import { ATAP_DAN_3, JENDELA, NAVY, ORANYE, TIANG } from './Logo';

// Layar tunggu: garis logo tergambar kayak sketsa rangka, lalu warnanya diisi (pilihan A pemilik).
// Animasinya di globals.css (.logo-loading). Kalau animasi dimatikan di HP, logo tampil utuh diam.

export function LogoLoading({ teks = 'Tunggu sebentar' }: { teks?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-5">
      <svg viewBox="392 113 474 299" aria-hidden="true" className="logo-loading w-36 h-auto overflow-visible">
        <path pathLength={1} fill={NAVY} stroke={NAVY} d={ATAP_DAN_3} />
        <path pathLength={1} fill={ORANYE} stroke={ORANYE} d={TIANG} className="tiang" />
        <path pathLength={1} fill={ORANYE} stroke={ORANYE} strokeWidth={0} d={JENDELA} className="jendela" />
      </svg>
      <p className="text-navy font-semibold">
        {teks}
        <span className="loading-titik" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
