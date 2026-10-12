'use client';

import React from 'react';
import { ProyekGaleriSchema } from '@/types/domain';
import { pesanWaGaleri, ringkasProyek } from '@/lib/cms/galeri';
import { waTanyaUrl } from '@/lib/whatsapp';
import { catatKlikWa } from '@/lib/jejak';

export interface DataKontakGaleri {
  namaUsaha: string;
  whatsappNumber: string;
  /** Alamat situs yang sedang dibuka, buat link halaman proyek di pesan WhatsApp. */
  asal: string;
}

const kelasTombolWa =
  'flex items-center justify-center min-h-[48px] px-5 bg-oranye hover:bg-oranye-tua text-navy font-semibold rounded-xl transition-colors';

/** Tombol WhatsApp dari galeri. Pesannya menyebut proyek ini dan membawa link-nya, tanpa harga. */
export function TombolWaProyek({
  proyek,
  kontak,
  sumber,
  className = '',
  label,
  children,
}: {
  proyek: ProyekGaleriSchema;
  kontak: DataKontakGaleri;
  sumber: 'galeri' | 'galeri-detail';
  className?: string;
  /** Nama tombol untuk pembaca layar, kalau teks tombolnya sama di banyak kartu. */
  label?: string;
  children: React.ReactNode;
}) {
  const href = waTanyaUrl(kontak.whatsappNumber, pesanWaGaleri(kontak.namaUsaha, proyek, `${kontak.asal}/galeri/${proyek.id}`));
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => catatKlikWa(sumber, proyek.serviceId)}
      aria-label={label}
      className={`${kelasTombolWa} ${className}`}
    >
      {children}
    </a>
  );
}

export function KartuProyek({ proyek, kontak }: { proyek: ProyekGaleriSchema; kontak: DataKontakGaleri }) {
  const sampul = proyek.fotos[0];
  const ringkas = ringkasProyek(proyek);
  const href = `/galeri/${proyek.id}`;

  return (
    <article className="bg-white border border-kertas-garis rounded-2xl overflow-hidden flex flex-col">
      {/* Foto dan judul menuju halaman yang sama, jadi foto dilewati keyboard dan pembaca layar. */}
      <a href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[4/3] bg-kertas-dalam">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sampul.url} alt="" loading="lazy" className="w-full h-full object-cover" />
        {proyek.fotos.length > 1 && (
          <span className="absolute right-2.5 bottom-2.5 inline-flex items-center min-h-[28px] px-2.5 rounded-lg bg-white/90 text-navy text-xs font-semibold">
            {proyek.fotos.length} foto
          </span>
        )}
      </a>
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="space-y-1 flex-1">
          <h3 className="font-heading text-lg font-bold text-navy leading-snug">
            <a href={href} className="hover:underline underline-offset-4">
              {proyek.judul}
            </a>
          </h3>
          {ringkas && <p className="text-sm text-tinta-lembut">{ringkas}</p>}
        </div>
        <TombolWaProyek proyek={proyek} kontak={kontak} sumber="galeri" label={`Tanya lewat WhatsApp soal ${proyek.judul}`}>
          Tanya lewat WhatsApp
        </TombolWaProyek>
      </div>
    </article>
  );
}
