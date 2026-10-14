import { headers } from 'next/headers';

/**
 * Alamat situs dari permintaan yang sedang dilayani, misalnya https://landingpagekanopi.vercel.app.
 * Link di pesan WhatsApp dan gambar preview ikut domain yang sedang dibuka, jadi tetap benar
 * di Preview Vercel maupun nanti kalau pakai domain sendiri.
 */
export function asalPermintaan(): string {
  const h = headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000').split(',')[0].trim();
  const proto = (h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')).split(',')[0].trim();
  return `${proto}://${host}`;
}

/**
 * Alamat resmi situs buat Google: canonical, sitemap, dan data usaha. Selalu domain produksi,
 * supaya alamat Preview tidak ikut dianggap halaman terpisah. Di laptop pakai alamat yang dibuka.
 */
export function alamatResmi(): string {
  const produksi = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return produksi ? `https://${produksi}` : asalPermintaan();
}
