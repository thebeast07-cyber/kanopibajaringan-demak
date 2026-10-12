'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FotoLayananSchema, ProyekGaleriSchema, ServiceSchema } from '../../../types/domain';
import { KelolaFoto } from '../layanan/KelolaFoto';
import { Saklar } from '../Saklar';
import { TombolSalin } from '../TombolSalin';
import { useStatusSimpan } from '../../../lib/cms/sinkronServer';
import {
  IsianProyek,
  KesalahanProyek,
  isianDariProyek,
  periksaProyek,
  ringkasProyek,
  terapkanProyek,
} from '../../../lib/cms/galeri';
import {
  kelasBantuan,
  kelasJudulKartu,
  kelasKartu,
  kelasKolom,
  kelasLabel,
  kelasTombolKedua,
  kelasTombolTipis,
  kelasTombolUtama,
} from '../gaya';

interface FormProyekProps {
  proyek: ProyekGaleriSchema;
  baru: boolean;
  layanan: ServiceSchema[];
  /** Kembalikan pesan gagal, atau null kalau tersimpan. */
  onSimpan: (proyek: ProyekGaleriSchema) => Promise<string | null>;
  onHapus: () => Promise<string | null>;
}

const bulanIni = () => new Date().toISOString().slice(0, 7);

export function FormProyek({ proyek, baru, layanan, onSimpan, onHapus }: FormProyekProps) {
  const [awal, setAwal] = useState<IsianProyek>(() => isianDariProyek(proyek));
  const [isian, setIsian] = useState<IsianProyek>(awal);
  const [salah, setSalah] = useState<KesalahanProyek>({});
  const [gagal, setGagal] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  // Versi yang terakhir tersimpan, buat baris status dan link halaman proyek.
  const [terakhir, setTerakhir] = useState<ProyekGaleriSchema | null>(baru ? null : proyek);
  const [asal, setAsal] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const statusSimpan = useStatusSimpan();
  const konflik = statusSimpan.keadaan === 'konflik';

  const berubah = JSON.stringify(isian) !== JSON.stringify(awal);
  const adaSalah = Object.keys(salah).length > 0;

  useEffect(() => setAsal(window.location.origin), []);

  useEffect(() => {
    if (!berubah) return;
    const tahan = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', tahan);
    return () => window.removeEventListener('beforeunload', tahan);
  }, [berubah]);

  const ubah = (field: Partial<IsianProyek>) => {
    setTersimpan(false);
    setIsian((prev) => ({ ...prev, ...field }));
    setSalah((prev) => {
      const sisa = { ...prev };
      (Object.keys(field) as (keyof KesalahanProyek)[]).forEach((k) => delete sisa[k]);
      return sisa;
    });
  };

  const ubahFotos = (fn: (lama: FotoLayananSchema[]) => FotoLayananSchema[]) => {
    setTersimpan(false);
    setIsian((prev) => ({ ...prev, fotos: fn(prev.fotos) }));
    setSalah(({ fotos: _, ...sisa }) => sisa);
  };

  // Pilih layanan: nama produk ikut terisi, selama pemilik belum menulis nama sendiri.
  const pilihLayanan = (serviceId: string) => {
    const lama = layanan.find((s) => s.id === isian.serviceId)?.title ?? '';
    const judulMasihBawaan = !isian.judul.trim() || isian.judul.trim() === lama;
    const baruTitle = layanan.find((s) => s.id === serviceId)?.title ?? '';
    ubah(judulMasihBawaan && baruTitle ? { serviceId, judul: baruTitle } : { serviceId });
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasilPeriksa = periksaProyek(isian);
    setSalah(hasilPeriksa);
    if (Object.keys(hasilPeriksa).length > 0) {
      requestAnimationFrame(() => {
        const kolom = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-salah="true"]');
        kolom?.scrollIntoView({ block: 'center' });
        kolom?.focus({ preventScroll: true });
      });
      return;
    }
    setMenyimpan(true);
    setGagal('');
    const hasil = terapkanProyek(proyek, isian);
    const pesanGagal = await onSimpan(hasil);
    setMenyimpan(false);
    if (pesanGagal) {
      setGagal(pesanGagal);
    } else {
      setAwal(isian);
      setTerakhir(hasil);
      setTersimpan(true);
    }
  };

  const hapus = async () => {
    if (!window.confirm('Hapus proyek ini dari galeri? Foto-fotonya ikut terhapus.')) return;
    setMenyimpan(true);
    setGagal('');
    const pesanGagal = await onHapus();
    setMenyimpan(false);
    if (pesanGagal) setGagal(pesanGagal);
  };

  const keluar = (e: React.MouseEvent) => {
    if (berubah && !window.confirm('Perubahan belum disimpan. Tetap keluar?')) e.preventDefault();
  };

  const id = (nama: string) => `proyek-${nama}`;
  const deskripsi = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;
  const pesanSalah = (nama: keyof KesalahanProyek) =>
    salah[nama] ? (
      <p id={id(`${nama}-salah`)} className="text-sm font-semibold text-tinta">
        {salah[nama]}
      </p>
    ) : null;

  const tampilDiWebsite = Boolean(terakhir?.tampil && terakhir.fotos.length > 0);
  const linkProyek = asal && terakhir ? `${asal}/galeri/${terakhir.id}` : '';
  const keteranganStatus = !terakhir
    ? 'Belum tersimpan.'
    : [ringkasProyek(terakhir), tampilDiWebsite ? 'Tampil di website.' : 'Disembunyikan dari website.']
        .filter(Boolean)
        .join(' · ');

  const teksBar = menyimpan
    ? 'Menyimpan...'
    : adaSalah
    ? 'Ada isian yang perlu dibetulin. Lihat tanda di atas.'
    : tersimpan && !berubah
    ? 'Tersimpan. Website sudah pakai data barunya.'
    : berubah
    ? 'Ada perubahan belum disimpan.'
    : !terakhir
    ? 'Foto, nama produk, dan lokasi wajib. Sisanya boleh kosong.'
    : 'Belum ada perubahan.';

  return (
    <>
      <div className="-mt-5 -mx-4 bg-white border-b border-kertas-garis px-1.5">
        <Link
          href="/admin/galeri"
          onClick={keluar}
          className="inline-flex items-center gap-1 min-h-[48px] px-2.5 text-[15px] font-semibold text-navy"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5 L7 10 L12 15" />
          </svg>
          Galeri
        </Link>
      </div>

      <div className="space-y-1 pt-1">
        <h1 className="font-heading text-2xl leading-snug font-bold text-navy">
          {terakhir?.judul || isian.judul.trim() || 'Proyek baru'}
        </h1>
        <p className="text-sm text-tinta-lembut">{keteranganStatus}</p>
      </div>

      {tampilDiWebsite && linkProyek && (
        <div className={`${kelasKartu} p-4 space-y-2`}>
          <p className="text-[15px] font-semibold">Link halaman proyek</p>
          <p className={kelasBantuan}>
            Kirim link ini ke calon pelanggan atau pasang di status WhatsApp. Foto pertama muncul sebagai preview.
          </p>
          <div className="flex flex-wrap gap-2">
            <TombolSalin teks={linkProyek} label="Salin link" className={kelasTombolTipis} />
            <a href={`/galeri/${terakhir!.id}`} target="_blank" rel="noopener noreferrer" className={kelasTombolTipis}>
              Buka halamannya
            </a>
          </div>
        </div>
      )}

      <form ref={formRef} id="form-proyek" onSubmit={kirim} noValidate className="space-y-4">
        <section className={`${kelasKartu} p-4 space-y-4`}>
          <h2 className={kelasJudulKartu}>Foto pemasangan</h2>
          {/* Penanda salah buat fokus otomatis: kalau foto kosong, layar diarahkan ke sini. */}
          <div tabIndex={-1} data-salah={Boolean(salah.fotos)} className="focus:outline-none space-y-3">
            <KelolaFoto serviceId={`galeri-${proyek.id}`} idDasar={id('foto')} fotos={isian.fotos} ubahFotos={ubahFotos} galeri />
            {pesanSalah('fotos')}
          </div>
        </section>

        <section className={`${kelasKartu} p-4 space-y-4`}>
          <h2 className={kelasJudulKartu}>Detail proyek</h2>

          {layanan.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor={id('layanan')} className={kelasLabel}>
                Jenis layanan <span className="font-normal text-tinta-lembut">(boleh kosong)</span>
              </label>
              <select
                id={id('layanan')}
                value={isian.serviceId}
                onChange={(e) => pilihLayanan(e.target.value)}
                aria-describedby={id('layanan-bantuan')}
                className={`${kelasKolom()} appearance-none`}
              >
                <option value="">Tidak dipilih</option>
                {layanan.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <p id={id('layanan-bantuan')} className={kelasBantuan}>
                Buat statistik: kelihatan layanan mana yang paling sering ditanya dari galeri.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor={id('judul')} className={kelasLabel}>
              Nama produk
            </label>
            <input
              id={id('judul')}
              type="text"
              value={isian.judul}
              placeholder="mis. Kanopi Alderon"
              onChange={(e) => ubah({ judul: e.target.value })}
              aria-invalid={Boolean(salah.judul)}
              aria-describedby={deskripsi(id('judul-bantuan'), salah.judul && id('judul-salah'))}
              className={`${kelasKolom(Boolean(salah.judul))} placeholder:text-tinta-samar`}
            />
            <p id={id('judul-bantuan')} className={kelasBantuan}>
              Ikut tertulis di pesan WhatsApp pelanggan.
            </p>
            {pesanSalah('judul')}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={id('lokasi')} className={kelasLabel}>
              Lokasi pemasangan
            </label>
            <input
              id={id('lokasi')}
              type="text"
              value={isian.lokasi}
              placeholder="mis. Sayung, Demak"
              onChange={(e) => ubah({ lokasi: e.target.value })}
              aria-invalid={Boolean(salah.lokasi)}
              aria-describedby={deskripsi(id('lokasi-bantuan'), salah.lokasi && id('lokasi-salah'))}
              className={`${kelasKolom(Boolean(salah.lokasi))} placeholder:text-tinta-samar`}
            />
            <p id={id('lokasi-bantuan')} className={kelasBantuan}>
              Cukup kecamatan dan kota. Jangan tulis alamat rumah pelanggan.
            </p>
            {pesanSalah('lokasi')}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={id('dipasang')} className={kelasLabel}>
              Bulan dipasang <span className="font-normal text-tinta-lembut">(boleh kosong)</span>
            </label>
            <input
              id={id('dipasang')}
              type="month"
              value={isian.dipasang}
              max={bulanIni()}
              onChange={(e) => ubah({ dipasang: e.target.value })}
              aria-invalid={Boolean(salah.dipasang)}
              aria-describedby={deskripsi(salah.dipasang && id('dipasang-salah'))}
              className={kelasKolom(Boolean(salah.dipasang))}
            />
            {pesanSalah('dipasang')}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={id('ukuran')} className={kelasLabel}>
              Ukuran <span className="font-normal text-tinta-lembut">(boleh kosong)</span>
            </label>
            <input
              id={id('ukuran')}
              type="text"
              value={isian.ukuran}
              placeholder="mis. 6 × 4 m"
              onChange={(e) => ubah({ ukuran: e.target.value })}
              className={`${kelasKolom()} placeholder:text-tinta-samar`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={id('keterangan')} className={kelasLabel}>
              Keterangan <span className="font-normal text-tinta-lembut">(boleh kosong)</span>
            </label>
            <textarea
              id={id('keterangan')}
              rows={4}
              value={isian.keterangan}
              placeholder="Bahan yang dipakai, warna, atau cerita singkat pemasangannya."
              onChange={(e) => ubah({ keterangan: e.target.value })}
              className={`${kelasKolom()} py-3 leading-relaxed placeholder:text-tinta-samar`}
            />
          </div>
        </section>

        <section className={`${kelasKartu} p-4 space-y-2`}>
          <h2 className={kelasJudulKartu}>Tampilan</h2>
          <Saklar
            id={id('tampil')}
            nyala={isian.tampil}
            onUbah={(v) => ubah({ tampil: v })}
            judul="Tampilkan di website"
            bantuan="Matikan kalau fotonya belum mau dipamerkan. Datanya tetap tersimpan."
          />
        </section>

        {terakhir && (
          <section className={`${kelasKartu} p-4 space-y-3`}>
            <h2 className={kelasJudulKartu}>Hapus proyek</h2>
            <p className={kelasBantuan}>Proyek dan semua fotonya hilang dari website dan penyimpanan.</p>
            <button type="button" onClick={hapus} disabled={menyimpan || konflik} className={kelasTombolKedua}>
              Hapus proyek ini
            </button>
          </section>
        )}
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-kertas-garis shadow-[0_-6px_16px_rgba(11,45,91,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl mx-auto px-4 pt-2.5 pb-3 space-y-2">
          {konflik ? (
            <p role="alert" className="text-[13px] font-semibold text-tinta">
              {statusSimpan.pesan}
            </p>
          ) : gagal ? (
            <p role="alert" className="text-[13px] font-semibold text-tinta">
              {gagal}
            </p>
          ) : (
            <p role="status" className="text-[13px] text-tinta-lembut">
              {teksBar}
            </p>
          )}
          {konflik ? (
            <button type="button" onClick={() => window.location.reload()} className={`${kelasTombolUtama} w-full`}>
              Muat ulang halaman
            </button>
          ) : (
            <button
              type="submit"
              form="form-proyek"
              disabled={menyimpan || (!berubah && !gagal)}
              className={`${kelasTombolUtama} w-full`}
            >
              {menyimpan ? 'Menyimpan...' : 'Simpan'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
