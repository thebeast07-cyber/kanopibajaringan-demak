'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Calculator, Images, LayoutGrid, MessageCircle } from 'lucide-react';
import { SumberWa, catatKlikWa } from '@/lib/jejak';

interface BarBawahProps {
  adaGaleri: boolean;
  /** Tujuan tombol WhatsApp. Di halaman proyek, pesannya menyebut proyek itu. */
  wa: { href: string; sumber: SumberWa; layanan?: string };
}

const TINGGI = 'h-[calc(60px+env(safe-area-inset-bottom))]';

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
    { href: `${awal}#layanan`, label: 'Layanan', ikon: LayoutGrid },
    { href: `${awal}#kalkulator`, label: 'Cek harga', ikon: Calculator },
    ...(adaGaleri ? [{ href: '/galeri', label: 'Galeri', ikon: Images, aktif: diGaleri }] : []),
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
                <m.ikon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
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
              <MessageCircle className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
              WhatsApp
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
