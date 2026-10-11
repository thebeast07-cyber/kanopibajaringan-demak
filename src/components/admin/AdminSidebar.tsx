'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Layers,
  HardHat,
  Paintbrush,
  PlusCircle,
  Box,
  Package,
  DollarSign,
  Calculator,
  BookOpen,
  PlayCircle,
  History,
  GitBranch,
  ArrowLeft,
  ExternalLink,
  Briefcase,
  FileText,
  Globe,
  Settings,
  X,
  ClipboardList,
} from 'lucide-react';

export interface NavGroup {
  groupLabel: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
  }[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'UTAMA',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/isi-data', label: 'Isi Data Layanan', icon: ClipboardList },
    ],
  },
  {
    groupLabel: 'PRODUK',
    items: [
      { href: '/admin/layanan', label: 'Layanan', icon: Wrench },
      { href: '/admin/bahan', label: 'Bahan', icon: Layers },
      { href: '/admin/rangka', label: 'Rangka', icon: Box },
      { href: '/admin/pengerjaan', label: 'Pengerjaan', icon: HardHat },
      { href: '/admin/finishing', label: 'Finishing', icon: Paintbrush },
      { href: '/admin/tambahan', label: 'Tambahan', icon: PlusCircle },
      { href: '/admin/paket', label: 'Paket', icon: Package },
    ],
  },
  {
    groupLabel: 'HARGA',
    items: [
      { href: '/admin/harga', label: 'Harga', icon: DollarSign },
      { href: '/admin/cara-hitung', label: 'Cara Hitung', icon: Calculator },
      { href: '/admin/buku-hitungan', label: 'Buku Hitungan', icon: BookOpen },
      { href: '/admin/simulator', label: 'Simulator', icon: PlayCircle },
      { href: '/admin/versi', label: 'Versi Harga', icon: GitBranch },
    ],
  },
  {
    groupLabel: 'OPERASIONAL',
    items: [
      { href: '/admin/estimasi', label: 'Estimasi', icon: FileText },
      { href: '/admin/portofolio', label: 'Portofolio', icon: Briefcase },
    ],
  },
  {
    groupLabel: 'WEBSITE',
    items: [{ href: '/admin/konten-website', label: 'Konten Website', icon: Globe }],
  },
  {
    groupLabel: 'SISTEM',
    items: [
      { href: '/admin/riwayat', label: 'Riwayat', icon: History },
      { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
    ],
  },
];

export interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-800 shadow-xl transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
              Pengelolaan Usaha
            </div>
            <div className="text-base font-bold text-white tracking-tight">Admin Estimator</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {group.groupLabel}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Return Link */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 hover:text-white transition"
          >
            <span>Lihat Website Utama</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </aside>
    </>
  );
}
