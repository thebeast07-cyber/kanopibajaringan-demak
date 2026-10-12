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

// Ikon digambar sendiri, gayanya sama dengan menu admin (garis 2px, ujung bulat).
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
  // Kanopi: atap miring di atas dua tiang.
  layanan: (
    <>
      <path d="M3 9.5 L12 5 L21 9.5" />
      <path d="M6 8 V19" />
      <path d="M18 8 V19" />
      <path d="M3 19 H21" />
    </>
  ),
  // Meteran: kalkulatornya dimulai dari isi ukuran.
  cekHarga: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
      <path d="M6.5 7 V10.5" />
      <path d="M10.5 7 V12" />
      <path d="M14.5 7 V10.5" />
      <path d="M18 7 V12" />
    </>
  ),
  // Sama dengan ikon Galeri di admin.
  galeri: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 16 L9 11 L13 15 L16 12.5 L20.5 16.5" />
      <circle cx="15.5" cy="8.5" r="1.5" />
    </>
  ),
  whatsapp: <path d="M12 4 A8 8 0 1 1 8 18.9 L4 20 L5.1 16.1 A8 8 0 0 1 12 4 Z" />,
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
