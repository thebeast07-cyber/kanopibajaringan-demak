'use client';

import React, { useMemo, useState } from 'react';
import { CompleteDataset, EstimatorInput, ServiceSchema } from '@/types/domain';
import { calculateEstimate } from '@/lib/estimator/pricingEngine';
import { buildWhatsAppLeadUrl, formatRupiah } from '@/lib/whatsapp';

interface EstimatorWizardProps {
  dataset: CompleteDataset;
  initialServiceId?: string;
}

/**
 * Kalkulator estimasi — model harga borongan.
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

  const snapshot = useMemo(() => {
    if (!activeService) return null;
    try {
      return calculateEstimate(currentInput, dataset).snapshot;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [currentInput, dataset, activeService]);

  // Tarif borongan layanan aktif, buat ditampilkan sebagai "785.000 / m²"
  const borongan = activeService?.pricingRules?.[0];
  const unitLabel =
    borongan?.unitLabel ?? (measurement === 'm2' ? 'm²' : measurement === 'meter' ? 'meter' : 'unit');

  const minimumApplied = snapshot
    ? snapshot.billableUnits.applied > snapshot.billableUnits.actual
    : false;

  const handleOpenWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshot) return;
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
    window.open(url, '_blank');
  };

  if (!activeService) return null;

  const numberField =
    'w-full px-4 min-h-[52px] rounded-xl border border-kertas-garis bg-white text-xl font-heading font-bold text-tinta focus:outline-none focus:border-hutan';
  const textField =
    'w-full px-4 min-h-[48px] rounded-xl border border-kertas-garis bg-white text-tinta focus:outline-none focus:border-hutan';
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
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-hutan tracking-tight">
            Berapa biayanya?
          </h2>
          <p className="text-tinta-lembut leading-relaxed">
            Pilih layanan, masukkan ukuran, harganya langsung muncul di sebelah.
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
                          ? 'bg-hutan border-hutan text-white'
                          : 'bg-white border-kertas-garis text-tinta hover:border-hutan-muda'
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
                      onChange={(e) => setLengthInput(Number(e.target.value) || 0)}
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
                      onChange={(e) => setWidthInput(Number(e.target.value) || 0)}
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
                    onChange={(e) => setLengthInput(Number(e.target.value) || 0)}
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
                    onChange={(e) => setQuantityInput(Number(e.target.value) || 1)}
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
              Pilihan bahan, warna, dan pekerjaan tambahan (talang, bongkar atap lama) dibahas
              langsung di WhatsApp, biar nggak ribet di sini.
            </p>
          </div>

          {/* ---------- Hasil ---------- */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-hutan text-white rounded-2xl p-6 sm:p-7 space-y-5">
              <div>
                <p className="text-sm text-hutan-kabut">Perkiraan biaya</p>
                <p className="font-heading text-lg font-semibold mt-0.5">{activeService.title}</p>
              </div>

              <div>
                {/* Aksen amber mendarat di sini. Versi terang karena di atas hijau tua. */}
                <p className="font-heading text-4xl sm:text-5xl leading-none font-bold tracking-tight text-amber-terang">
                  {snapshot ? formatRupiah(snapshot.breakdown.total) : '—'}
                </p>
                {borongan && snapshot && (
                  <p className="text-sm text-hutan-kabut mt-3">
                    {formatRupiah(borongan.rate)} / {unitLabel} × {snapshot.billableUnits.applied}{' '}
                    {unitLabel}
                  </p>
                )}
              </div>

              {minimumApplied && snapshot && (
                <p className="text-sm text-hutan-kabut leading-relaxed bg-hutan-tua rounded-xl p-4">
                  Ukuran kamu {snapshot.billableUnits.actual} {unitLabel}, tapi layanan ini minimum{' '}
                  <strong className="text-white">
                    {snapshot.billableUnits.applied} {unitLabel}
                  </strong>
                  , jadi dihitung segitu.
                </p>
              )}

              {snapshot && (
                <p className="text-sm text-hutan-kabut pt-4 border-t border-hutan-muda">
                  Estimasi pengerjaan {snapshot.duration.text}.
                </p>
              )}

              <p className="text-sm text-hutan-kabut leading-relaxed">
                Harga borongan, sudah termasuk bahan, rangka, upah pasang, dan finishing. Masih
                ancer-ancer; harga pastinya setelah survei lokasi.
              </p>
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
                  placeholder="mis. Pondok Aren, Tangerang Selatan"
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
                  placeholder="Warna, model, atau permintaan khusus"
                  className={`${textField} py-3 resize-none`}
                />
              </div>

              {/* Pesan kesalahan muncul di tempat, bukan lewat alert() yang bikin
                  orang kehilangan konteks (R-27). */}
              {formError && (
                <p role="alert" className="text-sm text-amber-gelap bg-kertas-dalam rounded-xl p-3">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={!snapshot}
                className="w-full min-h-[52px] bg-amber-gelap hover:bg-amber-tua disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
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
