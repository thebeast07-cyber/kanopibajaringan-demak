'use client';

import React, { useEffect, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { ServiceSchema } from '../../../types/domain';
import {
  daftarKolomKosong,
  kolomKosong,
  layananBaru,
  slugDariNama,
  teksHarga,
  teksLama,
  teksMinimum,
} from '../../../lib/cms/isiDataLayanan';
import { FormLayanan, kelasTombolKedua, kelasTombolUtama } from '../../../components/admin/isi-data/FormLayanan';

// Garis putus-putus = slot yang belum diisi. Kalimatnya yang membawa arti, bukan warna.
function DataKosong() {
  return (
    <span className="inline-block text-sm text-tinta-lembut border border-dashed border-tinta-batas rounded px-2 py-0.5">
      Data kosong
    </span>
  );
}

function Ringkasan({ service }: { service: ServiceSchema }) {
  const harga = teksHarga(service);
  const minimum = teksMinimum(service);
  const lama = teksLama(service);
  const bahan = service.bahanStandar ?? [];

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-2.5 text-sm">
      <dt className="text-tinta-lembut">Harga borongan</dt>
      <dd>
        {harga ? <span className="font-heading text-base font-semibold text-amber-gelap">{harga}</span> : <DataKosong />}
      </dd>

      <dt className="text-tinta-lembut">Minimum pengerjaan</dt>
      <dd className="text-tinta">{minimum ?? <DataKosong />}</dd>

      <dt className="text-tinta-lembut">Lama pengerjaan</dt>
      <dd className="text-tinta">{lama ?? <DataKosong />}</dd>

      <dt className="text-tinta-lembut">Bahan standar</dt>
      <dd className="text-tinta">
        {bahan.length ? (
          <ul className="space-y-0.5">
            {bahan.map((b, i) => (
              <li key={i}>
                <span className="text-tinta-lembut">{b.bagian}:</span> {b.bahan}
              </li>
            ))}
          </ul>
        ) : (
          <DataKosong />
        )}
      </dd>
    </dl>
  );
}

/** Simpan ke draf lalu langsung terbitkan, supaya pemilik cukup menekan satu tombol. */
function simpanDanTerbitkan(service: ServiceSchema): string | null {
  try {
    defaultCmsRepository.saveService(service, 'Owner');
  } catch {
    return 'Gagal menyimpan. Coba lagi, atau muat ulang halamannya.';
  }
  try {
    defaultCmsRepository.publishDraft('Owner');
  } catch {
    return 'Tersimpan sebagai draf, tapi belum tampil di website karena ada data lain yang belum valid. Cek halaman Versi Harga.';
  }
  return null;
}

