import { BusinessConfigSchema } from '../../types/domain';
import { kotaSurveiGratis } from './wilayah';

/**
 * Nomor yang diketik pemilik (0822..., +62 822..., 62822...) jadi format wa.me: 62 tanpa spasi.
 * Null kalau bukan nomor HP Indonesia yang masuk akal.
 */
export function nomorWaInternasional(ketikan: string): string | null {
  let angka = ketikan.replace(/\D/g, '');
  if (angka.startsWith('0')) angka = `62${angka.slice(1)}`;
  else if (angka.startsWith('8')) angka = `62${angka}`;
  if (!/^628\d{7,11}$/.test(angka)) return null;
  return angka;
}

/** 6282228132455 → 0822 2813 2455, cara orang Indonesia biasa nulis nomor HP. */
export function nomorWaTampil(internasional: string): string {
  const lokal = internasional.replace(/^62/, '0');
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, '$1 $2 $3');
}

export interface IsianPengaturan {
  nomorWa: string;
  kota: string[];
  /** Bagian dari `kota` yang dapat survei gratis. */
  kotaGratis: string[];
  namaUsaha: string;
  tagline: string;
  catatanHarga: string;
  linkMaps: string;
  alamat: string;
}

export type KesalahanPengaturan = Partial<Record<'nomorWa' | 'kota' | 'namaUsaha' | 'linkMaps', string>>;

const LINK_MAPS = /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|maps\.google\.[a-z.]+\/|(www\.)?google\.[a-z.]+\/maps)/i;

/**
 * Link dari tombol Bagikan di Maps. Null kalau bukan link Google Maps. Parameter pelacak dari
 * aplikasi (g_st, utm_*) dibuang supaya yang tersimpan link bersih.
 */
export function rapikanLinkMaps(ketikan: string): string | null {
  const teks = ketikan.trim().match(/https:\/\/\S+/)?.[0] ?? '';
  if (!LINK_MAPS.test(teks)) return null;
  try {
    const url = new URL(teks);
    for (const k of Array.from(url.searchParams.keys())) {
      if (k === 'g_st' || k.startsWith('utm_')) url.searchParams.delete(k);
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isianDariConfig(c: BusinessConfigSchema): IsianPengaturan {
  return {
    nomorWa: nomorWaTampil(c.frontlineContact.whatsappNumber),
    kota: [...c.serviceAreas],
    kotaGratis: kotaSurveiGratis(c),
    namaUsaha: c.businessName,
    tagline: c.tagline,
    catatanHarga: c.surveyDisclaimer,
    linkMaps: c.linkMaps ?? '',
    alamat: c.alamat ?? '',
  };
}

export function periksaPengaturan(i: IsianPengaturan): KesalahanPengaturan {
  const salah: KesalahanPengaturan = {};
  if (!nomorWaInternasional(i.nomorWa)) salah.nomorWa = 'Nomornya kayaknya kurang pas. Tulis nomor HP lengkap, misalnya 0822 1234 5678.';
  if (i.kota.length === 0) salah.kota = 'Isi minimal satu kota.';
  if (!i.namaUsaha.trim()) salah.namaUsaha = 'Nama usaha wajib diisi.';
  if (i.linkMaps.trim() && !rapikanLinkMaps(i.linkMaps)) {
    salah.linkMaps = 'Ini bukan link Google Maps. Buka profil usaha di Maps, ketuk Bagikan, lalu Salin link.';
  }
  return salah;
}

/** Bagian config yang diubah halaman Pengaturan. Kontak lain (nama CS, email) dibiarkan. */
export function terapkanPengaturan(c: BusinessConfigSchema, i: IsianPengaturan): Partial<BusinessConfigSchema> {
  return {
    businessName: i.namaUsaha.trim(),
    tagline: i.tagline.trim(),
    surveyDisclaimer: i.catatanHarga.trim(),
    serviceAreas: i.kota.map((k) => k.trim()).filter(Boolean),
    kotaSurveiGratis: i.kota.filter((k) => i.kotaGratis.includes(k)),
    frontlineContact: { ...c.frontlineContact, whatsappNumber: nomorWaInternasional(i.nomorWa)! },
    linkMaps: rapikanLinkMaps(i.linkMaps) ?? undefined,
    alamat: i.alamat.trim().replace(/\s+/g, ' ') || undefined,
  };
}

/** Kota baru dirapikan (huruf awal kapital) dan tidak dobel. */
export function tambahKota(daftar: string[], ketikan: string): string[] {
  const rapi = ketikan
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, (h) => h.toUpperCase());
  if (!rapi || daftar.some((k) => k.toLowerCase() === rapi.toLowerCase())) return daftar;
  return [...daftar, rapi];
}
