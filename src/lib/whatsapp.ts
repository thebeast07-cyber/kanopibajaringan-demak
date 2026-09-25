import { EstimateSnapshot, CompleteDataset } from '../types/domain';

export interface CustomerContactInfo {
  customerName: string;
  cityOrDistrict: string;
  additionalNotes?: string;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppLeadUrl(
  snapshot: EstimateSnapshot,
  customer: CustomerContactInfo,
  dataset: CompleteDataset
): string {
  const service = dataset.services.find((s) => s.id === snapshot.input.serviceId);
  const serviceName = service ? service.title : snapshot.input.serviceId;

  const mat = dataset.materials.find((m) => m.id === snapshot.input.materialId);
  const frame = dataset.frames.find((f) => f.id === snapshot.input.frameId);
  const labor = dataset.laborOptions.find((l) => l.id === snapshot.input.laborId);
  const finishing = dataset.finishings.find((fn) => fn.id === snapshot.input.finishingId);

  const selectedAddons = (snapshot.input.addonIds || [])
    .map((id) => dataset.addOns.find((a) => a.id === id)?.name)
    .filter(Boolean);

  const selectedConditions = (snapshot.input.siteConditionIds || [])
    .map((id) => dataset.siteConditions.find((c) => c.id === id)?.name)
    .filter(Boolean);

  let dimensionStr = '';
  if (snapshot.billableUnits.unitType === 'm2') {
    dimensionStr = `${snapshot.input.length || 0}m × ${snapshot.input.width || 0}m (${snapshot.billableUnits.actual} m²`;
    if (snapshot.billableUnits.applied > snapshot.billableUnits.actual) {
      dimensionStr += ` → Min Billing ${snapshot.billableUnits.applied} m²`;
    }
    dimensionStr += ')';
  } else if (snapshot.billableUnits.unitType === 'meter') {
    dimensionStr = `${snapshot.input.length || 0} meter`;
    if (snapshot.billableUnits.applied > snapshot.billableUnits.actual) {
      dimensionStr += ` (Min Billing ${snapshot.billableUnits.applied} m)`;
    }
  } else {
    dimensionStr = `${snapshot.input.quantity || 1} unit`;
  }

  const lines = [
    `*HALO TIM MARKETING / FRONTLINE KANOPI PRO*`,
    `Saya ingin mengajukan *Survei Lokasi Gratis* & konfirmasi rincian estimasi proyek berikut:`,
    ``,
    `📋 *KODE ESTIMASI:* \`${snapshot.estimateId}\``,
    `📅 *Tanggal:* ${new Date(snapshot.calculatedAt).toLocaleDateString('id-ID')}`,
    `🛠️ *Layanan:* ${serviceName}`,
    `📐 *Dimensi/Volume:* ${dimensionStr}`,
    ``,
    `⚙️ *SPESIFIKASI PILIHAN:*`,
    mat ? `• *Atap/Material:* ${mat.name}` : null,
    frame ? `• *Rangka:* ${frame.name}` : null,
    labor ? `• *Jasa Tukang:* ${labor.name}` : null,
    finishing ? `• *Finishing:* ${finishing.name}` : null,
    selectedAddons.length > 0 ? `• *Pekerjaan Tambahan:* ${selectedAddons.join(', ')}` : null,
    selectedConditions.length > 0 ? `• *Kondisi Lokasi:* ${selectedConditions.join(', ')}` : null,
    ``,
    `💰 *ESTIMASI BIAYA:* *${formatRupiah(snapshot.breakdown.total)}*`,
    `⏱️ *ESTIMASI DURASI:* *${snapshot.duration.text}*`,
    ``,
    `👤 *DATA PEMOHON:*`,
    `• *Nama:* ${customer.customerName}`,
    `• *Lokasi/Kecamatan:* ${customer.cityOrDistrict}`,
    customer.additionalNotes ? `• *Catatan Tambahan:* ${customer.additionalNotes}` : null,
    ``,
    `ℹ️ _Saya memahami estimasi ini bersifat acuan awal dan harga final akan dipastikan setelah Tim Teknis melakukan survei lokasi._`,
  ].filter((line) => line !== null);

  const rawMessage = lines.join('\n');
  const targetPhone = dataset.businessConfig.frontlineContact.whatsappNumber.replace(/\D/g, '');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(rawMessage)}`;
}
