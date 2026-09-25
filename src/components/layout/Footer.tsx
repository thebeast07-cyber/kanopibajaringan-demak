import React from 'react';
import { BusinessConfigSchema } from '@/types/domain';
import { ShieldCheck, MapPin, Phone, Mail, Clock, FileText } from 'lucide-react';

interface FooterProps {
  config: BusinessConfigSchema;
}

export function Footer({ config }: FooterProps) {
  return (
    <footer className="bg-[#1B3B2B] text-[#D0E3D7] border-t border-[#284E3A] pt-16 pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-[#284E3A] pb-12">
          
          {/* Business Summary */}
          <div className="space-y-4">
            <h3 className="text-white text-base font-bold flex items-center gap-2 font-heading">
              <span className="w-2.5 h-2.5 rounded bg-[#16A34A] inline-block"></span>
              {config.businessName}
            </h3>
            <p className="text-xs leading-relaxed text-[#D0E3D7]">{config.tagline}</p>
            <div className="inline-flex items-center gap-2 bg-[#122A1E] border border-[#284E3A] px-3.5 py-2 rounded-lg text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{config.guaranteeTerms}</span>
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs font-heading">Cakupan Area Survei</h4>
            <ul className="space-y-2 text-[#D0E3D7]">
              {config.serviceAreas.map((area) => (
                <li key={area} className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  <span>Survei Lokasi {area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Services List */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs font-heading">Spesialisasi Utama</h4>
            <ul className="space-y-2 text-[#D0E3D7]">
              <li>Kanopi Alderon Twinwall 10mm</li>
              <li>Kanopi SolarTuff Polycarbonate</li>
              <li>Rangka Atap Baja Ringan C75</li>
              <li>Pagar Minimalis & Wood WPC</li>
              <li>Railing Tangga & Balkon Stainless</li>
              <li>Tralis Jendela Safety Steel</li>
            </ul>
          </div>

          {/* Frontline Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs font-heading">Kontak Frontline WA</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm font-heading">{config.frontlineContact.name}</p>
                  <p className="text-[11px] text-[#A3C7B5]">{config.frontlineContact.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{config.frontlineContact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Senin - Sabtu: 08:00 - 18:00 WIB</span>
              </div>
            </div>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#A3C7B5]">
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{config.surveyDisclaimer}</span>
          </p>
          <p>© {new Date().getFullYear()} {config.businessName}. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}

