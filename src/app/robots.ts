import type { MetadataRoute } from 'next';
import { alamatResmi } from '@/lib/server/asal';

export const dynamic = 'force-dynamic';

// Halaman admin dan API tidak perlu muncul di hasil pencarian.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${alamatResmi()}/sitemap.xml`,
  };
}
