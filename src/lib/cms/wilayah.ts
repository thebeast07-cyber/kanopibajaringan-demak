import { BusinessConfigSchema } from '../../types/domain';

/**
 * Kota yang dapat survei gratis, urut seperti daftar kota yang dilayani. Kota yang sudah dihapus
 * dari daftar layanan ikut hilang di sini. Data lama yang belum punya isian ini dianggap kosong:
 * lebih baik website tidak menjanjikan gratis daripada menjanjikan ke kota yang salah.
 */
export function kotaSurveiGratis(c: BusinessConfigSchema): string[] {
  const gratis = c.kotaSurveiGratis ?? [];
  return c.serviceAreas.filter((k) => gratis.includes(k));
}

/** ["Demak"] → "Demak", dua kota → "Demak dan Semarang", tiga atau lebih → "A, B, dan C". */
export function gabungKota(daftar: string[]): string {
  if (daftar.length <= 2) return daftar.join(' dan ');
  return `${daftar.slice(0, -1).join(', ')}, dan ${daftar[daftar.length - 1]}`;
}
