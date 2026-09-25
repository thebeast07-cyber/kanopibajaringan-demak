'use client';

import React, { useState } from 'react';
import { Wrench, PhoneCall, Menu, X, ArrowUpRight, MapPin } from 'lucide-react';
import { BusinessConfigSchema } from '@/types/domain';

interface NavbarProps {
  config: BusinessConfigSchema;
}

export function Navbar({ config }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Announcement Bar - Clean & Un-crowded */}
      <div className="bg-[#1B3B2B] text-[#E7F2EC] text-[11px] font-medium py-1.5 px-4 border-b border-[#284E3A]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <span>Melayani Survei Lokasi Gratis: {config.serviceAreas.slice(0, 4).join(', ')} & Sekitarnya</span>
          </div>
          <div className="hidden md:block text-[#A3C7B5]">
            <span>{config.guaranteeTerms}</span>
          </div>
        </div>
      </div>



      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2DA] text-[#1C1917]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Identity */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1B3B2B] text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-[#16A34A] transition-colors">
              <Wrench className="w-5 h-5 text-emerald-400 group-hover:text-white" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-[#1C1917] flex items-center gap-2 font-heading">
                {config.businessName}
                <span className="text-[10px] font-semibold bg-[#EAF5ED] text-[#15803D] px-2 py-0.5 rounded border border-[#C2E3CD]">
                  Survei Gratis
                </span>
              </div>
              <p className="text-xs text-[#78716C] hidden sm:block font-normal">{config.tagline}</p>
            </div>
          </a>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-[#44403C]">
            <a href="#kalkulator" className="text-[#15803D] flex items-center gap-1.5 hover:text-[#16A34A] transition-colors font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              Estimator Biaya
            </a>
            <a href="#layanan" className="hover:text-[#1B3B2B] transition-colors">
              Layanan
            </a>
            <a href="#portfolio" className="hover:text-[#1B3B2B] transition-colors">
              Portfolio Proyek
            </a>
            <a href="#cara-kerja" className="hover:text-[#1B3B2B] transition-colors">
              Alur Kerja
            </a>
            <a href="#faq" className="hover:text-[#1B3B2B] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right WhatsApp Consultation CTA */}
          <div className="hidden sm:flex items-center">
            <a
              href={`https://wa.me/${config.frontlineContact.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm active:translate-y-0.5"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Konsultasi WA</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-lg bg-white border border-[#E7E2DA] text-[#1C1917] hover:bg-[#F3EFEA]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-b border-[#E7E2DA] px-4 pt-3 pb-6 space-y-3 text-xs uppercase font-semibold tracking-wider">
            <a
              href="#kalkulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#15803D] font-bold py-2 border-b border-[#E7E2DA]"
            >
              📊 Estimator Biaya Proyek
            </a>
            <a
              href="#layanan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#1C1917] hover:text-[#15803D] py-2 border-b border-[#E7E2DA]"
            >
              🔨 Layanan Spesialis
            </a>
            <a
              href="#portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#1C1917] hover:text-[#15803D] py-2 border-b border-[#E7E2DA]"
            >
              📷 Portfolio Proyek Selesai
            </a>
            <a
              href="#cara-kerja"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#1C1917] hover:text-[#15803D] py-2 border-b border-[#E7E2DA]"
            >
              📋 Alur Survei & Garansi
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#1C1917] hover:text-[#15803D] py-2 border-b border-[#E7E2DA]"
            >
              ❓ Tanya Jawab (FAQ)
            </a>
            <a
              href={`https://wa.me/${config.frontlineContact.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#16A34A] text-white font-bold w-full py-3 rounded-lg mt-3 shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Konsultasi WhatsApp Gratis</span>
            </a>
          </div>
        )}
      </header>
    </>
  );
}

