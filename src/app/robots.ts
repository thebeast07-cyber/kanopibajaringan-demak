import type { MetadataRoute } from 'next';

// Halaman admin dan API tidak perlu muncul di hasil pencarian.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] } };
}
