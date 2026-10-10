'use client';

import React, { useState } from 'react';
import { defaultDataAdapter } from '@/data/localDataAdapter';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { EstimatorWizard } from '@/components/estimator/EstimatorWizard';

export default function HomePage() {
  const dataset = defaultDataAdapter.getDataset();
  const config = defaultDataAdapter.getBusinessConfig();
  const services = defaultDataAdapter.getServices();
  const faqs = defaultDataAdapter.getFaqs();

  const [activeServiceId, setActiveServiceId] = useState<string>(services[0]?.id || '');

  const handleSelectService = (serviceId: string) => {
    setActiveServiceId(serviceId);
  };

  const waHref = `https://wa.me/${config.frontlineContact.whatsappNumber.replace(/\D/g, '')}`;

  return (
    <div className="min-h-screen flex flex-col bg-kertas text-tinta">
      <Navbar config={config} />

      <main className="flex-1">
        <Hero config={config} dataset={dataset} />

        {/* Kalkulator ditaruh langsung di bawah hero karena itu satu-satunya alasan
            orang buka halaman ini. */}
        <EstimatorWizard dataset={dataset} initialServiceId={activeServiceId} key={activeServiceId} />

        <ServicesSection services={services} onSelectService={handleSelectService} />
        <ProcessSection />
        <FaqSection faqs={faqs} />

        {/* Section portofolio dihapus: isinya 3 proyek karangan dengan foto stok dan
            testimoni palsu. Pasang lagi lewat /admin/portofolio setelah ada foto asli. */}

        <section className="bg-hutan text-white py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
              Udah dapat angkanya? Lanjut ngobrol.
            </h2>
            <p className="text-hutan-kabut leading-relaxed">
              Kirim ukuran dan lokasi kamu lewat WhatsApp. Kami balas dengan harga yang lebih pasti
              dan atur jadwal survei. Survei gratis, nggak ada biaya tersembunyi.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center min-h-[52px] px-8 bg-amber-gelap hover:bg-amber-tua text-white font-semibold rounded-xl transition-colors"
              >
                Chat WhatsApp
              </a>
              <a
                href="#kalkulator"
                className="w-full sm:w-auto flex items-center justify-center min-h-[52px] px-7 bg-hutan-tua hover:bg-hutan-muda text-white font-semibold rounded-xl border border-hutan-muda transition-colors"
              >
                Hitung ulang
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer config={config} />
    </div>
  );
}
