'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { kolomKosong, teksHarga } from '../../../lib/cms/isiDataLayanan';
import { ServiceSchema } from '../../../types/domain';
import { kelasJudulHalaman, kelasKartu, kelasTombolKedua } from '../../../components/admin/gaya';

function Gambar({ svc }: { svc: ServiceSchema }) {
  const foto = svc.fotos?.[0];
  if (foto) {
    return (
      <span className="relative shrink-0 w-16 h-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url} alt="" className="w-16 h-16 rounded-xl object-cover bg-kertas-dalam" />
        {svc.fotos!.length > 1 && (
          <span className="absolute right-1 bottom-1 rounded-md bg-white px-1.5 text-[11px] font-bold text-navy">
            {svc.fotos!.length}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="shrink-0 w-16 h-16 rounded-xl border border-dashed border-tinta-batas bg-kertas flex items-center justify-center">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B655E" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11 L12 4 L21 11" />
        <path d="M6 10 V20 H18 V10" />
      </svg>
    </span>
  );
}

function keteranganBaris(svc: ServiceSchema): string {
  const kosong = kolomKosong(svc).filter((k) => k !== 'harga');
  const bagian = [
    kosong.includes('bahan') ? 'Bahan belum diisi' : kolomKosong(svc).length === 0 ? 'Lengkap' : '',
    svc.featured ? (svc.fotos?.length ? 'Kartu besar' : 'Kartu besar, belum ada foto') : '',
    svc.status !== 'active' ? 'Disembunyikan dari website' : '',
  ].filter(Boolean);
  return bagian.join(' · ');
}

function DaftarLayanan() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const saring = params.get('saring') === 'belum-lengkap' ? 'belum-lengkap' : 'semua';
  const [layanan, setLayanan] = useState<ServiceSchema[] | null>(null);

  useEffect(() => {
    const muat = () => setLayanan(defaultCmsRepository.getWorkingDataset().services);
    muat();
    return defaultCmsRepository.subscribe(muat);
  }, []);

  if (!layanan) {
    return (
      <p role="status" className="text-sm text-tinta-lembut">
        Memuat data layanan...
      </p>
    );
  }

  const belumLengkap = layanan.filter((s) => kolomKosong(s).length > 0);
  const tampil = saring === 'belum-lengkap' ? belumLengkap : layanan;
  const ganti = (s: 'semua' | 'belum-lengkap') =>
    router.replace(s === 'semua' ? pathname : `${pathname}?saring=${s}`, { scroll: false });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className={kelasJudulHalaman}>Layanan</h1>
        <p className="text-sm text-tinta-lembut">
          {layanan.length === 0
            ? 'Belum ada layanan.'
            : `${layanan.length - belumLengkap.length} dari ${layanan.length} sudah lengkap.`}
        </p>
      </div>

      {layanan.length > 0 && (
        <div role="group" aria-label="Saring layanan" className="flex gap-2">
          {(
            [
              ['semua', `Semua ${layanan.length}`],
              ['belum-lengkap', `Belum lengkap ${belumLengkap.length}`],
            ] as const
          ).map(([nilai, label]) => (
            <button
              key={nilai}
              type="button"
              aria-pressed={saring === nilai}
              onClick={() => ganti(nilai)}
              className={`min-h-[44px] px-3.5 rounded-xl border text-sm font-semibold ${
                saring === nilai ? 'bg-navy border-navy text-white' : 'bg-white border-kertas-garis text-tinta hover:bg-kertas-dalam'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tampil.length === 0 ? (
        <p className={`${kelasKartu} p-4 text-[15px]`}>
          {saring === 'belum-lengkap' ? 'Semua layanan sudah lengkap.' : 'Belum ada layanan. Tambah yang pertama di bawah.'}
        </p>
      ) : (
        <ul className={`${kelasKartu} overflow-hidden divide-y divide-kertas-garis`}>
          {tampil.map((svc) => {
            const harga = teksHarga(svc);
            const [angka, satuan] = harga ? harga.split(' / ') : [];
            const keterangan = keteranganBaris(svc);
            return (
              <li key={svc.id}>
                <Link
                  href={`/admin/layanan/${svc.id}`}
                  className="flex items-center gap-3 px-3.5 py-3 text-tinta hover:bg-kertas"
                >
                  <Gambar svc={svc} />
                  <span className="flex-1 min-w-0 flex flex-col items-start gap-1">
                    <span className="text-[15px] font-semibold leading-snug">{svc.title}</span>
                    {harga ? (
                      <span className="font-heading text-base font-bold text-oranye-gelap">
                        {angka} <span className="font-sans text-[13px] font-normal text-tinta-lembut">/ {satuan}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-tinta-lembut border border-dashed border-tinta-batas rounded-md px-2 py-0.5">
                        Harga kosong
                      </span>
                    )}
                    {keterangan && <span className="text-[13px] text-tinta-lembut">{keterangan}</span>}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B655E" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M8 5 L13 10 L8 15" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/admin/layanan/baru" className={`${kelasTombolKedua} w-full`}>
        Tambah layanan
      </Link>
    </div>
  );
}

export default function HalamanLayanan() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-tinta-lembut">
          Memuat data layanan...
        </p>
      }
    >
      <DaftarLayanan />
    </Suspense>
  );
}
