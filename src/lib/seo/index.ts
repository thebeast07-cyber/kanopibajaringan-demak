import { CompleteDataset } from '../../types/domain';
import { proyekTampil } from '../cms/galeri';

// Bahan untuk Google: judul halaman yang menyebut kota, dan data usaha terstruktur (schema.org)
// yang menyambungkan website ini dengan profil Google Maps.

export const NAMA_RESMI = '3 Putra Spesialis Kanopi dan Baja Ringan';

/** "Demak, Semarang". Maksimal tiga kota supaya judul tidak terpotong di hasil Google. */
export function kotaJudul(serviceAreas: string[]): string {
  return serviceAreas.slice(0, 3).join(', ');
}

export function judulDepan(d: CompleteDataset): string {
  const kota = kotaJudul(d.businessConfig.serviceAreas);
  return `Jasa Kanopi & Baja Ringan ${kota} | ${d.businessConfig.businessName}`;
}

export function judulGaleri(d: CompleteDataset): string {
  const kota = kotaJudul(d.businessConfig.serviceAreas);
  return `Galeri Pemasangan Kanopi & Baja Ringan ${kota} | ${d.businessConfig.businessName}`;
}

/**
 * Data usaha untuk halaman depan. Yang belum diisi pemilik (alamat, link Maps) tidak ditulis,
 * bukan diisi tebakan. Jenisnya RoofingContractor: kontraktor atap, paling dekat dengan kanopi
 * dan baja ringan di daftar schema.org.
 */
export function dataUsaha(d: CompleteDataset, alamatSitus: string): Record<string, unknown> {
  const c = d.businessConfig;
  const layanan = d.services.filter((s) => s.status === 'active');
  const fotoProyek = proyekTampil(d.galeri).map((p) => p.fotos[0].og ?? p.fotos[0].url);
  const fotoLayanan = layanan.flatMap((s) => (s.fotos?.[0] ? [s.fotos[0].url] : []));
  const foto = [...fotoLayanan, ...fotoProyek].slice(0, 6).map((u) => new URL(u, alamatSitus).toString());

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    '@id': `${alamatSitus}/#usaha`,
    name: c.businessName,
    alternateName: NAMA_RESMI,
    description: c.tagline,
    url: `${alamatSitus}/`,
    logo: `${alamatSitus}/brand/ikon-3putra-512.png`,
    image: foto.length ? foto : [`${alamatSitus}/brand/og-logo.png`],
    telephone: `+${c.frontlineContact.whatsappNumber}`,
    areaServed: c.serviceAreas.map((nama) => ({ '@type': 'City', name: nama })),
    makesOffer: layanan.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } })),
  };
  if (c.alamat) data.address = { '@type': 'PostalAddress', streetAddress: c.alamat, addressCountry: 'ID' };
  if (c.linkMaps) {
    data.hasMap = c.linkMaps;
    data.sameAs = [c.linkMaps];
  }
  return data;
}

/** JSON di dalam <script>: "<" di-escape supaya teks isian tidak bisa menutup tag script. */
export function jsonUntukScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
