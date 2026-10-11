import { BahanStandarSchema, MeasurementType, ServiceSchema } from '../../types/domain';
import { getMinimumPengerjaan, getTarifBorongan } from '../estimator/pricingEngine';
import { formatRupiah } from '../whatsapp';

export type CaraUkur = Extract<MeasurementType, 'm2' | 'meter' | 'unit'>;

export const SATUAN: Record<CaraUkur, string> = { m2: 'm²', meter: 'meter', unit: 'unit' };

export function satuanLayanan(service: Pick<ServiceSchema, 'measurementType'>): string {
  return SATUAN[service.measurementType as CaraUkur] ?? 'unit';
}

/** Isian form disimpan sebagai teks supaya kolom kosong tetap kosong, bukan jadi 0. */
export interface IsianLayanan {
  title: string;
  shortDescription: string;
  measurementType: CaraUkur;
  harga: string;
  minimum: string;
  hariMin: string;
  hariMax: string;
  bahan: BahanStandarSchema[];
}

export type KolomWajib = 'harga' | 'lama' | 'bahan';

const NAMA_KOLOM: Record<KolomWajib, string> = {
  harga: 'harga',
  lama: 'lama pengerjaan',
  bahan: 'bahan standar',
};

export function kolomKosong(service: ServiceSchema): KolomWajib[] {
  const kosong: KolomWajib[] = [];
  if (!getTarifBorongan(service)) kosong.push('harga');
  if (!service.durationRanges?.length) kosong.push('lama');
  if (!service.bahanStandar?.length) kosong.push('bahan');
  return kosong;
}

export function daftarKolomKosong(service: ServiceSchema): string {
  return kolomKosong(service).map((k) => NAMA_KOLOM[k]).join(', ');
}

export function teksHarga(service: ServiceSchema): string | null {
  const tarif = getTarifBorongan(service);
  return tarif ? `${formatRupiah(tarif.rate)} / ${satuanLayanan(service)}` : null;
}

export function teksMinimum(service: ServiceSchema): string | null {
  const min = getMinimumPengerjaan(service);
  return min ? `${min} ${satuanLayanan(service)}` : null;
}

export function teksLama(service: ServiceSchema): string | null {
  const r = service.durationRanges?.[0];
  if (!r) return null;
  return r.minDays === r.maxDays ? `${r.minDays} hari kerja` : `${r.minDays} sampai ${r.maxDays} hari kerja`;
}

function angka(teks: string): number | null {
  const bersih = teks.replace(/\D/g, '');
  return bersih ? Number(bersih) : null;
}

export function isianDariLayanan(service: ServiceSchema): IsianLayanan {
  const range = service.durationRanges?.[0];
  return {
    title: service.title,
    shortDescription: service.shortDescription,
    measurementType: (['m2', 'meter', 'unit'].includes(service.measurementType)
      ? service.measurementType
      : 'm2') as CaraUkur,
    harga: getTarifBorongan(service) ? String(getTarifBorongan(service)!.rate) : '',
    minimum: getMinimumPengerjaan(service) ? String(getMinimumPengerjaan(service)) : '',
    hariMin: range ? String(range.minDays) : '',
    hariMax: range ? String(range.maxDays) : '',
    bahan: service.bahanStandar?.length ? service.bahanStandar.map((b) => ({ ...b })) : [],
  };
}

export type KesalahanIsian = Partial<Record<'title' | 'harga' | 'minimum' | 'lama' | 'bahan', string>>;

export function periksaIsian(isian: IsianLayanan): KesalahanIsian {
  const salah: KesalahanIsian = {};
  if (!isian.title.trim()) salah.title = 'Nama layanan wajib diisi.';

  if (isian.harga.trim() && !angka(isian.harga)) {
    salah.harga = 'Harga 0 nggak bisa dipakai. Isi harganya atau kosongkan.';
  }
  if (isian.minimum.trim() && !angka(isian.minimum)) {
    salah.minimum = 'Minimum harus di atas 0, atau kosongkan.';
  }

  const min = angka(isian.hariMin);
  const max = angka(isian.hariMax);
  if (Boolean(isian.hariMin.trim()) !== Boolean(isian.hariMax.trim())) {
    salah.lama = 'Isi paling cepat dan paling lama dua-duanya, atau kosongkan dua-duanya.';
  } else if (min !== null && max !== null && (min < 1 || max < min)) {
    salah.lama = min < 1 ? 'Lama pengerjaan minimal 1 hari.' : 'Paling lama nggak boleh lebih cepat dari paling cepat.';
  }

  const barisSetengah = isian.bahan.some((b) => Boolean(b.bagian.trim()) !== Boolean(b.bahan.trim()));
  if (barisSetengah) salah.bahan = 'Bagian dan bahan harus diisi dua-duanya, atau hapus barisnya.';

  return salah;
}

/** Gabungkan isian ke layanan. Kolom yang dikosongkan jadi kosong juga di data. */
export function terapkanIsian(service: ServiceSchema, isian: IsianLayanan): ServiceSchema {
  const satuan = SATUAN[isian.measurementType];
  const harga = angka(isian.harga);
  const minimum = angka(isian.minimum);
  const hariMin = angka(isian.hariMin);
  const hariMax = angka(isian.hariMax);

  return {
    ...service,
    title: isian.title.trim(),
    shortDescription: isian.shortDescription.trim(),
    fullDescription: service.fullDescription || isian.shortDescription.trim(),
    measurementType: isian.measurementType,
    pricingRules: harga
      ? [
          {
            id: `rule-${service.id}-borongan`,
            targetComponent: 'base',
            model: isian.measurementType === 'm2' ? 'per_m2' : isian.measurementType === 'meter' ? 'per_m' : 'per_unit',
            rate: harga,
            unitLabel: satuan,
            description: `Harga borongan per ${satuan}, sudah termasuk bahan, rangka, upah pasang, dan finishing`,
          },
        ]
      : [],
    minimumBilling: minimum
      ? isian.measurementType === 'm2'
        ? { minimumArea: minimum }
        : isian.measurementType === 'meter'
        ? { minimumLength: minimum }
        : { minimumQuantity: minimum }
      : undefined,
    durationRanges:
      hariMin && hariMax ? [{ minUnits: 0, maxUnits: null, minDays: hariMin, maxDays: hariMax }] : [],
    bahanStandar: isian.bahan
      .map((b) => ({ bagian: b.bagian.trim(), bahan: b.bahan.trim() }))
      .filter((b) => b.bagian && b.bahan),
    source: 'owner',
  };
}

export function layananBaru(): ServiceSchema {
  const id = `svc-${Date.now().toString(36)}`;
  return {
    id,
    slug: id,
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: 'other',
    featured: false,
    measurementType: 'm2',
    pricingRules: [],
    allowedMaterialIds: [],
    allowedFrameIds: [],
    allowedLaborIds: [],
    allowedFinishingIds: [],
    allowedAddOnIds: [],
    allowedSiteConditionIds: [],
    durationRanges: [],
    bahanStandar: [],
    source: 'owner',
    status: 'active',
  };
}

export function slugDariNama(nama: string): string {
  return nama
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
