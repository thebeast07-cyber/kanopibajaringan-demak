'use client';

import React from 'react';
import { ServiceSchema } from '@/types/domain';
import { formatRupiah, waTanyaUrl } from '@/lib/whatsapp';
import { getMinimumPengerjaan, getTarifBorongan } from '@/lib/estimator/pricingEngine';

interface ServicesSectionProps {
  services: ServiceSchema[];
  namaUsaha: string;
  whatsappNumber: string;
  onSelectService?: (serviceId: string) => void;
}

function satuan(svc: ServiceSchema): string {
  return svc.pricingRules?.[0]?.unitLabel
    || (svc.measurementType === 'm2' ? 'm²' : svc.measurementType === 'meter' ? 'meter' : 'unit');
}

const kelasLinkWa =
  'inline-flex items-center min-h-[44px] text-hutan font-semibold underline underline-offset-4 decoration-hutan-muda hover:decoration-2';

export function ServicesSection({ services, namaUsaha, whatsappNumber, onSelectService }: ServicesSectionProps) {
  const utama = services.filter((s) => s.featured);
  const lainnya = services.filter((s) => !s.featured);

  const tanyaBahan = (svc: ServiceSchema) =>
    waTanyaUrl(whatsappNumber, `Halo ${namaUsaha}, saya mau tanya bahan lain untuk ${svc.title}.`);
  const tanyaHarga = (svc: ServiceSchema) =>
    waTanyaUrl(whatsappNumber, `Halo ${namaUsaha}, saya mau tanya harga ${svc.title}.`);

  return (
    <section id="layanan" className="py-16 sm:py-20 lg:py-24 bg-white text-tinta border-b border-kertas-garis">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-hutan tracking-tight">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {utama.map((svc) => {
            const tarif = getTarifBorongan(svc);
            const min = getMinimumPengerjaan(svc);
            const bahan = svc.bahanStandar ?? [];
            return (
              <div
                key={svc.id}
                className="bg-kertas border border-kertas-garis rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <h3 className="font-heading text-xl font-bold text-hutan">{svc.title}</h3>
                  <p className="text-sm text-tinta-lembut leading-relaxed">{svc.shortDescription}</p>

                  {/* Bagian bahan baru muncul kalau pemilik sudah mengisinya, tidak ada isian contoh. */}
                  {bahan.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold text-tinta">Bahan standar</h4>
                      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                        {bahan.map((b, i) => (
                          <React.Fragment key={i}>
                            <dt className="text-tinta-lembut">{b.bagian}</dt>
                            <dd className="text-tinta">{b.bahan}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>

                <div>
                  {tarif ? (
                    <p className="font-heading text-3xl font-bold text-amber">
                      {formatRupiah(tarif.rate)}
                      <span className="text-base font-normal text-tinta-lembut"> / {satuan(svc)}</span>
                    </p>
                  ) : (
                    <p className="text-tinta leading-relaxed">
                      Harganya belum dipasang di sini.{' '}
                      <a href={tanyaHarga(svc)} target="_blank" rel="noopener noreferrer" className={kelasLinkWa}>
                        Tanya harga lewat WhatsApp
                      </a>
                    </p>
                  )}
                  {min ? (
                    <p className="text-sm text-tinta-samar mt-1.5">
                      Minimum pengerjaan {min} {satuan(svc)}
                    </p>
                  ) : null}
                  {bahan.length > 0 && (
                    <a href={tanyaBahan(svc)} target="_blank" rel="noopener noreferrer" className={`${kelasLinkWa} text-sm mt-1`}>
                      Mau bahan lain? Tanya lewat WhatsApp
                    </a>
                  )}

                  <a
                    href="#kalkulator"
                    onClick={() => onSelectService && onSelectService(svc.id)}
                    className="flex items-center justify-center min-h-[48px] mt-5 bg-hutan hover:bg-hutan-muda text-white font-semibold rounded-xl transition-colors"
                  >
                    Hitung ukuran kamu
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Layanan sisanya pakai bentuk daftar, bukan kartu lagi. Bobotnya memang
            lebih rendah, jadi tampilannya ikut lebih ringan (R-14). */}
        {lainnya.length > 0 && (
          <div className="border-t border-kertas-garis pt-8">
            <h3 className="font-heading text-lg font-bold text-hutan mb-4">Layanan lain</h3>
            <ul className="divide-y divide-kertas-garis">
              {lainnya.map((svc) => {
                const tarif = getTarifBorongan(svc);
                const bahan = svc.bahanStandar ?? [];
                return (
                  <li
                    key={svc.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="max-w-xl">
                      <p className="font-semibold text-tinta">{svc.title}</p>
                      <p className="text-sm text-tinta-lembut leading-relaxed">{svc.shortDescription}</p>
                      {bahan.length > 0 && (
                        <p className="text-sm text-tinta mt-1">
                          <span className="text-tinta-lembut">Bahan standar:</span>{' '}
                          {bahan.map((b) => `${b.bagian} ${b.bahan}`).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
                      {/* text-xl, bukan text-lg: #D97706 cuma lolos AA di ambang teks
                          besar (18.66px ke atas + tebal). 18px persis masih gagal. */}
                      {tarif ? (
                        <span className="font-heading text-xl font-bold text-amber">
                          {formatRupiah(tarif.rate)}
                          <span className="text-sm font-normal text-tinta-lembut"> / {satuan(svc)}</span>
                        </span>
                      ) : (
                        <a href={tanyaHarga(svc)} target="_blank" rel="noopener noreferrer" className={`${kelasLinkWa} text-sm`}>
                          Tanya harga lewat WhatsApp
                        </a>
                      )}
                      <a
                        href="#kalkulator"
                        onClick={() => onSelectService && onSelectService(svc.id)}
                        className="flex items-center justify-center min-h-[44px] px-4 border border-kertas-garis bg-white hover:bg-kertas-dalam text-hutan font-semibold text-sm rounded-lg transition-colors"
                      >
                        Hitung
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
