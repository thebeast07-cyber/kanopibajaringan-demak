'use client';

import { Analytics } from '@vercel/analytics/next';
import { perangkatAdmin } from '@/lib/jejak';

// Kunjungan owner (halaman /admin, atau browser yang pernah login admin) dan panggilan API
// tidak dihitung, biar angkanya murni pelanggan.
export function AnalitikPengunjung() {
  return (
    <Analytics
      beforeSend={(event) => {
        const path = new URL(event.url).pathname;
        return path.startsWith('/admin') || path.startsWith('/api') || perangkatAdmin() ? null : event;
      }}
    />
  );
}
