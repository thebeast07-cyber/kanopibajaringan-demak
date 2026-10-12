'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SumberWa, catatKlikWa } from '@/lib/jejak';

interface BarBawahProps {
  adaGaleri: boolean;
  /** Tujuan tombol WhatsApp. Di halaman proyek, pesannya menyebut proyek itu. */
  wa: { href: string; sumber: SumberWa; layanan?: string };
}

const TINGGI = 'h-[calc(60px+env(safe-area-inset-bottom))]';

// Ikon digambar sendiri dan dipilih pemilik (garis 2px, ujung bulat). Jangan ganti ke set ikon
// siap pakai seperti lucide, lihat CLAUDE.md.
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
    >
      {children}
    </svg>
  );
}

const IKON = {
  // Rangka atap baja ringan.
  layanan: (
    <>
      <path d="M3 16 L12 6 L21 16 Z" />
      <path d="M12 6 V16" />
      <path d="M7.5 11 L10 16" />
      <path d="M16.5 11 L14 16" />
      <path d="M3 19.5 H21" />
    </>
  ),
  // Label harga.
  cekHarga: (
    <>
      <path d="M3.5 4.5 H11 L20 13.5 L13.5 20 L3.5 10 Z" />
      <circle cx="7.75" cy="8.75" r="1.25" />
    </>
  ),
  // Dua foto bertumpuk.
  galeri: (
    <>
      <path d="M7.5 7.5 V5.5 A2 2 0 0 1 9.5 3.5 H19 A2 2 0 0 1 21 5.5 V14 A2 2 0 0 1 19 16 H17" />
      <rect x="3" y="7.5" width="14" height="13" rx="2" />
      <path d="M3 17.5 L7.5 13.5 L10.5 16.5 L12.5 15 L17 18.5" />
    </>
  ),
  // Gelembung chat dengan gagang telepon.
  whatsapp: (
    <>
      <path d="M12 4 A8 8 0 1 1 8 18.9 L4 20 L5.1 16.1 A8 8 0 0 1 12 4 Z" />
      <path
        d="M9.3 8.6c.4-.5 1.1-.4 1.4.2l.6 1.3c.1.3.1.7-.2.9l-.6.6c.6 1.1 1.4 1.9 2.5 2.5l.6-.6c.2-.3.6-.3.9-.2l1.3.6c.6.3.7 1 .2 1.4l-.7.6c-.6.5-1.5.6-2.2.2-1.9-1-3.4-2.5-4.4-4.4-.4-.7-.3-1.6.2-2.2z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
};

// Menu bawah khusus HP, seperti di admin: jempol nyampe, dan WhatsApp selalu kelihatan.
// Di layar lebar menu atas sudah cukup, jadi bar ini disembunyikan.
export function BarBawah({ adaGaleri, wa }: BarBawahProps) {
  const pathname = usePathname();
  const awal = pathname === '/' ? '' : '/';
  const diGaleri = pathname.startsWith('/galeri');
  // Waktu keyboard HP terbuka (isi kalkulator), bar disembunyikan supaya tidak menutup kolom.
  const [mengetik, setMengetik] = useState(false);

  useEffect(() => {
    const kolomKetik = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit'].includes(el.type)));
    const masuk = (e: FocusEvent) => kolomKetik(e.target) && setMengetik(true);
    const keluar = () => setMengetik(false);
    document.addEventListener('focusin', masuk);
    document.addEventListener('focusout', keluar);
    return () => {
      document.removeEventListener('focusin', masuk);
      document.removeEventListener('focusout', keluar);
    };
  }, []);

  const menu = [
    { href: `${awal}#layanan`, label: 'Layanan', ikon: IKON.layanan },
    { href: `${awal}#kalkulator`, label: 'Cek harga', ikon: IKON.cekHarga },
    ...(adaGaleri ? [{ href: '/galeri', label: 'Galeri', ikon: IKON.galeri, aktif: diGaleri }] : []),
  ];

  const kelasMenu = 'flex flex-col items-center justify-center gap-1 min-h-[60px] text-xs';

  return (
    <>
      {/* Pengganjal setinggi bar, supaya footer paling bawah tidak ketutup. Warnanya ikut footer. */}
      <div aria-hidden="true" className={`md:hidden bg-navy ${TINGGI}`} />
      <nav
        aria-label="Menu bawah"
        hidden={mengetik}
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-kertas-garis pb-[env(safe-area-inset-bottom)]"
      >
        <ul className={`grid ${menu.length === 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {menu.map((m) => (
            <li key={m.label}>
              <a
                href={m.href}
                aria-current={m.aktif ? 'page' : undefined}
                className={`${kelasMenu} ${m.aktif ? 'text-navy font-bold' : 'text-tinta-lembut font-semibold hover:text-navy'}`}
              >
                <Ikon>{m.ikon}</Ikon>
                {m.label}
              </a>
            </li>
          ))}
          <li className="p-1.5">
            <a
              href={wa.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => catatKlikWa(wa.sumber, wa.layanan)}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[48px] rounded-xl bg-oranye hover:bg-oranye-tua text-navy text-xs font-bold"
            >
              <Ikon>{IKON.whatsapp}</Ikon>
              WhatsApp
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
