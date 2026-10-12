// Kolom ukuran di kalkulator menyimpan teks yang diketik, bukan angka. Kalau disimpan sebagai
// angka, kolom yang dikosongkan jadi 0 dan ketikan berikutnya nempel di belakang nol itu.
// Orang Indonesia nulis "3,5 meter", jadi koma dan titik sama-sama dianggap tanda desimal.

/** Rapikan ketikan: angka saja, satu tanda desimal, maksimal 2 angka di belakangnya. */
export function rapikanKetikanUkuran(teks: string, desimal = true): string {
  let t = teks.replace(/\s/g, '');
  if (!desimal) return t.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

  t = t.replace(/[^\d.,]/g, '');
  const i = t.search(/[.,]/);
  if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/[.,]/g, '').slice(0, 2);
  // "05" jadi "5", tapi "0,5" tetap.
  return t.replace(/^0+(?=\d)/, '');
}

/** Angka dari ketikan. Kosong, nol, atau tidak terbaca jadi 0 (artinya: belum diisi). */
export function angkaUkuran(teks: string): number {
  const n = Number(teks.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Luas dibulatkan 2 angka di belakang koma: 3,3 × 2,7 = 8,91, bukan 8,909999999999998. */
export function luas(panjang: number, lebar: number): number {
  return Math.round(panjang * lebar * 100) / 100;
}

/** Angka cara Indonesia: 3,5 dan 1.250. */
export function angkaId(n: number): string {
  return n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}
