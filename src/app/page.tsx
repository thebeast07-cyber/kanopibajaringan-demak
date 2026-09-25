'use client';

import React, { useState } from 'react';
import { defaultDataAdapter } from '@/data/localDataAdapter';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { PortfolioSection } from '@/components/landing/PortfolioSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { EstimatorWizard } from '@/components/estimator/EstimatorWizard';
import { PhoneCall, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const dataset = defaultDataAdapter.getDataset();
  const config = defaultDataAdapter.getBusinessConfig();
  const services = defaultDataAdapter.getServices();
  const portfolios = defaultDataAdapter.getPortfolios();
  const faqs = defaultDataAdapter.getFaqs();

  const [activeServiceId, setActiveServiceId] = useState<string>(services[0]?.id || '');

  const handleSelectService = (serviceId: string) => {
    setActiveServiceId(serviceId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar config={config} />
      
      <main className="flex-1">
        <Hero config={config} />
        
        {/* Horizontal Benefits Trust Bar */}
        <section className="bg-white border-b border-[#E7E2DA] py-6 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs font-bold text-[#1C1917] font-heading">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Material Bergaransi SNI</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Tukang Las Profesional</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Kalkulasi Harga Baku</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Survei Lokasi Gratis</span>
              </div>
            </div>
          </div>
        </section>

        <EstimatorWizard dataset={dataset} initialServiceId={activeServiceId} key={activeServiceId} />
        <ServicesSection services={services} onSelectService={handleSelectService} />
        <PortfolioSection portfolios={portfolios} />
        <ProcessSection />
        <FaqSection faqs={faqs} />

        {/* Final Conversion CTA Banner */}
        <section className="relative bg-[#1B3B2B] text-white py-20 overflow-hidden border-t border-[#284E3A]">
          <div
            className="absolute inset-0 opacity-15 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80')`,
            }}
          />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-heading">
              Siap Wujudkan Kanopi & Atap Rumah Anda?
            </h2>
            <p className="text-base sm:text-lg text-[#D0E3D7] max-w-2xl mx-auto leading-relaxed">
              Konsultasikan rincian proyek Anda langsung via WhatsApp dengan Marketing Frontline untuk menjadwalkan survei lokasi gratis oleh Tim Teknis Owner.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/${config.frontlineContact.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold px-8 py-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg active:translate-y-0.5"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Chat WhatsApp Sekarang</span>
                <ArrowUpRight className="w-5 h-5" />
              </a>

              <a
                href="#kalkulator"
                className="flex items-center justify-center gap-2 bg-[#122A1E] hover:bg-[#284E3A] text-white font-bold px-7 py-4 rounded-xl text-sm uppercase tracking-wider border border-[#284E3A] transition-all"
              >
                <span>Hitung Ulang Estimasi</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer config={config} />
    </div>
  );
}

