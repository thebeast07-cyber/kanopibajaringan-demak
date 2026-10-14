import type { MetadataRoute } from 'next';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';
import { alamatResmi } from '@/lib/server/asal';
import { proyekTampil } from '@/lib/cms/galeri';

// Daftar halaman buat Google. Proyek galeri baru otomatis ikut begitu disimpan pemilik.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dataset = await bacaDatasetTerbit();
  const base = alamatResmi();
  const proyek = proyekTampil(dataset.galeri);
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    ...(proyek.length
      ? [
          { url: `${base}/galeri`, changeFrequency: 'weekly' as const, priority: 0.8 },
          ...proyek.map((p) => ({ url: `${base}/galeri/${p.id}`, lastModified: new Date(p.dibuat), priority: 0.6 })),
        ]
      : []),
  ];
}
