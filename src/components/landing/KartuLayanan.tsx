'use client';

import React from 'react';
import { ServiceSchema } from '@/types/domain';
import { formatRupiah, waTanyaUrl } from '@/lib/whatsapp';
import { getMinimumPengerjaan, getTarifBorongan } from '@/lib/estimator/pricingEngine';
import { GaleriFoto } from './GaleriFoto';
import { SumberWa, catatKlikWa } from '@/lib/jejak';

// Satu sumber tampilan kartu layanan: dipakai halaman depan dan tombol "Lihat hasil" di admin,
// jadi yang dilihat pemilik waktu ngedit sama persis dengan yang dilihat pelanggan.

export interface KartuLayananProps {
  svc: ServiceSchema;
  namaUsaha: string;
  whatsappNumber: string;
  onSelectService?: (serviceId: string) => void;
  /** Di admin: tampilan sama, tapi link tidak bisa diklik dan tidak dicatat. */
  pratinjau?: boolean;
}

export function satuanKartu(svc: ServiceSchema): string {
  return svc.pricingRules?.[0]?.unitLabel
    || (svc.measurementType === 'm2' ? 'm²' : svc.measurementType === 'meter' ? 'meter' : 'unit');
}

const kelasLinkWa =
  'inline-flex items-center min-h-[44px] text-navy font-semibold underline underline-offset-4 decoration-navy-muda hover:decoration-2';

function LinkWa({
  href,
  sumber,
  layanan,
  pratinjau,
  className,
  children,
}: {
  href: string;
  sumber: SumberWa;
  layanan: string;
  pratinjau?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  if (pratinjau) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => catatKlikWa(sumber, layanan)} className={className}>
      {children}
    </a>
  );
}

function LinkHitung({
  svc,
  onSelectService,
  pratinjau,
  className,
  children,
}: Pick<KartuLayananProps, 'svc' | 'onSelectService' | 'pratinjau'> & { className: string; children: React.ReactNode }) {
  if (pratinjau) return <span className={className}>{children}</span>;
  return (
    <a href="#kalkulator" onClick={() => onSelectService && onSelectService(svc.id)} className={className}>
      {children}
    </a>
  );
}

/** Kartu besar dengan galeri foto, untuk layanan unggulan. */
export function KartuUtama({ svc, namaUsaha, whatsappNumber, onSelectService, pratinjau }: KartuLayananProps) {
  const tarif = getTarifBorongan(svc);
  const min = getMinimumPengerjaan(svc);
  const bahan = svc.bahanStandar ?? [];

  return (
    <div className="bg-kertas border border-kertas-garis rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-5">
      <div className="space-y-3">
        {/* Foto asli dari pemilik saja. Tanpa foto, kartu tampil tanpa gambar, bukan foto stok. */}
        {svc.fotos && svc.fotos.length > 0 && (
          <div className="pb-2">
            <GaleriFoto fotos={svc.fotos} judul={svc.title} />
          </div>
        )}
        <h3 className="font-heading text-xl font-bold text-navy">{svc.title}</h3>
        <p className="text-sm text-tinta-lembut leading-relaxed">{svc.shortDescription}</p>

        {/* Bagian bahan baru muncul kalau pemilik sudah mengisinya, tidak ada isian contoh. */}
        {bahan.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-tinta">Bahan standar</h4>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {bahan.map((b, i) => (
                <React.Fragment key={i}>
                  <dt className="text-tinta-lembut">{b.bagian}</dt>
                  <dd className="text-tinta">{b.bahan}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div>
        {tarif ? (
          <p className="font-heading text-3xl font-bold text-oranye-gelap">
            {formatRupiah(tarif.rate)}
            <span className="text-base font-normal text-tinta-lembut"> / {satuanKartu(svc)}</span>
          </p>
        ) : (
          <p className="text-tinta leading-relaxed">
            Harganya belum dipasang di sini.{' '}
            <LinkWa
              href={waTanyaUrl(whatsappNumber, `Halo ${namaUsaha}, saya mau tanya harga ${svc.title}.`)}
              sumber="kartu-tanya-harga"
              layanan={svc.id}
              pratinjau={pratinjau}
              className={kelasLinkWa}
            >
              Tanya harga lewat WhatsApp
            </LinkWa>
          </p>
        )}
        {min ? (
          <p className="text-sm text-tinta-samar mt-1.5">
            Minimum pengerjaan {min} {satuanKartu(svc)}
          </p>
        ) : null}
        {bahan.length > 0 && (
          <LinkWa
            href={waTanyaUrl(whatsappNumber, `Halo ${namaUsaha}, saya mau tanya bahan lain untuk ${svc.title}.`)}
            sumber="kartu-bahan-lain"
            layanan={svc.id}
            pratinjau={pratinjau}
            className={`${kelasLinkWa} text-sm mt-1`}
          >
            Mau bahan lain? Tanya lewat WhatsApp
          </LinkWa>
        )}

        <LinkHitung
          svc={svc}
          onSelectService={onSelectService}
          pratinjau={pratinjau}
          className="flex items-center justify-center min-h-[48px] mt-5 bg-navy hover:bg-navy-muda text-white font-semibold rounded-xl transition-colors"
        >
          Hitung ukuran kamu
        </LinkHitung>
      </div>
    </div>
  );
}

/** Satu baris di daftar "Layanan lain". Bobotnya lebih rendah, jadi tampilannya lebih ringan (R-14). */
export function BarisLainnya({ svc, namaUsaha, whatsappNumber, onSelectService, pratinjau }: KartuLayananProps) {
  const tarif = getTarifBorongan(svc);
  const bahan = svc.bahanStandar ?? [];

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="max-w-xl">
        <p className="font-semibold text-tinta">{svc.title}</p>
        <p className="text-sm text-tinta-lembut leading-relaxed">{svc.shortDescription}</p>
        {bahan.length > 0 && (
          <p className="text-sm text-tinta mt-1">
            <span className="text-tinta-lembut">Bahan standar:</span> {bahan.map((b) => `${b.bagian} ${b.bahan}`).join(', ')}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
        {tarif ? (
          <span className="font-heading text-xl font-bold text-oranye-gelap">
            {formatRupiah(tarif.rate)}
            <span className="text-sm font-normal text-tinta-lembut"> / {satuanKartu(svc)}</span>
          </span>
        ) : (
          <LinkWa
            href={waTanyaUrl(whatsappNumber, `Halo ${namaUsaha}, saya mau tanya harga ${svc.title}.`)}
            sumber="daftar-tanya-harga"
            layanan={svc.id}
            pratinjau={pratinjau}
            className={`${kelasLinkWa} text-sm`}
          >
            Tanya harga lewat WhatsApp
          </LinkWa>
        )}
        <LinkHitung
          svc={svc}
          onSelectService={onSelectService}
          pratinjau={pratinjau}
          className="flex items-center justify-center min-h-[44px] px-4 border border-kertas-garis bg-white hover:bg-kertas-dalam text-navy font-semibold text-sm rounded-lg transition-colors"
        >
          Hitung
        </LinkHitung>
      </div>
    </div>
  );
}
