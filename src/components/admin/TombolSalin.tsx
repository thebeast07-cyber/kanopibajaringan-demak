'use client';

import React, { useState } from 'react';

interface TombolSalinProps {
  teks: string;
  label: string;
  className: string;
}

/** Salin ke clipboard. Kalau browser menolak, link-nya ditampilkan supaya bisa disalin manual. */
export function TombolSalin({ teks, label, className }: TombolSalinProps) {
  const [hasil, setHasil] = useState<'tersalin' | 'gagal' | null>(null);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teks);
      setHasil('tersalin');
      setTimeout(() => setHasil(null), 2500);
    } catch {
      setHasil('gagal');
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1.5 max-w-full">
      <button type="button" onClick={salin} className={className}>
        {hasil === 'tersalin' ? 'Tersalin' : label}
      </button>
      <span aria-live="polite" className="sr-only">
        {hasil === 'tersalin' ? 'Link tersalin.' : ''}
      </span>
      {hasil === 'gagal' && (
        <span className="text-[13px] text-tinta-lembut break-all">
          Nggak bisa nyalin otomatis. Tekan lama link ini lalu salin: <span className="text-tinta select-all">{teks}</span>
        </span>
      )}
    </span>
  );
}
