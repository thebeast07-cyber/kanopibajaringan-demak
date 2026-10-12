import { useSyncExternalStore } from 'react';
import { defaultLocalCmsRepository, StorageState } from './localCmsRepository';

export type JenisPenyimpanan = 'redis' | 'vercel-blob' | 'lokal' | 'belum-dipasang';

export interface StatusSimpan {
  keadaan: 'memuat' | 'tersimpan' | 'menyimpan' | 'gagal' | 'konflik';
  jenis: JenisPenyimpanan | null;
  pesan?: string;
}

let status: StatusSimpan = { keadaan: 'memuat', jenis: null };
const pendengar = new Set<() => void>();
let etag: string | null = null;
let tertunda: StorageState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let antrean: Promise<void> = Promise.resolve();

function setStatus(baru: Partial<StatusSimpan>) {
  status = { ...status, ...baru };
  pendengar.forEach((fn) => fn());
}

export function ambilStatusSimpan(): StatusSimpan {
  return status;
}

export function langgananStatusSimpan(fn: () => void): () => void {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

export function useStatusSimpan(): StatusSimpan {
  return useSyncExternalStore(langgananStatusSimpan, ambilStatusSimpan, ambilStatusSimpan);
}

async function kirimSatu(): Promise<void> {
  if (!tertunda) return;
  // Selama konflik, jangan menimpa data perangkat lain sampai halaman dimuat ulang.
  if (status.keadaan === 'konflik') return;
  const state = tertunda;
  tertunda = null;
  try {
    const res = await fetch('/api/admin/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, etag }),
    });
    const isi = await res.json().catch(() => ({}));
    if (res.ok) {
      etag = isi.etag;
      if (!tertunda) setStatus({ keadaan: 'tersimpan', pesan: undefined });
    } else if (res.status === 409) {
      setStatus({ keadaan: 'konflik', pesan: isi.pesan });
    } else {
      // Simpan lagi nanti: perubahan yang gagal dikirim tidak boleh hilang diam-diam.
      tertunda = tertunda ?? state;
      setStatus({ keadaan: 'gagal', pesan: isi.pesan || 'Gagal menyimpan. Coba lagi.' });
    }
  } catch {
    tertunda = tertunda ?? state;
    setStatus({ keadaan: 'gagal', pesan: 'Koneksi putus waktu menyimpan. Cek internetnya lalu coba lagi.' });
  }
}

function jadwalkan(state: StorageState) {
  tertunda = state;
  if (status.keadaan !== 'konflik') setStatus({ keadaan: 'menyimpan', pesan: undefined });
  if (timer) clearTimeout(timer);
  // Ketikan beruntun digabung jadi satu kiriman.
  timer = setTimeout(() => {
    timer = null;
    antrean = antrean.then(kirimSatu);
  }, 600);
}

/** Kirim yang tertunda sekarang juga. Mengembalikan pesan gagal, atau null kalau tersimpan. */
export async function simpanSekarang(): Promise<string | null> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  antrean = antrean.then(kirimSatu);
  await antrean;
  return status.keadaan === 'tersimpan' ? null : status.pesan || 'Belum tersimpan.';
}

export async function muatDariServer(): Promise<void> {
  const res = await fetch('/api/admin/state', { cache: 'no-store' });
  const isi = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(isi.pesan || 'Data admin nggak bisa dimuat.');

  etag = isi.etag ?? null;
  if (isi.state) defaultLocalCmsRepository.replaceState(isi.state);
  defaultLocalCmsRepository.setPenyimpanLuar(jadwalkan);
  setStatus({
    keadaan: 'tersimpan',
    jenis: isi.jenis,
    pesan: isi.jenis === 'belum-dipasang' ? 'Penyimpanan online belum dipasang di Vercel, jadi perubahan nggak bisa disimpan.' : undefined,
  });
}

export function cobaKirimLagi() {
  if (tertunda) antrean = antrean.then(kirimSatu);
}
