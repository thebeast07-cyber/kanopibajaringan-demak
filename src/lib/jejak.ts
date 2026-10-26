import { track } from '@vercel/analytics';
import { Kejadian, SumberWa, TujuanLink, tentukanAsal } from './statistik/kejadian';

export type { SumberWa, TujuanLink };

// Funnel yang bisa diukur website: datang → isi ukuran → klik WhatsApp.
// Deal atau tidak terjadi di WhatsApp, di luar jangkauan website.
// Tiap kejadian dikirim ke dua tempat: Vercel Web Analytics dan penghitung sendiri untuk
// Beranda admin (Vercel paket Hobby tidak menampilkan event custom).

const TANDA_ADMIN = 'jejak-abaikan';

/** Browser yang pernah login admin tidak dihitung, biar kunjungan pemilik nggak ikut angka. */
export function tandaiPerangkatAdmin() {
  try {
    localStorage.setItem(TANDA_ADMIN, '1');
  } catch {
    // Mode privat atau penyimpanan diblok: kunjungan pemilik dari browser ini bisa ikut terhitung.
  }
}

export function perangkatAdmin(): boolean {
  try {
    return localStorage.getItem(TANDA_ADMIN) === '1';
  } catch {
    return false;
  }
}

/** True cuma sekali per tab. Tanpa sessionStorage, anggap selalu pertama. */
function pertamaDiSesi(nama: string): boolean {
  try {
    if (sessionStorage.getItem(nama)) return false;
    sessionStorage.setItem(nama, '1');
    return true;
  } catch {
    return true;
  }
}

function kirim(k: Kejadian) {
  if (perangkatAdmin()) return;
  const isi = JSON.stringify(k);
  // sendBeacon tetap terkirim walau halaman langsung pindah ke WhatsApp.
  if (navigator.sendBeacon?.('/api/jejak', new Blob([isi], { type: 'application/json' }))) return;
  fetch('/api/jejak', { method: 'POST', body: isi, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(
    () => null
  );
}

export function catatKunjungan() {
  if (!pertamaDiSesi('jejak-kunjungan')) return;
  kirim({ jenis: 'kunjungan', asal: tentukanAsal(location.search, document.referrer, location.host) });
}

/** Sekali per kunjungan: cukup tahu orangnya mencoba kalkulator, bukan tiap ketikan. */
export function catatIsiUkuran(layanan: string) {
  if (!pertamaDiSesi('jejak-isi-ukuran')) return;
  track('isi_ukuran', { layanan });
  kirim({ jenis: 'isi_ukuran', layanan, aksiPertama: pertamaDiSesi('jejak-aksi') });
}

export function catatKlikWa(sumber: SumberWa, layanan?: string) {
  track('klik_whatsapp', layanan ? { sumber, layanan } : { sumber });
  kirim({
    jenis: 'klik_wa',
    sumber,
    ...(layanan ? { layanan } : {}),
    pertama: pertamaDiSesi('jejak-klik-wa'),
    aksiPertama: pertamaDiSesi('jejak-aksi'),
  });
}

export function catatKlikLink(tujuan: TujuanLink) {
  track('klik_link', { tujuan });
  kirim({ jenis: 'klik_link', tujuan });
}
