'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  Wrench,
  Layers,
  DollarSign,
  GitBranch,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Tag,
  Sliders,
  Play,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { AdminCard, AdminBadge, AdminButton } from '../../../components/admin/ui';

interface Chapter {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  category: 'dasar' | 'katalog' | 'formula' | 'publikasi' | 'contoh';
}

const CHAPTERS: Chapter[] = [
  { id: 's1-sistem-harga', number: '01', title: 'Memahami Sistem Harga', shortDesc: 'Konsep dasar pemecahan komponen biaya produk', category: 'dasar' },
  { id: 's2-data-produk', number: '02', title: 'Menyiapkan Data Produk', shortDesc: 'Menentukan jenis layanan, kategori & model ukuran', category: 'dasar' },
  { id: 's3-satuan-harga', number: '03', title: 'Menentukan Satuan Harga', shortDesc: 'Perbedaan per m², per meter, unit, fixed, % & pengali', category: 'dasar' },
  { id: 's4-bahan', number: '04', title: 'Katalog Bahan', shortDesc: 'Mengisi tarif bahan penutup & konversi dari supplier', category: 'katalog' },
  { id: 's5-rangka', number: '05', title: 'Katalog Rangka', shortDesc: 'Mengatur spesifikasi & tarif konstruksi rangka utama', category: 'katalog' },
  { id: 's6-pengerjaan', number: '06', title: 'Katalog Pengerjaan & Upah', shortDesc: 'Mengatur tarif upah tukang & fabrikasi pengelasan', category: 'katalog' },
  { id: 's7-finishing', number: '07', title: 'Katalog Finishing & Cat', shortDesc: 'Mengatur tarif cat Duco, Powder Coating & Anti Karat', category: 'katalog' },
  { id: 's8-tambahan', number: '08', title: 'Katalog Opsi Tambahan & Aksesoris', shortDesc: 'Memahami komponen opsional & pengelompokan kategori', category: 'katalog' },
  { id: 's9-minimum-billing', number: '09', title: 'Ukuran & Minimum Billing', shortDesc: 'Aturan batas minimum order dan cara kerjanya', category: 'formula' },
  { id: 's10-menyusun-cara-hitung', number: '10', title: 'Menyusun Urutan Cara Hitung', shortDesc: 'Langkah demi langkah merangkai rumus di builder', category: 'formula' },
  { id: 's11-percentage-multiplier', number: '11', title: 'Percentage & Multiplier', shortDesc: 'Mengatur faktor kerumitan lokasi & margin keuntungan', category: 'formula' },
  { id: 's12-custom-input', number: '12', title: 'Custom Input (Input Kustom)', shortDesc: 'Menangani parameter variabel dinamis pelanggan', category: 'formula' },
  { id: 's13-simulasi', number: '13', title: 'Simulasi Kalkulasi', shortDesc: 'Menguji langsung formula dengan contoh masukan real-time', category: 'formula' },
  { id: 's14-impact-preview', number: '14', title: 'Impact Preview (Pratinjau Dampak)', shortDesc: 'Melihat simulasi perbandingan harga Draf vs Dipublikasikan', category: 'publikasi' },
  { id: 's15-validation', number: '15', title: 'Pemeriksaan Validasi Data', shortDesc: 'Cek otomatis relasi ID agar draf bebas kesalahan', category: 'publikasi' },
  { id: 's16-publish', number: '16', title: 'Menerbitkan Versi (Publish)', shortDesc: 'Alur publikasi draf & keabadian versi historis', category: 'publikasi' },
  { id: 's17-contoh-gerobak', number: '17', title: 'Contoh Lengkap Gerobak / Booth UMKM', shortDesc: 'Studi kasus hipotetis penyusunan konfigurasi dari A-Z', category: 'contoh' },
  { id: 's18-checklist-publish', number: '18', title: 'Checklist Mandiri Sebelum Publish', shortDesc: 'Daftar periksa keamanan sebelum menekan tombol publikasi', category: 'contoh' },
];

