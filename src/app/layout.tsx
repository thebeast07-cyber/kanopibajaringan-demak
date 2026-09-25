import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kanopi & Baja Ringan | Estimator Biaya & Konstruksi Bergaransi',
  description:
    'Layanan kalkulator estimasi biaya kanopi, atap baja ringan, pagar, dan railing bergaransi resmi. Hitung estimasi harga proyek secara instan dan ajukan survei lokasi gratis.',
  keywords: [
    'kanopi alderon semarang',
    'kanopi baja ringan solo',
    'pagar minimalis',
    'railing tangga',
    'harga kanopi per m2',
    'kalkulator kanopi',
    'survei lokasi gratis kanopi',
  ],
  authors: [{ name: 'Kanopi & Baja Ringan Pro' }],
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
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Work+Sans:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAF8F5] text-[#1C1917] font-sans antialiased selection:bg-[#1B3B2B] selection:text-white">
        {children}
      </body>
    </html>
  );
}

