'use client';

import React from 'react';
import { BusinessConfigSchema } from '@/types/domain';
import { sapaanUmum, waTanyaUrl } from '@/lib/whatsapp';
import { catatKlikWa } from '@/lib/jejak';
import { LogoMendatar } from '@/components/brand/Logo';
import { gabungKota, kotaSurveiGratis } from '@/lib/cms/wilayah';

interface FooterProps {
  config: BusinessConfigSchema;
}

// Dua kelompok, bukan empat kolom template. Jam operasional dan email dibuang
// karena belum dikonfirmasi pemilik; WhatsApp satu-satunya kontak yang pasti asli.
export function Footer({ config }: FooterProps) {
  const waHref = waTanyaUrl(config.frontlineContact.whatsappNumber, sapaanUmum(config.businessName));
  const gratis = kotaSurveiGratis(config);
  const waTampil = config.frontlineContact.whatsappNumber.replace(/^62/, '0');

  return (
    <footer className="bg-navy text-navy-kabut pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pb-10 border-b border-navy-muda">
          <div className="space-y-3">
            <LogoMendatar terang className="h-10 w-auto" />
            <p className="leading-relaxed max-w-sm">{config.tagline}</p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => catatKlikWa('footer')}
              className="inline-flex items-center min-h-[44px] text-white font-semibold underline underline-offset-4 decoration-navy-kabut hover:decoration-white"
            >
              WhatsApp {waTampil}
            </a>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-base font-bold text-white">Area layanan</h2>
            <p className="leading-relaxed">{config.serviceAreas.join(' · ')}</p>
            {gratis.length > 0 && <p className="leading-relaxed">Survei gratis di {gabungKota(gratis)}.</p>}
          </div>
        </div>

        <div className="pt-8 space-y-4 text-sm">
          <p className="leading-relaxed max-w-3xl">{config.surveyDisclaimer}</p>
          <p className="text-navy-kabut">
            © {new Date().getFullYear()} {config.businessName}
          </p>
        </div>
      </div>
    </footer>
  );
}
