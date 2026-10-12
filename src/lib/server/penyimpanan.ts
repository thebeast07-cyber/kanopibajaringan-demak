import { promises as fs } from 'fs';
import path from 'path';
import { createHash, randomBytes } from 'crypto';
import { BlobPreconditionFailedError, del, get, put } from '@vercel/blob';
import { unstable_cache } from 'next/cache';
import { LocalCmsRepository, StorageState } from '../cms/localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { CompleteDataset } from '../../types/domain';
import { redis, redisTerpasang } from './redis';

/** Tempat foto. */
export type JenisPenyimpanan = 'vercel-blob' | 'lokal' | 'belum-dipasang';
/** Tempat data admin (harga, bahan, pengaturan). */
export type TempatState = 'redis' | JenisPenyimpanan;

export class KonflikPenyimpanan extends Error {}
export class PenyimpananBelumDipasang extends Error {}

export const TAG_DATA = 'cms-data';

export function jenisPenyimpanan(): JenisPenyimpanan {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return 'vercel-blob';
  // Di Vercel folder proyek hanya-baca, jadi tanpa Blob tidak ada tempat menyimpan.
  if (process.env.VERCEL) return 'belum-dipasang';
  return 'lokal';
}

// Data admin disimpan di Redis kalau ada. Blob public di-cache CDN sampai 60 detik setelah
// ditimpa, jadi admin bisa membaca versi basi lalu ditolak waktu menyimpan. Redis selalu
// membaca versi terbaru. Blob tetap dipakai untuk foto, yang namanya selalu baru.
export function tempatState(): TempatState {
  return redisTerpasang() ? 'redis' : jenisPenyimpanan();
}

// Alamat data admin diturunkan dari ADMIN_SESSION_SECRET: tidak bisa ditebak, dan Production
// dan Preview (rahasianya beda) tidak saling menimpa walau memakai Redis yang sama.
function kunciAdmin(): string {
  return createHash('sha256')
    .update(process.env.ADMIN_SESSION_SECRET || 'lokal')
    .digest('hex')
    .slice(0, 24);
}

function pathState(): string {
  return `cms/${kunciAdmin()}/state.json`;
}

const kunciRedis = () => ({ state: `cms:${kunciAdmin()}:state`, versi: `cms:${kunciAdmin()}:versi` });

// Simpan hanya kalau versi di server masih sama dengan versi yang dipegang perangkat ini.
// Dijalankan di dalam Redis sekaligus, jadi dua perangkat yang menyimpan bersamaan tidak bisa
// sama-sama lolos.
const SKRIP_SIMPAN = `
local sekarang = redis.call('GET', KEYS[2]) or '0'
if sekarang ~= ARGV[1] then return {0, sekarang} end
local baru = tostring(tonumber(sekarang) + 1)
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], baru)
return {1, baru}
`;

const FOLDER_LOKAL = process.env.CMS_DATA_DIR || path.join(process.cwd(), '.data');
const FILE_STATE_LOKAL = path.join(FOLDER_LOKAL, 'state.json');
export const FOLDER_FOTO_LOKAL = path.join(FOLDER_LOKAL, 'foto');

function etagDari(teks: string): string {
  return createHash('sha1').update(teks).digest('hex');
}

export function stateAwal(): StorageState {
  return new LocalCmsRepository(COMPREHENSIVE_DATASET).exportState();
}

async function bacaStateBlob(): Promise<{ state: StorageState | null; etag: string | null }> {
  // useCache false cuma berpengaruh di store private; di store public ini bisa basi sampai 60 detik.
  const hasil = await get(pathState(), { access: 'public', useCache: false });
  if (!hasil || hasil.statusCode !== 200) return { state: null, etag: null };
  const teks = await new Response(hasil.stream).text();
  return { state: JSON.parse(teks), etag: hasil.blob.etag };
}

export async function bacaState(): Promise<{ state: StorageState | null; etag: string | null }> {
  const tempat = tempatState();
  if (tempat === 'belum-dipasang') return { state: null, etag: null };

  if (tempat === 'redis') {
    const k = kunciRedis();
    const [teks, versi] = await redis()!.mget<(string | null)[]>(k.state, k.versi);
    if (teks) return { state: JSON.parse(teks), etag: versi ?? '0' };
    // Belum pernah disimpan di Redis: pakai data lama dari Blob kalau ada. Simpanan pertama
    // memindahkannya ke Redis. Kalau Blob gagal dibaca, biarkan galat, jangan mulai dari kosong.
    const lama = jenisPenyimpanan() === 'vercel-blob' ? (await bacaStateBlob()).state : null;
    return { state: lama, etag: '0' };
  }

  if (tempat === 'lokal') {
    try {
      const teks = await fs.readFile(FILE_STATE_LOKAL, 'utf8');
      return { state: JSON.parse(teks), etag: etagDari(teks) };
    } catch {
      return { state: null, etag: null };
    }
  }

  return bacaStateBlob();
}

