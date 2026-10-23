import { EstimateSnapshot, CompleteDataset, BahanStandarSchema } from '../types/domain';
import { getTarifBorongan } from './estimator/pricingEngine';
import { angkaId } from './estimator/ukuran';

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

export function teksBahanStandar(bahan: BahanStandarSchema[] | undefined): string {
  return (bahan ?? []).map((b) => `${b.bagian}: ${b.bahan}`).join('; ');
}

export function sapaanUmum(namaUsaha: string): string {
  return `Halo ${namaUsaha}, saya mau tanya soal pemasangan.`;
}

/** Link WhatsApp dengan pesan pembuka yang sudah terisi. */
export function waTanyaUrl(whatsappNumber: string, pesan: string): string {
  return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(pesan)}`;
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

  // Pola ukuran sama dengan di halaman (DESIGN.md): "5 m × 2 m (10 m² → ditagih 12 m²)".
  const { actual, applied, unitType } = snapshot.billableUnits;
  const kenaMinimum = applied > actual;
  let dimensionStr = '';
  if (unitType === 'm2') {
    dimensionStr = `${angkaId(snapshot.input.length || 0)} m × ${angkaId(snapshot.input.width || 0)} m (${angkaId(actual)} m²${
      kenaMinimum ? ` → ditagih ${angkaId(applied)} m²` : ''
    })`;
  } else if (unitType === 'meter') {
    dimensionStr = `${angkaId(snapshot.input.length || 0)} meter${kenaMinimum ? ` (ditagih ${angkaId(applied)} meter)` : ''}`;
  } else {
    dimensionStr = `${snapshot.input.quantity || 1} unit${kenaMinimum ? ` (ditagih ${applied} unit)` : ''}`;
  }

  // Pesan ini yang pertama dibaca pemilik di HP-nya. Ditulis seperti orang ngetik
  // beneran: tanpa emoji, tanpa judul huruf kapital, nama usaha dibaca dari config
  // (dulu "KANOPI PRO" ditulis mati di sini dan ketinggalan waktu nama usahanya ganti).
  const namaUsaha = dataset.businessConfig.businessName;

  // Harga atau lama pengerjaan yang belum diisi pemilik tidak ditulis sama sekali,
  // supaya pesan tidak membawa "Rp 0" atau angka tebakan.
  const adaHarga = Boolean(service && getTarifBorongan(service));
  const bahanStandar = teksBahanStandar(service?.bahanStandar);

  const lines = [
    `Halo ${namaUsaha}, saya mau tanya soal pemasangan.`,
    ``,
    `Layanan: ${serviceName}`,
    `Ukuran: ${dimensionStr}`,
    bahanStandar ? `Bahan standar: ${bahanStandar}` : null,
    // Baris spesifikasi cuma muncul kalau ada yang dipilih. Layanan borongan tidak punya.
    mat ? `Atap/bahan: ${mat.name}` : null,
    frame ? `Rangka: ${frame.name}` : null,
    labor ? `Jasa tukang: ${labor.name}` : null,
    finishing ? `Finishing: ${finishing.name}` : null,
    selectedAddons.length > 0 ? `Tambahan: ${selectedAddons.join(', ')}` : null,
    selectedConditions.length > 0 ? `Kondisi lokasi: ${selectedConditions.join(', ')}` : null,
    ``,
    adaHarga ? `Perkiraan dari kalkulator: *${formatRupiah(snapshot.breakdown.total)}*` : null,
    snapshot.duration.text ? `Perkiraan pengerjaan: ${snapshot.duration.text}` : null,
    ``,
    `Nama saya ${customer.customerName}, lokasi di ${customer.cityOrDistrict}.`,
    customer.additionalNotes ? `Catatan: ${customer.additionalNotes}` : null,
    ``,
    adaHarga
      ? `Boleh minta harga pastinya sekalian jadwal survei?`
      : `Harganya belum ada di website. Boleh minta dihitungkan sekalian jadwal survei?`,
    ``,
    `(kode ${snapshot.estimateId}, dihitung ${new Date(snapshot.calculatedAt).toLocaleDateString('id-ID')})`,
  ]
    .filter((line): line is string => line !== null)
    // baris kosong dobel muncul kalau harga dan lama pengerjaan dua-duanya belum diisi
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''));

  return waTanyaUrl(dataset.businessConfig.frontlineContact.whatsappNumber, lines.join('\n'));
}
