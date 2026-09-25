'use client';

import React from 'react';
import { ServiceSchema } from '@/types/domain';
import { Wrench, ArrowRight, Layers, Ruler } from 'lucide-react';

interface ServicesSectionProps {
  services: ServiceSchema[];
  onSelectService?: (serviceId: string) => void;
}

export function ServicesSection({ services, onSelectService }: ServicesSectionProps) {
  const featuredServices = services.filter((s) => s.featured);
  const otherServices = services.filter((s) => !s.featured);

  const getServiceImage = (slug: string) => {
    if (slug.includes('alderon')) return 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=80';
    if (slug.includes('baja-ringan')) return 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80';
    if (slug.includes('pagar')) return 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80';
    return 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&q=80';
  };

  return (
    <section id="layanan" className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] text-[#1C1917] border-b border-[#E7E2DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E7E2DA] text-[#15803D] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
            <Wrench className="w-4 h-4 text-[#16A34A]" />
            <span>LAYANAN SPESIALIS KONSTRUKSI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight font-heading">
            Kanopi, Atap Baja Ringan & Pagar Bergaransi
          </h2>
          <p className="text-base text-[#57534E]">
            Setiap pengerjaan menggunakan material baku SNI dengan acuan perhitungan baku tanpa biaya tersembunyi.
          </p>
        </div>

        {/* Featured Primary Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featuredServices.map((svc) => (
            <div
              key={svc.id}
              className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-60 w-full overflow-hidden bg-[#FAF8F5] relative">
                  <img
                    src={svc.imageUrl || getServiceImage(svc.slug)}
                    alt={svc.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 text-[#15803D] text-[11px] font-bold px-3 py-1 rounded-md border border-[#E7E2DA] uppercase tracking-wider shadow-sm">
                    Layanan Utama
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-4">
                  <h3 className="text-xl font-bold text-[#1C1917] font-heading">{svc.title}</h3>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">{svc.fullDescription}</p>

                  <div className="p-3.5 bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl text-xs space-y-2 font-medium text-[#57534E]">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-[#16A34A]" /> Satuan Hitung:
                      </span>
                      <span className="text-[#1C1917] font-bold uppercase">{svc.measurementType}</span>
                    </div>
                    {svc.minimumBilling && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#16A34A]" /> Batas Minimum:
                        </span>
                        <span className="text-[#15803D] font-bold">
                          {svc.minimumBilling.minimumArea ||
                            svc.minimumBilling.minimumLength ||
                            svc.minimumBilling.minimumQuantity}{' '}
                          {svc.measurementType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7 pt-0">
                <a
                  href="#kalkulator"
                  onClick={() => onSelectService && onSelectService(svc.id)}
                  className="flex items-center justify-between bg-[#1B3B2B] hover:bg-[#15803D] text-white font-semibold text-xs uppercase tracking-wider p-4 rounded-xl transition-all shadow-sm"
                >
                  <span>Hitung Biaya {svc.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Services: Editorial Clean List (Reduces Card Repetition) */}
        {otherServices.length > 0 && (
          <div className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider font-heading border-b border-[#E7E2DA] pb-3">
              Layanan Spesialis Lainnya
            </h3>

            <div className="divide-y divide-[#E7E2DA]">
              {otherServices.map((svc) => (
                <div
                  key={svc.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#1C1917] font-heading">{svc.title}</span>
                      <span className="text-[10px] font-bold uppercase bg-[#EAF5ED] text-[#15803D] px-2 py-0.5 rounded border border-[#C2E3CD]">
                        {svc.measurementType}
                      </span>
                    </div>
                    <p className="text-xs text-[#57534E] leading-relaxed">{svc.shortDescription}</p>
                  </div>

                  <a
                    href="#kalkulator"
                    onClick={() => onSelectService && onSelectService(svc.id)}
                    className="inline-flex items-center gap-2 bg-[#FAF8F5] hover:bg-[#EAF5ED] text-[#15803D] font-semibold px-4 py-2.5 rounded-lg border border-[#E7E2DA] text-xs uppercase tracking-wider transition-colors shrink-0"
                  >
                    <span>Hitung Estimasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}


