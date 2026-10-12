import { FotoLayananSchema, ProyekGaleriSchema } from '../../types/domain';

// Galeri = foto hasil pemasangan asli. Sengaja tanpa harga: tiap proyek beda ukuran, bahan, dan
// medan, jadi harga ditanyakan lewat WhatsApp, bukan ditebak dari foto.

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "2026-05" → "Mei 2026". Null kalau kosong atau formatnya salah. */
export function teksDipasang(dipasang?: string): string | null {
  const cocok = /^(\d{4})-(\d{2})$/.exec(dipasang ?? '');
  if (!cocok) return null;
  const bulan = Number(cocok[2]);
  if (bulan < 1 || bulan > 12) return null;
  return `${BULAN[bulan - 1]} ${cocok[1]}`;
}

/** "Sayung, Demak · Mei 2026", bagian yang kosong dilewati. */
export function ringkasProyek(p: Pick<ProyekGaleriSchema, 'lokasi' | 'dipasang'>): string {
  return [p.lokasi.trim(), teksDipasang(p.dipasang)].filter(Boolean).join(' · ');
}

/** Judul halaman dan preview link: "Kanopi Alderon di Sayung, Demak". */
export function judulProyek(p: Pick<ProyekGaleriSchema, 'judul' | 'lokasi'>): string {
  return p.lokasi.trim() ? `${p.judul.trim()} di ${p.lokasi.trim()}` : p.judul.trim();
}

/** Yang tampil ke pelanggan: dinyalakan pemilik dan punya foto. Terbaru dipasang duluan. */
export function proyekTampil(galeri: ProyekGaleriSchema[] | undefined): ProyekGaleriSchema[] {
  return (galeri ?? [])
    .filter((p) => p.tampil && p.fotos.length > 0)
    .sort((a, b) => (b.dipasang ?? '').localeCompare(a.dipasang ?? '') || b.dibuat.localeCompare(a.dibuat));
}

/** Pesan WhatsApp dari galeri. Link halaman proyek ikut, supaya fotonya muncul sebagai preview. */
export function pesanWaGaleri(namaUsaha: string, p: Pick<ProyekGaleriSchema, 'judul' | 'lokasi'>, url: string): string {
  return `Halo ${namaUsaha}, saya lihat foto ${judulProyek(p)} dari galeri website. Saya mau yang kayak gini, bisa dibantu?\n\n${url}`;
}

export interface IsianProyek {
  judul: string;
  serviceId: string;
  lokasi: string;
  dipasang: string;
  ukuran: string;
  keterangan: string;
  fotos: FotoLayananSchema[];
  tampil: boolean;
}

export type KesalahanProyek = Partial<Record<'judul' | 'lokasi' | 'fotos' | 'dipasang', string>>;

export function proyekBaru(sekarang = new Date()): ProyekGaleriSchema {
  return {
    id: `gal-${sekarang.getTime().toString(36)}`,
    judul: '',
    lokasi: '',
    fotos: [],
    tampil: true,
    dibuat: sekarang.toISOString(),
  };
}

export function isianDariProyek(p: ProyekGaleriSchema): IsianProyek {
  return {
    judul: p.judul,
    serviceId: p.serviceId ?? '',
    lokasi: p.lokasi,
    dipasang: p.dipasang ?? '',
    ukuran: p.ukuran ?? '',
    keterangan: p.keterangan ?? '',
    fotos: p.fotos.map((f) => ({ ...f })),
    tampil: p.tampil,
  };
}

export function periksaProyek(i: IsianProyek): KesalahanProyek {
  const salah: KesalahanProyek = {};
  if (i.fotos.length === 0) salah.fotos = 'Unggah minimal satu foto. Galeri isinya foto.';
  if (!i.judul.trim()) salah.judul = 'Isi nama produknya, misalnya Kanopi Alderon.';
  if (!i.lokasi.trim()) salah.lokasi = 'Isi lokasi pemasangan, misalnya Sayung, Demak.';
  if (i.dipasang && !teksDipasang(i.dipasang)) salah.dipasang = 'Pilih bulan dan tahun pemasangan, atau kosongkan.';
  return salah;
}

export function terapkanProyek(p: ProyekGaleriSchema, i: IsianProyek): ProyekGaleriSchema {
  const opsional = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    id: p.id,
    judul: i.judul.trim(),
    serviceId: opsional(i.serviceId),
    lokasi: i.lokasi.trim(),
    dipasang: opsional(i.dipasang),
    ukuran: opsional(i.ukuran),
    keterangan: opsional(i.keterangan),
    fotos: i.fotos.map((f) => ({
      url: f.url,
      ...(f.og ? { og: f.og } : {}),
      ...(f.keterangan?.trim() ? { keterangan: f.keterangan.trim() } : {}),
    })),
    tampil: i.tampil,
    dibuat: p.dibuat,
  };
}
