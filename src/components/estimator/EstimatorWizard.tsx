'use client';

import React, { useMemo, useState } from 'react';
import { CompleteDataset, EstimatorInput, ServiceSchema } from '@/types/domain';
import { calculateEstimate, getTarifBorongan } from '@/lib/estimator/pricingEngine';
import { buildWhatsAppLeadUrl, formatRupiah, teksBahanStandar } from '@/lib/whatsapp';
import { catatIsiUkuran, catatKlikWa } from '@/lib/jejak';

interface EstimatorWizardProps {
  dataset: CompleteDataset;
  initialServiceId?: string;
}

/**
 * Kalkulator estimasi untuk model harga borongan.
 *
 * Satu layar: pilih layanan → isi ukuran → harga langsung muncul → lempar ke WhatsApp.
 * Pilihan bahan, rangka, upah, dan finishing TIDAK ditanyakan di sini; harga tiap
 * layanan sudah borongan (lihat pricingRules tiap service). Spesifikasi detail dan
 * pekerjaan tambahan dibahas saat nego & survei lokasi.
 */
export function EstimatorWizard({ dataset, initialServiceId }: EstimatorWizardProps) {
  const services = useMemo(
    () => dataset.services.filter((s) => s.status === 'active'),
    [dataset.services]
  );

  const defaultService = services[0];
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || defaultService?.id || ''
  );

  const activeService: ServiceSchema | undefined =
    services.find((s) => s.id === selectedServiceId) || defaultService;

  const [lengthInput, setLengthInput] = useState<number>(5);
  const [widthInput, setWidthInput] = useState<number>(4);
  const [quantityInput, setQuantityInput] = useState<number>(3);

  const [customerName, setCustomerName] = useState<string>('');
  const [cityOrDistrict, setCityOrDistrict] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const measurement = activeService?.measurementType ?? 'm2';

  const currentInput: EstimatorInput = {
    serviceId: activeService?.id ?? '',
    length: lengthInput,
    width: widthInput,
    quantity: quantityInput,
    notes: additionalNotes,
  };

  // Ukuran nol bukan pesanan kecil, tapi pesanan yang belum diisi. Tanpa penjaga ini
  // minimum pengerjaan tetap jalan, dan kalkulator menawarkan Rp 9.420.000 untuk
  // kanopi 0 m². Harga cuma boleh muncul kalau ada ukuran yang beneran diketik.
  const adaUkuran =
    measurement === 'm2'
      ? lengthInput > 0 && widthInput > 0
      : measurement === 'meter'
      ? lengthInput > 0
      : quantityInput > 0;

  const snapshot = useMemo(() => {
    if (!activeService || !adaUkuran) return null;
    try {
      return calculateEstimate(currentInput, dataset).snapshot;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [currentInput, dataset, activeService, adaUkuran]);

  // Tarif borongan layanan aktif, buat ditampilkan sebagai "785.000 / m²".
  // null kalau pemilik belum mengisi harga: kalkulator jangan menampilkan Rp 0.
  const borongan = activeService ? getTarifBorongan(activeService) : null;
  const adaHargaSama = services.some((s) => getTarifBorongan(s) !== null);
  const bahanStandar = teksBahanStandar(activeService?.bahanStandar);
  const unitLabel =
    borongan?.unitLabel ?? (measurement === 'm2' ? 'm²' : measurement === 'meter' ? 'meter' : 'unit');

  const minimumApplied = snapshot
    ? snapshot.billableUnits.applied > snapshot.billableUnits.actual
    : false;

  const handleOpenWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshot) {
      // Dulu di sini cuma `return`, jadi tombolnya diam saja kalau ukurannya kosong.
      setFormError('Isi ukurannya dulu, biar ada angka yang bisa kami bahas.');
      return;
    }
    if (!customerName.trim() || !cityOrDistrict.trim()) {
      setFormError('Isi nama dan lokasi dulu ya, biar kami tahu mau kirim tim ke mana.');
      return;
    }
    setFormError('');

    const url = buildWhatsAppLeadUrl(
      snapshot,
      { customerName, cityOrDistrict, additionalNotes },
      dataset
    );
    catatKlikWa('kalkulator', activeService?.title);
    window.open(url, '_blank');
  };

  if (!activeService) return null;

  // outline bawaan dimatikan, jadi penggantinya harus lebih tebal dari sekadar
  // border yang ganti warna: cincin navy dua piksel, kelihatan jelas pas di-Tab (R-32).
  const fokus = 'focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy';
  const numberField = `w-full px-4 min-h-[52px] rounded-xl border border-kertas-garis bg-white text-xl font-heading font-bold text-tinta ${fokus}`;
  const textField = `w-full px-4 min-h-[48px] rounded-xl border border-kertas-garis bg-white text-tinta ${fokus}`;
  const fieldLabel = 'block text-sm font-semibold text-tinta mb-2';
  const hintLabel = 'block text-sm text-tinta-lembut mb-1.5';

  // Ukuran selalu ditulis dengan pola yang sama di seluruh situs (lihat DESIGN.md).
  const ukuranTeks =
    measurement === 'm2'
      ? `${lengthInput} m × ${widthInput} m`
      : measurement === 'meter'
      ? `${lengthInput} meter`
      : `${quantityInput} unit`;

  return (
    <section id="kalkulator" className="py-16 sm:py-20 bg-kertas-dalam text-tinta border-b border-kertas-garis">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3 mb-8">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            Berapa biayanya?
          </h2>
          <p className="text-tinta-lembut leading-relaxed">
            {adaHargaSama
              ? 'Pilih layanan, masukkan ukuran, harganya langsung muncul di sebelah.'
              : 'Pilih layanan dan masukkan ukurannya, lalu kirim lewat WhatsApp. Kami hitungkan harganya.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ---------- Input ---------- */}
          <div className="lg:col-span-7 bg-white border border-kertas-garis rounded-2xl p-6 sm:p-8 space-y-7">
            <fieldset>
              <legend className={fieldLabel}>Mau pasang apa?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((svc) => {
                  const isActive = svc.id === activeService.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`text-left px-4 min-h-[52px] flex items-center rounded-xl border font-semibold transition-colors ${
                        isActive
                          ? 'bg-navy border-navy text-white'
                          : 'bg-white border-kertas-garis text-tinta hover:border-navy-muda'
                      }`}
                    >
                      {svc.title}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="pt-6 border-t border-kertas-garis">
              <p className={fieldLabel}>Ukuran</p>

              {measurement === 'm2' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="panjang" className={hintLabel}>
                      Panjang (meter)
                    </label>
                    <input
                      id="panjang"
                      type="number"
                      min={0}
                      step={0.5}
                      value={lengthInput}
                      onChange={(e) => {
                        setLengthInput(Number(e.target.value) || 0);
                        catatIsiUkuran(activeService.title);
                      }}
                      className={numberField}
                    />
                  </div>
                  <div>
                    <label htmlFor="lebar" className={hintLabel}>
                      Lebar (meter)
                    </label>
                    <input
                      id="lebar"
                      type="number"
                      min={0}
                      step={0.5}
                      value={widthInput}
                      onChange={(e) => {
                        setWidthInput(Number(e.target.value) || 0);
                        catatIsiUkuran(activeService.title);
                      }}
                      className={numberField}
                    />
                  </div>
                </div>
              )}

              {measurement === 'meter' && (
                <div>
                  <label htmlFor="panjang" className={hintLabel}>
                    Panjang (meter)
                  </label>
                  <input
                    id="panjang"
                    type="number"
                    min={0}
                    step={0.5}
                    value={lengthInput}
                    onChange={(e) => {
                        setLengthInput(Number(e.target.value) || 0);
                        catatIsiUkuran(activeService.title);
                      }}
                    className={numberField}
                  />
                </div>
              )}

              {measurement === 'unit' && (
                <div>
                  <label htmlFor="jumlah" className={hintLabel}>
                    Jumlah unit
                  </label>
                  <input
                    id="jumlah"
                    type="number"
                    min={1}
                    step={1}
                    value={quantityInput}
                    onChange={(e) => {
                      setQuantityInput(Number(e.target.value) || 1);
                      catatIsiUkuran(activeService.title);
                    }}
                    className={numberField}
                  />
                </div>
              )}

              {snapshot && measurement === 'm2' && (
                <p className="text-sm text-tinta-lembut mt-3">
                  {ukuranTeks} = <strong className="text-tinta">{snapshot.billableUnits.actual} m²</strong>
                </p>
              )}
            </div>

            <p className="text-sm text-tinta-lembut leading-relaxed bg-kertas-dalam rounded-xl p-4">
              Mau bahan atau warna lain, atau ada pekerjaan tambahan kayak talang dan bongkar atap
              lama? Tulis di catatan, nanti dibahas di WhatsApp.
            </p>
          </div>

          {/* ---------- Hasil ---------- */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-navy text-white rounded-2xl p-6 sm:p-7 space-y-5">
              <div>
                <p className="text-sm text-navy-kabut">Perkiraan biaya</p>
                <p className="font-heading text-lg font-semibold mt-0.5">{activeService.title}</p>
              </div>

              <div>
                {/* Aksen oranye mendarat di sini. Oranye logo lolos kontras di atas navy.
                    Tanpa ukuran, slot ini diisi kalimat, bukan tanda baca: pengunjung
                    perlu tahu apa yang kurang, bukan menebak garis panjang artinya apa. */}
                {snapshot && borongan ? (
                  <p className="font-heading text-4xl sm:text-5xl leading-none font-bold tracking-tight text-oranye">
                    {formatRupiah(snapshot.breakdown.total)}
                  </p>
                ) : !borongan ? (
                  <p className="font-heading text-xl font-semibold text-white leading-snug">
                    Harga {activeService.title} belum dipasang di sini. Kirim ukurannya lewat
                    WhatsApp, nanti kami hitungkan.
                  </p>
                ) : (
                  <p className="font-heading text-xl font-semibold text-navy-kabut leading-snug">
                    Isi ukurannya dulu, harganya nanti muncul di sini.
                  </p>
                )}
                {borongan && snapshot && (
                  <p className="text-sm text-navy-kabut mt-3">
                    {formatRupiah(borongan.rate)} / {unitLabel} × {snapshot.billableUnits.applied}{' '}
                    {unitLabel}
                  </p>
                )}
              </div>

              {minimumApplied && snapshot && borongan && (
                <p className="text-sm text-navy-kabut leading-relaxed bg-navy-tua rounded-xl p-4">
                  Ukuran kamu {snapshot.billableUnits.actual} {unitLabel}, tapi layanan ini minimum{' '}
                  <strong className="text-white">
                    {snapshot.billableUnits.applied} {unitLabel}
                  </strong>
                  , jadi dihitung segitu.
                </p>
              )}

              {snapshot && snapshot.duration.text && (
                <p className="text-sm text-navy-kabut pt-4 border-t border-navy-muda">
                  Perkiraan pengerjaan {snapshot.duration.text}, dipastikan setelah survei.
                </p>
              )}

              {bahanStandar && (
                <p className="text-sm text-navy-kabut leading-relaxed">
                  <span className="text-white font-semibold">Bahan standar:</span> {bahanStandar}.
                  Mau bahan lain? Tulis di catatan.
                </p>
              )}

              {borongan && (
                <p className="text-sm text-navy-kabut leading-relaxed">
                  Harga borongan, sudah termasuk bahan, rangka, upah pasang, dan finishing. Masih
                  ancer-ancer; harga pastinya setelah survei lokasi.
                </p>
              )}
            </div>

            <form
              onSubmit={handleOpenWhatsApp}
              noValidate
              className="bg-white border border-kertas-garis rounded-2xl p-6 space-y-4"
            >
              <div>
                <label htmlFor="nama" className={fieldLabel}>
                  Nama
                </label>
                <input
                  id="nama"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama kamu"
                  aria-invalid={Boolean(formError) && !customerName.trim()}
                  className={textField}
                />
              </div>
              <div>
                <label htmlFor="lokasi" className={fieldLabel}>
                  Lokasi / kecamatan
                </label>
                <input
                  id="lokasi"
                  type="text"
                  value={cityOrDistrict}
                  onChange={(e) => setCityOrDistrict(e.target.value)}
                  placeholder="mis. Sayung, Demak"
                  aria-invalid={Boolean(formError) && !cityOrDistrict.trim()}
                  className={textField}
                />
              </div>
              <div>
                <label htmlFor="catatan" className={fieldLabel}>
                  Catatan (opsional)
                </label>
                <textarea
                  id="catatan"
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Bahan lain, warna, atau permintaan khusus"
                  className={`${textField} py-3 resize-none`}
                />
              </div>

              {/* Pesan kesalahan muncul di tempat, bukan lewat alert() yang bikin
                  orang kehilangan konteks (R-27). */}
              {formError && (
                <p role="alert" className="text-sm text-oranye-gelap bg-kertas-dalam rounded-xl p-3">
                  {formError}
                </p>
              )}

              {/* Sengaja tidak dimatikan pakai `disabled`. Tombol mati tidak bisa
                  di-Tab dan tidak menjelaskan apa-apa; yang ini tetap bisa ditekan
                  dan menjawab sendiri kalau ukurannya belum diisi (R-26, R-32). */}
              <button
                type="submit"
                className="w-full min-h-[52px] bg-oranye hover:bg-oranye-tua text-navy font-bold rounded-xl transition-colors"
              >
                Lanjut chat WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
