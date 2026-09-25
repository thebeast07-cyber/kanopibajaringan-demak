'use client';

import React, { useState } from 'react';
import { FaqSchema } from '@/types/domain';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  faqs: FaqSchema[];
}

export function FaqSection({ faqs }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-white text-[#1C1917] border-b border-[#E7E2DA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#EAF5ED] border border-[#C2E3CD] text-[#15803D] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-[#16A34A]" />
            <span>PERTANYAAN POPULER (FAQ)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight font-heading">
            Tanya Jawab Seputar Estimasi & Survei
          </h2>
          <p className="text-base text-[#57534E]">
            Jawaban langsung untuk pertanyaan yang paling sering diajukan calon pelanggan.
          </p>
        </div>

        {/* Light Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-[#1C1917] text-sm sm:text-base hover:text-[#15803D] transition-colors font-heading"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#16A34A] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-[#57534E] leading-relaxed border-t border-[#E7E2DA] pt-4 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

