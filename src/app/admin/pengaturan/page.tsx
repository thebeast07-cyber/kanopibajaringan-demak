'use client';

import React, { useEffect, useRef, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { simpanPengaturan } from '../../../lib/cms/simpanAdmin';
import {
  IsianPengaturan,
  KesalahanPengaturan,
  isianDariConfig,
  nomorWaInternasional,
  periksaPengaturan,
  tambahKota,
  terapkanPengaturan,
} from '../../../lib/cms/pengaturan';
import { LINK_PROMOSI, linkPromosi } from '../../../lib/linkPromosi';
import { TombolSalin } from '../../../components/admin/TombolSalin';
import {
  kelasBantuan,
  kelasJudulHalaman,
  kelasJudulKartu,
  kelasKartu,
  kelasKolom,
  kelasLabel,
  kelasTombolKedua,
  kelasTombolTipis,
  kelasTombolUtama,
} from '../../../components/admin/gaya';

export default function HalamanPengaturan() {
  const [awal, setAwal] = useState<IsianPengaturan>(() => isianDariConfig(defaultCmsRepository.getBusinessConfig()));
  const [isian, setIsian] = useState<IsianPengaturan>(awal);
  const [kotaBaru, setKotaBaru] = useState('');
  const [salah, setSalah] = useState<KesalahanPengaturan>({});
  const [gagal, setGagal] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const berubah = JSON.stringify(isian) !== JSON.stringify(awal);
  const adaSalah = Object.keys(salah).length > 0;
  const nomorSah = nomorWaInternasional(isian.nomorWa);

  useEffect(() => {
    if (!berubah) return;
    const tahan = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', tahan);
    return () => window.removeEventListener('beforeunload', tahan);
  }, [berubah]);

  const ubah = (field: Partial<IsianPengaturan>) => {
    setTersimpan(false);
    setIsian((prev) => ({ ...prev, ...field }));
    setSalah((prev) => {
      const sisa = { ...prev };
      if ('nomorWa' in field) delete sisa.nomorWa;
      if ('kota' in field) delete sisa.kota;
      if ('namaUsaha' in field) delete sisa.namaUsaha;
      return sisa;
    });
  };

  const tambah = () => {
    ubah({ kota: tambahKota(isian.kota, kotaBaru) });
    setKotaBaru('');
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasilPeriksa = periksaPengaturan(isian);
    setSalah(hasilPeriksa);
    if (Object.keys(hasilPeriksa).length > 0) {
      requestAnimationFrame(() => {
        const kolom = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        kolom?.scrollIntoView({ block: 'center' });
        kolom?.focus({ preventScroll: true });
      });
      return;
    }
    setMenyimpan(true);
    setGagal('');
    const pesanGagal = await simpanPengaturan(terapkanPengaturan(defaultCmsRepository.getBusinessConfig(), isian));
    setMenyimpan(false);
    if (pesanGagal) {
      setGagal(pesanGagal);
    } else {
      const rapi = isianDariConfig(defaultCmsRepository.getBusinessConfig());
      setAwal(rapi);
      setIsian(rapi);
      setTersimpan(true);
    }
  };

  const keluar = async () => {
    if (berubah && !window.confirm('Perubahan belum disimpan. Tetap keluar?')) return;
    await fetch('/api/admin/masuk', { method: 'DELETE' }).catch(() => null);
    window.location.assign('/admin/masuk');
  };

  const pesanSalah = (nama: keyof KesalahanPengaturan) =>
    salah[nama] ? (
      <p id={`atur-${nama}-salah`} className="text-sm font-semibold text-tinta">
        {salah[nama]}
      </p>
    ) : null;

  const barTampil = berubah || tersimpan || Boolean(gagal) || adaSalah;
  const teksBar = menyimpan
    ? 'Menyimpan...'
    : adaSalah
    ? 'Ada isian yang perlu dibetulin. Lihat tanda di atas.'
    : tersimpan && !berubah
    ? 'Tersimpan. Website sudah pakai data barunya.'
    : 'Ada perubahan belum disimpan.';

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className={kelasJudulHalaman}>Pengaturan usaha</h1>
        <p className="text-sm text-tinta-lembut leading-relaxed">Yang diganti di sini langsung kepakai di seluruh website.</p>
      </div>

      <form ref={formRef} id="form-pengaturan" onSubmit={kirim} noValidate className="space-y-4">
        <section className={`${kelasKartu} p-4 space-y-2.5`} aria-labelledby="judul-wa">
          <h2 id="judul-wa" className={kelasJudulKartu}>
            WhatsApp
          </h2>
          <label htmlFor="atur-wa" className={kelasLabel}>
            Nomor yang menerima chat
          </label>
          <input
            id="atur-wa"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={isian.nomorWa}
            onChange={(e) => ubah({ nomorWa: e.target.value })}
            aria-invalid={Boolean(salah.nomorWa)}
            aria-describedby={`atur-wa-bantuan${salah.nomorWa ? ' atur-nomorWa-salah' : ''}`}
            className={`${kelasKolom(Boolean(salah.nomorWa))} text-lg font-semibold`}
          />
          <p id="atur-wa-bantuan" className={kelasBantuan}>
            Semua tombol WhatsApp di website mengarah ke nomor ini.
          </p>
          {pesanSalah('nomorWa')}
          {nomorSah && (
            <a
              href={`https://wa.me/${nomorSah}`}
              target="_blank"
              rel="noopener noreferrer"
              className={kelasTombolTipis}
            >
              Coba buka chat ke nomor ini
            </a>
          )}
        </section>

        <section className={`${kelasKartu} p-4 space-y-2.5`} aria-labelledby="judul-kota">
          <h2 id="judul-kota" className={kelasJudulKartu}>
            Kota yang dilayani
          </h2>
          {isian.kota.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {isian.kota.map((k) => (
                <li
                  key={k}
                  className="inline-flex items-center pl-3 rounded-xl border border-kertas-garis bg-kertas-dalam text-[15px] font-semibold"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => ubah({ kota: isian.kota.filter((x) => x !== k) })}
                    aria-label={`Hapus ${k}`}
                    className="inline-flex items-center justify-center w-11 h-11 text-tinta-lembut hover:text-navy"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M3 3 L11 11 M11 3 L3 11" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <label htmlFor="atur-kota-baru" className="sr-only">
              Kota baru
            </label>
            <input
              id="atur-kota-baru"
              type="text"
              value={kotaBaru}
              placeholder="Nama kota"
              onChange={(e) => setKotaBaru(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  tambah();
                }
              }}
              aria-invalid={Boolean(salah.kota)}
              aria-describedby={`atur-kota-bantuan${salah.kota ? ' atur-kota-salah' : ''}`}
              className={`${kelasKolom(Boolean(salah.kota))} flex-1 min-w-0 placeholder:text-tinta-samar`}
            />
            <button type="button" onClick={tambah} disabled={!kotaBaru.trim()} className={kelasTombolKedua}>
              Tambah
            </button>
          </div>
          <p id="atur-kota-bantuan" className={kelasBantuan}>
            Tampil di baris paling atas website, di bagian pembuka, dan di footer.
          </p>
          {pesanSalah('kota')}
        </section>

        <section className={`${kelasKartu} p-4 space-y-3.5`} aria-labelledby="judul-nama">
          <h2 id="judul-nama" className={kelasJudulKartu}>
            Nama dan tagline
          </h2>
          <div className="space-y-1.5">
            <label htmlFor="atur-nama" className={kelasLabel}>
              Nama usaha
            </label>
            <input
              id="atur-nama"
              type="text"
              value={isian.namaUsaha}
              onChange={(e) => ubah({ namaUsaha: e.target.value })}
              aria-invalid={Boolean(salah.namaUsaha)}
              aria-describedby={`atur-nama-bantuan${salah.namaUsaha ? ' atur-namaUsaha-salah' : ''}`}
              className={kelasKolom(Boolean(salah.namaUsaha))}
            />
            <p id="atur-nama-bantuan" className={kelasBantuan}>
              Dipakai di sapaan pesan WhatsApp (“Halo {isian.namaUsaha.trim() || '...'}, ...”) dan di footer. Logo nggak ikut
              berubah.
            </p>
            {pesanSalah('namaUsaha')}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="atur-tagline" className={kelasLabel}>
              Tagline
            </label>
            <input
              id="atur-tagline"
              type="text"
              value={isian.tagline}
              onChange={(e) => ubah({ tagline: e.target.value })}
              aria-describedby="atur-tagline-bantuan"
              className={kelasKolom()}
            />
            <p id="atur-tagline-bantuan" className={kelasBantuan}>
              Muncul di bawah logo dan di footer.
            </p>
          </div>
        </section>

        <section className={`${kelasKartu} p-4 space-y-2`} aria-labelledby="judul-catatan">
          <h2 id="judul-catatan" className={kelasJudulKartu}>
            Catatan soal harga
          </h2>
          <label htmlFor="atur-catatan" className={kelasBantuan}>
            Tampil di footer, di bawah semua harga.
          </label>
          <textarea
            id="atur-catatan"
            rows={4}
            value={isian.catatanHarga}
            onChange={(e) => ubah({ catatanHarga: e.target.value })}
            className={`${kelasKolom()} py-3 leading-relaxed`}
          />
        </section>
      </form>

      <section className={`${kelasKartu} px-4 py-2`} aria-labelledby="judul-promosi">
        <div className="pt-2 pb-1 space-y-1">
          <h2 id="judul-promosi" className={kelasJudulKartu}>
            Link buat promosi
          </h2>
          <p className={kelasBantuan}>
            Pasang link ini di tempat promosi, biar Beranda tahu pengunjung datang dari mana.
          </p>
        </div>
        <ul className="divide-y divide-kertas-garis">
          {LINK_PROMOSI.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
              <span className="pt-2.5 text-[15px]">{l.label}</span>
              <TombolSalin teks={linkPromosi(l.query)} label="Salin link" className={kelasTombolTipis} />
            </li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={keluar} className={kelasTombolTipis}>
        Keluar dari admin
      </button>

      {barTampil && (
        <>
          <div aria-hidden="true" className="h-20" />
          <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 bg-white border-t border-kertas-garis shadow-[0_-6px_16px_rgba(11,45,91,0.08)]">
            <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
              {gagal ? (
                <p role="alert" className="text-[13px] font-semibold text-tinta">
                  {gagal}
                </p>
              ) : (
                <p role="status" className="text-[13px] text-tinta-lembut">
                  {teksBar}
                </p>
              )}
              <button
                type="submit"
                form="form-pengaturan"
                disabled={menyimpan || (!berubah && !gagal)}
                className={`${kelasTombolUtama} shrink-0`}
              >
                {menyimpan ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
