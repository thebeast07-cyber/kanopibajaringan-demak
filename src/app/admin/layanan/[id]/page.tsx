'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { defaultCmsRepository } from '../../../../lib/cms/repository';
import { layananBaru, slugDariNama } from '../../../../lib/cms/isiDataLayanan';
import { hapusFotoTerbuang, simpanLayanan } from '../../../../lib/cms/simpanAdmin';
import { ServiceSchema } from '../../../../types/domain';
import { FormLayanan } from '../../../../components/admin/layanan/FormLayanan';
import { kelasTombolKedua } from '../../../../components/admin/gaya';

export default function UbahLayanan({ params }: { params: { id: string } }) {
  const baru = params.id === 'baru';
  // Data sudah dimuat layout sebelum halaman ini dirender.
  const [service] = useState<ServiceSchema | null>(() =>
    baru ? layananBaru() : defaultCmsRepository.getServiceById(params.id) ?? null
  );
  const config = defaultCmsRepository.getBusinessConfig();

  if (!service) {
    return (
      <div className="space-y-3">
        <p className="font-semibold">Layanan ini nggak ketemu. Mungkin sudah dihapus atau link-nya salah.</p>
        <Link href="/admin/layanan" className={kelasTombolKedua}>
          Ke daftar layanan
        </Link>
      </div>
    );
  }

  const simpan = async (hasil: ServiceSchema) => {
    const akhir = baru ? { ...hasil, slug: slugDariNama(hasil.title) || hasil.id } : hasil;
    const lama = defaultCmsRepository.getServiceById(service.id);
    const pesanGagal = await simpanLayanan(akhir);
    if (!pesanGagal) {
      hapusFotoTerbuang(lama, akhir);
      // Layanan baru dapat alamatnya sendiri, biar refresh tidak membuka form kosong lagi.
      // Form tetap di layar (tidak dimuat ulang) supaya pesan "Tersimpan" kelihatan.
      if (baru) window.history.replaceState(null, '', `/admin/layanan/${akhir.id}`);
    }
    return pesanGagal;
  };

  return (
    <FormLayanan
      service={service}
      baru={baru}
      namaUsaha={config.businessName}
      whatsappNumber={config.frontlineContact.whatsappNumber}
      onSimpan={simpan}
    />
  );
}
