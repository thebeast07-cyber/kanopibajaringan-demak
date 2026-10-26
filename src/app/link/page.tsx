import type { Metadata } from 'next';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { alamatResmi } from '@/lib/server/asal';
import { HalamanLink } from '@/components/link/HalamanLink';

// Halaman yang dibuka dari QR brosur (dan bisa juga dari bio). Datanya dari Redis, jadi
// dirender tiap kunjungan seperti halaman depan.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { businessConfig: c } = await bacaDatasetTerbit();
  return {
    metadataBase: new URL(alamatResmi()),
    title: `${c.businessName}: WhatsApp, website, dan sosial media`,
    description: `${c.tagline}. Chat WhatsApp, cek harga di website, atau lihat hasil pemasangan di Instagram dan TikTok.`,
    // Halaman pintu masuk, isinya sudah ada di halaman depan. Tidak perlu muncul di Google.
    robots: { index: false, follow: true },
  };
}

export default async function Link({ searchParams }: { searchParams: { utm_source?: string } }) {
  const { businessConfig: c } = await bacaDatasetTerbit();
  return (
    <HalamanLink
      namaUsaha={c.businessName}
      tagline={c.tagline}
      whatsappNumber={c.frontlineContact.whatsappNumber}
      linkInstagram={c.linkInstagram}
      linkTiktok={c.linkTiktok}
      dariBrosur={searchParams.utm_source?.toLowerCase() === 'brosur'}
    />
  );
}
