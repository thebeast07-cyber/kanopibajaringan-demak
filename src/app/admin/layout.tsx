'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import {
  ambilStatusSimpan,
  cobaKirimLagi,
  langgananStatusSimpan,
  muatDariServer,
  StatusSimpan,
} from '../../lib/cms/sinkronServer';

const kelasTombol =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-tinta-batas bg-white hover:bg-kertas-dalam text-navy text-sm font-semibold';

function teksStatus(s: StatusSimpan): string {
  if (s.jenis === 'belum-dipasang') return 'Belum tersambung';
  switch (s.keadaan) {
    case 'memuat':
      return 'Memuat...';
    case 'menyimpan':
      return 'Menyimpan...';
    case 'gagal':
      return 'Gagal menyimpan';
    case 'konflik':
      return 'Perlu muat ulang';
    default:
      return s.jenis === 'lokal' ? 'Tersimpan (uji lokal)' : 'Tersimpan online';
  }
}

function BannerSimpan({ status }: { status: StatusSimpan }) {
  const perluTampil =
    status.keadaan === 'gagal' || status.keadaan === 'konflik' || status.jenis === 'belum-dipasang';
  if (!perluTampil || !status.pesan) return null;

  return (
    <div role="alert" className="bg-kertas-dalam border border-tinta-batas rounded-lg p-4 text-tinta space-y-3">
      <p className="font-semibold">{status.pesan}</p>
      {status.keadaan === 'konflik' && (
        <button type="button" onClick={() => window.location.reload()} className={kelasTombol}>
          Muat ulang halaman
        </button>
      )}
      {status.keadaan === 'gagal' && (
        <button type="button" onClick={cobaKirimLagi} className={kelasTombol}>
          Coba simpan lagi
        </button>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const halamanMasuk = pathname === '/admin/masuk';
  const [dataSiap, setDataSiap] = useState(false);
  const [galatMuat, setGalatMuat] = useState('');
  const status = useSyncExternalStore(langgananStatusSimpan, ambilStatusSimpan, ambilStatusSimpan);

  useEffect(() => {
    if (halamanMasuk) return;
    // Halaman admin baru dirender setelah data dari penyimpanan online masuk, supaya
    // tidak ada yang mengedit data lama lalu menimpa versi yang lebih baru.
    muatDariServer()
      .then(() => setDataSiap(true))
      .catch((e: Error) => setGalatMuat(e.message));
  }, [halamanMasuk]);

  if (halamanMasuk) return <>{children}</>;

  const keluar = async () => {
    await fetch('/api/admin/masuk', { method: 'DELETE' }).catch(() => null);
    window.location.assign('/admin/masuk');
  };

  return (
    <div className="min-h-screen bg-kertas text-tinta">
      <header className="sticky top-0 z-30 bg-white border-b border-kertas-garis">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <p className="font-heading text-lg font-semibold text-navy">
            3 Putra <span className="font-sans text-sm font-normal text-tinta-lembut">admin</span>
          </p>
          <div className="flex items-center gap-2">
            <p aria-live="polite" className="hidden sm:block text-sm text-tinta-lembut mr-1">
              {teksStatus(status)}
            </p>
            <a href="/" target="_blank" rel="noopener noreferrer" className={kelasTombol}>
              Lihat website
            </a>
            <button type="button" onClick={keluar} className={kelasTombol}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {galatMuat ? (
          <div role="alert" className="space-y-3">
            <p className="font-semibold">{galatMuat}</p>
            <button type="button" onClick={() => window.location.reload()} className={kelasTombol}>
              Coba lagi
            </button>
          </div>
        ) : !dataSiap ? (
          <p role="status" className="text-sm text-tinta-lembut">
            Memuat data dari penyimpanan online...
          </p>
        ) : (
          <>
            <BannerSimpan status={status} />
            {children}
          </>
        )}
      </main>
    </div>
  );
}
