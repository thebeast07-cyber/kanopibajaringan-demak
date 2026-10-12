import type { Metadata } from 'next';
import { HalamanDepan } from '@/components/landing/HalamanDepan';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { getTarifBorongan } from '@/lib/estimator/pricingEngine';

// Halaman dibangun ulang tiap admin menyimpan (revalidatePath di /api/admin/state);
// angka ini cuma jaring pengaman kalau sinyal itu terlewat.
export const revalidate = 3600;

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

  // Gambar preview waktu link dibagikan di WhatsApp: foto asli pertama dari pemilik, kalau ada.
  const layananBerfoto = aktif.find((s) => s.featured && s.fotos?.length);
  const foto = layananBerfoto?.fotos?.[0];

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
      ...(foto ? { images: [{ url: foto.url, alt: foto.keterangan || layananBerfoto!.title }] } : {}),
    },
    twitter: { card: foto ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function HomePage() {
  const dataset = await bacaDatasetTerbit();
  return <HalamanDepan dataset={dataset} />;
}
