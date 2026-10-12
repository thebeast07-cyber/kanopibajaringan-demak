import { promises as fs } from 'fs';
import path from 'path';
import { createHash, randomBytes } from 'crypto';
import { BlobPreconditionFailedError, del, get, put } from '@vercel/blob';
import { unstable_cache } from 'next/cache';
import { LocalCmsRepository, StorageState } from '../cms/localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { CompleteDataset } from '../../types/domain';

export type JenisPenyimpanan = 'vercel-blob' | 'lokal' | 'belum-dipasang';

export class KonflikPenyimpanan extends Error {}
export class PenyimpananBelumDipasang extends Error {}

export const TAG_DATA = 'cms-data';

export function jenisPenyimpanan(): JenisPenyimpanan {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return 'vercel-blob';
  // Di Vercel folder proyek hanya-baca, jadi tanpa Blob tidak ada tempat menyimpan.
  if (process.env.VERCEL) return 'belum-dipasang';
  return 'lokal';
}

// Semua berkas disimpan public supaya jalan di jenis store apa pun. Data admin ditaruh
// di alamat yang diturunkan dari ADMIN_SESSION_SECRET, jadi tidak bisa ditebak.
function pathState(): string {
  const kunci = createHash('sha256')
    .update(process.env.ADMIN_SESSION_SECRET || 'lokal')
    .digest('hex')
    .slice(0, 24);
  return `cms/${kunci}/state.json`;
}

const FOLDER_LOKAL = process.env.CMS_DATA_DIR || path.join(process.cwd(), '.data');
const FILE_STATE_LOKAL = path.join(FOLDER_LOKAL, 'state.json');
export const FOLDER_FOTO_LOKAL = path.join(FOLDER_LOKAL, 'foto');

function etagDari(teks: string): string {
  return createHash('sha1').update(teks).digest('hex');
}

export function stateAwal(): StorageState {
  return new LocalCmsRepository(COMPREHENSIVE_DATASET).exportState();
}

export async function bacaState(): Promise<{ state: StorageState | null; etag: string | null }> {
  const jenis = jenisPenyimpanan();
  if (jenis === 'belum-dipasang') return { state: null, etag: null };

  if (jenis === 'lokal') {
    try {
      const teks = await fs.readFile(FILE_STATE_LOKAL, 'utf8');
      return { state: JSON.parse(teks), etag: etagDari(teks) };
    } catch {
      return { state: null, etag: null };
    }
  }

  // useCache false: baca langsung dari asal, bukan salinan CDN yang bisa telat.
  const hasil = await get(pathState(), { access: 'public', useCache: false });
  if (!hasil || hasil.statusCode !== 200) return { state: null, etag: null };
  const teks = await new Response(hasil.stream).text();
  return { state: JSON.parse(teks), etag: hasil.blob.etag };
}

/** Simpan state admin. `etagLama` dari bacaan terakhir; kalau sudah berubah di perangkat lain, ditolak. */
export async function simpanState(state: StorageState, etagLama: string | null): Promise<{ etag: string }> {
  const jenis = jenisPenyimpanan();
  if (jenis === 'belum-dipasang') throw new PenyimpananBelumDipasang();
  const teks = JSON.stringify(state);

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
  try {
    const { state } = await bacaState();
    return (state ?? stateAwal()).publishedDataset;
  } catch (e) {
    // Penyimpanan sedang bermasalah: tampilkan data bawaan (tanpa harga) daripada halaman error.
    console.error('Gagal membaca data terbit', e);
    return stateAwal().publishedDataset;
  }
}

/** Data yang dilihat pelanggan. Di-cache; dibuang tiap admin menyimpan (revalidateTag). */
export const bacaDatasetTerbit = unstable_cache(bacaDatasetTerbitTanpaCache, ['cms-dataset-terbit'], {
  tags: [TAG_DATA],
  revalidate: 3600,
});

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
