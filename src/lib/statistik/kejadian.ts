// Kejadian yang dicatat website ke penghitung sendiri (Redis), untuk Beranda admin.
// Vercel Web Analytics di paket Hobby tidak menampilkan event custom, jadi klik WhatsApp
// dihitung di sini. Yang disimpan cuma hitungan per hari, tanpa cookie dan data pribadi.

/** Tombol WhatsApp mana yang diklik, supaya kelihatan bagian halaman mana yang paling kerja. */
export const SUMBER_WA = [
  'navbar',
  'menu-hp',
  'hero',
  'kartu-tanya-harga',
  'kartu-bahan-lain',
  'daftar-tanya-harga',
  'kalkulator',
  'ajakan-bawah',
  'footer',
  'galeri',
  'galeri-detail',
  'bar-bawah',
] as const;
export type SumberWa = (typeof SUMBER_WA)[number];

export const ASAL = ['instagram', 'google-maps', 'google', 'facebook', 'whatsapp', 'tiktok', 'langsung', 'lainnya'] as const;
export type Asal = (typeof ASAL)[number];

export type Kejadian =
  | { jenis: 'kunjungan'; asal: Asal }
  | { jenis: 'isi_ukuran'; layanan: string; aksiPertama: boolean }
  | { jenis: 'klik_wa'; sumber: SumberWa; layanan?: string; pertama: boolean; aksiPertama: boolean };

const ASAL_UTM: Record<string, Asal> = {
  instagram: 'instagram',
  ig: 'instagram',
  'google-maps': 'google-maps',
  maps: 'google-maps',
  gmaps: 'google-maps',
  google: 'google',
  facebook: 'facebook',
  fb: 'facebook',
  whatsapp: 'whatsapp',
  wa: 'whatsapp',
  tiktok: 'tiktok',
};

/**
 * Asal kunjungan. Link berlabel (utm_source) didahulukan karena aplikasi Instagram dan
 * WhatsApp sering tidak mengirim referrer, jadi tanpa label kunjungannya kebaca "langsung".
 */
export function tentukanAsal(search: string, referrer: string, hostSendiri: string): Asal {
  const utm = new URLSearchParams(search).get('utm_source')?.trim().toLowerCase();
  if (utm) return ASAL_UTM[utm] ?? 'lainnya';

  if (!referrer) return 'langsung';
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'lainnya';
  }
  if (host === hostSendiri.toLowerCase().split(':')[0]) return 'langsung';
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)(facebook\.com|fb\.me|fb\.com)$/.test(host)) return 'facebook';
  if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(host)) return 'whatsapp';
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
  // Pencarian dan Google Maps sama-sama datang dari google.*, tidak bisa dibedakan dari referrer.
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
  return 'lainnya';
}

const ID_LAYANAN = /^[a-z0-9][a-z0-9_-]{0,59}$/i;

/** Endpoint pencatat terbuka untuk umum, jadi isinya diperiksa ketat sebelum dihitung. */
export function periksaKejadian(isi: unknown): Kejadian | null {
  if (!isi || typeof isi !== 'object') return null;
  const k = isi as Record<string, unknown>;
  const layananSah = (v: unknown) => typeof v === 'string' && ID_LAYANAN.test(v);

  if (k.jenis === 'kunjungan') {
    return ASAL.includes(k.asal as Asal) ? { jenis: 'kunjungan', asal: k.asal as Asal } : null;
  }
  if (k.jenis === 'isi_ukuran') {
    if (!layananSah(k.layanan)) return null;
    return { jenis: 'isi_ukuran', layanan: k.layanan as string, aksiPertama: k.aksiPertama === true };
  }
  if (k.jenis === 'klik_wa') {
    if (!SUMBER_WA.includes(k.sumber as SumberWa)) return null;
    if (k.layanan !== undefined && !layananSah(k.layanan)) return null;
    return {
      jenis: 'klik_wa',
      sumber: k.sumber as SumberWa,
      ...(k.layanan ? { layanan: k.layanan as string } : {}),
      pertama: k.pertama === true,
      aksiPertama: k.aksiPertama === true,
    };
  }
  return null;
}

