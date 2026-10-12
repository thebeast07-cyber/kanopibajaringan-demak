'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FotoLayananSchema, ServiceSchema } from '../../../types/domain';
import { KelolaFoto } from './KelolaFoto';
import { PratinjauKartu } from './PratinjauKartu';
import { formatRupiah } from '../../../lib/whatsapp';
import { useStatusSimpan } from '../../../lib/cms/sinkronServer';
import {
  CaraUkur,
  IsianLayanan,
  KesalahanIsian,
  SATUAN,
  daftarKolomKosong,
  isianDariLayanan,
  periksaIsian,
  terapkanIsian,
} from '../../../lib/cms/isiDataLayanan';
import {
  kelasBantuan,
  kelasJudulKartu,
  kelasKartu,
  kelasKolom,
  kelasLabel,
  kelasTombolKedua,
  kelasTombolUtama,
} from '../gaya';

const CARA_UKUR: { value: CaraUkur; label: string; bantuan: string }[] = [
  { value: 'm2', label: 'm²', bantuan: 'Pelanggan isi panjang × lebar.' },
  { value: 'meter', label: 'meter', bantuan: 'Pelanggan isi panjang saja.' },
  { value: 'unit', label: 'unit', bantuan: 'Pelanggan isi jumlah.' },
];

type IdBagian = 'harga' | 'bahan' | 'foto' | 'info' | 'tampilan';
const NAMA_BAGIAN: Record<IdBagian, string> = {
  harga: 'Harga',
  bahan: 'Bahan',
  foto: 'Foto',
  info: 'Info',
  tampilan: 'Tampilan',
};

function isianAwal(service: ServiceSchema): IsianLayanan {
  const awal = isianDariLayanan(service);
  // Satu baris kosong biar langsung bisa diketik, bukan contoh isian.
  return awal.bahan.length ? awal : { ...awal, bahan: [{ bagian: '', bahan: '' }] };
}

