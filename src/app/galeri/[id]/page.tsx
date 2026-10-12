import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { asalPermintaan } from '@/lib/server/asal';
import { judulProyek, proyekTampil, teksDipasang } from '@/lib/cms/galeri';
import { CompleteDataset } from '@/types/domain';
import { getTarifBorongan } from '@/lib/estimator/pricingEngine';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GaleriFoto } from '@/components/landing/GaleriFoto';
import { KartuProyek, TombolWaProyek } from '@/components/landing/KartuProyek';
import { CatatKunjungan } from '@/components/landing/CatatKunjungan';

// Halaman satu proyek. Link-nya ikut di pesan WhatsApp dari galeri, jadi foto pertamanya yang
// muncul sebagai preview di chat (versi JPEG 1200×630 yang dibuat waktu foto diunggah).
export const dynamic = 'force-dynamic';

const cari = (dataset: CompleteDataset, id: string) => proyekTampil(dataset.galeri).find((p) => p.id === id);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const dataset = await bacaDatasetTerbit();
  const proyek = cari(dataset, params.id);
  if (!proyek) return { title: `Galeri | ${dataset.businessConfig.businessName}` };

  const nama = dataset.businessConfig.businessName;
  const title = `${judulProyek(proyek)} | ${nama}`;
  const dipasang = teksDipasang(proyek.dipasang);
  const description =
    proyek.keterangan?.trim() ||
    `Foto asli pemasangan ${proyek.judul} di ${proyek.lokasi}${dipasang ? `, ${dipasang}` : ''}. Tanya harga untuk ukuranmu lewat WhatsApp.`;
  const foto = proyek.fotos[0];

  return {
    metadataBase: new URL(asalPermintaan()),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'id_ID',
      siteName: nama,
      url: `/galeri/${proyek.id}`,
      images: [{ url: foto.og ?? foto.url, alt: foto.keterangan || proyek.judul, ...(foto.og ? { width: 1200, height: 630 } : {}) }],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function HalamanProyek({ params }: { params: { id: string } }) {
  const dataset = await bacaDatasetTerbit();
  const proyek = cari(dataset, params.id);
  if (!proyek) notFound();

  const config = dataset.businessConfig;
  const kontak = { namaUsaha: config.businessName, whatsappNumber: config.frontlineContact.whatsappNumber, asal: asalPermintaan() };
  const layanan = proyek.serviceId ? dataset.services.find((s) => s.id === proyek.serviceId && s.status === 'active') : undefined;
  const dipasang = teksDipasang(proyek.dipasang);
  const adaHarga = dataset.services.some((s) => s.status === 'active' && getTarifBorongan(s) !== null);
  const lain = proyekTampil(dataset.galeri)
    .filter((p) => p.id !== proyek.id)
    .slice(0, 3);

  const rincian = [
    { label: 'Lokasi', isi: proyek.lokasi },
    dipasang && { label: 'Dipasang', isi: dipasang },
    proyek.ukuran && { label: 'Ukuran', isi: proyek.ukuran },
    layanan && layanan.title !== proyek.judul && { label: 'Jenis layanan', isi: layanan.title },
  ].filter(Boolean) as { label: string; isi: string }[];

  return (
    <div className="min-h-screen flex flex-col bg-kertas text-tinta">
      <CatatKunjungan />
      <Navbar config={config} adaGaleri />
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <a
            href="/galeri"
            className="inline-flex items-center gap-1 min-h-[44px] text-navy font-semibold underline underline-offset-4 decoration-navy-muda hover:decoration-2"
          >
            Semua proyek
          </a>

          <GaleriFoto fotos={proyek.fotos} judul={proyek.judul} />

          <div className="space-y-4">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-navy leading-tight">{proyek.judul}</h1>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[15px]">
              {rincian.map((r) => (
                <div key={r.label} className="contents">
                  <dt className="text-tinta-lembut">{r.label}</dt>
                  <dd className="text-tinta font-semibold">{r.isi}</dd>
                </div>
              ))}
            </dl>
            {proyek.keterangan && <p className="text-tinta leading-relaxed whitespace-pre-line">{proyek.keterangan}</p>}
          </div>

          <div className="bg-white border border-kertas-garis rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="font-heading text-xl font-bold text-navy">Mau yang kayak gini?</h2>
            <p className="text-tinta-lembut leading-relaxed">
              Harganya tergantung ukuran dan bahan di tempatmu. Chat kami, link foto ini ikut terkirim biar langsung nyambung.
              Survei lokasinya gratis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <TombolWaProyek proyek={proyek} kontak={kontak} sumber="galeri-detail" className="w-full sm:w-auto">
                Tanya lewat WhatsApp
              </TombolWaProyek>
              <a
                href="/#kalkulator"
                className="flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-navy bg-white hover:bg-kertas-dalam text-navy font-semibold transition-colors"
              >
                {adaHarga ? 'Hitung perkiraan harga' : 'Isi ukuran'}
              </a>
            </div>
          </div>
        </div>

        {lain.length > 0 && (
          <section aria-labelledby="judul-lain" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-6">
            <h2 id="judul-lain" className="font-heading text-2xl font-bold text-navy">
              Proyek lain
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lain.map((p) => (
                <KartuProyek key={p.id} proyek={p} kontak={kontak} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer config={config} />
    </div>
  );
}