/** Kolom hitungan yang ditambah satu untuk sebuah kejadian, dalam satu hash per hari. */
export function kolomHitungan(k: Kejadian): string[] {
  switch (k.jenis) {
    case 'kunjungan':
      return ['kunjungan', `asal:${k.asal}`];
    case 'isi_ukuran':
      return ['isi_ukuran', `ukuran_layanan:${k.layanan}`, ...(k.aksiPertama ? ['sesi_aksi'] : [])];
    case 'klik_wa':
      return [
        'klik_wa',
        `wa_sumber:${k.sumber}`,
        ...(k.layanan ? [`wa_layanan:${k.layanan}`] : []),
        ...(k.pertama ? ['sesi_klik_wa'] : []),
        ...(k.aksiPertama ? ['sesi_aksi'] : []),
      ];
  }
}

export interface Peringkat {
  kunci: string;
  jumlah: number;
}

export interface Ringkasan {
  /** Kunjungan = sesi browser yang membuka halaman depan atau galeri, bukan orang unik. */
  kunjungan: number;
  isiUkuran: number;
  /** Kunjungan yang klik WhatsApp minimal sekali. */
  kunjunganKlikWa: number;
  /** Semua klik tombol WhatsApp, termasuk yang berulang dari kunjungan yang sama. */
  klikWa: number;
  /** Kunjungan yang isi ukuran atau klik WhatsApp, minimal salah satu. */
  kunjunganBeraksi: number;
  asal: Peringkat[];
  sumberWa: Peringkat[];
  layananWa: Peringkat[];
}

type HashHari = Record<string, number | string> | null | undefined;

function urut(peta: Map<string, number>): Peringkat[] {
  return Array.from(peta, ([kunci, jumlah]) => ({ kunci, jumlah }))
    .filter((p) => p.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah || a.kunci.localeCompare(b.kunci));
}

/** Jumlahkan hash beberapa hari jadi satu ringkasan. Hari tanpa data boleh null. */
export function ringkas(hari: HashHari[]): Ringkasan {
  const total = new Map<string, number>();
  for (const h of hari) {
    if (!h) continue;
    for (const [kolom, nilai] of Object.entries(h)) {
      const n = Number(nilai);
      if (Number.isFinite(n)) total.set(kolom, (total.get(kolom) ?? 0) + n);
    }
  }
  const awalan = (prefix: string) =>
    urut(
      new Map(
        Array.from(total)
          .filter(([k]) => k.startsWith(prefix))
          .map(([k, v]) => [k.slice(prefix.length), v])
      )
    );

  return {
    kunjungan: total.get('kunjungan') ?? 0,
    isiUkuran: total.get('isi_ukuran') ?? 0,
    kunjunganKlikWa: total.get('sesi_klik_wa') ?? 0,
    klikWa: total.get('klik_wa') ?? 0,
    kunjunganBeraksi: total.get('sesi_aksi') ?? 0,
    asal: awalan('asal:'),
    sumberWa: awalan('wa_sumber:'),
    layananWa: awalan('wa_layanan:'),
  };
}

/** Tanggal kalender di Jakarta (YYYY-MM-DD). Satu hari dihitung dari tengah malam WIB. */
export function tanggalJakarta(waktu: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(waktu);
}

/** Daftar tanggal mundur dari hari ini: `jumlah` hari terakhir, yang terbaru dulu. */
export function tanggalMundur(sekarang: Date, jumlah: number): string[] {
  const hasil: string[] = [];
  for (let i = 0; i < jumlah; i++) {
    hasil.push(tanggalJakarta(new Date(sekarang.getTime() - i * 86_400_000)));
  }
  return hasil;
}

export const LABEL_ASAL: Record<Asal, string> = {
  instagram: 'Instagram',
  'google-maps': 'Google Maps',
  google: 'Google (pencarian atau Maps)',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  langsung: 'Langsung ketik alamat',
  lainnya: 'Situs lain',
};

export const LABEL_SUMBER_WA: Record<SumberWa, string> = {
  navbar: 'Tombol atas',
  'menu-hp': 'Menu di HP',
  hero: 'Bagian paling atas',
  'kartu-tanya-harga': 'Kartu layanan (tanya harga)',
  'kartu-bahan-lain': 'Kartu layanan (tanya bahan lain)',
  'daftar-tanya-harga': 'Daftar layanan lain',
  kalkulator: 'Kalkulator',
  'ajakan-bawah': 'Ajakan di bawah',
  footer: 'Footer',
  galeri: 'Galeri proyek',
  'galeri-detail': 'Halaman foto proyek',
  'bar-bawah': 'Menu bawah di HP',
};
