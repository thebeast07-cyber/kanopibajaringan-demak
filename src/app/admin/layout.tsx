'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
  ambilStatusSimpan,
  cobaKirimLagi,
  langgananStatusSimpan,
  muatDariServer,
} from '../../lib/cms/sinkronServer';

const kelasTombol =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-tinta-batas bg-white hover:bg-kertas-dalam text-hutan font-semibold';

function BannerSimpan() {
  const status = useSyncExternalStore(langgananStatusSimpan, ambilStatusSimpan, ambilStatusSimpan);
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dataSiap, setDataSiap] = useState(false);
  const [galatMuat, setGalatMuat] = useState('');

  useEffect(() => {
    if (halamanMasuk) return;
    // Halaman admin baru dirender setelah data dari penyimpanan online masuk, supaya
    // tidak ada yang mengedit data lama lalu menimpa versi yang lebih baru.
    muatDariServer()
      .then(() => setDataSiap(true))
      .catch((e: Error) => setGalatMuat(e.message));
  }, [halamanMasuk]);

  if (halamanMasuk) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen w-full transition-all">
        <AdminHeader onToggleMobile={() => setMobileOpen((prev) => !prev)} />
        {/* Header fixed setinggi 64px, jadi jarak atas = 64px + jarak sisi. Dulu ditulis
            `pt-20 p-4 sm:p-6 lg:p-8`: sm:p-6/lg:p-8 menimpa pt-20 dan judul ketutup header. */}
        <main className="px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-[88px] lg:px-8 lg:pb-8 lg:pt-24 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {galatMuat ? (
            <div role="alert" className="max-w-xl space-y-3 text-tinta">
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
              <BannerSimpan />
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
