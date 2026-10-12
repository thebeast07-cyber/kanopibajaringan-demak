'use client';

import React from 'react';
import { ServiceSchema } from '@/types/domain';
import { BarisLainnya, KartuUtama } from './KartuLayanan';

interface ServicesSectionProps {
  services: ServiceSchema[];
  namaUsaha: string;
  whatsappNumber: string;
  onSelectService?: (serviceId: string) => void;
}

export function ServicesSection({ services, namaUsaha, whatsappNumber, onSelectService }: ServicesSectionProps) {
  const utama = services.filter((s) => s.featured);
  const lainnya = services.filter((s) => !s.featured);

  return (
    <section id="layanan" className="py-16 sm:py-20 lg:py-24 bg-white text-tinta border-b border-kertas-garis">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            Yang bisa kami kerjakan
          </h2>
          {/* Klaim "bahan standar SNI" dihapus dari kalimat di bawah: pemilik belum punya
              bukti sertifikasinya, dan klaim standar tanpa bukti itu karangan (R-36). */}
          <p className="text-tinta-lembut leading-relaxed">
            Harganya borongan: sudah termasuk bahan standar, rangka, upah pasang, dan finishing. Mau
            bahan atau warna lain? Tanya aja lewat WhatsApp.
          </p>
        </div>

        {/* Layanan unggulan. Harganya ditaruh paling menonjol karena itu yang dicari. */}
        {/* items-start: kartu tanpa foto/harga tidak ikut meregang setinggi kartu sebelahnya. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {utama.map((svc) => (
            <KartuUtama
              key={svc.id}
              svc={svc}
              namaUsaha={namaUsaha}
              whatsappNumber={whatsappNumber}
              onSelectService={onSelectService}
            />
          ))}
        </div>

        {/* Layanan sisanya pakai bentuk daftar, bukan kartu lagi. Bobotnya memang
            lebih rendah, jadi tampilannya ikut lebih ringan (R-14). */}
        {lainnya.length > 0 && (
          <div className="border-t border-kertas-garis pt-8">
            <h3 className="font-heading text-lg font-bold text-navy mb-4">Layanan lain</h3>
            <ul className="divide-y divide-kertas-garis">
              {lainnya.map((svc) => (
                <li key={svc.id}>
                  <BarisLainnya
                    svc={svc}
                    namaUsaha={namaUsaha}
                    whatsappNumber={whatsappNumber}
                    onSelectService={onSelectService}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