/** Simpan state admin. `etagLama` dari bacaan terakhir; kalau sudah berubah di perangkat lain, ditolak. */
export async function simpanState(state: StorageState, etagLama: string | null): Promise<{ etag: string }> {
  const jenis = tempatState();
  if (jenis === 'belum-dipasang') throw new PenyimpananBelumDipasang();
  const teks = JSON.stringify(state);

  if (jenis === 'redis') {
    const k = kunciRedis();
    const [berhasil, versi] = (await redis()!.eval(SKRIP_SIMPAN, [k.state, k.versi], [etagLama ?? '0', teks])) as [
      number,
      string,
    ];
    if (Number(berhasil) !== 1) throw new KonflikPenyimpanan();
    return { etag: String(versi) };
  }

  if (jenis === 'lokal') {
    const sekarang = await bacaState();
    if (sekarang.etag && sekarang.etag !== etagLama) throw new KonflikPenyimpanan();
    await fs.mkdir(FOLDER_LOKAL, { recursive: true });
    await fs.writeFile(FILE_STATE_LOKAL, teks, 'utf8');
    return { etag: etagDari(teks) };
  }

  try {
    const hasil = await put(pathState(), teks, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
      ...(etagLama ? { ifMatch: etagLama } : {}),
    });
    return { etag: hasil.etag };
  } catch (e) {
    if (e instanceof BlobPreconditionFailedError) throw new KonflikPenyimpanan();
    throw e;
  }
}

async function bacaDatasetTerbitTanpaCache(): Promise<CompleteDataset> {
  const { state } = await bacaState();
  return (state ?? stateAwal()).publishedDataset;
}

/** Data yang dilihat pelanggan. Di-cache; dibuang tiap admin menyimpan (revalidateTag). */
const bacaDatasetTerbitCache = unstable_cache(bacaDatasetTerbitTanpaCache, ['cms-dataset-terbit'], {
  tags: [TAG_DATA],
  revalidate: 3600,
});

/**
 * Seperti di atas, tapi kalau penyimpanan sedang bermasalah tampilkan data bawaan (tanpa harga)
 * daripada halaman error. Galat ditangkap di luar cache, jadi data bawaan itu tidak ikut
 * tersimpan sejam: kunjungan berikutnya langsung mencoba lagi.
 */
export async function bacaDatasetTerbit(): Promise<CompleteDataset> {
  try {
    return await bacaDatasetTerbitCache();
  } catch (e) {
    // Sinyal internal Next.js (mis. halaman harus dirender dinamis) wajib diteruskan.
    if ((e as { digest?: string })?.digest) throw e;
    console.error('Gagal membaca data terbit', e);
    return stateAwal().publishedDataset;
  }
}

const TIPE_FOTO: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

export async function simpanFoto(isi: Buffer, contentType: string, serviceId: string): Promise<string> {
  const ext = TIPE_FOTO[contentType];
  if (!ext) throw new Error('Format foto tidak didukung.');
  const jenis = jenisPenyimpanan();
  if (jenis === 'belum-dipasang') throw new PenyimpananBelumDipasang();
  const folderLayanan = serviceId.replace(/[^a-z0-9-]/gi, '').slice(0, 60) || 'layanan';

  if (jenis === 'lokal') {
    const nama = `${folderLayanan}-${randomBytes(8).toString('hex')}.${ext}`;
    await fs.mkdir(FOLDER_FOTO_LOKAL, { recursive: true });
    await fs.writeFile(path.join(FOLDER_FOTO_LOKAL, nama), isi);
    return `/api/foto/${nama}`;
  }

  const hasil = await put(`foto/${folderLayanan}/foto.${ext}`, isi, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
    // Nama berkas selalu baru (random suffix), jadi aman di-cache lama.
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return hasil.url;
}

export async function hapusFoto(url: string): Promise<void> {
  if (url.startsWith('/api/foto/')) {
    const nama = path.basename(url);
    await fs.rm(path.join(FOLDER_FOTO_LOKAL, nama), { force: true });
    return;
  }
  if (jenisPenyimpanan() === 'vercel-blob' && new URL(url).hostname.endsWith('.blob.vercel-storage.com')) {
    await del(url);
  }
}
