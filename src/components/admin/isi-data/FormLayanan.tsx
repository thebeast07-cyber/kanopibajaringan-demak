'use client';

import React, { useRef, useState } from 'react';
import { FotoLayananSchema, ServiceSchema } from '../../../types/domain';
import { KelolaFoto } from './KelolaFoto';
import { formatRupiah } from '../../../lib/whatsapp';
import {
  CaraUkur,
  IsianLayanan,
  KesalahanIsian,
  SATUAN,
  isianDariLayanan,
  periksaIsian,
  terapkanIsian,
} from '../../../lib/cms/isiDataLayanan';

export const kelasTombolUtama =
  'inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-hutan hover:bg-hutan-muda text-white font-semibold transition-colors';
export const kelasTombolKedua =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-tinta-batas bg-white hover:bg-kertas-dalam text-hutan font-semibold transition-colors';

const kelasLabel = 'block text-sm font-semibold text-tinta';
const kelasBantuan = 'text-sm text-tinta-lembut';
// Kolom yang salah ditandai garis tebal + kalimat, bukan warna merah saja.
const kelasKolom = (tandaiSalah = false) =>
  `w-full min-h-[44px] px-3 rounded-lg bg-white text-tinta ${
    tandaiSalah ? 'border-2 border-tinta' : 'border border-tinta-batas'
  }`;

const CARA_UKUR: { value: CaraUkur; label: string }[] = [
  { value: 'm2', label: 'm² (panjang × lebar)' },
  { value: 'meter', label: 'Meter (panjang saja)' },
  { value: 'unit', label: 'Unit (jumlah)' },
];

interface FormLayananProps {
  service: ServiceSchema;
  idForm: string;
  /** Kembalikan pesan gagal, atau null kalau tersimpan. */
  onSimpan: (service: ServiceSchema) => Promise<string | null>;
  onBatal: () => void;
}

