// Link berlabel untuk tiap tempat promosi. Tanpa label, kunjungan dari aplikasi Instagram dan
// WhatsApp sering kebaca "langsung" karena aplikasinya tidak mengirim asal halaman.

export const LINK_PROMOSI = [
  { id: 'instagram', label: 'Bio Instagram', query: 'utm_source=instagram&utm_medium=bio' },
  { id: 'google-maps', label: 'Google Maps', query: 'utm_source=google-maps&utm_medium=profil' },
  { id: 'whatsapp', label: 'Status WhatsApp', query: 'utm_source=whatsapp&utm_medium=status' },
  { id: 'facebook', label: 'Halaman Facebook', query: 'utm_source=facebook&utm_medium=halaman' },
] as const;

/** Isi QR di brosur. Kalau diganti, QR yang sudah dicetak tetap ke alamat lama, jadi jangan diganti. */
export const LINK_BROSUR = '/link?utm_source=brosur';

/** Alamat website asli. Di Preview tetap mengarah ke domain produksi kalau Vercel menyediakannya. */
export function alamatWebsite(): string {
  const produksi = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (produksi) return `https://${produksi}`;
  return typeof window === 'undefined' ? '' : window.location.origin;
}

export function linkPromosi(query: string): string {
  return `${alamatWebsite()}/?${query}`;
}
