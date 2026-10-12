import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { asalPermintaan } from '@/lib/server/asal';
import { proyekTampil } from '@/lib/cms/galeri';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { KartuProyek } from '@/components/landing/KartuProyek';
import { CatatKunjungan } from '@/components/landing/CatatKunjungan';

// Sama seperti halaman depan: data dibaca dari Redis (lewat cache), jadi dirender tiap kunjungan.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const dataset = await bacaDatasetTerbit();
  const pertama = proyekTampil(dataset.galeri)[0];
  const title = `Galeri pemasangan | ${dataset.businessConfig.businessName}`;
  const description = `Foto asli pemasangan kanopi, atap baja ringan, pagar, dan railing di ${dataset.businessConfig.serviceAreas.join(', ')}.`;
  const foto = pertama?.fotos[0];
  return {
    metadataBase: new URL(asalPermintaan()),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'id_ID',
      siteName: dataset.businessConfig.businessName,
      images: foto
        ? [{ url: foto.og ?? foto.url, alt: pertama.judul, ...(foto.og ? { width: 1200, height: 630 } : {}) }]
        : [{ url: '/brand/og-logo.png', width: 1200, height: 630, alt: 'Logo 3 Putra' }],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function HalamanGaleri() {
  const dataset = await bacaDatasetTerbit();
  const config = dataset.businessConfig;
  const proyek = proyekTampil(dataset.galeri);
  // Galeri kosong tidak dipamerkan, sama seperti di halaman depan.
  if (proyek.length === 0) notFound();
  const kontak = { namaUsaha: config.businessName, whatsappNumber: config.frontlineContact.whatsappNumber, asal: asalPermintaan() };

  return (
    <div className="min-h-screen flex flex-col bg-kertas text-tinta">
      <CatatKunjungan />
      <Navbar config={config} adaGaleri />
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight">Hasil pemasangan kami</h1>
            <p className="text-tinta-lembut leading-relaxed">
              {proyek.length} proyek, semua foto asli dari lokasi. Harganya tergantung ukuran dan bahan, jadi kalau ada
              yang cocok, tanya langsung lewat WhatsApp.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyek.map((p) => (
              <KartuProyek key={p.id} proyek={p} kontak={kontak} />
            ))}
          </div>
        </div>
      </main>
      <Footer config={config} />
    </div>
  );
}
