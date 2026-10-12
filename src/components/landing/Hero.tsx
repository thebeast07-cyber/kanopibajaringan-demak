import React from 'react';
import { BusinessConfigSchema, CompleteDataset } from '@/types/domain';
import { calculateEstimate, getTarifBorongan } from '@/lib/estimator/pricingEngine';
import { formatRupiah, sapaanUmum, waTanyaUrl } from '@/lib/whatsapp';
import { catatKlikWa } from '@/lib/jejak';

interface HeroProps {
  config: BusinessConfigSchema;
  dataset: CompleteDataset;
}

export function Hero({ config, dataset }: HeroProps) {
  const waHref = waTanyaUrl(config.frontlineContact.whatsappNumber, sapaanUmum(config.businessName));

  // Contoh dihitung dari data yang sama dengan kalkulator, bukan angka yang diketik
  // tangan. Dulu di sini tertulis Rp 17.400.000 yang sudah basi tiga model harga lalu.
  // Layanan tanpa harga dilewati, biar contohnya tidak pernah jadi Rp 0.
  const contohLayanan = dataset.services.find(
    (s) => s.status === 'active' && s.measurementType === 'm2' && getTarifBorongan(s) !== null
  );
  const adaHarga = dataset.services.some((s) => s.status === 'active' && getTarifBorongan(s) !== null);
  const contoh = contohLayanan
    ? calculateEstimate({ serviceId: contohLayanan.id, length: 5, width: 4 }, dataset).snapshot
    : null;

  return (
    <section className="bg-kertas text-tinta border-b border-kertas-garis py-14 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-hutan tracking-tight leading-[1.1]">
              Mau pasang kanopi?
              <br />
              {adaHarga ? 'Cek dulu harganya di sini.' : 'Kirim ukurannya ke sini.'}
            </h1>

            <p className="text-lg text-tinta-lembut leading-relaxed max-w-xl">
              {adaHarga
                ? 'Masukin ukurannya, harganya langsung keluar. Nggak perlu isi form panjang, nggak perlu nunggu dibalas besok. Kalau cocok, lanjut chat buat nego dan atur survei.'
                : 'Masukin ukurannya, terus kirim lewat WhatsApp. Kami hitungkan harganya dan atur jadwal survei.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href="#kalkulator"
                className="flex items-center justify-center min-h-[52px] px-7 bg-hutan hover:bg-hutan-muda text-white font-semibold rounded-xl transition-colors"
              >
                {adaHarga ? 'Hitung harga sekarang' : 'Masukkan ukuran'}
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => catatKlikWa('hero')}
                className="flex items-center justify-center min-h-[52px] px-7 border border-kertas-garis bg-white hover:bg-kertas-dalam text-hutan font-semibold rounded-xl transition-colors"
              >
                Tanya dulu lewat WhatsApp
              </a>
            </div>

            <p className="text-sm text-tinta-lembut pt-2 border-t border-kertas-garis">
              Survei lokasi gratis di {config.serviceAreas.slice(0, 3).join(', ')}, dan sekitarnya.
            </p>
          </div>

          {/* Motif identitas: angkanya yang jadi bintang, bukan foto stok.
              Foto proyek asli dipasang di sini kalau 3 Putra sudah punya. */}
          {contoh && contohLayanan && (
            <div className="lg:col-span-5">
              <div className="bg-white border border-kertas-garis rounded-2xl p-6 sm:p-8 shadow-sm">
                <p className="text-sm text-tinta-lembut">Contoh: {contohLayanan.title}</p>

                <p className="font-heading text-2xl font-semibold text-hutan mt-4">
                  5 m × 4 m
                  <span className="text-base font-normal text-tinta-lembut"> ({contoh.billableUnits.applied} m²)</span>
                </p>

                <p className="font-heading text-4xl sm:text-5xl font-bold text-amber mt-3">
                  {formatRupiah(contoh.breakdown.total)}
                </p>

                <p className="text-sm text-tinta-lembut mt-3 leading-relaxed">
                  Sudah termasuk bahan, rangka, upah pasang, dan finishing.
                  {contoh.duration.text && ` Perkiraan pengerjaan ${contoh.duration.text}, dipastikan setelah survei.`}
                </p>

                <a
                  href="#kalkulator"
                  className="flex items-center justify-center min-h-[48px] mt-6 bg-kertas-dalam hover:bg-kertas-garis text-hutan font-semibold rounded-xl transition-colors"
                >
                  Hitung ukuran punya kamu
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
