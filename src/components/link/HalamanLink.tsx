'use client';

import React, { useEffect } from 'react';
import { LogoMendatar } from '@/components/brand/Logo';
import { sapaanUmum, waTanyaUrl } from '@/lib/whatsapp';
import { TujuanLink, catatKlikLink, catatKlikWa, catatKunjungan } from '@/lib/jejak';

// Ikon gaya B (isi penuh) pilihan pemilik, grid 24×24. Bagian dalamnya diwarnai sama dengan
// latar tombol (--latar, ikut berubah waktu hover), jadi kelihatan seperti lubang.
function Ikon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const IKON = {
  whatsapp: (
    <>
      <path d="M3.5 20.5 L4.6 16.3 A8.5 8.5 0 1 1 7.7 19.3 Z" fill="currentColor" />
      <path
        d="M9.2 8.6c-.3 2.9 3.1 6.4 6.2 6.2l.9-1.6-1.9-1.1-1 .9c-1-.4-1.9-1.3-2.3-2.3l.9-1-1.1-1.9z"
        fill="var(--latar)"
        stroke="var(--latar)"
        strokeWidth="1"
      />
    </>
  ),
  // Jendela browser dengan atap kanopi di dalamnya: website-nya usaha kanopi.
  website: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" fill="currentColor" />
      <path d="M6.5 8H17.5" stroke="var(--latar)" />
      <path d="M7 17 L12 12.5 L17 17" stroke="var(--latar)" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="3.8" stroke="var(--latar)" />
      <circle cx="17" cy="7" r="1.1" fill="var(--latar)" stroke="none" />
    </>
  ),
  tiktok: (
    <>
      <path d="M13.5 3.5V15a3.75 3.75 0 1 1-3.75-3.75" strokeWidth="3.2" />
      <path d="M13.5 3.5c.3 2.7 2.3 4.7 5 5" strokeWidth="3.2" />
    </>
  ),
};

const kelasTombol =
  'flex items-center gap-3 min-h-[56px] px-4 rounded-2xl bg-[var(--latar)] text-[17px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy';

interface HalamanLinkProps {
  namaUsaha: string;
  tagline: string;
  whatsappNumber: string;
  linkInstagram?: string;
  linkTiktok?: string;
  /** Dibuka dari QR brosur: pesan WhatsApp menyebut brosur, biar pemilik tahu chatnya dari mana. */
  dariBrosur: boolean;
}

export function HalamanLink({ namaUsaha, tagline, whatsappNumber, linkInstagram, linkTiktok, dariBrosur }: HalamanLinkProps) {
  useEffect(() => catatKunjungan(), []);

  const pesan = dariBrosur
    ? `Halo ${namaUsaha}, saya lihat dari brosur. Mau tanya soal pemasangan.`
    : sapaanUmum(namaUsaha);

  const lain: { tujuan: TujuanLink; href: string; label: string; luar: boolean }[] = [
    { tujuan: 'website', href: '/', label: 'Cek harga & foto proyek', luar: false },
    ...(linkInstagram ? [{ tujuan: 'instagram' as const, href: linkInstagram, label: 'Instagram', luar: true }] : []),
    ...(linkTiktok ? [{ tujuan: 'tiktok' as const, href: linkTiktok, label: 'TikTok', luar: true }] : []),
  ];

  return (
    <main className="min-h-screen bg-kertas text-tinta px-4 py-12">
      <div className="max-w-sm mx-auto space-y-8">
        <header className="space-y-3 text-center">
          <LogoMendatar className="h-12 w-auto mx-auto" />
          <p className="text-tinta-lembut">{tagline}</p>
        </header>

        <div className="space-y-3">
          <a
            href={waTanyaUrl(whatsappNumber, pesan)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => catatKlikWa('halaman-link')}
            className={`${kelasTombol} [--latar:theme(colors.oranye.DEFAULT)] hover:[--latar:theme(colors.oranye.tua)] text-navy`}
          >
            <Ikon>{IKON.whatsapp}</Ikon>
            <span className="flex-1">
              Chat WhatsApp
              <span className="block text-sm font-normal">Tanya harga dan jadwal survei gratis</span>
            </span>
          </a>

          {lain.map((l) => (
            <a
              key={l.tujuan}
              href={l.href}
              {...(l.luar ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => catatKlikLink(l.tujuan)}
              className={`${kelasTombol} [--latar:#FFFFFF] hover:[--latar:theme(colors.kertas.dalam)] border border-kertas-garis text-navy`}
            >
              <Ikon>{IKON[l.tujuan]}</Ikon>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
