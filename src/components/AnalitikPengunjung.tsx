'use client';

import { Analytics } from '@vercel/analytics/next';

// Kunjungan owner ke /admin dan panggilan API tidak dihitung, biar angkanya murni pelanggan.
export function AnalitikPengunjung() {
  return (
    <Analytics
      beforeSend={(event) => {
        const path = new URL(event.url).pathname;
        return path.startsWith('/admin') || path.startsWith('/api') ? null : event;
      }}
    />
  );
}
