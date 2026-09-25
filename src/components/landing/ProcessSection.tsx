import React from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ProcessSection() {
  const steps = [
    {
      num: '01',
      title: 'Kalkulasi Estimasi',
      desc: 'Pilih jenis kanopi, masukkan ukuran, serta spesifikasi material pada Kalkulator Biaya untuk memperoleh perkiraan harga baku.',
    },
    {
      num: '02',
      title: 'Kirim via WhatsApp',
      desc: 'Hasil rincian estimasi terformat dikirimkan langsung ke Marketing Frontline via WhatsApp untuk konsultasi awal.',
    },
    {
      num: '03',
      title: 'Survei Lokasi Gratis',
      desc: 'Tim Teknis Owner mendatangi rumah Anda untuk pengukuran fisik presisi, cek struktur, & konsultasi tanpa biaya.',
    },
    {
      num: '04',
      title: 'Pengerjaan & Garansi',
      desc: 'Setelah penawaran resmi disetujui, fabrikasi las & pemasangan dikerjakan cepat bergaransi resmi kebocoran.',
    },
  ];

  return (
    <section id="cara-kerja" className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] text-[#1C1917] border-b border-[#E7E2DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E7E2DA] text-[#15803D] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>ALUR KERJA TRANSPARAN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight font-heading">
            4 Langkah Praktis Proyek Konstruksi Anda
          </h2>
          <p className="text-base text-[#57534E]">
            Proses transparan yang menjamin kepastian anggaran tanpa komitmen biaya sebelum penawaran final disetujui.
          </p>
        </div>

        {/* Process Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => (
            <div
              key={item.num}
              className="bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E7E2DA] pb-3">
                  <span className="text-3xl font-bold text-[#15803D] font-heading">{item.num}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                </div>

                <h3 className="text-base font-bold text-[#1C1917] leading-snug font-heading">{item.title}</h3>
                <p className="text-xs text-[#57534E] leading-relaxed">{item.desc}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:flex justify-end pt-2 text-[#A8A095]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Survey Policy Banner */}
        <div className="p-5 bg-white border border-[#E7E2DA] rounded-2xl text-xs text-[#57534E] space-y-1.5 shadow-sm">
          <span className="font-bold text-[#15803D] uppercase tracking-wider block font-heading">
            💡 KETENTUAN HAK & KEWAJIBAN SURVEI LOKASI:
          </span>
          <p className="text-[#1C1917] text-xs leading-relaxed">
            Estimasi biaya di website ini merupakan acuan perhitungan baku. Pelanggan berhak membatalkan atau mengubah rencana tanpa denda atau biaya apa pun jika hasil pengukuran fisik survei lokasi oleh Tim Owner tidak memenuhi kesepakatan Anda.
          </p>
        </div>

      </div>
    </section>
  );
}

