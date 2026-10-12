'use client';

import { useEffect } from 'react';
import { catatKunjungan } from '@/lib/jejak';

/** Halaman di luar halaman depan juga dihitung kunjungannya, misalnya link galeri yang dibagikan. */
export function CatatKunjungan() {
  useEffect(() => catatKunjungan(), []);
  return null;
}
