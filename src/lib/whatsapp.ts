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

  // Pesan ini yang pertama dibaca pemilik di HP-nya. Ditulis seperti orang ngetik
  // beneran: tanpa emoji, tanpa judul huruf kapital, nama usaha dibaca dari config
  // (dulu "KANOPI PRO" ditulis mati di sini dan ketinggalan waktu nama usahanya ganti).
  const namaUsaha = dataset.businessConfig.businessName;

  const lines = [
    `Halo ${namaUsaha}, saya mau tanya soal pemasangan.`,
    ``,
    `Layanan: ${serviceName}`,
    `Ukuran: ${dimensionStr}`,
    // Baris spesifikasi cuma muncul kalau ada yang dipilih. Layanan borongan tidak punya.
    mat ? `Atap/bahan: ${mat.name}` : null,
    frame ? `Rangka: ${frame.name}` : null,
    labor ? `Jasa tukang: ${labor.name}` : null,
    finishing ? `Finishing: ${finishing.name}` : null,
    selectedAddons.length > 0 ? `Tambahan: ${selectedAddons.join(', ')}` : null,
    selectedConditions.length > 0 ? `Kondisi lokasi: ${selectedConditions.join(', ')}` : null,
    ``,
    `Perkiraan dari kalkulator: *${formatRupiah(snapshot.breakdown.total)}*`,
    `Perkiraan pengerjaan: ${snapshot.duration.text}`,
    ``,
    `Nama saya ${customer.customerName}, lokasi di ${customer.cityOrDistrict}.`,
    customer.additionalNotes ? `Catatan: ${customer.additionalNotes}` : null,
    ``,
    `Boleh minta harga pastinya dan dijadwalkan survei?`,
    ``,
    `(kode ${snapshot.estimateId}, dihitung ${new Date(snapshot.calculatedAt).toLocaleDateString('id-ID')})`,
  ].filter((line) => line !== null);

  const rawMessage = lines.join('\n');
  const targetPhone = dataset.businessConfig.frontlineContact.whatsappNumber.replace(/\D/g, '');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(rawMessage)}`;
}
