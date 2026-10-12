import { Redis } from '@upstash/redis';
import { Kejadian, Ringkasan, kolomHitungan, ringkas, tanggalJakarta, tanggalMundur } from '../statistik/kejadian';

// Integrasi Upstash di Vercel kadang memberi nama KV_REST_API_*, kadang UPSTASH_REDIS_REST_*.
function alamat(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

let klien: Redis | null | undefined;
function redis(): Redis | null {
  if (klien === undefined) {
    const a = alamat();
    klien = a ? new Redis({ url: a.url, token: a.token }) : null;
  }
  return klien;
}

export function statistikTerpasang(): boolean {
  return alamat() !== null;
}

// Preview dan Production memakai database yang sama, jadi hitungannya dipisah per lingkungan
// supaya klik waktu coba-coba di Preview tidak ikut ke angka asli.
const LINGKUNGAN = process.env.VERCEL_ENV || 'lokal';
const kunciHari = (tanggal: string) => `jejak:${LINGKUNGAN}:${tanggal}`;
const UMUR_DATA_DETIK = 400 * 24 * 60 * 60;

export async function catatKejadian(k: Kejadian, sekarang = new Date()): Promise<void> {
  const r = redis();
  if (!r) return;
  const kunci = kunciHari(tanggalJakarta(sekarang));
  const p = r.pipeline();
  for (const kolom of kolomHitungan(k)) p.hincrby(kunci, kolom, 1);
  p.expire(kunci, UMUR_DATA_DETIK);
  await p.exec();
}

export interface HasilStatistik {
  hari: number;
  dari: string;
  sampai: string;
  sekarang: Ringkasan;
  sebelumnya: Ringkasan;
}

/** Ringkasan `hari` hari terakhir (hari ini ikut) dan periode yang sama sebelumnya. */
export async function bacaStatistik(hari: number, sekarang = new Date()): Promise<HasilStatistik | null> {
  const r = redis();
  if (!r) return null;
  const tanggal = tanggalMundur(sekarang, hari * 2);
  const p = r.pipeline();
  for (const t of tanggal) p.hgetall(kunciHari(t));
  const isi = (await p.exec()) as (Record<string, number | string> | null)[];
  return {
    hari,
    dari: tanggal[hari - 1],
    sampai: tanggal[0],
    sekarang: ringkas(isi.slice(0, hari)),
    sebelumnya: ringkas(isi.slice(hari)),
  };
}
