import { BusinessConfigSchema } from '../../types/domain';

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
  namaUsaha: string;
  tagline: string;
  catatanHarga: string;
  linkMaps: string;
  alamat: string;
  linkInstagram: string;
  linkTiktok: string;
}

export type KesalahanPengaturan = Partial<
  Record<'nomorWa' | 'kota' | 'namaUsaha' | 'linkMaps' | 'linkInstagram' | 'linkTiktok', string>
>;

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

const HOST_SOSMED = { instagram: 'instagram.com', tiktok: 'tiktok.com' } as const;
const NAMA_AKUN = /^[a-z0-9._]{1,30}$/i;

/**
 * Link profil Instagram atau TikTok. Pemilik boleh menempel link dari tombol Bagikan, atau cukup
 * mengetik nama akunnya (@3putra). Hasilnya link profil bersih tanpa parameter pelacak aplikasi.
 * Null kalau bukan akun di platform itu.
 */
export function rapikanLinkSosmed(platform: keyof typeof HOST_SOSMED, ketikan: string): string | null {
  const teks = ketikan.trim();
  const host = HOST_SOSMED[platform];
  const akun = teks.replace(/^@/, '');
  if (NAMA_AKUN.test(akun) && !akun.includes('.com')) {
    return platform === 'instagram' ? `https://www.instagram.com/${akun}/` : `https://www.tiktok.com/@${akun}`;
  }
  try {
    const url = new URL(teks.match(/https?:\/\/\S+/)?.[0] ?? (teks.includes(host) ? `https://${teks}` : ''));
    const h = url.hostname.toLowerCase();
    // Link bagikan TikTok dari aplikasi bentuknya vt.tiktok.com/xxxx, tetap diterima apa adanya.
    if (h !== host && !h.endsWith(`.${host}`)) return null;
    return `https://${h}${url.pathname}`;
  } catch {
    return null;
  }
}

export function isianDariConfig(c: BusinessConfigSchema): IsianPengaturan {
  return {
    nomorWa: nomorWaTampil(c.frontlineContact.whatsappNumber),
    kota: [...c.serviceAreas],
    namaUsaha: c.businessName,
    tagline: c.tagline,
    catatanHarga: c.surveyDisclaimer,
    linkMaps: c.linkMaps ?? '',
    alamat: c.alamat ?? '',
    linkInstagram: c.linkInstagram ?? '',
    linkTiktok: c.linkTiktok ?? '',
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
  if (i.linkInstagram.trim() && !rapikanLinkSosmed('instagram', i.linkInstagram)) {
    salah.linkInstagram = 'Ini bukan link Instagram. Tulis nama akunnya (misalnya @3putra) atau tempel link profilnya.';
  }
  if (i.linkTiktok.trim() && !rapikanLinkSosmed('tiktok', i.linkTiktok)) {
    salah.linkTiktok = 'Ini bukan link TikTok. Tulis nama akunnya (misalnya @3putra) atau tempel link profilnya.';
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
    frontlineContact: { ...c.frontlineContact, whatsappNumber: nomorWaInternasional(i.nomorWa)! },
    linkMaps: rapikanLinkMaps(i.linkMaps) ?? undefined,
    alamat: i.alamat.trim().replace(/\s+/g, ' ') || undefined,
    linkInstagram: rapikanLinkSosmed('instagram', i.linkInstagram) ?? undefined,
    linkTiktok: rapikanLinkSosmed('tiktok', i.linkTiktok) ?? undefined,
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
