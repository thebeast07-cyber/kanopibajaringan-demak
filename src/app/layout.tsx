import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3 Putra | Pasang Kanopi, Baja Ringan, Pagar & Railing',
  description:
    'Cek harga pasang kanopi, atap baja ringan, pagar, dan railing. Masukkan ukuran, harganya langsung keluar, lanjut chat WhatsApp buat nego dan jadwal survei gratis.',
  keywords: [
    'harga kanopi per m2',
    'pasang kanopi tangerang',
    'kanopi alderon',
    'atap baja ringan',
    'pagar minimalis',
    'railing tangga',
    'survei lokasi gratis kanopi',
  ],
  authors: [{ name: '3 Putra' }],
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
      <body className="min-h-screen bg-kertas text-tinta font-sans antialiased selection:bg-hutan selection:text-white">
        {children}
      </body>
    </html>
  );
}
