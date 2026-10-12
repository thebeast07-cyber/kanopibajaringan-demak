// Logo 3 Putra, digambar ulang dari board logo pemilik. Sumber SVG lengkap ada di public/brand/.
// Koordinatnya mengikuti piksel board asli, jadi viewBox-nya tidak mulai dari 0.

const NAVY = '#0B2D5B';
const ORANYE = '#FF8A3D';

const ATAP_DAN_3 = 'M631 123 L856 275 V323 L631 169 L505 237.5 H610 V268 L560 304 C590 304 606 320 606 342 V364 C606 386 589 402 567 402 H402 L440 367 H552 C562 367 568 360 568 351 C568 341 562 334 553 334 H483 V328 L544 272 H454 L422 240 Z';
const TIANG = 'M634 196 L757 279.1 V402 H715 V289.7 L634 235 Z M774 290.6 L811 315.6 V402 H774 Z M825 325 L856 346 V402 H825 Z';
const JENDELA = 'M644 291.5 H657.5 A2 2 0 0 1 659.5 293.5 V307 A2 2 0 0 1 657.5 309 H644 A2 2 0 0 1 642 307 V293.5 A2 2 0 0 1 644 291.5 Z M668 291.5 H681.5 A2 2 0 0 1 683.5 293.5 V307 A2 2 0 0 1 681.5 309 H668 A2 2 0 0 1 666 307 V293.5 A2 2 0 0 1 668 291.5 Z M644 316 H657.5 A2 2 0 0 1 659.5 318 V331.5 A2 2 0 0 1 657.5 333.5 H644 A2 2 0 0 1 642 331.5 V318 A2 2 0 0 1 644 316 Z M668 316 H681.5 A2 2 0 0 1 683.5 318 V331.5 A2 2 0 0 1 681.5 333.5 H668 A2 2 0 0 1 666 331.5 V318 A2 2 0 0 1 668 316 Z';
const TULISAN = 'M271 450 H346 A20 20 0 0 1 366 470 V478 A16 16 0 0 1 356 494 A16 16 0 0 1 366 510 V521 A20 20 0 0 1 346 541 H271 V520 H336 A6 6 0 0 0 342 514 V508 A6 6 0 0 0 336 502 H293 V486 H335 A6 6 0 0 0 341 480 V475 A6 6 0 0 0 335 469 H271 Z M425 541 V449 H506 A22 22 0 0 1 528 471 V490 A22 22 0 0 1 506 512 H448 V541 Z M448 469 V492 H499 A6 6 0 0 0 505 486 V475 A6 6 0 0 0 499 469 Z M541 449 H564 V514 A6 6 0 0 0 570 520 H612 A6 6 0 0 0 618 514 V449 H641 V519 A22 22 0 0 1 619 541 H563 A22 22 0 0 1 541 519 Z M653 449 H741 V469 H709 V541 H685 V469 H653 Z M752 541 V449 H832 A22 22 0 0 1 854 471 V489 A20 20 0 0 1 834 509 H827 L855 541 H825 L788 500 V491 H825 A6 6 0 0 0 831 485 V475 A6 6 0 0 0 825 469 H775 V541 Z M861 541 L907 456 A12 12 0 0 1 917.5 449 H925 A12 12 0 0 1 935.5 456 L983 541 H955 L922 477 L889 541 Z';

interface LogoProps {
  /** Untuk latar navy: bagian navy jadi putih, oranye tetap. */
  terang?: boolean;
  className?: string;
}

/** Tanda + tulisan "3 PUTRA" berdampingan, untuk navbar dan footer. */
export function LogoMendatar({ terang = false, className }: LogoProps) {
  const utama = terang ? '#FFFFFF' : NAVY;
  return (
    <svg viewBox="392 113 1512 299" className={className} role="img" aria-label="3 Putra">
      <path fill={utama} d={ATAP_DAN_3} />
      <path fill={ORANYE} d={TIANG} />
      <path fill={ORANYE} d={JENDELA} />
      <g transform="translate(547.5 -415.6) scale(1.37)">
        <path fill={utama} fillRule="evenodd" d={TULISAN} />
      </g>
    </svg>
  );
}
