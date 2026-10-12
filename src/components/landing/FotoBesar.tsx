'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FotoLayananSchema } from '@/types/domain';

interface FotoBesarProps {
  fotos: FotoLayananSchema[];
  judul: string;
  mulai: number;
  /** Dipanggil dengan nomor foto terakhir yang dilihat, biar galeri kecil ikut pindah ke sana. */
  onTutup: (terakhir: number) => void;
}

const kelasTombol =
  'inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-lg border border-white/40 text-white font-semibold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed';

/** Foto layanan layar penuh. Utuh tanpa terpotong, bisa digeser ke foto lain. */
export function FotoBesar({ fotos, judul, mulai, onTutup }: FotoBesarProps) {
  const jalurRef = useRef<HTMLUListElement>(null);
  const lembarRef = useRef<HTMLDivElement>(null);
  const tutupRef = useRef<HTMLButtonElement>(null);
  const [aktif, setAktif] = useState(mulai);
  const aktifRef = useRef(mulai);
  aktifRef.current = aktif;
  const banyak = fotos.length > 1;

  // Langsung di foto yang diketuk, tanpa animasi geser dari foto pertama.
  useLayoutEffect(() => {
    const jalur = jalurRef.current;
    if (jalur) jalur.scrollLeft = mulai * jalur.clientWidth;
  }, [mulai]);

  const keFoto = (i: number) => {
    const jalur = jalurRef.current;
    if (!jalur || i < 0 || i >= fotos.length) return;
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    jalur.scrollTo({ left: i * jalur.clientWidth, behavior: kurangiGerak ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    tutupRef.current?.focus();
    const tombol = (e: KeyboardEvent) => {
      // Ditangkap paling awal supaya lembar lain di bawahnya (mis. pratinjau admin) tidak ikut bereaksi.
      if (e.key === 'Escape') {
        e.stopPropagation();
        onTutup(aktifRef.current);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.stopPropagation();
        e.preventDefault();
        keFoto(aktifRef.current + (e.key === 'ArrowRight' ? 1 : -1));
      } else if (e.key === 'Tab' && lembarRef.current) {
        e.stopPropagation();
        const bisa = Array.from(lembarRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
        const i = bisa.indexOf(document.activeElement as HTMLButtonElement);
        const tujuan = e.shiftKey ? (i <= 0 ? bisa.length - 1 : i - 1) : i === bisa.length - 1 ? 0 : i + 1;
        e.preventDefault();
        bisa[tujuan]?.focus();
      }
    };
    window.addEventListener('keydown', tombol, true);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tombol, true);
      document.body.style.overflow = overflowLama;
    };
    // keFoto dan onTutup cukup dibaca saat tombol ditekan; aktif dibaca lewat ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saatGeser = () => {
    const jalur = jalurRef.current;
    if (jalur) setAktif(Math.round(jalur.scrollLeft / jalur.clientWidth));
  };

  const foto = fotos[aktif];

  // Dipasang langsung di <body>, supaya header website yang menempel di atas tidak menutupinya.
  return createPortal(
    <div
      ref={lembarRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${judul}, ukuran besar`}
      className="fixed inset-0 z-[60] flex flex-col bg-tinta text-white"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <p className="text-sm text-white/80">
          {banyak ? `${aktif + 1} / ${fotos.length}` : judul}
        </p>
        <button ref={tutupRef} type="button" onClick={() => onTutup(aktif)} className={kelasTombol}>
          Tutup
        </button>
      </div>

      <ul
        ref={jalurRef}
        onScroll={saatGeser}
        className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((f, i) => (
          <li key={f.url} className="snap-start shrink-0 w-full h-full flex items-center justify-center px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.url}
              alt={f.keterangan || `${judul}, foto ${i + 1} dari ${fotos.length}`}
              className="max-w-full max-h-full object-contain"
            />
          </li>
        ))}
      </ul>

      <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3">
        {banyak ? (
          <button type="button" onClick={() => keFoto(aktif - 1)} disabled={aktif === 0} aria-label="Foto sebelumnya" className={kelasTombol}>
            ←
          </button>
        ) : (
          <span />
        )}
        <p aria-live="polite" className="flex-1 text-center text-sm text-white/90">
          {foto?.keterangan || ''}
        </p>
        {banyak ? (
          <button
            type="button"
            onClick={() => keFoto(aktif + 1)}
            disabled={aktif === fotos.length - 1}
            aria-label="Foto berikutnya"
            className={kelasTombol}
          >
            →
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>,
    document.body
  );
}
