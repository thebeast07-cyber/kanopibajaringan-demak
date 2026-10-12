'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { defaultCmsRepository } from '../../../../lib/cms/repository';
import { proyekBaru } from '../../../../lib/cms/galeri';
import { hapusFotoTerbuang, hapusProyek, simpanProyek } from '../../../../lib/cms/simpanAdmin';
import { ProyekGaleriSchema } from '../../../../types/domain';
import { FormProyek } from '../../../../components/admin/galeri/FormProyek';
import { kelasTombolKedua } from '../../../../components/admin/gaya';

const cariProyek = (id: string) => (defaultCmsRepository.getWorkingDataset().galeri ?? []).find((p) => p.id === id);

export default function UbahProyek({ params }: { params: { id: string } }) {
  const router = useRouter();
  const baru = params.id === 'baru';
  // Data sudah dimuat layout sebelum halaman ini dirender.
  const [proyek] = useState<ProyekGaleriSchema | null>(() => (baru ? proyekBaru() : cariProyek(params.id) ?? null));
  const layanan = defaultCmsRepository.getServices();

  if (!proyek) {
    return (
      <div className="space-y-3">
        <p className="font-semibold">Proyek ini nggak ketemu. Mungkin sudah dihapus atau link-nya salah.</p>
        <Link href="/admin/galeri" className={kelasTombolKedua}>
          Ke galeri
        </Link>
      </div>
    );
  }

  const simpan = async (hasil: ProyekGaleriSchema) => {
    const lama = cariProyek(proyek.id);
    const pesanGagal = await simpanProyek(hasil);
    if (!pesanGagal) {
      hapusFotoTerbuang(lama, hasil);
      // Proyek baru dapat alamatnya sendiri, biar refresh tidak membuka form kosong lagi.
      if (baru) window.history.replaceState(null, '', `/admin/galeri/${hasil.id}`);
    }
    return pesanGagal;
  };

  const hapus = async () => {
    const lama = cariProyek(proyek.id);
    const pesanGagal = await hapusProyek(proyek.id);
    if (!pesanGagal) {
      hapusFotoTerbuang(lama, { fotos: [] });
      router.push('/admin/galeri');
    }
    return pesanGagal;
  };

  return <FormProyek proyek={proyek} baru={baru} layanan={layanan} onSimpan={simpan} onHapus={hapus} />;
}
