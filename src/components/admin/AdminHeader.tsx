'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { defaultCmsRepository } from '../../lib/cms/repository';
import { ShieldCheck, GitCommit, ExternalLink, Menu } from 'lucide-react';

export interface AdminHeaderProps {
  onToggleMobile?: () => void;
}

export function AdminHeader({ onToggleMobile }: AdminHeaderProps) {
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');
  const [hasDraft, setHasDraft] = useState<boolean>(false);

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
        <div>
          <h1 className="text-sm font-bold text-slate-800 tracking-tight">
            Panel Pengelolaan Harga & Layanan
          </h1>
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

        {/* Mode Info */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Edit Aman</span>
        </div>

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
      </div>
    </header>
  );
}