export default function AdminIsiDataPage() {
  const [layanan, setLayanan] = useState<ServiceSchema[] | null>(null);
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [draftBaru, setDraftBaru] = useState<ServiceSchema | null>(null);
  const [tersimpan, setTersimpan] = useState<{ id: string; nama: string } | null>(null);

  useEffect(() => {
    const muat = () => setLayanan(defaultCmsRepository.getWorkingDataset().services);
    muat();
    return defaultCmsRepository.subscribe(muat);
  }, []);

  if (!layanan) {
    return (
      <p role="status" className="text-sm text-tinta-lembut">
        Memuat data layanan...
      </p>
    );
  }

  const jumlahLengkap = layanan.filter((s) => kolomKosong(s).length === 0).length;

  const bukaTutup = (id: string) => {
    setTersimpan(null);
    setDraftBaru(null);
    setTerbuka((sekarang) => (sekarang === id ? null : id));
  };

  const simpan = (service: ServiceSchema) => {
    const pesanGagal = simpanDanTerbitkan(service);
    if (!pesanGagal) {
      setTerbuka(null);
      setDraftBaru(null);
      setTersimpan({ id: service.id, nama: service.title });
      // Form yang panjang menutup, jadi konfirmasinya bisa ada di atas layar. Bawa ke sana.
      requestAnimationFrame(() => {
        const pesan = document.getElementById(`tersimpan-${service.id}`);
        pesan?.scrollIntoView({ block: 'center' });
        pesan?.focus();
      });
    }
    return pesanGagal;
  };

  return (
    <div className="max-w-3xl space-y-8 pb-16 text-tinta">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-hutan">Isi data layanan</h1>
        <p className="text-tinta-lembut leading-relaxed">
          Harga, lama pengerjaan, dan bahan di website diambil dari sini. Yang belum diisi ditandai{' '}
          <DataKosong />. Selama kosong, website nggak nampilin angkanya dan pelanggan diarahkan tanya
          lewat WhatsApp.
        </p>
        <p className="text-sm text-tinta bg-kertas-dalam border border-kertas-garis rounded-lg p-3 leading-relaxed">
          Untuk sekarang data ini tersimpan di browser ini saja. Pelanggan di HP atau laptop lain
          belum bisa lihat sampai penyimpanan online dipasang.
        </p>
      </div>

      <p className="font-semibold text-tinta">
        {layanan.length === 0
          ? 'Belum ada layanan. Tambah layanan pertama di bawah.'
          : `${jumlahLengkap} dari ${layanan.length} layanan sudah lengkap.`}
      </p>

      <ul className="space-y-4">
        {layanan.map((svc) => {
          const kosong = daftarKolomKosong(svc);
          const isOpen = terbuka === svc.id;
          const idForm = `form-${svc.id}`;
          const adaIsi = kolomKosong(svc).length < 3;

          return (
            <li key={svc.id} className="bg-white border border-kertas-garis rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-heading text-lg font-semibold text-hutan">{svc.title}</h2>
                  <p className="text-sm text-tinta">
                    {kosong ? (
                      <>
                        <span className="font-semibold">Belum lengkap.</span> Kosong: {kosong}.
                      </>
                    ) : (
                      <span className="font-semibold">Lengkap.</span>
                    )}
                    {svc.status !== 'active' && ' Sedang disembunyikan dari website.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => bukaTutup(svc.id)}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? idForm : undefined}
                  className={`${isOpen ? kelasTombolKedua : kelasTombolUtama} shrink-0`}
                >
                  {isOpen ? 'Tutup' : adaIsi ? 'Ubah data' : 'Isi data'}
                </button>
              </div>

              {tersimpan?.id === svc.id && (
                <p
                  id={`tersimpan-${svc.id}`}
                  role="status"
                  tabIndex={-1}
                  className="text-sm text-tinta bg-kertas-dalam rounded-lg p-3"
                >
                  {tersimpan.nama} tersimpan. Website di browser ini sudah pakai data barunya.
                </p>
              )}

              {isOpen ? (
                <div className="pt-4 border-t border-kertas-garis">
                  <FormLayanan service={svc} idForm={idForm} onSimpan={simpan} onBatal={() => setTerbuka(null)} />
                </div>
              ) : (
                <Ringkasan service={svc} />
              )}
            </li>
          );
        })}
      </ul>

      {draftBaru ? (
        <section className="bg-white border border-kertas-garis rounded-xl p-4 sm:p-6 space-y-4" aria-labelledby="judul-layanan-baru">
          <h2 id="judul-layanan-baru" className="font-heading text-lg font-semibold text-hutan">
            Layanan baru
          </h2>
          <FormLayanan
            service={draftBaru}
            idForm="form-layanan-baru"
            onSimpan={(svc) => simpan({ ...svc, slug: slugDariNama(svc.title) || svc.id })}
            onBatal={() => setDraftBaru(null)}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => {
            setTerbuka(null);
            setTersimpan(null);
            setDraftBaru(layananBaru());
          }}
          className={kelasTombolKedua}
        >
          Tambah layanan baru
        </button>
      )}
    </div>
  );
}
