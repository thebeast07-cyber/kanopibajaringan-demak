'use client';

import React from 'react';
import { ProyekGaleriSchema } from '@/types/domain';
import { DataKontakGaleri, KartuProyek } from './KartuProyek';

const BATAS_DEPAN = 6;

/** Galeri di halaman depan. Tidak dirender sama sekali selama belum ada proyek yang tampil. */
export function GaleriSection({ proyek, kontak }: { proyek: ProyekGaleriSchema[]; kontak: DataKontakGaleri }) {
  if (proyek.length === 0) return null;
  const tampil = proyek.slice(0, BATAS_DEPAN);

  return (
    <section id="galeri" className="py-16 sm:py-20 lg:py-24 bg-kertas text-tinta border-b border-kertas-garis scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight">Hasil pemasangan kami</h2>
          <p className="text-tinta-lembut leading-relaxed">
            Foto asli dari proyek yang sudah kami pasang. Harganya tergantung ukuran dan bahan, jadi kalau ada yang
            cocok, tanya langsung lewat WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tampil.map((p) => (
            <KartuProyek key={p.id} proyek={p} kontak={kontak} />
          ))}
        </div>

        {proyek.length > tampil.length && (
          <a
            href="/galeri"
            className="inline-flex items-center min-h-[44px] text-navy font-semibold underline underline-offset-4 decoration-navy-muda hover:decoration-2"
          >
            Lihat semua {proyek.length} proyek
          </a>
        )}
      </div>
    </section>
  );
}
