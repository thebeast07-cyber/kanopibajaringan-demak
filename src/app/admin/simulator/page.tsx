'use client';

import React, { useEffect, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { CompleteDataset, EstimatorInput, EstimateSnapshot } from '../../../types/domain';
import { calculateEstimate } from '../../../lib/estimator/pricingEngine';
import { PlayCircle, RefreshCcw, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminSimulatorPage() {
  const [dataset, setDataset] = useState<CompleteDataset | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('svc-kanopi-alderon');
  const [length, setLength] = useState<number>(5);
  const [width, setWidth] = useState<number>(4);
  const [materialId, setMaterialId] = useState<string>('');
  const [frameId, setFrameId] = useState<string>('');
  const [laborId, setLaborId] = useState<string>('');
  const [snapshot, setSnapshot] = useState<EstimateSnapshot | null>(null);

  useEffect(() => {
    const ds = defaultCmsRepository.getDataset();
    setDataset(ds);

    return defaultCmsRepository.subscribe(() => {
      setDataset(defaultCmsRepository.getDataset());
    });
  }, []);

  useEffect(() => {
    if (!dataset) return;
    const service = dataset.services.find((s) => s.id === selectedServiceId) || dataset.services[0];
    const allowedMats = dataset.materials.filter((m) => service.allowedMaterialIds.includes(m.id));
    const allowedFrames = dataset.frames.filter((f) => service.allowedFrameIds.includes(f.id));
    const allowedLabors = dataset.laborOptions.filter((l) => service.allowedLaborIds.includes(l.id));

    if (allowedMats.length > 0 && !materialId) setMaterialId(allowedMats[0].id);
    if (allowedFrames.length > 0 && !frameId) setFrameId(allowedFrames[0].id);
    if (allowedLabors.length > 0 && !laborId) setLaborId(allowedLabors[0].id);

    const input: EstimatorInput = {
      serviceId: service.id,
      length,
      width,
      materialId: materialId || allowedMats[0]?.id,
      frameId: frameId || allowedFrames[0]?.id,
      laborId: laborId || allowedLabors[0]?.id,
    };

    try {
      const res = calculateEstimate(input, dataset);
      setSnapshot(res.snapshot);
    } catch (e) {
      console.error(e);
    }
  }, [dataset, selectedServiceId, length, width, materialId, frameId, laborId]);

  if (!dataset || !snapshot) return <div className="p-8 text-slate-500">Memuat simulator...</div>;

  const selectedService = dataset.services.find((s) => s.id === selectedServiceId) || dataset.services[0];
  const allowedMats = dataset.materials.filter((m) => selectedService.allowedMaterialIds.includes(m.id));
  const allowedFrames = dataset.frames.filter((f) => selectedService.allowedFrameIds.includes(f.id));
  const allowedLabors = dataset.laborOptions.filter((l) => selectedService.allowedLaborIds.includes(l.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-amber-600" />
          <span>Simulator Harga (Pengujian Mesin Kalkulasi Real-Time)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Uji masukan estimasi menggunakan mesin kalkulasi yang sama persis dengan estimator di website utama.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Controls */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            1. Masukkan Parameter Sampel Proyek
          </h3>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Pilih Produk / Layanan</label>
            <select
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setMaterialId('');
                setFrameId('');
                setLaborId('');
              }}
              className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
            >
              {dataset.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.measurementType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Panjang (m)</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Lebar (m)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Material Penutup</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              {allowedMats.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Rp {m.pricingRule.rate.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Rangka Utama</label>
            <select
              value={frameId}
              onChange={(e) => setFrameId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              {allowedFrames.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Rp {f.pricingRule.rate.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Upah Tukang</label>
            <select
              value={laborId}
              onChange={(e) => setLaborId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              {allowedLabors.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (Rp {l.pricingRule.rate.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Live Breakdown Output */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Hasil Kalkulasi Engine Real-Time
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Versi: {snapshot.pricingVersion}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Total Luas Bidang</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {snapshot.billableUnits.actual} {snapshot.billableUnits.unitType}
                </div>
                {snapshot.billableUnits.applied > snapshot.billableUnits.actual && (
                  <div className="text-[10px] text-amber-400 mt-1">
                    Minimum billing diterapkan: {snapshot.billableUnits.applied} {snapshot.billableUnits.unitType}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Estimasi Durasi Pengerjaan</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{snapshot.duration.text}</div>
              </div>
            </div>

            {/* Rincian Komponen Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-300">Rincian Komponen Biaya:</div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Biaya Bahan Atap:</span>
                  <span>Rp {snapshot.breakdown.materialCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Biaya Rangka Utama:</span>
                  <span>Rp {snapshot.breakdown.frameCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Biaya Upah Tukang:</span>
                  <span>Rp {snapshot.breakdown.laborCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Biaya Finishing:</span>
                  <span>Rp {snapshot.breakdown.finishingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400 text-sm">
                  <span>Subtotal Estimasi:</span>
                  <span>Rp {snapshot.breakdown.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Snapshot kalkulasi valid dan kompatibel 100% dengan format WhatsApp lead quotation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
