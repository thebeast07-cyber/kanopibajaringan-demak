import { track } from '@vercel/analytics';

// Funnel yang bisa diukur website: datang → isi ukuran → klik WhatsApp.
// Deal atau tidak terjadi di WhatsApp, di luar jangkauan website.

/** Tombol WhatsApp mana yang diklik, supaya kelihatan bagian halaman mana yang paling kerja. */
export type SumberWa =
  | 'navbar'
  | 'menu-hp'
  | 'hero'
  | 'kartu-tanya-harga'
  | 'kartu-bahan-lain'
  | 'daftar-tanya-harga'
  | 'kalkulator'
  | 'ajakan-bawah'
  | 'footer';

export function catatKlikWa(sumber: SumberWa, layanan?: string) {
  track('klik_whatsapp', layanan ? { sumber, layanan } : { sumber });
}

let ukuranSudahDicatat = false;

/** Sekali per kunjungan: cukup tahu orangnya mencoba kalkulator, bukan tiap ketikan. */
export function catatIsiUkuran(layanan: string) {
  if (ukuranSudahDicatat) return;
  ukuranSudahDicatat = true;
  track('isi_ukuran', { layanan });
}
