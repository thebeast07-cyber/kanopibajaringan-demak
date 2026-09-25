'use client';

import React, { useEffect, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { CompleteDataset, MaterialSchema, ImpactPreviewCase } from '../../../types/domain';
import { calculateEstimate } from '../../../lib/estimator/pricingEngine';
import { DollarSign, ArrowRight, Save, Check, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminHargaPage() {
  const [dataset, setDataset] = useState<CompleteDataset | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('svc-kanopi-alderon');
  const [targetMaterialId, setTargetMaterialId] = useState<string>('');
  const [newRate, setNewRate] = useState<number>(0);
  const [oldRate, setOldRate] = useState<number>(0);
  const [authorName, setAuthorName] = useState<string>('Owner');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const ds = defaultCmsRepository.getDataset();
    setDataset(ds);
    if (ds.materials.length > 0) {
      setTargetMaterialId(ds.materials[0].id);
      setOldRate(ds.materials[0].pricingRule.rate);
      setNewRate(ds.materials[0].pricingRule.rate);
    }
    return defaultCmsRepository.subscribe(() => {
      const updatedDs = defaultCmsRepository.getDataset();
      setDataset(updatedDs);
    });
  }, []);

  if (!dataset) return <div className="p-8 text-slate-500">Memuat data master harga...</div>;

  const selectedService = dataset.services.find((s) => s.id === selectedServiceId) || dataset.services[0];
  const targetMaterial = dataset.materials.find((m) => m.id === targetMaterialId) || dataset.materials[0];

  const handleSelectMaterial = (id: string) => {
    setTargetMaterialId(id);
    const mat = dataset.materials.find((m) => m.id === id);
    if (mat) {
      setOldRate(mat.pricingRule.rate);
      setNewRate(mat.pricingRule.rate);
    }
  };

  const config = dataset.calculationConfigs?.find((c) => c.serviceId === selectedServiceId);
  const impactCases: ImpactPreviewCase[] = config?.impactPreviewCases || [
    { label: 'Proyek Kecil (10m²)', length: 5, width: 2 },
    { label: 'Proyek Standard (20m²)', length: 5, width: 4 },
    { label: 'Proyek Besar (40m²)', length: 8, width: 5 },
  ];

  // Compute Before vs After Project Estimate Impacts dynamically
  const impacts = impactCases.map((testCase) => {
    const baseInput = {
      serviceId: selectedService.id,
      length: testCase.length || 5,
      width: testCase.width || 4,
      quantity: testCase.quantity || 1,
      materialId: targetMaterial.id,
    };

    const beforeRes = calculateEstimate(baseInput, dataset);

    // Simulated updated dataset
    const simulatedMaterials = dataset.materials.map((m) =>
      m.id === targetMaterial.id
        ? { ...m, pricingRule: { ...m.pricingRule, rate: newRate } }
        : m
    );

    const simulatedDataset: CompleteDataset = {
      ...dataset,
      materials: simulatedMaterials,
    };

    const afterRes = calculateEstimate(baseInput, simulatedDataset);

    const diff = afterRes.snapshot.breakdown.total - beforeRes.snapshot.breakdown.total;

    return {
      label: testCase.label,
      beforeTotal: beforeRes.snapshot.breakdown.total,
      afterTotal: afterRes.snapshot.breakdown.total,
      diff,
    };
  });

  const handleSavePriceChange = () => {
    if (!targetMaterial) return;
    const updatedMat: MaterialSchema = {
      ...targetMaterial,
      pricingRule: {
        ...targetMaterial.pricingRule,
        rate: newRate,
      },
    };
    defaultCmsRepository.saveMaterial(updatedMat, authorName || 'Owner');
    setOldRate(newRate);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-600" />
          <span>Edit Harga & Simulasi Dampak Perubahan (Safe Impact Preview)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ubah harga per m² / per unit dan lihat perbandingan harga proyek pelanggan sebelum dan sesudah perubahan sebelum disimpan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Select & Edit Rate */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            1. Pilih Material & Ubah Harga
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pilih Layanan / Produk</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
              >
                {dataset.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.measurementType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pilih Material Yang Diubah</label>
              <select
                value={targetMaterialId}
                onChange={(e) => handleSelectMaterial(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
              >
                {dataset.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Harga Saat Ini: Rp {m.pricingRule.rate.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-slate-600">
                <span>Harga Lama (Semula):</span>
                <strong className="text-slate-700">Rp {oldRate.toLocaleString('id-ID')}</strong>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Harga Baru (Rp)</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg border-2 border-amber-400 font-bold text-lg text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Pembuat Perubahan</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <button
                onClick={handleSavePriceChange}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Harga</span>
              </button>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Harga berhasil diperbarui & dicatat ke Riwayat!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Impact Diff Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              2. Simulasi Dampak Harga Proyek Pelanggan (Before vs After)
            </h3>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Safe Preview Active
            </span>
          </div>

          <div className="space-y-4">
            {impacts.map((imp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{imp.label}</div>
                  <div className="text-xs text-slate-500">Estimasi Total Proyek</div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">SEBELUM</div>
                    <div className="text-sm font-bold text-slate-600 line-through">
                      Rp {imp.beforeTotal.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400" />

                  <div>
                    <div className="text-[10px] uppercase font-semibold text-emerald-600">SESUDAH</div>
                    <div className="text-base font-bold text-emerald-700">
                      Rp {imp.afterTotal.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="ml-2 pl-3 border-l border-slate-200">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        imp.diff > 0
                          ? 'bg-amber-100 text-amber-800'
                          : imp.diff < 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {imp.diff > 0 ? `+Rp ${imp.diff.toLocaleString('id-ID')}` : `Rp ${imp.diff.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Prinsip Edit Aman: Perubahan harga yang dilakukan tidak langsung mengubah estimasi historis pelanggan. 
              Estimasi baru yang dihitung di website utama akan menggunakan harga terbaru secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
