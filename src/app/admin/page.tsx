'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { defaultCmsRepository } from '../../lib/cms/repository';
import { CompleteDataset, AuditLogEntry } from '../../types/domain';
import {
  AdminCard,
  AdminBadge,
  AdminButton,
  AdminSection,
  AdminTable,
  Column,
} from '../../components/admin/ui';
import {
  Wrench,
  Layers,
  DollarSign,
  GitBranch,
  Calculator,
  BookOpen,
  PlayCircle,
  History,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [dataset, setDataset] = useState<CompleteDataset | null>(null);
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [recentAudits, setRecentAudits] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const update = () => {
      const data = defaultCmsRepository.getPublishedDataset();
      setDataset(data);
      setActiveVersion(defaultCmsRepository.getActiveVersion());
      setHasDraft(defaultCmsRepository.hasDraft());
      setRecentAudits(defaultCmsRepository.getAuditLogs().slice(0, 5));
    };

    update();
    return defaultCmsRepository.subscribe(update);
  }, []);

  if (!dataset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-medium text-slate-500 animate-pulse">
          Memuat data usaha...
        </div>
      </div>
    );
  }

  const auditColumns: Column<AuditLogEntry>[] = [
    {
      header: 'Waktu',
      accessor: (row) => (
        <span className="text-xs font-mono text-slate-500">
          {new Date(row.timestamp).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Kategori',
      accessor: (row) => <AdminBadge variant="info">{row.category.toUpperCase()}</AdminBadge>,
    },
    {
      header: 'Keterangan Perubahan',
      accessor: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.item}</div>
          <div className="text-xs text-slate-500">
            {row.oldValue} <span className="text-amber-600 font-bold">→</span> {row.newValue}
          </div>
        </div>
      ),
    },
    {
      header: 'Versi',
      accessor: (row) => <AdminBadge variant="warning">{row.pricingVersion}</AdminBadge>,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Pusat Kendali Harga Usaha</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {dataset.businessConfig.businessName}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Kelola harga bahan, upah pengerjaan, opsi finishing, serta formula hitungan dalam satu modul terpusat yang selalu konsisten.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
          <FileSpreadsheet className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AdminCard className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Layanan Aktif
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{dataset.services.length}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Kanopi, Baja Ringan, dll</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bahan & Penutup
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{dataset.materials.length}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Spandek, Alderon, Polycarbonate</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Versi Harga Website
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeVersion}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Dipublikasikan</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <GitBranch className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Perubahan
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {hasDraft ? (
                  <span className="text-amber-700">Draft Aktif</span>
                ) : (
                  <span className="text-slate-600">Terbuka</span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {hasDraft ? 'Perubahan siap dites' : 'Semua harga sinkron'}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                hasDraft ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Quick Navigation Sections */}
      <AdminSection
        title="Modul Pengelolaan Utama & Panduan"
        description="Pilih bagian yang ingin Anda periksa, ubah, atau pelajari panduannya"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminCard
            title="Panduan Konfigurasi"
            subtitle="Buku panduan operasional pemilik usaha berbahasa Indonesia"
            action={
              <Link href="/admin/panduan">
                <AdminButton size="sm" variant="primary" icon={<BookOpen className="w-3.5 h-3.5" />}>
                  Buka Panduan
                </AdminButton>
              </Link>
            }
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Cakupan Panduan:</span>
                <strong className="text-slate-800">18 Bab Lengkap</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Contoh Studi Kasus:</span>
                <strong className="text-amber-700 font-bold">Gerobak & Booth</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Istilah Teknis:</span>
                <AdminBadge variant="success">BAHASA USAHA</AdminBadge>
              </div>
              <div className="flex justify-between py-1">
                <span>Checklist Safety:</span>
                <strong className="text-slate-800">Tersedia</strong>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Produk & Bahan"
            subtitle="Kelola katalog produk, material, rangka, upah & cat"
            action={
              <Link href="/admin/layanan">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Buka
                </AdminButton>
              </Link>
            }
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Layanan:</span>
                <strong className="text-slate-800">{dataset.services.length} Layanan</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Opsi Bahan Atap:</span>
                <strong className="text-slate-800">{dataset.materials.length} Opsi</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Opsi Rangka:</span>
                <strong className="text-slate-800">{dataset.frames.length} Opsi</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Biaya Tambahan:</span>
                <strong className="text-slate-800">{dataset.addOns.length} Item</strong>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Cara Hitung & Formula"
            subtitle="Atur urutan perhitungan & logika rumus bisnis"
            action={
              <Link href="/admin/cara-hitung">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Buka
                </AdminButton>
              </Link>
            }
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Mesin Hitung:</span>
                <AdminBadge variant="success">SATU SUMBER BENAR</AdminBadge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Formula Terkonfigurasi:</span>
                <strong className="text-slate-800">
                  {dataset.calculationConfigs?.length || 0} Produk
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Dukungan Minimum:</span>
                <strong className="text-slate-800">Aktif (Misal 10m²)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Buku Hitungan:</span>
                <strong className="text-slate-800">Tersambung Otomatis</strong>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Pengujian & Simulasi"
            subtitle="Uji dampak perubahan harga pada hasil estimasi"
            action={
              <Link href="/admin/simulator">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Buka
                </AdminButton>
              </Link>
            }
          >
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Simulator Harga:</span>
                <strong className="text-slate-800">Tanpa Efek Langsung</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Buku Hitungan Preview:</span>
                <strong className="text-slate-800">Format Pemilik</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Margin Keuntungan:</span>
                <strong className="text-slate-800">Terhitung Transparan</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Versi Terpublikasi:</span>
                <strong className="text-slate-800">{activeVersion}</strong>
              </div>
            </div>
          </AdminCard>
        </div>
      </AdminSection>

      {/* Audit Activity Table */}
      <AdminSection
        title="Riwayat Perubahan Terakhir"
        description="Catatan aktivitas pengubahan harga dan konfigurasi"
        action={
          <Link href="/admin/riwayat">
            <AdminButton size="sm" variant="ghost" icon={<History className="w-4 h-4" />}>
              Lihat Semua Riwayat
            </AdminButton>
          </Link>
        }
      >
        <AdminTable
          columns={auditColumns}
          data={recentAudits}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada riwayat aktivitas pengubahan data."
        />
      </AdminSection>
    </div>
  );
}
