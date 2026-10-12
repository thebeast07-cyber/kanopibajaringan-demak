'use client';

import React, { useRef, useState } from 'react';
import { FotoLayananSchema } from '../../../types/domain';
import { BATAS_FOTO, geserFoto } from '../../../lib/cms/isiDataLayanan';
import { kecilkanFoto } from '../../../lib/cms/kecilkanFoto';
import { kelasBantuan, kelasTombolKedua } from '../gaya';

const kelasTombolKecil =
  'inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-lg border border-kertas-garis bg-white hover:bg-kertas-dalam text-navy text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed';

interface KelolaFotoProps {
  serviceId: string;
  idDasar: string;
  fotos: FotoLayananSchema[];
  ubahFotos: (fn: (lama: FotoLayananSchema[]) => FotoLayananSchema[]) => void;
}

async function unggah(file: File, serviceId: string): Promise<string> {
  const kecil = await kecilkanFoto(file);
  const data = new FormData();
  data.append('foto', kecil, file.name);
  data.append('serviceId', serviceId);
  const res = await fetch('/api/admin/foto', { method: 'POST', body: data });
  const isi = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${file.name}: ${isi.pesan || 'gagal diunggah.'}`);
  return isi.url;
}

export function KelolaFoto({ serviceId, idDasar, fotos, ubahFotos }: KelolaFotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kemajuan, setKemajuan] = useState('');
  const [galat, setGalat] = useState<string[]>([]);
  const sisa = BATAS_FOTO - fotos.length;

  const pilihFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const semua = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (semua.length === 0) return;

    const dipakai = semua.slice(0, Math.max(0, sisa));
    const pesan: string[] = [];
    if (dipakai.length < semua.length) {
      pesan.push(`Maksimal ${BATAS_FOTO} foto per layanan, jadi ${semua.length - dipakai.length} foto nggak ikut diunggah.`);
    }

    // Satu per satu, biar HP dengan koneksi pelan nggak kehabisan memori atau timeout.
    for (let i = 0; i < dipakai.length; i++) {
      setKemajuan(`Mengunggah ${i + 1} dari ${dipakai.length} foto...`);
      try {
        const url = await unggah(dipakai[i], serviceId);
        ubahFotos((lama) => [...lama, { url }]);
      } catch (err) {
        pesan.push((err as Error).message);
      }
    }
    setKemajuan('');
    setGalat(pesan);
  };

  const geser = (i: number, arah: -1 | 1) => {
    ubahFotos((lama) => geserFoto(lama, i, arah));
    // Fokus ikut fotonya, supaya pengguna keyboard bisa terus menggeser foto yang sama.
    const tujuan = i + arah;
    setTimeout(() => {
      const searah = document.getElementById(`${idDasar}-geser-${arah}-${tujuan}`) as HTMLButtonElement | null;
      // Sampai di ujung, tombol searah mati dan tidak bisa difokus: pindah ke tombol sebaliknya.
      (searah && !searah.disabled ? searah : document.getElementById(`${idDasar}-geser-${-arah}-${tujuan}`))?.focus();
    }, 0);
  };

  return (
    <div className="space-y-3">
      <p id={`${idDasar}-bantuan`} className={kelasBantuan}>
        {fotos.length} dari {BATAS_FOTO} foto. Foto pertama tampil duluan, pelanggan bisa geser ke foto berikutnya.
        Foto yang dihapus baru benar-benar hilang setelah Simpan.
      </p>

      {fotos.length === 0 ? (
        <p className="text-[15px] text-tinta">Belum ada foto. Selama kosong, kartu layanan tampil tanpa foto.</p>
      ) : (
        <ol className="space-y-3" aria-describedby={`${idDasar}-bantuan`}>
          {fotos.map((foto, i) => (
            <li key={foto.url} className="flex gap-3 rounded-xl border border-kertas-garis p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.keterangan || `Foto ${i + 1}`}
                className="w-24 h-24 shrink-0 object-cover rounded-lg bg-kertas-dalam"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <label htmlFor={`${idDasar}-ket-${i}`} className="block text-sm font-semibold text-tinta">
                  Foto {i + 1}
                  {i === 0 && <span className="font-normal text-tinta-lembut"> · tampil pertama</span>}
                </label>
                <input
                  id={`${idDasar}-ket-${i}`}
                  type="text"
                  value={foto.keterangan ?? ''}
                  placeholder="Keterangan (boleh kosong)"
                  onChange={(e) =>
                    ubahFotos((lama) => lama.map((f, idx) => (idx === i ? { ...f, keterangan: e.target.value } : f)))
                  }
                  className="w-full min-h-[44px] px-3 rounded-lg border border-tinta-batas bg-white text-tinta text-[15px] placeholder:text-tinta-samar"
                />
                <div className="flex gap-2">
                  <button
                    id={`${idDasar}-geser--1-${i}`}
                    type="button"
                    onClick={() => geser(i, -1)}
                    disabled={i === 0}
                    className={kelasTombolKecil}
                    aria-label={`Geser foto ${i + 1} ke depan`}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M11 4 L6 9 L11 14" />
                    </svg>
                  </button>
                  <button
                    id={`${idDasar}-geser-1-${i}`}
                    type="button"
                    onClick={() => geser(i, 1)}
                    disabled={i === fotos.length - 1}
                    className={kelasTombolKecil}
                    aria-label={`Geser foto ${i + 1} ke belakang`}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M7 4 L12 9 L7 14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => ubahFotos((lama) => lama.filter((_, idx) => idx !== i))}
                    className={kelasTombolKecil}
                    aria-label={`Hapus foto ${i + 1}`}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <input
        ref={inputRef}
        id={`${idDasar}-file`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        onChange={pilihFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={Boolean(kemajuan) || sisa <= 0}
        className={`${kelasTombolKedua} w-full`}
      >
        {sisa <= 0 ? `Sudah ${BATAS_FOTO} foto` : fotos.length ? 'Tambah foto lagi' : 'Pilih foto dari galeri'}
      </button>

      {kemajuan && (
        <p role="status" className="text-sm text-tinta">
          {kemajuan}
        </p>
      )}
      {galat.length > 0 && (
        <ul role="alert" className="text-sm font-semibold text-tinta space-y-1">
          {galat.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
