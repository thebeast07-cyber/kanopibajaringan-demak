import type { Metadata } from 'next';
import { HalamanDepan } from '@/components/landing/HalamanDepan';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { getTarifBorongan } from '@/lib/estimator/pricingEngine';
import { proyekTampil } from '@/lib/cms/galeri';

// Dirender tiap kunjungan, karena data dibaca dari Redis dengan permintaan tanpa cache yang
// tidak boleh dipakai di halaman statis. Datanya sendiri tetap di-cache (bacaDatasetTerbit)
// dan dibuang tiap admin menyimpan, jadi Redis tidak dibaca di setiap kunjungan.
export const dynamic = 'force-dynamic';

const NAMA_RESMI = '3 Putra Spesialis Kanopi dan Baja Ringan';

// Alamat situs untuk gambar preview yang berupa path relatif (mode uji lokal).
// Di Vercel, foto dari Blob sudah berupa URL penuh.
const ALAMAT_SITUS = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const dataset = await bacaDatasetTerbit();
  const aktif = dataset.services.filter((s) => s.status === 'active');
  const kota = dataset.businessConfig.serviceAreas.join(' dan ');
  const adaHarga = aktif.some((s) => getTarifBorongan(s) !== null);

  // Kalimat yang menjanjikan "harganya langsung keluar" cuma dipakai kalau memang ada harganya.
  const title = adaHarga ? `${NAMA_RESMI} | Cek Harga Borongan` : `${NAMA_RESMI} | ${kota}`;
  const description = adaHarga
    ? `Cek harga pasang kanopi, atap baja ringan, pagar, dan railing di ${kota}. Masukkan ukuran, harganya langsung keluar, lanjut chat WhatsApp buat nego dan jadwal survei gratis.`
    : `Pasang kanopi, atap baja ringan, pagar, dan railing di ${kota}. Masukkan ukuran, kirim lewat WhatsApp, kami hitungkan harganya. Survei lokasi gratis.`;

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
    metadataBase: new URL(ALAMAT_SITUS),
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
  return <HalamanDepan dataset={dataset} />;
}
