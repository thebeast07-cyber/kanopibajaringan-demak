import type { Metadata } from 'next';
import { HalamanDepan } from '@/components/landing/HalamanDepan';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { getTarifBorongan } from '@/lib/estimator/pricingEngine';
import { proyekTampil } from '@/lib/cms/galeri';
import { alamatResmi } from '@/lib/server/asal';
import { dataUsaha, judulDepan, jsonUntukScript } from '@/lib/seo';
import { gabungKota, kotaSurveiGratis } from '@/lib/cms/wilayah';

// Dirender tiap kunjungan, karena data dibaca dari Redis dengan permintaan tanpa cache yang
// tidak boleh dipakai di halaman statis. Datanya sendiri tetap di-cache (bacaDatasetTerbit)
// dan dibuang tiap admin menyimpan, jadi Redis tidak dibaca di setiap kunjungan.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const dataset = await bacaDatasetTerbit();
  const aktif = dataset.services.filter((s) => s.status === 'active');
  const kota = gabungKota(dataset.businessConfig.serviceAreas);
  const gratis = kotaSurveiGratis(dataset.businessConfig);
  const kalimatGratis = gratis.length > 0 ? ` Survei gratis di ${gabungKota(gratis)}.` : '';
  const adaHarga = aktif.some((s) => getTarifBorongan(s) !== null);

  // Judul buat Google menyebut jenis jasa dan kota, karena itu yang diketik orang di pencarian.
  const title = judulDepan(dataset);
  const description = adaHarga
    ? `Cek harga pasang kanopi, atap baja ringan, pagar, dan railing di ${kota}. Masukkan ukuran, harganya langsung keluar, lanjut chat WhatsApp buat nego dan jadwal survei.${kalimatGratis}`
    : `Pasang kanopi, atap baja ringan, pagar, dan railing di ${kota}. Masukkan ukuran, kirim lewat WhatsApp, kami hitungkan harganya.${kalimatGratis}`;

  // Gambar preview waktu link dibagikan di WhatsApp: foto asli pertama dari pemilik (kartu
  // layanan dulu, lalu galeri), kalau belum ada pakai logo.
  const layananBerfoto = aktif.find((s) => s.featured && s.fotos?.length);
  const proyekPertama = proyekTampil(dataset.galeri)[0];
  const gambar = layananBerfoto?.fotos?.[0]
    ? { url: layananBerfoto.fotos[0].url, alt: layananBerfoto.fotos[0].keterangan || layananBerfoto.title }
    : proyekPertama
    ? { url: proyekPertama.fotos[0].og ?? proyekPertama.fotos[0].url, alt: proyekPertama.judul, ...(proyekPertama.fotos[0].og ? { width: 1200, height: 630 } : {}) }
    : { url: '/brand/og-logo.png', width: 1200, height: 630, alt: 'Logo 3 Putra' };

  return {
    metadataBase: new URL(alamatResmi()),
    alternates: { canonical: '/' },
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'id_ID',
      siteName: dataset.businessConfig.businessName,
      images: [gambar],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function HomePage() {
  const dataset = await bacaDatasetTerbit();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonUntukScript(dataUsaha(dataset, alamatResmi())) }} />
      <HalamanDepan dataset={dataset} />
    </>
  );
}
