import React from 'react';
import { Calculator, PhoneCall, Check, ArrowRight, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { BusinessConfigSchema } from '@/types/domain';

interface HeroProps {
  config: BusinessConfigSchema;
}

export function Hero({ config }: HeroProps) {
  return (
    <section className="relative bg-[#FAF8F5] text-[#1C1917] border-b border-[#E7E2DA] py-14 sm:py-20 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text & Actions */}
          <div className="lg:col-span-7 space-y-7">
            
            <div className="inline-flex items-center gap-2 bg-[#EAF5ED] border border-[#C2E3CD] text-[#15803D] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>SPESIALIS KANOPI & BAJA RINGAN · SURVEI LOKASI GRATIS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] tracking-tight leading-[1.12] font-heading">
              Jasa Pasang Kanopi & Atap Baja Ringan <br />
              <span className="text-[#15803D]">
                Bergaransi & Harga Transparan.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-2xl font-normal">
              Hitung perkiraan biaya baku secara mandiri untuk proyek kanopi, atap galvalum, maupun pagar rumah Anda sebelum tim kami datang melakukan survei lokasi gratis.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href="#kalkulator"
                className="flex items-center justify-center gap-2.5 bg-[#1B3B2B] hover:bg-[#15803D] text-white font-semibold px-7 py-4 rounded-xl transition-all text-sm tracking-wide shadow-md active:translate-y-0.5"
              >
                <Calculator className="w-5 h-5 text-emerald-400" />
                <span>Mulai Hitung Estimasi</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={`https://wa.me/${config.frontlineContact.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-6 py-4 rounded-xl transition-all text-sm tracking-wide shadow-sm"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Konsultasi WhatsApp</span>
              </a>
            </div>

            {/* Trust Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#E7E2DA] text-xs font-medium text-[#78716C]">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#EAF5ED] text-[#15803D] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Material Standar SNI</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#EAF5ED] text-[#15803D] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Tanpa Biaya Survei</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#EAF5ED] text-[#15803D] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Garansi Kebocoran 100%</span>
              </div>
            </div>

          </div>

          {/* Right Photographic Showcase with Live Estimate Preview Overlay */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#E7E2DA] bg-white">
              <img
                src="https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=1000&q=80"
                alt="Kanopi Minimalis Alderon Carport"
                className="w-full h-[380px] sm:h-[420px] object-cover"
              />

              
              {/* Location Tag */}
              <div className="absolute top-4 left-4 bg-white/95 text-[#1C1917] font-semibold text-xs px-3 py-1.5 rounded-lg border border-[#E7E2DA] flex items-center gap-1.5 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Proyek Terpasang - {config.serviceAreas.slice(0, 2).join(' & ')}</span>
              </div>


              {/* Embedded Live Estimate Card Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#E7E2DA] rounded-xl p-4 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917]">
                  <span className="flex items-center gap-1.5 text-[#15803D] font-bold">
                    <Sparkles className="w-4 h-4" /> Contoh Estimasi Biaya
                  </span>
                  <span className="bg-[#EAF5ED] text-[#15803D] font-bold px-2 py-0.5 rounded text-[10px]">
                    20 m² (5m × 4m)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E7E2DA]">
                  <div>
                    <p className="text-[11px] text-[#78716C]">Kanopi Alderon Twinwall + Hollow 40x60:</p>
                    <p className="text-xl font-bold text-[#1C1917] font-heading">Rp 17.400.000</p>
                  </div>
                  <a
                    href="#kalkulator"
                    className="bg-[#1B3B2B] hover:bg-[#15803D] text-white text-xs font-semibold py-2.5 px-3.5 rounded-lg text-center transition-colors shadow-sm"
                  >
                    Hitung Punya Anda
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

