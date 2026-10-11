import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { CompleteDataset, ServiceSchema } from '../../types/domain';

// Khusus tes. Angka di sini harga lama isian pembuat sistem, dipakai cuma supaya
// hitungan bisa diuji. Jangan diimpor ke halaman: harga asli diisi pemilik.
const HARGA_UJI: Record<string, Partial<ServiceSchema>> = {
  'svc-kanopi-alderon': {
    pricingRules: [
      { id: 'rule-uji-alderon', targetComponent: 'base', model: 'per_m2', rate: 785000, unitLabel: 'm²' },
    ],
    minimumBilling: { minimumArea: 12 },
    durationRanges: [
      { minUnits: 0, maxUnits: 20, minDays: 2, maxDays: 3 },
      { minUnits: 21, maxUnits: 40, minDays: 3, maxDays: 5 },
      { minUnits: 41, maxUnits: null, minDays: 5, maxDays: 8 },
    ],
  },
  'svc-pagar-minimalis': {
    pricingRules: [
      { id: 'rule-uji-pagar', targetComponent: 'base', model: 'per_m', rate: 630000, unitLabel: 'meter' },
    ],
    minimumBilling: { minimumLength: 4 },
    durationRanges: [{ minUnits: 0, maxUnits: null, minDays: 4, maxDays: 7 }],
  },
};

export function datasetHargaUji(): CompleteDataset {
  const ds: CompleteDataset = JSON.parse(JSON.stringify(COMPREHENSIVE_DATASET));
  ds.services = ds.services.map((s) => (HARGA_UJI[s.id] ? { ...s, ...HARGA_UJI[s.id] } : s));
  return ds;
}
