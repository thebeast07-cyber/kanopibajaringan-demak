'use client';

import React, { useEffect, useRef } from 'react';
import { ServiceSchema } from '../../../types/domain';
import { BarisLainnya, KartuUtama } from '../../landing/KartuLayanan';
import { kelasTombolTipis } from '../gaya';

interface PratinjauKartuProps {
  service: ServiceSchema;
  belumDisimpan: boolean;
  namaUsaha: string;
  whatsappNumber: string;
  onTutup: () => void;
}

/** Lembar dari bawah berisi kartu persis seperti di website, dari isian yang belum disimpan. */
export function PratinjauKartu({ service, belumDisimpan, namaUsaha, whatsappNumber, onTutup }: PratinjauKartuProps) {
  const tutupRef = useRef<HTMLButtonElement>(null);
  const lembarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tutupRef.current?.focus();
    const tombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup();
      // Tab tetap berputar di dalam lembar selama terbuka.
      if (e.key !== 'Tab' || !lembarRef.current) return;
      const fokusBisa = lembarRef.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]');
      const pertama = fokusBisa[0];
      const terakhir = fokusBisa[fokusBisa.length - 1];
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    };
    document.addEventListener('keydown', tombol);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', tombol);
      document.body.style.overflow = overflowLama;
    };
  }, [onTutup]);

  const props = { svc: service, namaUsaha, whatsappNumber, pratinjau: true };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/70" onClick={onTutup}>
      <div
        ref={lembarRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-pratinjau"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-kertas rounded-t-2xl"
      >
        <div className="sticky top-0 bg-kertas flex items-center justify-between gap-3 pl-4 pr-3 py-3 border-b border-kertas-garis">
          <h2 id="judul-pratinjau" className="text-base font-bold text-tinta">
            Begini tampilannya di website
          </h2>
          <button ref={tutupRef} type="button" onClick={onTutup} className={kelasTombolTipis}>
            Tutup
          </button>
        </div>

        <div className="p-4 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {belumDisimpan && (
            <p className="text-[13px] leading-relaxed text-tinta-lembut bg-kertas-dalam rounded-lg px-3 py-2.5">
              Belum disimpan. Pelanggan baru lihat versi ini setelah kamu tekan Simpan.
            </p>
          )}
          {service.status !== 'active' && (
            <p className="text-[13px] leading-relaxed text-tinta bg-kertas-dalam rounded-lg px-3 py-2.5">
              Layanan ini disembunyikan, jadi pelanggan nggak lihat kartu ini sama sekali.
            </p>
          )}
          {service.featured ? (
            <KartuUtama {...props} />
          ) : (
            <div className="bg-white border border-kertas-garis rounded-2xl px-4">
              <p className="pt-3 text-[13px] text-tinta-lembut">Tampil di daftar “Layanan lain”:</p>
              <BarisLainnya {...props} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
