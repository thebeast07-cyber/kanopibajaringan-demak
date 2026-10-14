import type { Metadata } from 'next';
import './globals.css';
import { AnalitikPengunjung } from '@/components/AnalitikPengunjung';

export const metadata: Metadata = {
  // Cadangan untuk admin dan login. Beranda punya generateMetadata sendiri yang ikut
  // kondisi data, jadi kalimat soal harga tidak ditulis di sini.
  title: '3 Putra Spesialis Kanopi dan Baja Ringan',
  description: 'Spesialis kanopi, atap baja ringan, pagar, dan railing di Demak dan Semarang.',
  keywords: [
    'harga kanopi per m2',
    'pasang kanopi demak',
    'baja ringan semarang',
    'kanopi alderon',
    'atap baja ringan',
    'pagar minimalis',
    'railing tangga',
    'survei lokasi gratis kanopi',
  ],
  authors: [{ name: '3 Putra Spesialis Kanopi dan Baja Ringan' }],
  // Kode verifikasi Google Search Console untuk kanopibajaringan-demak.vercel.app. Bukan rahasia:
  // Google membacanya dari halaman. Env GOOGLE_SITE_VERIFICATION bisa menggantinya tanpa ubah kode.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || '7zpz02BM6OC3PPl4-lqfKcYYsL--z5I3CFOjdEEvJw8' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-kertas text-tinta font-sans antialiased selection:bg-navy selection:text-white">
        {children}
        <AnalitikPengunjung />
      </body>
    </html>
  );
}
