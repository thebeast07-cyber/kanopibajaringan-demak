import { redis, redisTerpasang } from './redis';
import { Kejadian, Ringkasan, kolomHitungan, ringkas, tanggalJakarta, tanggalMundur } from '../statistik/kejadian';

export function statistikTerpasang(): boolean {
  return redisTerpasang();
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
  const isi = (await p.exec()) as Parameters<typeof ringkas>[0];
  return {
    hari,
    dari: tanggal[hari - 1],
    sampai: tanggal[0],
    sekarang: ringkas(isi.slice(0, hari)),
    sebelumnya: ringkas(isi.slice(hari)),
  };
}
