'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { ringkasProyek } from '../../../lib/cms/galeri';
import { ProyekGaleriSchema } from '../../../types/domain';
import { kelasJudulHalaman, kelasKartu, kelasTombolKedua } from '../../../components/admin/gaya';

export default function HalamanGaleri() {
  const [galeri, setGaleri] = useState<ProyekGaleriSchema[] | null>(null);

  useEffect(() => {
    const muat = () => setGaleri(defaultCmsRepository.getWorkingDataset().galeri ?? []);
    muat();
    return defaultCmsRepository.subscribe(muat);
  }, []);

  if (!galeri) {
    return (
      <p role="status" className="text-sm text-tinta-lembut">
        Memuat galeri...
      </p>
    );
  }

  // Yang paling baru ditambahkan di atas, biar gampang dicek setelah unggah.
  const urut = [...galeri].sort((a, b) => b.dibuat.localeCompare(a.dibuat));
  const tampil = galeri.filter((p) => p.tampil && p.fotos.length > 0).length;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className={kelasJudulHalaman}>Galeri</h1>
        <p className="text-sm text-tinta-lembut leading-relaxed">
          Foto hasil pemasangan asli, tanpa harga. Pelanggan bisa langsung chat WhatsApp dari foto yang dia suka.
        </p>
      </div>

      {urut.length === 0 ? (
        <div className={`${kelasKartu} p-4 space-y-1`}>
          <p className="text-[15px] font-semibold">Belum ada proyek di galeri.</p>
          <p className="text-sm text-tinta-lembut leading-relaxed">
            Selama kosong, bagian galeri nggak tampil di website. Tambah proyek pertama dari foto pemasangan yang
            sudah jadi.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-tinta-lembut">
            {tampil} dari {urut.length} proyek tampil di website.
          </p>
          <ul className={`${kelasKartu} overflow-hidden divide-y divide-kertas-garis`}>
            {urut.map((p) => {
              const sampul = p.fotos[0];
              const ringkas = ringkasProyek(p);
              return (
                <li key={p.id}>
                  <Link href={`/admin/galeri/${p.id}`} className="flex items-center gap-3 px-3.5 py-3 text-tinta hover:bg-kertas">
                    {sampul ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sampul.url} alt="" className="w-16 h-16 shrink-0 rounded-xl object-cover bg-kertas-dalam" />
                    ) : (
                      <span className="w-16 h-16 shrink-0 rounded-xl border border-dashed border-tinta-batas bg-kertas" />
                    )}
                    <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-[15px] font-semibold leading-snug">{p.judul || 'Tanpa nama'}</span>
                      {ringkas && <span className="text-[13px] text-tinta-lembut">{ringkas}</span>}
                      <span className="text-[13px] text-tinta-lembut">
                        {p.fotos.length} foto
                        {!p.tampil && ' · Disembunyikan dari website'}
                      </span>
                    </span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B655E" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M8 5 L13 10 L8 15" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Link href="/admin/galeri/baru" className={`${kelasTombolKedua} w-full`}>
        Tambah proyek
      </Link>
    </div>
  );
}