export function FormLayanan({ service, idForm, onSimpan, onBatal }: FormLayananProps) {
  const [isian, setIsian] = useState<IsianLayanan>(() => {
    const awal = isianDariLayanan(service);
    // Satu baris kosong biar langsung bisa diketik, bukan contoh isian.
    return awal.bahan.length ? awal : { ...awal, bahan: [{ bagian: '', bahan: '' }] };
  });
  const [salah, setSalah] = useState<KesalahanIsian>({});
  const [gagal, setGagal] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const satuan = SATUAN[isian.measurementType];
  const id = (nama: string) => `${idForm}-${nama}`;
  // Pesan salah hilang begitu kolomnya diubah, tidak perlu menunggu Simpan ditekan lagi.
  const KUNCI_SALAH: Partial<Record<keyof IsianLayanan, keyof KesalahanIsian>> = {
    title: 'title', harga: 'harga', minimum: 'minimum', hariMin: 'lama', hariMax: 'lama', bahan: 'bahan',
  };
  const ubah = (field: Partial<IsianLayanan>) => {
    setIsian((prev) => ({ ...prev, ...field }));
    setSalah((prev) => {
      const sisa = { ...prev };
      (Object.keys(field) as (keyof IsianLayanan)[]).forEach((k) => KUNCI_SALAH[k] && delete sisa[KUNCI_SALAH[k]!]);
      return sisa;
    });
  };
  const hargaAngka = Number(isian.harga.replace(/\D/g, ''));

  const ubahFotos = (fn: (lama: FotoLayananSchema[]) => FotoLayananSchema[]) =>
    setIsian((prev) => ({ ...prev, fotos: fn(prev.fotos) }));

  const ubahBaris = (i: number, field: 'bagian' | 'bahan', nilai: string) =>
    ubah({ bahan: isian.bahan.map((b, idx) => (idx === i ? { ...b, [field]: nilai } : b)) });

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasilPeriksa = periksaIsian(isian);
    setSalah(hasilPeriksa);
    if (Object.keys(hasilPeriksa).length > 0) {
      // Fokus ke kolom salah pertama supaya pengguna keyboard dan pembaca layar langsung tahu.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setMenyimpan(true);
    const pesanGagal = await onSimpan(terapkanIsian(service, isian));
    setMenyimpan(false);
    setGagal(pesanGagal ?? '');
  };

  const pesanSalah = (nama: keyof KesalahanIsian) =>
    salah[nama] ? (
      <p id={id(`${nama}-salah`)} className="text-sm font-semibold text-tinta">
        {salah[nama]}
      </p>
    ) : null;

  const deskripsi = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;

  return (
    <form ref={formRef} id={idForm} onSubmit={kirim} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor={id('nama')} className={kelasLabel}>
          Nama layanan
        </label>
        <input
          id={id('nama')}
          type="text"
          value={isian.title}
          onChange={(e) => ubah({ title: e.target.value })}
          aria-invalid={Boolean(salah.title)}
          aria-describedby={deskripsi(salah.title && id('title-salah'))}
          className={kelasKolom(Boolean(salah.title))}
        />
        {pesanSalah('title')}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id('keterangan')} className={kelasLabel}>
          Keterangan singkat
        </label>
        <p id={id('keterangan-bantuan')} className={kelasBantuan}>
          Satu kalimat yang tampil di bawah nama layanan.
        </p>
        <textarea
          id={id('keterangan')}
          rows={2}
          value={isian.shortDescription}
          onChange={(e) => ubah({ shortDescription: e.target.value })}
          aria-describedby={id('keterangan-bantuan')}
          className={`${kelasKolom()} py-2.5`}
        />
      </div>

      <KelolaFoto serviceId={service.id} idDasar={id('foto')} fotos={isian.fotos} ubahFotos={ubahFotos} />

      <div className="flex items-start gap-3">
        <input
          id={id('kartu-besar')}
          type="checkbox"
          checked={isian.featured}
          onChange={(e) => ubah({ featured: e.target.checked })}
          aria-describedby={id('kartu-besar-bantuan')}
          className="mt-3 h-5 w-5 shrink-0 accent-hutan"
        />
        <div>
          <label htmlFor={id('kartu-besar')} className="flex items-center min-h-[44px] text-sm font-semibold text-tinta cursor-pointer">
            Tampil sebagai kartu besar di website
          </label>
          <p id={id('kartu-besar-bantuan')} className={kelasBantuan}>
            Foto cuma tampil di kartu besar. Tanpa centang, layanan masuk daftar &ldquo;Layanan lain&rdquo; tanpa foto.
          </p>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className={kelasLabel}>Dihitung per</legend>
        <div className="flex flex-col sm:flex-row gap-2">
          {CARA_UKUR.map((opsi) => (
            <label
              key={opsi.value}
              className="flex items-center gap-2.5 min-h-[44px] px-3 rounded-lg border border-tinta-batas bg-white cursor-pointer has-[:checked]:border-2 has-[:checked]:border-hutan"
            >
              <input
                type="radio"
                name={id('cara-ukur')}
                value={opsi.value}
                checked={isian.measurementType === opsi.value}
                onChange={() => ubah({ measurementType: opsi.value })}
                className="h-4 w-4 accent-hutan"
              />
              <span className="text-tinta">{opsi.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={id('harga')} className={kelasLabel}>
          Harga borongan per {satuan} (Rp)
        </label>
        <p id={id('harga-bantuan')} className={kelasBantuan}>
          Sudah termasuk bahan, rangka, upah pasang, dan finishing. Ketik angkanya saja.
        </p>
        <input
          id={id('harga')}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={isian.harga}
          onChange={(e) => ubah({ harga: e.target.value.replace(/[^\d.]/g, '') })}
          aria-invalid={Boolean(salah.harga)}
          aria-describedby={deskripsi(id('harga-bantuan'), hargaAngka > 0 && id('harga-tampil'), salah.harga && id('harga-salah'))}
          className={`${kelasKolom(Boolean(salah.harga))} font-heading text-lg`}
        />
        {/* Angka yang nanti dibaca pelanggan, biar salah ketik nol kelihatan sebelum disimpan. */}
        {hargaAngka > 0 && (
          <p id={id('harga-tampil')} className="text-sm text-tinta-lembut">
            Tampil di website:{' '}
            <span className="font-heading text-base font-semibold text-amber-gelap">
              {formatRupiah(hargaAngka)} / {satuan}
            </span>
          </p>
        )}
        {pesanSalah('harga')}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id('minimum')} className={kelasLabel}>
          Minimum pengerjaan ({satuan})
        </label>
        <p id={id('minimum-bantuan')} className={kelasBantuan}>
          Kosongkan kalau nggak ada minimum.
        </p>
        <input
          id={id('minimum')}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={isian.minimum}
          onChange={(e) => ubah({ minimum: e.target.value.replace(/\D/g, '') })}
          aria-invalid={Boolean(salah.minimum)}
          aria-describedby={deskripsi(id('minimum-bantuan'), salah.minimum && id('minimum-salah'))}
          className={`${kelasKolom(Boolean(salah.minimum))} sm:max-w-[12rem]`}
        />
        {pesanSalah('minimum')}
      </div>

      <fieldset className="space-y-2" aria-describedby={deskripsi(id('lama-bantuan'), salah.lama && id('lama-salah'))}>
        <legend className={kelasLabel}>Lama pengerjaan</legend>
        <p id={id('lama-bantuan')} className={kelasBantuan}>
          Dalam hari kerja. Kosongkan dua-duanya kalau belum tahu.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div className="space-y-1">
            <label htmlFor={id('hari-min')} className="block text-sm text-tinta">
              Paling cepat
            </label>
            <input
              id={id('hari-min')}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={isian.hariMin}
              onChange={(e) => ubah({ hariMin: e.target.value.replace(/\D/g, '') })}
              aria-invalid={Boolean(salah.lama)}
              className={kelasKolom(Boolean(salah.lama))}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={id('hari-max')} className="block text-sm text-tinta">
              Paling lama
            </label>
            <input
              id={id('hari-max')}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={isian.hariMax}
              onChange={(e) => ubah({ hariMax: e.target.value.replace(/\D/g, '') })}
              aria-invalid={Boolean(salah.lama)}
              className={kelasKolom(Boolean(salah.lama))}
            />
          </div>
        </div>
        {pesanSalah('lama')}
      </fieldset>

      <fieldset className="space-y-3" aria-describedby={deskripsi(id('bahan-bantuan'), salah.bahan && id('bahan-salah'))}>
        <legend className={kelasLabel}>Bahan standar</legend>
        <p id={id('bahan-bantuan')} className={kelasBantuan}>
          Bahan yang dipakai di harga borongan. Pelanggan yang mau bahan lain bisa tanya lewat WhatsApp.
        </p>

        <ul className="space-y-3">
          {isian.bahan.map((baris, i) => {
            const setengah = Boolean(salah.bahan) && Boolean(baris.bagian.trim()) !== Boolean(baris.bahan.trim());
            return (
              <li
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[10rem_1fr_auto] gap-2 sm:items-end p-3 sm:p-0 rounded-lg border border-kertas-garis sm:border-0"
              >
                <div className="space-y-1">
                  <label htmlFor={id(`bagian-${i}`)} className="block text-sm text-tinta">
                    Bagian
                  </label>
                  <input
                    id={id(`bagian-${i}`)}
                    type="text"
                    value={baris.bagian}
                    onChange={(e) => ubahBaris(i, 'bagian', e.target.value)}
                    aria-invalid={setengah && !baris.bagian.trim()}
                    className={kelasKolom(setengah && !baris.bagian.trim())}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={id(`bahan-${i}`)} className="block text-sm text-tinta">
                    Bahan
                  </label>
                  <input
                    id={id(`bahan-${i}`)}
                    type="text"
                    value={baris.bahan}
                    onChange={(e) => ubahBaris(i, 'bahan', e.target.value)}
                    aria-invalid={setengah && !baris.bahan.trim()}
                    className={kelasKolom(setengah && !baris.bahan.trim())}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => ubah({ bahan: isian.bahan.filter((_, idx) => idx !== i) })}
                  className={kelasTombolKedua}
                  aria-label={`Hapus baris bahan ${i + 1}`}
                >
                  Hapus
                </button>
              </li>
            );
          })}
        </ul>

        {pesanSalah('bahan')}

        <button
          type="button"
          onClick={() => ubah({ bahan: [...isian.bahan, { bagian: '', bahan: '' }] })}
          className={kelasTombolKedua}
        >
          Tambah baris bahan
        </button>
      </fieldset>

      {gagal && (
        <p role="alert" className="text-sm font-semibold text-tinta bg-kertas-dalam rounded-lg p-3">
          {gagal}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-kertas-garis">
        <button type="submit" disabled={menyimpan} className={`${kelasTombolUtama} disabled:opacity-60`}>
          {menyimpan ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button type="button" onClick={onBatal} className={kelasTombolKedua}>
          Batal
        </button>
      </div>
    </form>
  );
}
