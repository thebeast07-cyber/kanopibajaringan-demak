'use client';

import React, { useRef, useState } from 'react';
import { FotoLayananSchema } from '@/types/domain';
import { FotoBesar } from './FotoBesar';

interface GaleriFotoProps {
  fotos: FotoLayananSchema[];
  judul: string;
}

const kelasTombol =
  'inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-kertas-garis bg-white hover:bg-kertas-dalam text-navy font-semibold disabled:opacity-40 disabled:cursor-not-allowed';

export function GaleriFoto({ fotos, judul }: GaleriFotoProps) {
  const jalurRef = useRef<HTMLUListElement>(null);
  const [aktif, setAktif] = useState(0);
  const [besar, setBesar] = useState<number | null>(null);
  const banyak = fotos.length > 1;

  const keFoto = (i: number, instan = false) => {
    const jalur = jalurRef.current;
    if (!jalur) return;
    // Gerak halus cuma buat menunjukkan arah pindahnya; dimatikan kalau pengguna minta gerak dikurangi.
    const kurangiGerak = instan || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    jalur.scrollTo({ left: i * jalur.clientWidth, behavior: kurangiGerak ? 'auto' : 'smooth' });
  };

  const tutupBesar = (terakhir: number) => {
    setBesar(null);
    // Galeri kecil ikut ke foto terakhir yang dilihat, dan fokus balik ke foto itu.
    requestAnimationFrame(() => {
      keFoto(terakhir, true);
      jalurRef.current?.querySelectorAll<HTMLButtonElement>('button')[terakhir]?.focus({ preventScroll: true });
    });
  };

  const saatGeser = () => {
    const jalur = jalurRef.current;
    if (jalur) setAktif(Math.round(jalur.scrollLeft / jalur.clientWidth));
  };

  return (
    <div className="space-y-2">
      <ul
        ref={jalurRef}
        onScroll={saatGeser}
        tabIndex={banyak ? 0 : undefined}
        aria-label={banyak ? `Foto ${judul}, geser untuk lihat foto lain` : `Foto ${judul}`}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-xl bg-kertas-dalam [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((foto, i) => (
          <li key={foto.url} className="snap-start shrink-0 w-full aspect-[4/3]">
            <button
              type="button"
              onClick={() => setBesar(i)}
              aria-label={`Perbesar foto ${i + 1}${foto.keterangan ? `: ${foto.keterangan}` : ''}`}
              className="relative block w-full h-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.keterangan || `${judul}, foto ${i + 1} dari ${fotos.length}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover"
              />
              {/* Tanda kecil kalau fotonya bisa diketuk buat dilihat besar. */}
              <span
                aria-hidden="true"
                className="absolute right-2 bottom-2 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 text-navy"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M9.5 2.5 H13.5 V6.5 M13.5 2.5 L9 7 M6.5 13.5 H2.5 V9.5 M2.5 13.5 L7 9" />
                </svg>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {banyak && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => keFoto(aktif - 1)}
            disabled={aktif === 0}
            aria-label="Foto sebelumnya"
            className={kelasTombol}
          >
            ←
          </button>
          <p aria-live="polite" className="text-sm text-tinta-lembut">
            {fotos[aktif]?.keterangan ? `${fotos[aktif].keterangan} · ` : ''}
            {aktif + 1} / {fotos.length}
          </p>
          <button
            type="button"
            onClick={() => keFoto(aktif + 1)}
            disabled={aktif === fotos.length - 1}
            aria-label="Foto berikutnya"
            className={kelasTombol}
          >
            →
          </button>
        </div>
      )}

      {besar !== null && <FotoBesar fotos={fotos} judul={judul} mulai={besar} onTutup={tutupBesar} />}
    </div>
  );
}