function Saklar({
  id,
  nyala,
  onUbah,
  judul,
  bantuan,
}: {
  id: string;
  nyala: boolean;
  onUbah: (nyala: boolean) => void;
  judul: string;
  bantuan: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={nyala}
      onClick={() => onUbah(!nyala)}
      className="w-full flex items-center justify-between gap-4 min-h-[64px] py-2 text-left"
    >
      <span className="space-y-0.5">
        <span className="block text-[15px] font-semibold text-tinta">{judul}</span>
        <span className={`block ${kelasBantuan}`}>{bantuan}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${nyala ? 'bg-navy' : 'bg-tinta-batas'}`}
      >
        <span
          className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-[left] ${
            nyala ? 'left-[23px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  );
}

interface FormLayananProps {
  service: ServiceSchema;
  baru: boolean;
  namaUsaha: string;
  whatsappNumber: string;
  /** Kembalikan pesan gagal, atau null kalau tersimpan. */
  onSimpan: (service: ServiceSchema) => Promise<string | null>;
}

export function FormLayanan({ service, baru, namaUsaha, whatsappNumber, onSimpan }: FormLayananProps) {
  const [awal, setAwal] = useState<IsianLayanan>(() => isianAwal(service));
  const [isian, setIsian] = useState<IsianLayanan>(awal);
  const [salah, setSalah] = useState<KesalahanIsian>({});
  const [gagal, setGagal] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const [lihatHasil, setLihatHasil] = useState(false);
  const [bagianAktif, setBagianAktif] = useState<IdBagian>(baru ? 'info' : 'harga');
  // Versi yang terakhir tersimpan, buat baris status di atas form.
  const [terakhir, setTerakhir] = useState<ServiceSchema | null>(baru ? null : service);
  const formRef = useRef<HTMLFormElement>(null);
  // Konflik: server sudah punya simpanan lebih baru. Simpan dimatikan sampai halaman dimuat ulang.
  const statusSimpan = useStatusSimpan();
  const konflik = statusSimpan.keadaan === 'konflik';
  const tombolLihatRef = useRef<HTMLButtonElement>(null);

  const berubah = JSON.stringify(isian) !== JSON.stringify(awal);
  const satuan = SATUAN[isian.measurementType];
  const hargaAngka = Number(isian.harga.replace(/\D/g, ''));
  const adaSalah = Object.keys(salah).length > 0;
  // Layanan baru: nama dulu, karena itu satu-satunya yang wajib. Layanan lama: harga dulu,
  // karena itu yang paling sering diganti.
  const urutan: IdBagian[] = baru ? ['info', 'harga', 'bahan', 'foto', 'tampilan'] : ['harga', 'bahan', 'foto', 'info', 'tampilan'];

  // Peringatan bawaan browser kalau HP ditutup atau tab di-refresh sebelum disimpan.
  useEffect(() => {
    if (!berubah) return;
    const tahan = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', tahan);
    return () => window.removeEventListener('beforeunload', tahan);
  }, [berubah]);

  // Tombol bagian di atas ikut menyala sesuai bagian yang sedang dibaca.
  useEffect(() => {
    const amati = new IntersectionObserver(
      (entri) => {
        const terlihat = entri.filter((e) => e.isIntersecting).map((e) => e.target.id as IdBagian);
        if (terlihat.length) setBagianAktif(terlihat[0]);
      },
      { rootMargin: '-130px 0px -55% 0px' }
    );
    urutan.forEach((id) => {
      const el = document.getElementById(id);
      if (el) amati.observe(el);
    });
    return () => amati.disconnect();
    // urutan cuma bergantung pada `baru`, yang tidak berubah selama halaman terbuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baru]);

  // Pesan salah hilang begitu kolomnya diubah, tidak perlu menunggu Simpan ditekan lagi.
  const KUNCI_SALAH: Partial<Record<keyof IsianLayanan, keyof KesalahanIsian>> = {
    title: 'title', harga: 'harga', minimum: 'minimum', hariMin: 'lama', hariMax: 'lama', bahan: 'bahan',
  };
  const ubah = (field: Partial<IsianLayanan>) => {
    setTersimpan(false);
    setIsian((prev) => ({ ...prev, ...field }));
    setSalah((prev) => {
      const sisa = { ...prev };
      (Object.keys(field) as (keyof IsianLayanan)[]).forEach((k) => KUNCI_SALAH[k] && delete sisa[KUNCI_SALAH[k]!]);
      return sisa;
    });
  };

  const ubahFotos = (fn: (lama: FotoLayananSchema[]) => FotoLayananSchema[]) => {
    setTersimpan(false);
    setIsian((prev) => ({ ...prev, fotos: fn(prev.fotos) }));
  };

  const ubahBaris = (i: number, field: 'bagian' | 'bahan', nilai: string) =>
    ubah({ bahan: isian.bahan.map((b, idx) => (idx === i ? { ...b, [field]: nilai } : b)) });

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasilPeriksa = periksaIsian(isian);
    setSalah(hasilPeriksa);
    if (Object.keys(hasilPeriksa).length > 0) {
      // Fokus ke kolom salah pertama supaya pengguna keyboard dan pembaca layar langsung tahu.
      requestAnimationFrame(() => {
        const kolom = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        kolom?.scrollIntoView({ block: 'center' });
        kolom?.focus({ preventScroll: true });
      });
      return;
    }
    setMenyimpan(true);
    setGagal('');
    const hasil = terapkanIsian(service, isian);
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

  const tutupHasil = () => {
    setLihatHasil(false);
    requestAnimationFrame(() => tombolLihatRef.current?.focus());
  };

  const keluar = (e: React.MouseEvent) => {
    if (berubah && !window.confirm('Perubahan belum disimpan. Tetap keluar?')) e.preventDefault();
  };

  const id = (nama: string) => `ubah-${nama}`;
  const deskripsi = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;
  const pesanSalah = (nama: keyof KesalahanIsian) =>
    salah[nama] ? (
      <p id={id(`${nama}-salah`)} className="text-sm font-semibold text-tinta">
        {salah[nama]}
      </p>
    ) : null;

  const kosong = terakhir ? daftarKolomKosong(terakhir) : '';
  const keteranganStatus = !terakhir
    ? 'Belum tersimpan.'
    : `${kosong ? `Belum lengkap: ${kosong}.` : 'Lengkap.'} ${
        terakhir.status === 'active' ? 'Tampil di website.' : 'Disembunyikan dari website.'
      }`;

  const teksBar = menyimpan
    ? 'Menyimpan...'
    : adaSalah
    ? 'Ada isian yang perlu dibetulin. Lihat tanda di atas.'
    : tersimpan && !berubah
    ? 'Tersimpan. Website sudah pakai data barunya.'
    : berubah
    ? 'Ada perubahan belum disimpan.'
    : !terakhir
    ? 'Isi nama layanan dulu, sisanya boleh menyusul.'
    : 'Belum ada perubahan.';

  const bagian: Record<IdBagian, React.ReactNode> = {
    harga: (
      <>
        <h2 className={kelasJudulKartu}>Harga borongan</h2>

        <fieldset className="space-y-2">
          <legend className={kelasLabel}>Dihitung per</legend>
          <div className="grid grid-cols-3 gap-[3px] bg-kertas-dalam rounded-xl p-[3px]">
            {CARA_UKUR.map((opsi) => (
              <label
                key={opsi.value}
                className="flex items-center justify-center min-h-[44px] rounded-lg text-[15px] font-semibold cursor-pointer text-tinta-lembut has-[:checked]:bg-white has-[:checked]:text-navy has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy"
              >
                <input
                  type="radio"
                  name={id('cara-ukur')}
                  value={opsi.value}
                  checked={isian.measurementType === opsi.value}
                  onChange={() => ubah({ measurementType: opsi.value })}
                  className="sr-only"
                />
                {opsi.label}
              </label>
            ))}
          </div>
          <p className={kelasBantuan}>{CARA_UKUR.find((c) => c.value === isian.measurementType)?.bantuan}</p>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor={id('harga')} className={kelasLabel}>
            Harga per {satuan}
          </label>
          <p id={id('harga-bantuan')} className={kelasBantuan}>
            Sudah termasuk bahan, rangka, upah pasang, dan finishing. Kosongkan kalau belum mau ditampilkan.
          </p>
          <div
            className={`flex items-center gap-2 px-3.5 rounded-xl bg-white min-h-[52px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy ${
              salah.harga ? 'border-2 border-tinta' : 'border border-tinta-batas'
            }`}
          >
            <span className="text-tinta-lembut" aria-hidden="true">
              Rp
            </span>
            <input
              id={id('harga')}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={isian.harga}
              onChange={(e) => ubah({ harga: e.target.value.replace(/[^\d.]/g, '') })}
              aria-invalid={Boolean(salah.harga)}
              aria-describedby={deskripsi(id('harga-bantuan'), hargaAngka > 0 && id('harga-tampil'), salah.harga && id('harga-salah'))}
              className="flex-1 min-w-0 bg-transparent font-heading text-xl font-bold text-tinta focus:outline-none"
            />
          </div>
          {/* Angka yang nanti dibaca pelanggan, biar salah ketik nol kelihatan sebelum disimpan. */}
          {hargaAngka > 0 && (
            <p id={id('harga-tampil')} className="text-[13px] text-tinta-lembut">
              Di website tampil:{' '}
              <span className="font-heading text-base font-bold text-oranye-gelap">
                {formatRupiah(hargaAngka)} / {satuan}
              </span>
            </p>
          )}
          {pesanSalah('harga')}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={id('minimum')} className={kelasLabel}>
            Minimal ditagih <span className="font-normal text-tinta-lembut">(boleh kosong)</span>
          </label>
          <div
            className={`flex items-center gap-2 px-3.5 rounded-xl bg-white min-h-[52px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy ${
              salah.minimum ? 'border-2 border-tinta' : 'border border-tinta-batas'
            }`}
          >
            <input
              id={id('minimum')}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={isian.minimum}
              onChange={(e) => ubah({ minimum: e.target.value.replace(/\D/g, '') })}
              aria-invalid={Boolean(salah.minimum)}
              aria-describedby={deskripsi(isian.minimum && id('minimum-bantuan'), salah.minimum && id('minimum-salah'))}
              className="flex-1 min-w-0 bg-transparent text-[17px] font-semibold text-tinta focus:outline-none"
            />
            <span className="text-tinta-lembut">{satuan}</span>
          </div>
          {isian.minimum && Number(isian.minimum) > 0 && (
            <p id={id('minimum-bantuan')} className={kelasBantuan}>
              Ukuran di bawah ini tetap ditagih {isian.minimum} {satuan}.
            </p>
          )}
          {pesanSalah('minimum')}
        </div>

        <fieldset className="space-y-1.5" aria-describedby={deskripsi(id('lama-bantuan'), salah.lama && id('lama-salah'))}>
          <legend className={kelasLabel}>
            Lama pengerjaan <span className="font-normal text-tinta-lembut">(boleh kosong)</span>
          </legend>
          <p id={id('lama-bantuan')} className={kelasBantuan}>
            Dalam hari kerja. Website menulisnya sebagai perkiraan yang dipastikan setelah survei.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {(['hariMin', 'hariMax'] as const).map((kolom) => (
              <div key={kolom} className="space-y-1">
                <label htmlFor={id(kolom)} className="block text-sm text-tinta">
                  {kolom === 'hariMin' ? 'Paling cepat' : 'Paling lama'}
                </label>
                <div
                  className={`flex items-center gap-2 px-3 rounded-xl bg-white min-h-[50px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy ${
                    salah.lama ? 'border-2 border-tinta' : 'border border-tinta-batas'
                  }`}
                >
                  <input
                    id={id(kolom)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={isian[kolom]}
                    onChange={(e) => ubah({ [kolom]: e.target.value.replace(/\D/g, '') })}
                    aria-invalid={Boolean(salah.lama)}
                    className="flex-1 min-w-0 bg-transparent text-base font-semibold text-tinta focus:outline-none"
                  />
                  <span className="text-sm text-tinta-lembut">hari</span>
                </div>
              </div>
            ))}
          </div>
          {pesanSalah('lama')}
        </fieldset>
      </>
    ),

    bahan: (
      <fieldset className="space-y-3" aria-describedby={deskripsi(id('bahan-bantuan'), salah.bahan && id('bahan-salah'))}>
        <legend className={`${kelasJudulKartu} mb-1`}>Bahan standar</legend>
        <p id={id('bahan-bantuan')} className={kelasBantuan}>
          Yang sudah termasuk di harga. Bahan lain tetap bisa diminta pelanggan lewat WhatsApp.
        </p>
        <ul className="space-y-2.5">
          {isian.bahan.map((baris, i) => {
            const setengah = Boolean(salah.bahan) && Boolean(baris.bagian.trim()) !== Boolean(baris.bahan.trim());
            return (
              <li key={i} className="flex gap-2 items-end">
                <div className="w-28 shrink-0 space-y-1">
                  <label htmlFor={id(`bagian-${i}`)} className="block text-[13px] text-tinta-lembut">
                    Bagian
                  </label>
                  <input
                    id={id(`bagian-${i}`)}
                    type="text"
                    value={baris.bagian}
                    placeholder="mis. Atap"
                    onChange={(e) => ubahBaris(i, 'bagian', e.target.value)}
                    aria-invalid={setengah && !baris.bagian.trim()}
                    className={`${kelasKolom(setengah && !baris.bagian.trim())} min-h-[48px] font-semibold placeholder:font-normal placeholder:text-tinta-samar`}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <label htmlFor={id(`bahan-${i}`)} className="block text-[13px] text-tinta-lembut">
                    Bahan
                  </label>
                  <input
                    id={id(`bahan-${i}`)}
                    type="text"
                    value={baris.bahan}
                    onChange={(e) => ubahBaris(i, 'bahan', e.target.value)}
                    aria-invalid={setengah && !baris.bahan.trim()}
                    className={`${kelasKolom(setengah && !baris.bahan.trim())} min-h-[48px]`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => ubah({ bahan: isian.bahan.filter((_, idx) => idx !== i) })}
                  className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-kertas-dalam hover:bg-kertas-garis text-tinta-lembut"
                  aria-label={`Hapus baris bahan ${i + 1}${baris.bagian ? ` (${baris.bagian})` : ''}`}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 4 L14 14 M14 4 L4 14" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        {pesanSalah('bahan')}
        <button
          type="button"
          onClick={() => ubah({ bahan: [...isian.bahan, { bagian: '', bahan: '' }] })}
          className="inline-flex items-center min-h-[44px] px-4 rounded-lg border border-dashed border-tinta-batas bg-white text-navy text-sm font-semibold hover:bg-kertas-dalam"
        >
          Tambah bahan
        </button>
      </fieldset>
    ),

    foto: (
      <>
        <h2 className={kelasJudulKartu}>Foto</h2>
        <KelolaFoto serviceId={service.id} idDasar={id('foto')} fotos={isian.fotos} ubahFotos={ubahFotos} />
      </>
    ),

    info: (
      <>
        <h2 className={kelasJudulKartu}>Info</h2>
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
          <textarea
            id={id('keterangan')}
            rows={3}
            value={isian.shortDescription}
            placeholder="Satu-dua kalimat buat pelanggan, misalnya cocok buat apa."
            onChange={(e) => ubah({ shortDescription: e.target.value })}
            className={`${kelasKolom()} py-3 leading-relaxed placeholder:text-tinta-samar`}
          />
        </div>
      </>
    ),

    tampilan: (
      <>
        <h2 className={kelasJudulKartu}>Tampilan</h2>
        <div className="divide-y divide-kertas-garis">
          <Saklar
            id={id('tampil')}
            nyala={isian.tampil}
            onUbah={(v) => ubah({ tampil: v })}
            judul="Tampilkan di website"
            bantuan="Matikan kalau layanan ini lagi nggak dikerjakan. Datanya tetap tersimpan."
          />
          <Saklar
            id={id('kartu-besar')}
            nyala={isian.featured}
            onUbah={(v) => ubah({ featured: v })}
            judul="Kartu besar di halaman depan"
            bantuan="Kartu besar pakai galeri foto. Kalau dimatikan, layanan masuk daftar “Layanan lain” tanpa foto."
          />
        </div>
      </>
    ),
  };

  return (
    <>
      <div className="-mt-5 -mx-4 bg-white border-b border-kertas-garis px-1.5">
        <Link
          href="/admin/layanan"
          onClick={keluar}
          className="inline-flex items-center gap-1 min-h-[48px] px-2.5 text-[15px] font-semibold text-navy"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5 L7 10 L12 15" />
          </svg>
          Layanan
        </Link>
      </div>

      <nav
        aria-label="Bagian isian"
        className="sticky top-[60px] z-20 -mx-4 px-3 py-1.5 bg-white border-b border-kertas-garis flex gap-1.5 overflow-x-auto"
      >
        {urutan.map((b) => (
          <a
            key={b}
            href={`#${b}`}
            aria-current={bagianAktif === b ? 'location' : undefined}
            onClick={() => setBagianAktif(b)}
            className={`inline-flex items-center min-h-[44px] px-3 rounded-lg text-sm font-semibold whitespace-nowrap ${
              bagianAktif === b ? 'bg-navy text-white' : 'text-tinta hover:bg-kertas-dalam'
            }`}
          >
            {NAMA_BAGIAN[b]}
          </a>
        ))}
      </nav>

      <div className="space-y-1 pt-1">
        <h1 className="font-heading text-2xl leading-snug font-bold text-navy">
          {terakhir?.title || isian.title.trim() || 'Layanan baru'}
        </h1>
        <p className="text-sm text-tinta-lembut">{keteranganStatus}</p>
      </div>

      <form ref={formRef} id="form-layanan" onSubmit={kirim} noValidate className="space-y-4">
        {urutan.map((b) => (
          <section key={b} id={b} className={`${kelasKartu} p-4 space-y-4 scroll-mt-32`}>
            {bagian[b]}
          </section>
        ))}
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
            <div className="grid grid-cols-2 gap-2.5">
              <button ref={tombolLihatRef} type="button" onClick={() => setLihatHasil(true)} className={kelasTombolKedua}>
                Lihat hasil
              </button>
              <button
                type="submit"
                form="form-layanan"
                disabled={menyimpan || (!berubah && !gagal)}
                className={kelasTombolUtama}
              >
                {menyimpan ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          )}
        </div>
      </div>

      {lihatHasil && (
        <PratinjauKartu
          service={terapkanIsian(service, isian)}
          belumDisimpan={berubah}
          namaUsaha={namaUsaha}
          whatsappNumber={whatsappNumber}
          onTutup={tutupHasil}
        />
      )}
    </>
  );
}