export default function AdminPanduanPage() {
  const [activeSection, setActiveSection] = useState<string>('s1-sistem-harga');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);

  // Sync hash anchor on click or page load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && CHAPTERS.some((c) => c.id === hash)) {
        setActiveSection(hash);
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const filteredChapters = CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.number.includes(searchQuery)
  );

  const currentIndex = CHAPTERS.findIndex((c) => c.id === activeSection);
  const prevChapter = currentIndex > 0 ? CHAPTERS[currentIndex - 1] : null;
  const nextChapter = currentIndex < CHAPTERS.length - 1 ? CHAPTERS[currentIndex + 1] : null;

  const navigateToChapter = (id: string) => {
    setActiveSection(id);
    window.location.hash = id;
    setMobileTocOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-16 w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Buku Panduan Operasional Pemilik Usaha</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Panduan Konfigurasi Produk & Aturan Harga (CMS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Panduan praktis berbahasa Indonesia untuk pemilik usaha dalam mengatur katalog produk, bahan, upah, opsi tambahan, serta menyusun urutan hitungan harga secara mandiri tanpa perlu coding.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
          <FileSpreadsheet className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Main Grid: Sidebar Table of Contents + Main Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Table of Contents (Sticky on Desktop, Accordion Drawer on Mobile) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 sticky top-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ListChecks className="w-4 h-4 text-amber-600" />
                <span>Daftar Bab Panduan</span>
              </div>
              <AdminBadge variant="amber" size="sm">18 Bab</AdminBadge>
            </div>

            {/* Search Input for Handbook Sections */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik panduan..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Chapter List */}
            <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
              {filteredChapters.map((ch) => {
                const isActive = ch.id === activeSection;
                return (
                  <button
                    key={ch.id}
                    onClick={() => navigateToChapter(ch.id)}
                    className={`w-full text-left py-2.5 px-3 rounded-xl transition-all flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'hover:bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ch.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{ch.title}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-slate-900 font-normal' : 'text-slate-400'}`}>
                        {ch.shortDesc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation back to Admin Dashboard */}
            <div className="pt-2 border-t border-slate-200">
              <Link href="/admin">
                <AdminButton variant="outline" size="sm" className="w-full justify-center" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  Kembali ke Dashboard Admin
                </AdminButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Main Content Reader */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-12 shadow-sm">
          
          {/* Top Quick Navigation Buttons */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 text-xs">
            {prevChapter ? (
              <button
                onClick={() => navigateToChapter(prevChapter.id)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-amber-600 font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Bab {prevChapter.number}: {prevChapter.title}</span>
              </button>
            ) : <div />}

            {nextChapter ? (
              <button
                onClick={() => navigateToChapter(nextChapter.id)}
                className="flex items-center gap-1.5 text-[#16A34A] hover:text-[#15803D] font-bold transition"
              >
                <span>Bab {nextChapter.number}: {nextChapter.title}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>

          {/* SECTION 01: Memahami Sistem Harga */}
          <section id="s1-sistem-harga" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 01</span>
              <h2 className="text-xl font-bold text-slate-900">1. Memahami Sistem Harga</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem kalkulator harga ini dirancang agar pemilik usaha dapat menentukan tarif transparan yang otomatis menyesuaikan ukuran proyek pelanggan. Setiap produk (misal: Kanopi, Pagar, atau Gerobak UMKM) dihitung dengan memecah total biaya menjadi komponen-komponen baku yang jelas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <strong className="text-slate-900 font-bold block">1. Bahan Atap / Body</strong>
                <p className="text-slate-500">Biaya penutup utama (Spandek, Alderon, ACP Galvalum, Kayu, dll).</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <strong className="text-slate-900 font-bold block">2. Rangka Utama</strong>
                <p className="text-slate-500">Biaya kontruksi penopang (Hollow Galvanis, Stainless, Baja C75, dll).</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <strong className="text-slate-900 font-bold block">3. Upah & Finishing</strong>
                <p className="text-slate-500">Biaya pengerjaan pengelasan, fabrikasi, serta pelapisan cat pelindung.</p>
              </div>
            </div>
          </section>

          {/* SECTION 02: Menyiapkan Data Produk */}
          <section id="s2-data-produk" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 02</span>
                <h2 className="text-xl font-bold text-slate-900">2. Menyiapkan Data Produk</h2>
              </div>
              <Link href="/admin/layanan">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Halaman Layanan</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Produk & Layanan (/admin/layanan)</strong>, Anda mendaftarkan jenis barang yang dijual. Setiap produk memiliki pengelompokan kategori bisnis:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li><strong className="text-slate-800">Kanopi Rumah (canopy):</strong> Kanopi carport, teras, atau selasar.</li>
              <li><strong className="text-slate-800">Rangka Baja Ringan (baja_ringan):</strong> Konstruksi atap baja ringan rumah/gudang.</li>
              <li><strong className="text-slate-800">Gerobak Usaha (gerobak):</strong> Gerobak dorong, booth portable, steling stainless.</li>
              <li><strong className="text-slate-800">Booth Jualan (booth):</strong> Kios dagang UMKM, container stand, booth mall.</li>
              <li><strong className="text-slate-800">Pagar & Pintu (gate / railing / tralis):</strong> Pagar besi, railing tangga, tralis jendela.</li>
            </ul>
          </section>

          {/* SECTION 03: Menentukan Satuan Harga */}
          <section id="s3-satuan-harga" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 03</span>
              <h2 className="text-xl font-bold text-slate-900">3. Menentukan Satuan Harga</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Setiap komponen biaya wajib memiliki satuan kalkulasi yang tepat agar estimasi akurat:
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-700 uppercase">per m² (Luas Bidang)</span>
                <p className="text-slate-600">Digunakan jika biaya bertambah seiring luas area (Hasil kali Panjang × Lebar). Cocok untuk bahan atap, rangka kanopi, dan cat dasar.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-sky-700 uppercase">per meter (Meter Lari)</span>
                <p className="text-slate-600">Digunakan untuk pekerjaan memanjang seperti pagar, railing, atau talang air PVC.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-amber-700 uppercase">per unit (Satuan Pcs)</span>
                <p className="text-slate-600">Digunakan untuk barang yang dihitung per buah (misal: Roda Trolley, Wastafel Sink, Saklar Lampu).</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-purple-700 uppercase">fixed (Borongan Tetap)</span>
                <p className="text-slate-600">Nominal flat yang tidak dipengaruhi ukuran (misal: Biaya Bongkar Struktur Lama atau Biaya Transportasi Flat).</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-rose-700 uppercase">percentage (%) & multiplier (×)</span>
                <p className="text-slate-600">Digunakan untuk persentase penyesuaian kerumitan lokasi/desain (misal: 0.15 = 15% dari subtotal).</p>
              </div>
            </div>
          </section>

          {/* SECTION 04: Katalog Bahan */}
          <section id="s4-bahan" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 04</span>
                <h2 className="text-xl font-bold text-slate-900">4. Katalog Bahan Penutup</h2>
              </div>
              <Link href="/admin/bahan">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Katalog Bahan</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Bahan (/admin/bahan)</strong>, Anda memasukkan tarif bahan per m² atau per meter lari.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-2 text-amber-900">
              <strong className="font-bold block flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Cara Konversi Harga Supplier ke Satuan Sistem (CONTOH SIMULASI):
              </strong>
              <p>
                Jika supplier menjual 1 lembar ACP seharga <strong className="font-mono">Rp 450.000 (CONTOH SIMULASI)</strong> dengan ukuran lembar <strong className="font-mono text-slate-800">1.22m × 2.44m = 2.97 m²</strong>:
              </p>
              <div className="p-2 bg-white/80 rounded font-mono text-[11px] text-slate-800">
                Harga per m² = Rp 450.000 ÷ 2.97 m² = Rp 151.515 / m² (CONTOH SIMULASI)
              </div>
              <p>
                Tambahkan margin keuntungan bahan yang Anda inginkan (misal +30%) menjadi tarif jual sistem: <strong className="font-mono">Rp 195.000 / m² (CONTOH SIMULASI)</strong>.
              </p>
            </div>
          </section>

          {/* SECTION 05: Katalog Rangka */}
          <section id="s5-rangka" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 05</span>
                <h2 className="text-xl font-bold text-slate-900">5. Katalog Rangka Utama</h2>
              </div>
              <Link href="/admin/rangka">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Katalog Rangka</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Rangka (/admin/rangka)</strong>, Anda mendaftarkan opsi besi/baja rangka penopang (misal: Hollow Galvanis 40x60, Stainless Steel 304, Baja C75).
            </p>
            <p className="text-xs text-slate-500">
              Tarif dihitung per m² mencakup kebutuhan besi utama, jari-jari isian, serta baut/fischer pendukung.
            </p>
          </section>

          {/* SECTION 06: Katalog Pengerjaan */}
          <section id="s6-pengerjaan" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 06</span>
                <h2 className="text-xl font-bold text-slate-900">6. Katalog Pengerjaan & Upah</h2>
              </div>
              <Link href="/admin/pengerjaan">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Upah Pengerjaan</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Pengerjaan (/admin/pengerjaan)</strong>, Anda mengatur alokasi upah tukang pengelasan dan fabrikasi. Upah dapat diset per m² (misal: Rp 50.000 / m²) atau per unit borongan.
            </p>
          </section>

          {/* SECTION 07: Katalog Finishing */}
          <section id="s7-finishing" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 07</span>
                <h2 className="text-xl font-bold text-slate-900">7. Katalog Finishing & Cat</h2>
              </div>
              <Link href="/admin/finishing">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Katalog Finishing</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Finishing (/admin/finishing)</strong>, mendaftarkan opsi pengecatan pelindung (misal: Cat Anti Karat Zinc Chromate, Powder Coating Oven, Cat Duco).
            </p>
          </section>

          {/* SECTION 08: Katalog Tambahan */}
          <section id="s8-tambahan" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 08</span>
                <h2 className="text-xl font-bold text-slate-900">8. Katalog Opsi Tambahan & Aksesoris</h2>
              </div>
              <Link href="/admin/tambahan">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Katalog Tambahan</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Tambahan (/admin/tambahan)</strong>, Anda mendaftarkan opsi ekstra yang dapat dicentang pelanggan.
            </p>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <strong className="font-bold text-slate-900 block">Perbedaan Komponen Utama vs Tambahan Opsional:</strong>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                <li><strong className="text-slate-800">Komponen Utama (Wajib):</strong> Bahan dasar, Rangka, Upah dasar yang pasti dibutuhkan setiap pembuatan.</li>
                <li><strong className="text-slate-800">Tambahan (Opsional):</strong> Aksesoris atau fitur tambahan pilihan seperti Talang PVC, Roda Heavy Duty, Wastafel Sink, atau Branding Sticker.</li>
              </ul>
              <p className="text-slate-500 pt-1">
                Anda dapat mengisi tag <strong className="text-amber-800">Kategori Tambahan</strong> (misal: Aksesoris, Interior, Mobilitas, Branding, Kelistrikan) untuk mengelompokkan opsi pada kalkulator.
              </p>
            </div>
          </section>

          {/* SECTION 09: Minimum Billing */}
          <section id="s9-minimum-billing" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 09</span>
              <h2 className="text-xl font-bold text-slate-900">9. Ukuran & Minimum Billing</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Setiap pekerjaan memiliki biaya operasional minimal. Anda dapat mengatur <strong className="text-slate-900">Minimum Billing</strong> pada produk (misal: 10 m²).
            </p>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
              <strong className="font-bold block">Cara Kerja Minimum Billing:</strong>
              <p>
                Jika pelanggan memasukkan ukuran <strong className="font-mono text-slate-800">2m × 4m = 8 m²</strong> (di bawah batas minimum 10 m²), sistem secara otomatis menghitung tagihan berdasarkan minimum <strong className="font-bold">10 m²</strong> agar biaya operasional tukang dan transportasi tetap menutup modal usaha Anda.
              </p>
            </div>
          </section>

          {/* SECTION 10: Menyusun Cara Hitung */}
          <section id="s10-menyusun-cara-hitung" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 10</span>
                <h2 className="text-xl font-bold text-slate-900">10. Menyusun Urutan Cara Hitung</h2>
              </div>
              <Link href="/admin/cara-hitung">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Pengatur Cara Hitung</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di halaman <strong className="text-slate-900">Cara Hitung (/admin/cara-hitung)</strong>, Anda menyusun urutan langkah kalkulasi dari Step 1 hingga akhir:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>Langkah 1: Biaya Bahan Penutup</span>
                <span className="font-mono text-slate-500">Luas (m²) × Tarif Bahan Selected</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>Langkah 2: Biaya Rangka Utama</span>
                <span className="font-mono text-slate-500">Luas (m²) × Tarif Rangka Selected</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>Langkah 3: Biaya Pengerjaan & Upah</span>
                <span className="font-mono text-slate-500">Luas (m²) × Tarif Upah Selected</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>Langkah 4: Fitur & Tambahan Opsional</span>
                <span className="font-mono text-slate-500">Fixed (1) + Nominal Addon Selected</span>
              </div>
            </div>
          </section>

          {/* SECTION 11: Percentage & Multiplier */}
          <section id="s11-percentage-multiplier" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 11</span>
              <h2 className="text-xl font-bold text-slate-900">11. Percentage (%) & Multiplier (Pengali)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Untuk menambahkan biaya penyesuaian kerumitan lokasi (misal: pemasangan di lantai 2 atau bentuk melengkung kustom):
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li><strong className="text-slate-800">Persentase (%):</strong> Mengisi tarif <span className="font-mono">0.15</span> untuk menambahkan biaya sebesar 15% dari subtotal sebelumnya.</li>
              <li><strong className="text-slate-800">Multiplier (Pengali):</strong> Mengisi tarif <span className="font-mono">1.20</span> untuk mengalikan subtotal dengan 1.20x.</li>
            </ul>
          </section>

          {/* SECTION 12: Custom Input */}
          <section id="s12-custom-input" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 12</span>
              <h2 className="text-xl font-bold text-slate-900">12. Custom Input (Input Kustom Pelanggan)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Jika produk membutuhkan masukan angka kustom dari pelanggan (misal: "Jumlah Stopkontak Tambahan" atau "Panjang Kabel Roll Extra"), Anda dapat memilih <strong className="text-slate-900">Sumber Nilai = Input Kustom</strong> di Cara Hitung. Sistem akan otomatis menampilkan kotak isian angka pada kalkulator estimator publik.
            </p>
          </section>

          {/* SECTION 13: Simulasi */}
          <section id="s13-simulasi" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 13</span>
                <h2 className="text-xl font-bold text-slate-900">13. Simulasi Kalkulasi Real-Time</h2>
              </div>
              <Link href="/admin/cara-hitung">
                <AdminButton size="sm" variant="outline" icon={<Play className="w-3.5 h-3.5 text-emerald-600" />}>Buka Simulator</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Di panel kanan halaman <strong className="text-slate-900">Cara Hitung (/admin/cara-hitung)</strong>, terdapat simulator otomatis. Setiap kali Anda mengubah urutan atau tarif langkah, simulator langsung menghitung hasil estimasi secara real-time tanpa risiko mengubah data publik.
            </p>
          </section>

          {/* SECTION 14: Impact Preview */}
          <section id="s14-impact-preview" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 14</span>
                <h2 className="text-xl font-bold text-slate-900">14. Impact Preview (Pratinjau Dampak)</h2>
              </div>
              <Link href="/admin/versi">
                <AdminButton size="sm" variant="outline" icon={<ArrowRight className="w-3.5 h-3.5" />}>Buka Versi Harga</AdminButton>
              </Link>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sebelum mempublikasikan draf harga baru ke publik, buka halaman <strong className="text-slate-900">Versi Harga (/admin/versi)</strong>. Sistem akan menampilkan kartu <strong className="text-amber-800">Pratinjau Dampak Perubahan Harga</strong>:
            </p>
            <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider block">Fitur Impact Preview:</span>
              <p className="text-slate-300">
                Menampilkan perbandingan skenario nyata (misal proyek <strong className="text-amber-300">5m × 4m</strong>) antara <strong className="text-white">Versi Dipublikasikan (Rp 15.700.000)</strong> vs <strong className="text-amber-400">Draf Versi Baru (Rp 17.300.000)</strong> beserta selisih persentase kenaikan/penurunan (+10.19%).
              </p>
            </div>
          </section>

          {/* SECTION 15: Validation */}
          <section id="s15-validation" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 15</span>
              <h2 className="text-xl font-bold text-slate-900">15. Pemeriksaan Validasi Data</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem secara otomatis memeriksa draf Anda sebelum tombol publikasi diaktifkan. Jika ada ID bahan atau rangka yang terhapus tetapi masih terhubung ke layanan, sistem akan memblokir publikasi dan menampilkan daftar perbaikan yang harus dilakukan.
            </p>
          </section>

          {/* SECTION 16: Publish */}
          <section id="s16-publish" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 16</span>
              <h2 className="text-xl font-bold text-slate-900">16. Menerbitkan Versi (Publish & Keabadian Historical)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Saat Anda menekan <strong className="text-emerald-700 font-bold">Publikasikan Versi Ini</strong> di `/admin/versi`:
            </p>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
              <li>Draf resmi dipromosikan menjadi versi aktif yang digunakan kalkulator publik.</li>
              <li>Versi dipublikasikan sebelumnya secara otomatis diarsipkan (Archived).</li>
              <li>Versi lama bersifat <strong className="text-slate-900 font-bold">Immutable (Abadi)</strong> dan tidak pernah terhapus. Anda selalu dapat melakukan <strong className="text-amber-800 font-bold">Revert (Kembalikan Versi)</strong> kapan saja jika ingin memakai kembali aturan harga lama.</li>
            </ol>
          </section>

          {/* SECTION 17: Contoh Lengkap Gerobak / Booth UMKM */}
          <section id="s17-contoh-gerobak" className="space-y-4 scroll-mt-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">BAB 17</span>
              <h2 className="text-xl font-bold text-slate-900">17. Contoh Lengkap Alur Konfigurasi Gerobak UMKM</h2>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>PANDUAN ALUR HIPOTETIS (CONTOH SIMULASI):</span>
              </div>
              <p className="text-slate-700">
                Berikut adalah langkah-langkah praktis jika Anda ingin mendaftarkan produk <strong className="text-slate-900 font-bold">Gerobak Custom UMKM (CONTOH SIMULASI)</strong>:
              </p>
              
              <div className="space-y-2 text-[11px] text-slate-800">
                <div className="p-2.5 bg-white rounded border border-amber-200">
                  <strong className="font-bold block text-slate-900">Langkah 1: Tambah Layanan di /admin/layanan</strong>
                  Judul: "Gerobak UMKM Custom" • Kategori: "gerobak" • Satuan: "3D Dimensi (P×L×T)".
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200">
                  <strong className="font-bold block text-slate-900">Langkah 2: Isi Katalog Bahan & Rangka</strong>
                  Tambahkan bahan body <strong className="font-mono">ACP Galvalum (CONTOH SIMULASI: Rp 195.000 / m²)</strong> dan rangka <strong className="font-mono">Hollow 40x40 (CONTOH SIMULASI: Rp 180.000 / m²)</strong>.
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200">
                  <strong className="font-bold block text-slate-900">Langkah 3: Isi Katalog Tambahan dengan Kategori</strong>
                  • Kategori "Mobilitas": <strong className="font-mono">Roda Heavy Duty 4" (CONTOH SIMULASI: Rp 250.000 / unit)</strong><br />
                  • Kategori "Interior": <strong className="font-mono">Wastafel Sink + Pump (CONTOH SIMULASI: Rp 450.000 / unit)</strong><br />
                  • Kategori "Branding": <strong className="font-mono">Full Wrap Sticker Vinyl (CONTOH SIMULASI: Rp 350.000 / paket)</strong>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200">
                  <strong className="font-bold block text-slate-900">Langkah 4: Atur Langkah Rumus di /admin/cara-hitung</strong>
                  Susun 5 langkah: (1) Material Body (m² × Bahan), (2) Rangka Utama (m² × Rangka), (3) Upah Fabrikasi (m² × Upah), (4) Aksesoris Tambahan (Addon), (5) Kerumitan Desain (+15% subtotal).
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200">
                  <strong className="font-bold block text-slate-900">Langkah 5: Simulasi & Publish di /admin/versi</strong>
                  Uji simulasi proyek, periksa Impact Preview, jalankan validasi, dan klik Publikasikan.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 18: Checklist Sebelum Publish */}
          <section id="s18-checklist-publish" className="space-y-4 scroll-mt-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-1 rounded-lg">BAB 18</span>
              <h2 className="text-xl font-bold text-slate-900">18. Checklist Mandiri Sebelum Publish</h2>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2.5 text-slate-700">
              <p className="font-bold text-slate-900">Pastikan 5 poin berikut sudah dicentang sebelum menekan tombol publikasi:</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Semua tarif bahan, rangka, upah, dan cat sudah mencakup margin keuntungan usaha.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Setiap produk layanan sudah terhubung dengan minimal 1 opsi bahan dan 1 opsi rangka aktif.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Langkah-langkah di Cara Hitung sudah diuji pada panel simulator real-time.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hasil perbandingan Impact Preview di `/admin/versi` sudah sesuai dengan target strategi harga usaha Anda.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Indikator Validasi Struktural Draf menampilkan status "Draf Layak & Valid".</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Bottom Quick Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs">
            {prevChapter ? (
              <button
                onClick={() => navigateToChapter(prevChapter.id)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-amber-600 font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Bab {prevChapter.number}: {prevChapter.title}</span>
              </button>
            ) : <div />}

            {nextChapter ? (
              <button
                onClick={() => navigateToChapter(nextChapter.id)}
                className="flex items-center gap-1.5 text-[#16A34A] hover:text-[#15803D] font-bold transition"
              >
                <span>Bab {nextChapter.number}: {nextChapter.title}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>

        </div>
      </div>
    </div>
  );
}
