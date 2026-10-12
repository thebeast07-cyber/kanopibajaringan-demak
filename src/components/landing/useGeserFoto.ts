'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Posisi foto di jalur geser (scroll-snap). Tujuan geser dicatat begitu tombol ditekan, jadi
 * ketukan beruntun maju terus walau animasi geser sebelumnya belum selesai.
 */
export function useGeserFoto(jumlah: number, awal = 0) {
  const jalurRef = useRef<HTMLUListElement>(null);
  const [posisi, setPosisi] = useState(awal);
  const [tujuan, setTujuan] = useState<number | null>(null);
  const tujuanRef = useRef<number | null>(null);
  const diamRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aktif = tujuan ?? posisi;
  const aktifRef = useRef(aktif);
  aktifRef.current = aktif;

  const bacaPosisi = () => {
    const jalur = jalurRef.current;
    return jalur && jalur.clientWidth ? Math.round(jalur.scrollLeft / jalur.clientWidth) : aktifRef.current;
  };

  // Setelah gerakan berhenti, posisi asli yang dipakai. Menangani juga jari yang menggeser ke
  // tempat lain di tengah animasi, dan geser ke posisi yang sama (tanpa event scroll).
  const tungguDiam = () => {
    if (diamRef.current) clearTimeout(diamRef.current);
    diamRef.current = setTimeout(() => {
      tujuanRef.current = null;
      setTujuan(null);
      setPosisi(bacaPosisi());
    }, 180);
  };

  useEffect(() => () => {
    if (diamRef.current) clearTimeout(diamRef.current);
  }, []);

  const keFoto = (i: number, instan = false) => {
    const jalur = jalurRef.current;
    if (!jalur || jumlah === 0) return;
    const j = Math.max(0, Math.min(jumlah - 1, i));
    tujuanRef.current = j;
    setTujuan(j);
    // Gerak halus cuma buat menunjukkan arah pindahnya; dimatikan kalau pengguna minta gerak dikurangi.
    const kurangiGerak = instan || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    jalur.scrollTo({ left: j * jalur.clientWidth, behavior: kurangiGerak ? 'auto' : 'smooth' });
    tungguDiam();
  };

  const geser = (arah: -1 | 1) => keFoto(aktifRef.current + arah);

  const saatGeser = () => {
    const sekarang = bacaPosisi();
    setPosisi(sekarang);
    if (tujuanRef.current !== null && sekarang === tujuanRef.current) {
      tujuanRef.current = null;
      setTujuan(null);
    }
    tungguDiam();
  };

  return { jalurRef, aktif, aktifRef, keFoto, geser, saatGeser };
}
