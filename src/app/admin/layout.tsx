'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ambilStatusSimpan,
  cobaKirimLagi,
  langgananStatusSimpan,
  muatDariServer,
  StatusSimpan,
} from '../../lib/cms/sinkronServer';
import { tandaiPerangkatAdmin } from '../../lib/jejak';
import { LogoLoading } from '../../components/brand/LogoLoading';
import { LogoMendatar } from '../../components/brand/Logo';
import { NavAdmin } from '../../components/admin/NavAdmin';
import { kelasTombolTipis } from '../../components/admin/gaya';

function BannerSimpan({ status }: { status: StatusSimpan }) {
  const perluTampil =
    status.keadaan === 'gagal' || status.keadaan === 'konflik' || status.jenis === 'belum-dipasang';
  if (!perluTampil || !status.pesan) return null;

  return (
    <div role="alert" className="bg-kertas-dalam border border-tinta-batas rounded-xl p-4 text-tinta space-y-3">
      <p className="font-semibold">{status.pesan}</p>
      {status.keadaan === 'konflik' && (
        <button type="button" onClick={() => window.location.reload()} className={kelasTombolTipis}>
          Muat ulang halaman
        </button>
      )}
      {status.keadaan === 'gagal' && (
        <button type="button" onClick={cobaKirimLagi} className={kelasTombolTipis}>
          Coba simpan lagi
        </button>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const halamanMasuk = pathname === '/admin/masuk';
  // Halaman ubah satu layanan atau satu proyek galeri punya bar Simpan sendiri di bawah, jadi
  // tab menu disembunyikan.
  const halamanUbah = /^\/admin\/(layanan|galeri)\/[^/]+$/.test(pathname);
  const [dataSiap, setDataSiap] = useState(false);
  const [galatMuat, setGalatMuat] = useState('');
  const status = useSyncExternalStore(langgananStatusSimpan, ambilStatusSimpan, ambilStatusSimpan);

  useEffect(() => {
    if (halamanMasuk) return;
    tandaiPerangkatAdmin();
    // Halaman admin baru dirender setelah data dari penyimpanan online masuk, supaya
    // tidak ada yang mengedit data lama lalu menimpa versi yang lebih baru.
    muatDariServer()
      .then(() => setDataSiap(true))
      .catch((e: Error) => setGalatMuat(e.message));
  }, [halamanMasuk]);

  if (halamanMasuk) return <>{children}</>;

  return (
    <div className="min-h-screen bg-kertas text-tinta">
      <header className="sticky top-0 z-30 bg-white border-b border-kertas-garis">
        <div className="max-w-xl mx-auto px-4 h-[60px] flex items-center justify-between gap-3">
          <Link href="/admin" aria-label="3 Putra, ke Beranda admin" className="flex items-center min-h-[44px]">
            <LogoMendatar className="h-[26px] w-auto" />
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className={kelasTombolTipis}>
            Lihat website
          </a>
        </div>
      </header>

      <main className={`max-w-xl mx-auto px-4 pt-5 space-y-4 ${halamanUbah ? 'pb-44' : 'pb-28'}`}>
        {galatMuat ? (
          <div role="alert" className="space-y-3">
            <p className="font-semibold">{galatMuat}</p>
            <button type="button" onClick={() => window.location.reload()} className={kelasTombolTipis}>
              Coba lagi
            </button>
          </div>
        ) : !dataSiap ? (
          <div className="flex justify-center py-16">
            <LogoLoading teks="Memuat data" />
          </div>
        ) : (
          <>
            <BannerSimpan status={status} />
            {children}
          </>
        )}
      </main>

      {!halamanUbah && <NavAdmin />}
    </div>
  );
}
