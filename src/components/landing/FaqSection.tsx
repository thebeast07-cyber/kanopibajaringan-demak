'use client';

import React, { useState } from 'react';
import { FaqSchema } from '@/types/domain';
import { ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  faqs: FaqSchema[];
}

export function FaqSection({ faqs }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-white text-tinta border-b border-kertas-garis">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-8">
          Yang sering ditanya
        </h2>

        <div className="divide-y divide-kertas-garis border-t border-b border-kertas-garis">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            const panelId = `faq-panel-${faq.id}`;
            return (
              <div key={faq.id}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full min-h-[64px] py-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-navy text-base sm:text-lg hover:text-navy-muda transition-colors"
                  >
                    <span>{faq.question}</span>
                    {/* Rotasi 180 derajat menandai buka/tutup, dipicu klik, bukan
                        animasi yang jalan sendiri (R-19, dial MOTION 1). */}
                    <ChevronDown
                      className={`w-5 h-5 text-tinta-lembut shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>

                {isOpen && (
                  <div id={panelId} className="pb-6 -mt-1 text-tinta-lembut leading-relaxed">
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
