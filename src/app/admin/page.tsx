'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { defaultCmsRepository } from '../../lib/cms/repository';
import { kolomKosong } from '../../lib/cms/isiDataLayanan';
import { ProyekGaleriSchema, ServiceSchema } from '../../types/domain';
import { proyekTampil } from '../../lib/cms/galeri';
import { Asal, LABEL_ASAL, LABEL_SUMBER_WA, LABEL_TUJUAN_LINK, Ringkasan, SumberWa, TujuanLink } from '../../lib/statistik/kejadian';
import { LINK_PROMOSI, linkPromosi } from '../../lib/linkPromosi';
import { TombolSalin } from '../../components/admin/TombolSalin';
import { LogoLoading } from '../../components/brand/LogoLoading';
import { kelasJudulHalaman, kelasKartu } from '../../components/admin/gaya';

type DataStatistik =
  | { keadaan: 'memuat' }
  | { keadaan: 'galat'; pesan: string }
  | { keadaan: 'belum-dipasang' }
  | { keadaan: 'ada'; hari: number; sekarang: Ringkasan; sebelumnya: Ringkasan };

const persen = (bagian: number, dari: number) => (dari > 0 ? Math.round((bagian / dari) * 100) : 0);

function kalimatBanding(sekarang: number, sebelumnya: number, hari: number): string {
  const periode = `${hari} hari sebelumnya`;
  if (sebelumnya === 0) return sekarang === 0 ? `Sama-sama kosong di ${periode}.` : `Di ${periode} belum ada.`;
  if (sekarang === sebelumnya) return `Sama dengan ${periode}.`;
  return `${sekarang > sebelumnya ? 'Naik' : 'Turun'} dari ${sebelumnya} di ${periode}.`;
}

