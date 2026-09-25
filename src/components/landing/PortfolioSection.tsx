import React from 'react';
import { PortfolioSchema } from '@/types/domain';
import { MapPin, Calendar, Quote, CheckCircle2 } from 'lucide-react';

interface PortfolioSectionProps {
  portfolios: PortfolioSchema[];
}

export function PortfolioSection({ portfolios }: PortfolioSectionProps) {
  const featured = portfolios[0];
  const supporting = portfolios.slice(1);

  return (
    <section id="portfolio" className="py-16 sm:py-20 lg:py-24 bg-white text-[#1C1917] border-b border-[#E7E2DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#EAF5ED] border border-[#C2E3CD] text-[#15803D] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>DOKUMENTASI PROYEK LAPANGAN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight font-heading">
            Portfolio Proyek Selesai & Teruji
          </h2>
          <p className="text-base text-[#57534E]">
            Bukti pengerjaan kanopi dan atap baja ringan di berbagai lokasi area jangkauan survei.
          </p>

        </div>

        {/* Featured Main Project Showcase */}
        {featured && (
          <article className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 shadow-sm">
            <div className="lg:col-span-7 relative h-72 lg:h-auto min-h-[340px] bg-[#E7E2DA]">
              <img
                src={featured.thumbnailUrl}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 text-[#1C1917] font-semibold text-xs px-3 py-1.5 rounded-lg border border-[#E7E2DA] flex items-center gap-1.5 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>{featured.location.district}, {featured.location.city} ({featured.location.province})</span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#78716C]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#16A34A]" /> Selesai Tahun {featured.completionYear}
                  </span>
                  <span className="bg-[#EAF5ED] text-[#15803D] font-bold px-2.5 py-0.5 rounded text-[10px]">PROYEK UTAMA</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-[#1C1917] leading-snug font-heading">
                  {featured.title}
                </h3>

                <div className="p-4 bg-white border border-[#E7E2DA] rounded-xl text-xs space-y-2">
                  <span className="font-bold text-[#1C1917] block uppercase text-[10px] tracking-wider font-heading">
                    Rincian Spesifikasi Terpasang:
                  </span>
                  <p className="text-[#57534E] leading-relaxed text-xs">{featured.specsSummary}</p>
                </div>
              </div>

              {featured.testimonialQuote && (
                <div className="pt-4 border-t border-[#E7E2DA] text-xs italic text-[#57534E] flex items-start gap-2.5">
                  <Quote className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>"{featured.testimonialQuote}"</span>
                </div>
              )}
            </div>
          </article>
        )}

        {/* Supporting Projects Asymmetric Grid */}
        {supporting.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supporting.map((item) => (
              <article
                key={item.id}
                className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm"
              >
                <div className="relative h-60 w-full bg-[#E7E2DA]">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 text-[#1C1917] font-semibold text-xs px-3 py-1.5 rounded-lg border border-[#E7E2DA] flex items-center gap-1.5 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{item.location.district}, {item.location.city}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#78716C]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#16A34A]" /> {item.completionYear}
                      </span>
                      <span>{item.location.province}</span>
                    </div>

                    <h4 className="text-lg font-bold text-[#1C1917] leading-snug font-heading">{item.title}</h4>

                    <div className="p-3.5 bg-white border border-[#E7E2DA] rounded-xl text-xs">
                      <span className="text-[#57534E] text-xs leading-relaxed">{item.specsSummary}</span>
                    </div>
                  </div>

                  {item.testimonialQuote && (
                    <div className="pt-3 border-t border-[#E7E2DA] text-xs italic text-[#57534E] flex items-start gap-2">
                      <Quote className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>"{item.testimonialQuote}"</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

