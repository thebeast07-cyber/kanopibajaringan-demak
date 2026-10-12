'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { defaultCmsRepository } from '../../lib/cms/repository';
import { GitCommit, ExternalLink, Menu } from 'lucide-react';
import { ambilStatusSimpan, langgananStatusSimpan, StatusSimpan } from '../../lib/cms/sinkronServer';

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

export interface AdminHeaderProps {
  onToggleMobile?: () => void;
}

export function AdminHeader({ onToggleMobile }: AdminHeaderProps) {
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const statusSimpan = useSyncExternalStore(langgananStatusSimpan, ambilStatusSimpan, ambilStatusSimpan);

  const keluar = async () => {
    await fetch('/api/admin/masuk', { method: 'DELETE' }).catch(() => null);
    window.location.assign('/admin/masuk');
  };

  useEffect(() => {
    const updateState = () => {
      setActiveVersion(defaultCmsRepository.getActiveVersion());
      setHasDraft(defaultCmsRepository.hasDraft());
    };

    updateState();
    return defaultCmsRepository.subscribe(updateState);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-0 lg:left-64 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm transition-all">
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Bukan h1: tiap halaman sudah punya judul sendiri. Disembunyikan di HP supaya
            tombol Keluar dan status simpan muat dalam header 64px. */}
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-slate-800 tracking-tight">
            Panel Pengelolaan Harga & Layanan
          </p>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Modul Operasional Pemilik Kontraktor Local
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Draft Indicator if active draft exists */}
        {hasDraft && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Ada Draft Belum Diterbitkan</span>
          </div>
        )}

        {/* Active Version Badge */}
        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
          <GitCommit className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Versi:</span>
          <strong className="text-amber-600 font-bold">{activeVersion}</strong>
        </div>

        {/* Status simpan nyata, menggantikan badge "Edit Aman" yang tidak menandai apa-apa. */}
        <p
          aria-live="polite"
          className="hidden sm:block text-xs font-semibold text-tinta px-2.5 py-1 rounded-lg border border-kertas-garis bg-white"
        >
          {teksStatus(statusSimpan)}
        </p>

        {/* Direct Link to Public Site */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg transition"
        >
          <span className="hidden sm:inline">Lihat Website</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
        </Link>

        <button
          type="button"
          onClick={keluar}
          className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg transition"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
