import { BusinessConfigSchema, ServiceSchema } from '../../types/domain';
import { defaultCmsRepository } from './repository';
import { simpanSekarang } from './sinkronServer';

// Satu tombol Simpan buat pemilik: tulis ke draf, langsung terbitkan, lalu tunggu penyimpanan
// online menerimanya. Kembalikan pesan gagal, atau null kalau sudah tampil di website.

async function terbitkan(): Promise<string | null> {
  try {
    defaultCmsRepository.publishDraft('Owner');
  } catch {
    return 'Tersimpan sebagai draf, tapi belum tampil di website karena ada data lain yang belum valid.';
  }
  const gagalOnline = await simpanSekarang();
  return gagalOnline ? `Belum tersimpan online. ${gagalOnline}` : null;
}

export async function simpanLayanan(service: ServiceSchema): Promise<string | null> {
  try {
    defaultCmsRepository.saveService(service, 'Owner');
  } catch {
    return 'Gagal menyimpan. Coba lagi, atau muat ulang halamannya.';
  }
  return terbitkan();
}

export async function simpanPengaturan(ubahan: Partial<BusinessConfigSchema>): Promise<string | null> {
  try {
    if (!defaultCmsRepository.hasDraft()) defaultCmsRepository.createDraft('Ubah pengaturan usaha', 'Owner');
    // Ambil dari draf, bukan dari data terbit, supaya nomor versi draf tidak tertimpa.
    const sekarang = defaultCmsRepository.getDraftDataset()!.businessConfig;
    defaultCmsRepository.saveDraft({ businessConfig: { ...sekarang, ...ubahan } }, 'Owner');
  } catch {
    return 'Gagal menyimpan. Coba lagi, atau muat ulang halamannya.';
  }
  return terbitkan();
}

/** Foto yang dibuang dari daftar dihapus juga dari penyimpanan, setelah datanya tersimpan. */
export function hapusFotoTerbuang(lama: ServiceSchema | undefined, baru: ServiceSchema) {
  const dipakai = new Set((baru.fotos ?? []).map((f) => f.url));
  const terbuang = (lama?.fotos ?? []).map((f) => f.url).filter((u) => !dipakai.has(u));
  if (terbuang.length === 0) return;
  fetch('/api/admin/foto', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: terbuang }),
  }).catch(() => null);
}
