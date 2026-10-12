'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { BusinessConfigSchema } from '@/types/domain';
import { sapaanUmum, waTanyaUrl } from '@/lib/whatsapp';
import { catatKlikWa } from '@/lib/jejak';
import { LogoMendatar } from '@/components/brand/Logo';

interface NavbarProps {
  config: BusinessConfigSchema;
  /** Tautan Galeri cuma muncul kalau ada proyek yang tampil. */
  adaGaleri?: boolean;
}

/**
 * Hanya section yang benar-benar ada di halaman. Jangan tambah tautan ke section yang belum
 * dibangun (R-24). Di halaman depan tetap "#..." supaya tidak memuat ulang halaman (link
 * promosi membawa ?utm_source); dari halaman lain diawali "/".
 */
export function tautanSitus(pathname: string, adaGaleri: boolean) {
  const awal = pathname === '/' ? '' : '/';
  return [
    { href: `${awal}#kalkulator`, label: 'Cek harga' },
    { href: `${awal}#layanan`, label: 'Layanan' },
    ...(adaGaleri ? [{ href: '/galeri', label: 'Galeri' }] : []),
    { href: `${awal}#cara-kerja`, label: 'Cara kerja' },
    { href: `${awal}#faq`, label: 'Tanya jawab' },
  ];
}

export function Navbar({ config, adaGaleri = false }: NavbarProps) {
  const pathname = usePathname();
  const tautan = tautanSitus(pathname, adaGaleri);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tombolMenuRef = useRef<HTMLButtonElement>(null);
  const waHref = waTanyaUrl(config.frontlineContact.whatsappNumber, sapaanUmum(config.businessName));

  // Menu HP bisa ditutup pakai Escape, lalu fokus balik ke tombol menu (R-32).
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const tutup = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMobileMenuOpen(false);
      tombolMenuRef.current?.focus();
    };
    document.addEventListener('keydown', tutup);
    return () => document.removeEventListener('keydown', tutup);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Baris wilayah layanan. Isinya fakta, bukan slogan. */}
      <div className="bg-navy text-navy-kabut text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto">
          <span>Survei gratis di {config.serviceAreas.slice(0, 4).join(', ')} dan sekitarnya</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-kertas/95 backdrop-blur-sm border-b border-kertas-garis text-tinta">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <a href={pathname === '/' ? '#' : '/'} className="shrink-0 flex flex-col justify-center gap-1 min-h-[44px]">
            <LogoMendatar className="h-8 sm:h-9 w-auto" />
            <span className="text-xs text-tinta-lembut hidden sm:block">{config.tagline}</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-tinta-lembut">
            {tautan.map((link) => (
              <a key={link.href} href={link.href} className="inline-flex items-center min-h-[44px] hover:text-navy transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Amber muncul di sini karena ini tombol WhatsApp. Lihat DESIGN.md. */}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => catatKlikWa('navbar')}
            className="hidden sm:flex items-center min-h-[44px] bg-oranye hover:bg-oranye-tua text-navy font-semibold px-4 rounded-lg text-sm transition-colors"
          >
            Chat WhatsApp
          </a>

          <button
            ref={tombolMenuRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg border border-kertas-garis text-navy hover:bg-kertas-dalam"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-kertas border-b border-kertas-garis px-4 pb-5">
            {tautan.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] text-tinta border-b border-kertas-garis"
              >
                {link.label}
              </a>
            ))}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => catatKlikWa('menu-hp')}
              className="flex items-center justify-center min-h-[44px] bg-oranye text-navy font-semibold w-full rounded-lg mt-4"
            >
              Chat WhatsApp
            </a>
          </div>
        )}
      </header>
    </>
  );
}
