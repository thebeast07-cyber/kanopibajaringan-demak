// Kelas yang dipakai bareng di halaman admin. Tombol utama navy; oranye cuma buat angka harga.

export const kelasTombolUtama =
  'inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl bg-navy hover:bg-navy-muda text-white font-semibold transition-colors disabled:opacity-60';
export const kelasTombolKedua =
  'inline-flex items-center justify-center min-h-[48px] px-4 rounded-xl border border-navy bg-white hover:bg-kertas-dalam text-navy font-semibold transition-colors disabled:opacity-60';
export const kelasTombolTipis =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-kertas-garis bg-white hover:bg-kertas-dalam text-navy text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export const kelasKartu = 'bg-white border border-kertas-garis rounded-2xl';
export const kelasJudulHalaman = 'font-heading text-[28px] leading-tight font-bold text-navy';
export const kelasJudulKartu = 'text-[17px] font-bold text-tinta';
export const kelasLabel = 'block text-sm font-semibold text-tinta';
export const kelasBantuan = 'text-[13px] leading-relaxed text-tinta-lembut';

// Kolom yang salah ditandai garis tebal + kalimat, bukan warna merah saja.
export const kelasKolom = (tandaiSalah = false) =>
  `w-full min-h-[50px] px-3.5 rounded-xl bg-white text-tinta text-base ${
    tandaiSalah ? 'border-2 border-tinta' : 'border border-tinta-batas'
  }`;