function YangKosong({ layanan, galeri }: { layanan: ServiceSchema[]; galeri: ProyekGaleriSchema[] }) {
  const aktif = layanan.filter((s) => s.status === 'active');
  const jumlahLayanan = (jumlah: number, teks: string, href: string) => ({ jumlah, teks: `${jumlah} layanan ${teks}`, aksi: 'Isi', href });
  const baris = [
    jumlahLayanan(aktif.filter((s) => kolomKosong(s).includes('harga')).length, 'belum ada harga', '/admin/layanan?saring=belum-lengkap'),
    jumlahLayanan(aktif.filter((s) => kolomKosong(s).includes('bahan')).length, 'belum ada bahan standar', '/admin/layanan?saring=belum-lengkap'),
    // Foto cuma tampil di kartu besar, jadi yang dihitung kartu besar saja. Foto tidak masuk
    // syarat "lengkap", jadi link-nya ke semua layanan, bukan saringan belum lengkap.
    jumlahLayanan(aktif.filter((s) => s.featured && !s.fotos?.length).length, 'kartu besar belum ada foto', '/admin/layanan'),
    // Selama galeri kosong, bagiannya tidak tampil di website sama sekali.
    {
      jumlah: proyekTampil(galeri).length === 0 ? 1 : 0,
      teks: 'Galeri belum ada foto proyek',
      aksi: 'Tambah',
      href: '/admin/galeri/baru',
    },
  ].filter((b) => b.jumlah > 0);

  return (
    <section className={`${kelasKartu} px-4 py-2`} aria-labelledby="judul-kosong">
      <h2 id="judul-kosong" className="text-base font-bold pt-2 pb-1">
        Yang masih kosong di website
      </h2>
      {baris.length === 0 ? (
        <p className="py-3 text-[15px] text-tinta">Semua layanan yang tampil sudah lengkap, galeri juga sudah ada isinya.</p>
      ) : (
        <ul className="divide-y divide-kertas-garis">
          {baris.map((b) => (
            <li key={b.teks}>
              <Link
                href={b.href}
                className="flex items-center justify-between gap-3 min-h-[52px] text-[15px] text-tinta hover:text-navy"
              >
                <span>{b.teks}</span>
                <span className="text-sm font-semibold text-navy">{b.aksi}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BarisPeringkat({ label, jumlah, maks, satuan }: { label: string; jumlah: number; maks: number; satuan?: string }) {
  return (
    <li className="space-y-1">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-tinta">{label}</span>
        <span className="font-semibold text-tinta whitespace-nowrap">
          {jumlah}
          {satuan ? ` ${satuan}` : ''}
        </span>
      </div>
      <div className="h-2 rounded bg-kertas-dalam" aria-hidden="true">
        <div className="h-2 rounded bg-navy-muda" style={{ width: `${Math.min(100, Math.max(4, persen(jumlah, maks)))}%` }} />
      </div>
    </li>
  );
}

function Statistik({
  data,
  layanan,
  galeri,
}: {
  data: Extract<DataStatistik, { keadaan: 'ada' }>;
  layanan: ServiceSchema[];
  galeri: ProyekGaleriSchema[];
}) {
  const { sekarang: s, sebelumnya, hari } = data;
  const namaLayanan = (id: string) => layanan.find((l) => l.id === id)?.title ?? 'Layanan yang sudah dihapus';
  const pergi = Math.max(0, s.kunjungan - s.kunjunganBeraksi);
  const klikBerlayanan = s.layananWa.reduce((n, p) => n + p.jumlah, 0);
  const layananWa = [
    ...s.layananWa.map((p) => ({ label: namaLayanan(p.kunci), jumlah: p.jumlah })),
    ...(s.klikWa > klikBerlayanan ? [{ label: 'Tanpa pilih layanan', jumlah: s.klikWa - klikBerlayanan }] : []),
  ].sort((a, b) => b.jumlah - a.jumlah);

  return (
    <>
      <section className="bg-navy rounded-2xl p-5 space-y-1.5" aria-labelledby="judul-klik-wa">
        <h2 id="judul-klik-wa" className="text-[15px] text-navy-kabut font-normal">
          Klik ke WhatsApp, {hari} hari terakhir
        </h2>
        <p className="font-heading text-[64px] leading-none font-bold text-oranye">{s.kunjunganKlikWa}</p>
        <p className="pt-1.5 text-[15px] text-white">{kalimatBanding(s.kunjunganKlikWa, sebelumnya.kunjunganKlikWa, hari)}</p>
        <p className="text-[13px] leading-relaxed text-navy-kabut">
          Dihitung sekali per kunjungan. Yang jadi chat atau deal kelihatannya di WhatsApp.
        </p>
      </section>

      <YangKosong layanan={layanan} galeri={galeri} />

      <section className={`${kelasKartu} p-4 space-y-3.5`} aria-labelledby="judul-alur">
        <h2 id="judul-alur" className="text-base font-bold">
          Dari buka website sampai klik WhatsApp
        </h2>
        <dl className="grid grid-cols-3 gap-2">
          <div>
            <dt className="text-[13px] text-tinta-lembut">Kunjungan</dt>
            <dd className="font-heading text-[28px] font-bold text-navy">{s.kunjungan}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-tinta-lembut">Isi ukuran</dt>
            <dd className="font-heading text-[28px] font-bold text-navy">{s.isiUkuran}</dd>
            <dd className="text-xs text-tinta-samar">{persen(s.isiUkuran, s.kunjungan)}% dari kunjungan</dd>
          </div>
          <div>
            <dt className="text-[13px] text-tinta-lembut">Klik WhatsApp</dt>
            <dd className="font-heading text-[28px] font-bold text-navy">{s.kunjunganKlikWa}</dd>
            <dd className="text-xs text-tinta-samar">{persen(s.kunjunganKlikWa, s.kunjungan)}% dari kunjungan</dd>
          </div>
        </dl>
        {pergi > 0 && (
          <p className="text-sm leading-relaxed">
            {pergi} dari {s.kunjungan} kunjungan lihat-lihat lalu pergi tanpa isi ukuran atau klik WhatsApp.
          </p>
        )}
      </section>

      {s.asal.length > 0 && (
        <section className={`${kelasKartu} p-4 space-y-3`} aria-labelledby="judul-asal">
          <h2 id="judul-asal" className="text-base font-bold">
            Pengunjung datang dari mana
          </h2>
          <ul className="space-y-3">
            {s.asal.map((p) => (
              <BarisPeringkat
                key={p.kunci}
                label={LABEL_ASAL[p.kunci as Asal] ?? p.kunci}
                jumlah={p.jumlah}
                maks={s.asal[0].jumlah}
              />
            ))}
          </ul>
        </section>
      )}

      {layananWa.length > 0 && (
        <section className={`${kelasKartu} p-4 space-y-3`} aria-labelledby="judul-ditanya">
          <h2 id="judul-ditanya" className="text-base font-bold">
            Paling sering ditanya
          </h2>
          <ul className="space-y-3">
            {layananWa.map((p) => (
              <BarisPeringkat key={p.label} label={p.label} jumlah={p.jumlah} maks={layananWa[0].jumlah} satuan="klik" />
            ))}
          </ul>
        </section>
      )}

      {s.sumberWa.length > 0 && (
        <section className={`${kelasKartu} p-4 space-y-3`} aria-labelledby="judul-tombol">
          <h2 id="judul-tombol" className="text-base font-bold">
            Tombol WhatsApp yang paling sering diklik
          </h2>
          <ul className="space-y-3">
            {s.sumberWa.map((p) => (
              <BarisPeringkat
                key={p.kunci}
                label={LABEL_SUMBER_WA[p.kunci as SumberWa] ?? p.kunci}
                jumlah={p.jumlah}
                maks={s.sumberWa[0].jumlah}
                satuan="klik"
              />
            ))}
          </ul>
        </section>
      )}

      {s.klikLink.length > 0 && (
        <section className={`${kelasKartu} p-4 space-y-3`} aria-labelledby="judul-link">
          <div className="space-y-1">
            <h2 id="judul-link" className="text-base font-bold">
              Tombol lain di halaman link
            </h2>
            <p className="text-sm text-tinta-lembut">Klik WhatsApp dari halaman link sudah masuk hitungan di atas.</p>
          </div>
          <ul className="space-y-3">
            {s.klikLink.map((p) => (
              <BarisPeringkat
                key={p.kunci}
                label={LABEL_TUJUAN_LINK[p.kunci as TujuanLink] ?? p.kunci}
                jumlah={p.jumlah}
                maks={s.klikLink[0].jumlah}
                satuan="klik"
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function BelumAdaKunjungan({ judul, isi }: { judul: string; isi: string }) {
  const instagram = LINK_PROMOSI[0];
  return (
    <section className="bg-navy rounded-2xl p-5 space-y-2.5" aria-labelledby="judul-belum">
      <h2 className="text-[15px] text-navy-kabut font-normal">Klik ke WhatsApp</h2>
      <p id="judul-belum" className="font-heading text-2xl leading-snug font-semibold text-white">
        {judul}
      </p>
      <p className="text-sm leading-relaxed text-navy-kabut">{isi}</p>
      <TombolSalin
        teks={linkPromosi(instagram.query)}
        label="Salin link untuk Instagram"
        className="inline-flex items-center min-h-[44px] px-4 rounded-lg border border-navy-kabut text-white text-sm font-semibold hover:bg-navy-muda"
      />
    </section>
  );
}

export default function BerandaAdmin() {
  const [hari, setHari] = useState<7 | 30>(7);
  const [data, setData] = useState<DataStatistik>({ keadaan: 'memuat' });
  const [layanan, setLayanan] = useState<ServiceSchema[]>([]);
  const [galeri, setGaleri] = useState<ProyekGaleriSchema[]>([]);

  useEffect(() => {
    const muat = () => {
      const data = defaultCmsRepository.getWorkingDataset();
      setLayanan(data.services);
      setGaleri(data.galeri ?? []);
    };
    muat();
    return defaultCmsRepository.subscribe(muat);
  }, []);

  useEffect(() => {
    let batal = false;
    setData({ keadaan: 'memuat' });
    fetch(`/api/admin/statistik?hari=${hari}`)
      .then(async (res) => {
        const isi = await res.json().catch(() => ({}));
        if (batal) return;
        if (!res.ok) setData({ keadaan: 'galat', pesan: isi.pesan || 'Statistik gagal dimuat.' });
        else if (!isi.terpasang) setData({ keadaan: 'belum-dipasang' });
        else setData({ keadaan: 'ada', hari: isi.hari, sekarang: isi.sekarang, sebelumnya: isi.sebelumnya });
      })
      .catch(() => !batal && setData({ keadaan: 'galat', pesan: 'Koneksi putus waktu memuat statistik.' }));
    return () => {
      batal = true;
    };
  }, [hari]);

  const kosong = data.keadaan === 'ada' && data.sekarang.kunjungan === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className={kelasJudulHalaman}>Beranda</h1>
        <div role="group" aria-label="Rentang waktu" className="flex bg-kertas-dalam rounded-xl p-[3px]">
          {([7, 30] as const).map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={hari === h}
              onClick={() => setHari(h)}
              className={`min-h-[40px] px-3 rounded-lg text-sm font-semibold ${
                hari === h ? 'bg-white text-navy' : 'text-tinta-lembut hover:text-navy'
              }`}
            >
              {h} hari
            </button>
          ))}
        </div>
      </div>

      {data.keadaan === 'memuat' && (
        <div className="flex justify-center py-10">
          <LogoLoading teks={`Memuat statistik ${hari} hari terakhir`} />
        </div>
      )}

      {data.keadaan === 'galat' && (
        <>
          <div role="alert" className={`${kelasKartu} p-4 space-y-1`}>
            <p className="font-semibold">{data.pesan}</p>
            <p className="text-sm text-tinta-lembut">Data layanan tetap aman, ini cuma statistiknya.</p>
          </div>
          <YangKosong layanan={layanan} galeri={galeri} />
        </>
      )}

      {data.keadaan === 'belum-dipasang' && (
        <>
          <BelumAdaKunjungan
            judul="Penghitung kunjungan belum dipasang."
            isi="Sambungkan database Upstash Redis ke project ini di Vercel, lalu deploy ulang. Selama belum dipasang, website tetap jalan normal."
          />
          <YangKosong layanan={layanan} galeri={galeri} />
        </>
      )}

      {kosong && (
        <>
          <BelumAdaKunjungan
            judul="Belum ada kunjungan tercatat."
            isi="Angkanya muncul di sini begitu ada yang buka website. Biar ketahuan orang datang dari mana, pasang link khusus di bio Instagram dan profil Google Maps."
          />
          <YangKosong layanan={layanan} galeri={galeri} />
        </>
      )}

      {data.keadaan === 'ada' && !kosong && <Statistik data={data} layanan={layanan} galeri={galeri} />}
    </div>
  );
}
