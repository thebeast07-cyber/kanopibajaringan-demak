'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import {
  CompleteDataset,
  ServiceCalculationConfig,
  FormulaStepConfig,
  FormulaValueSource,
  FormulaPriceSource,
  FormulaOperator,
  EstimatorInput,
  ServiceSchema,
} from '../../../types/domain';
import { evaluateFormulaEngine, FormulaEngineResult } from '../../../lib/estimator/formulaEngine';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
} from '../../../components/admin/ui';
import {
  Calculator,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  Info,
  Play,
  Eye,
  Sliders,
  Layers,
  HelpCircle,
} from 'lucide-react';

// Owner-friendly Options Mapping
const VALUE_SOURCE_OPTIONS: { value: FormulaValueSource; label: string; description: string }[] = [
  { value: 'area', label: 'Luas Pekerjaan (m²)', description: 'Hasil kali Panjang × Lebar' },
  { value: 'length', label: 'Panjang Bidang (Meter)', description: 'Ukuran panjang dalam meter lari' },
  { value: 'width', label: 'Lebar Bidang (Meter)', description: 'Ukuran lebar dalam meter lari' },
  { value: 'height', label: 'Tinggi Bidang (Meter)', description: 'Ukuran tinggi proyek' },
  { value: 'quantity', label: 'Jumlah Unit / Pasang', description: 'Banyaknya unit / item' },
  { value: 'fixed_value', label: 'Paket / Borongan (Fixed = 1)', description: 'Hitungan 1 paket borongan' },
  { value: 'subtotal', label: 'Subtotal Sebelumnya', description: 'Total kumulatif dari langkah sebelumnya' },
  { value: 'custom_input', label: 'Input Kustom Lainnya', description: 'Parameter kustom pelanggan' },
];

const PRICE_SOURCE_OPTIONS: { value: FormulaPriceSource; label: string; description: string }[] = [
  { value: 'material', label: 'Bahan Atap / Penutup', description: 'Mengambil tarif dari catalog Bahan Atap yang dipilih' },
  { value: 'frame', label: 'Rangka Utama', description: 'Mengambil tarif dari catalog Rangka yang dipilih' },
  { value: 'labor', label: 'Upah Pengerjaan', description: 'Mengambil tarif dari catalog Upah Tukang' },
  { value: 'finishing', label: 'Finishing & Cat', description: 'Mengambil tarif dari catalog Finishing' },
  { value: 'addon', label: 'Biaya Tambahan', description: 'Mengambil tarif dari catalog Tambahan' },
  { value: 'package', label: 'Paket Pekerjaan', description: 'Mengambil harga paket khusus' },
  { value: 'custom_rate', label: 'Tarif Custom (Rp)', description: 'Ditentukan langsung di langkah ini' },
  { value: 'fixed_amount', label: 'Nominal Tetap (Rp)', description: 'Biaya flat langsung dimasukkan' },
  { value: 'percentage_rate', label: 'Persentase (%)', description: 'Persentase dari subtotal (misal 0.15 = 15%)' },
];

const OPERATION_OPTIONS: { value: FormulaOperator; label: string; symbol: string }[] = [
  { value: 'multiply', label: 'Perkalian (Volume × Tarif)', symbol: '×' },
  { value: 'add', label: 'Penjumlahan (Volume + Nominal)', symbol: '+' },
  { value: 'fixed', label: 'Biaya Tetap Flat', symbol: '=' },
  { value: 'percentage', label: 'Persentase Subtotal (%)', symbol: '%' },
  { value: 'multiplier', label: 'Pengali Subtotal (Multiplier)', symbol: '×%' },
  { value: 'minimum_override', label: 'Batas Minimum Volume', symbol: '≥' },
];

export default function AdminCaraHitungPage() {
  const [dataset, setDataset] = useState<CompleteDataset | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('svc-kanopi-alderon');
  const [calcConfig, setCalcConfig] = useState<ServiceCalculationConfig | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Live Simulation Inputs State
  const [simLength, setSimLength] = useState<number>(6);
  const [simWidth, setSimWidth] = useState<number>(4);
  const [simQuantity, setSimQuantity] = useState<number>(1);
  const [simMaterialId, setSimMaterialId] = useState<string>('');
  const [simFrameId, setSimFrameId] = useState<string>('');
  const [simLaborId, setSimLaborId] = useState<string>('');
  const [simFinishingId, setSimFinishingId] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const ds = defaultCmsRepository.getWorkingDataset();
      setDataset(ds);

      const cfg = defaultCmsRepository.getCalculationConfig(selectedServiceId);
      if (cfg) {
        setCalcConfig(cfg);
      } else {
        const targetSvc = ds.services.find((s) => s.id === selectedServiceId);
        setCalcConfig({
          serviceId: selectedServiceId,
          explanatoryNotes: 'Estimasi dihitung transparan dari perkalian volume × tarif catalog master data.',
          steps: [
            {
              id: 'step-1',
              name: 'Biaya Bahan Atap',
              enabled: true,
              order: 1,
              componentType: 'material',
              valueSource: 'area',
              priceSource: 'material',
              operation: 'multiply',
            },
            {
              id: 'step-2',
              name: 'Biaya Rangka Utama',
              enabled: true,
              order: 2,
              componentType: 'frame',
              valueSource: 'area',
              priceSource: 'frame',
              operation: 'multiply',
            },
            {
              id: 'step-3',
              name: 'Biaya Pengerjaan & Installation',
              enabled: true,
              order: 3,
              componentType: 'labor',
              valueSource: 'area',
              priceSource: 'labor',
              operation: 'multiply',
            },
          ],
        });
      }
    };

    update();
    return defaultCmsRepository.subscribe(update);
  }, [selectedServiceId]);

  // Selected Service metadata & allowed entity filtering
  const currentService: ServiceSchema | undefined = useMemo(() => {
    return dataset?.services.find((s) => s.id === selectedServiceId);
  }, [dataset, selectedServiceId]);

  // Allowed entity choices filtered by Service relations
  const allowedMaterials = useMemo(() => {
    if (!dataset || !currentService) return [];
    return dataset.materials.filter((m) => currentService.allowedMaterialIds.includes(m.id));
  }, [dataset, currentService]);

  const allowedFrames = useMemo(() => {
    if (!dataset || !currentService) return [];
    return dataset.frames.filter((f) => currentService.allowedFrameIds.includes(f.id));
  }, [dataset, currentService]);

  const allowedLabors = useMemo(() => {
    if (!dataset || !currentService) return [];
    return dataset.laborOptions.filter((l) => currentService.allowedLaborIds.includes(l.id));
  }, [dataset, currentService]);

  const allowedFinishings = useMemo(() => {
    if (!dataset || !currentService) return [];
    return dataset.finishings.filter((f) => currentService.allowedFinishingIds.includes(f.id));
  }, [dataset, currentService]);

  const allowedPackages = useMemo(() => {
    if (!dataset) return [];
    return dataset.packages || [];
  }, [dataset]);

  // Set default simulation choices when service changes
  useEffect(() => {
    if (allowedMaterials.length > 0) setSimMaterialId(allowedMaterials[0].id);
    if (allowedFrames.length > 0) setSimFrameId(allowedFrames[0].id);
    if (allowedLabors.length > 0) setSimLaborId(allowedLabors[0].id);
    if (allowedFinishings.length > 0) setSimFinishingId(allowedFinishings[0].id);
  }, [selectedServiceId, allowedMaterials, allowedFrames, allowedLabors, allowedFinishings]);

  // Live Simulation Computation using Formula Engine
  const simulationResult: FormulaEngineResult | null = useMemo(() => {
    if (!dataset || !calcConfig || !currentService) return null;

    const tempDataset: CompleteDataset = {
      ...dataset,
      calculationConfigs: dataset.calculationConfigs
        ? dataset.calculationConfigs.map((c) => (c.serviceId === selectedServiceId ? calcConfig : c))
        : [calcConfig],
    };

    const input: EstimatorInput = {
      serviceId: selectedServiceId,
      length: simLength,
      width: simWidth,
      quantity: simQuantity,
      materialId: simMaterialId || undefined,
      frameId: simFrameId || undefined,
      laborId: simLaborId || undefined,
      finishingId: simFinishingId || undefined,
    };

    try {
      return evaluateFormulaEngine(input, tempDataset);
    } catch (e) {
      return null;
    }
  }, [
    dataset,
    calcConfig,
    currentService,
    selectedServiceId,
    simLength,
    simWidth,
    simQuantity,
    simMaterialId,
    simFrameId,
    simLaborId,
    simFinishingId,
  ]);

  if (!dataset || !calcConfig) {
    return <div className="p-8 text-slate-500">Memuat modul cara hitung...</div>;
  }

  // Step Handlers
  const handleAddStep = () => {
    const newStep: FormulaStepConfig = {
      id: `step-${Date.now()}`,
      name: 'Langkah Hitung Baru',
      enabled: true,
      order: calcConfig.steps.length + 1,
      valueSource: 'area',
      priceSource: 'material',
      operation: 'multiply',
    };

    setCalcConfig({
      ...calcConfig,
      steps: [...calcConfig.steps, newStep],
    });
  };

  const handleRemoveStep = (id: string) => {
    setCalcConfig({
      ...calcConfig,
      steps: calcConfig.steps.filter((s) => s.id !== id),
    });
  };

  const handleUpdateStep = (id: string, updated: Partial<FormulaStepConfig>) => {
    setCalcConfig({
      ...calcConfig,
      steps: calcConfig.steps.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...calcConfig.steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;

    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;

    setCalcConfig({
      ...calcConfig,
      steps: newSteps.map((s, idx) => ({ ...s, order: idx + 1 })),
    });
  };

  const handleSaveConfig = () => {
    defaultCmsRepository.saveCalculationConfig(calcConfig, 'Owner');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-6 h-6 text-amber-600" />
              <span>Cara Hitung (Formula Builder Visual)</span>
            </h1>
            <AdminBadge variant="amber">Blueprint Prototype</AdminBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur dan susun langkah-langkah logika perhitungan harga untuk setiap layanan bisnis tanpa membuat kode program.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin/panduan#s10-menyusun-cara-hitung"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Panduan Cara Hitung</span>
          </a>
          <AdminButton
            onClick={handleSaveConfig}
            variant="primary"
            icon={<Save className="w-4 h-4" />}
          >
            Simpan Cara Hitung
          </AdminButton>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Konfigurasi Cara Hitung draf berhasil diperbarui!</span>
        </div>
      )}

      {/* Select Service Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <label className="text-xs font-bold text-slate-700 block">Layanan Yang Diatur:</label>
            <p className="text-xs text-slate-500">Pilih jenis layanan untuk menyesuaikan urutan rumus kalkulasinya.</p>
          </div>
        </div>

        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-amber-500 outline-none min-w-[280px]"
        >
          {dataset.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.measurementType.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Layout Grid: Left (Builder Steps) & Right (Live Simulation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Steps Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Langkah Perhitungan Berurutan</h3>
              <p className="text-xs text-slate-500">Langkah dievaluasi dari atas ke bawah secara berurutan.</p>
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition border border-slate-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Langkah</span>
            </button>
          </div>

          {calcConfig.steps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 italic">
              Belum ada langkah perhitungan. Klik "+ Tambah Langkah" untuk memulai.
            </div>
          ) : (
            calcConfig.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`bg-white rounded-xl border shadow-sm p-5 space-y-4 transition ${
                  step.enabled !== false
                    ? 'border-slate-200 hover:border-amber-400'
                    : 'border-slate-200 bg-slate-50/50 opacity-65'
                }`}
              >
                {/* Step Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                      className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-amber-500 outline-none px-1"
                      placeholder="Nama Langkah (misal: Biaya Bahan Atap)"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStep(step.id, { enabled: step.enabled === false })}
                      className={`text-xs px-2 py-1 rounded-md font-semibold border ${
                        step.enabled !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {step.enabled !== false ? 'Aktif' : 'Non-Aktif'}
                    </button>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Naikkan Urutan"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === calcConfig.steps.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Turunkan Urutan"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(step.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-1"
                        title="Hapus Langkah"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* 1. Value Source (Yang Dihitung) */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Yang Dihitung (Dasar Perhitungan)
                    </label>
                    <select
                      value={step.valueSource || 'area'}
                      onChange={(e) =>
                        handleUpdateStep(step.id, {
                          valueSource: e.target.value as FormulaValueSource,
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {VALUE_SOURCE_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Price Source (Harga dipake) */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Harga Yang Dipakai (Sumber Harga)
                    </label>
                    <select
                      value={step.priceSource || 'material'}
                      onChange={(e) =>
                        handleUpdateStep(step.id, {
                          priceSource: e.target.value as FormulaPriceSource,
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {PRICE_SOURCE_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Input Configuration metadata UI for owner */}
                  {step.valueSource === 'custom_input' && (
                    <div className="sm:col-span-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 space-y-3">
                      <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pengaturan Parameter Input Kustom</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Nama Input
                          </label>
                          <input
                            type="text"
                            value={step.customInputConfig?.label || ''}
                            onChange={(e) =>
                              handleUpdateStep(step.id, {
                                customInputConfig: {
                                  label: e.target.value,
                                  unit: step.customInputConfig?.unit || 'titik',
                                  defaultValue: step.customInputConfig?.defaultValue ?? 1,
                                },
                              })
                            }
                            placeholder="Misal: Jumlah Titik Lampu"
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Satuan
                          </label>
                          <input
                            type="text"
                            value={step.customInputConfig?.unit || ''}
                            onChange={(e) =>
                              handleUpdateStep(step.id, {
                                customInputConfig: {
                                  label: step.customInputConfig?.label || 'Input Kustom',
                                  unit: e.target.value,
                                  defaultValue: step.customInputConfig?.defaultValue ?? 1,
                                },
                              })
                            }
                            placeholder="Misal: titik, pcs, meter"
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Nilai Awal (Default)
                          </label>
                          <input
                            type="number"
                            value={step.customInputConfig?.defaultValue ?? 1}
                            onChange={(e) =>
                              handleUpdateStep(step.id, {
                                customInputConfig: {
                                  label: step.customInputConfig?.label || 'Input Kustom',
                                  unit: step.customInputConfig?.unit || 'titik',
                                  defaultValue: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Catalog Specific SourceId Filtered by Service allowed IDs */}
                  {step.priceSource === 'material' && (
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Pilihan Bahan Spesifik (Opsional - Kosongkan untuk Pilihan Konsumen)
                      </label>
                      <select
                        value={step.sourceId || ''}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { sourceId: e.target.value || undefined })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Bebas (Tergantung pilihan konsumen di estimator) --</option>
                        {allowedMaterials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Rp {m.pricingRule.rate.toLocaleString('id-ID')}/{m.pricingRule.unitLabel || 'm²'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {step.priceSource === 'frame' && (
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Pilihan Rangka Spesifik (Opsional)
                      </label>
                      <select
                        value={step.sourceId || ''}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { sourceId: e.target.value || undefined })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Bebas (Tergantung pilihan konsumen di estimator) --</option>
                        {allowedFrames.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} (Rp {f.pricingRule.rate.toLocaleString('id-ID')}/{f.pricingRule.unitLabel || 'm²'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {step.priceSource === 'package' && (
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">Pilih Paket Spesifik</label>
                      <select
                        value={step.sourceId || ''}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { sourceId: e.target.value || undefined })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Pilih Paket Master Data --</option>
                        {allowedPackages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} (Rp {pkg.price.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom rate input */}
                  {(step.priceSource === 'custom_rate' ||
                    step.priceSource === 'fixed_amount' ||
                    step.priceSource === 'percentage_rate') && (
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {step.priceSource === 'percentage_rate'
                          ? 'Nilai Persentase (misal 0.15 = 15%)'
                          : 'Tarif / Rate Custom (Rp)'}
                      </label>
                      <input
                        type="number"
                        step={step.priceSource === 'percentage_rate' ? 0.01 : 1000}
                        value={step.customRate || 0}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { customRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  )}

                  {/* 4. Operation (Operasi Hitungan) */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Operasi Hitungan</label>
                    <select
                      value={step.operation || step.operator || 'multiply'}
                      onChange={(e) =>
                        handleUpdateStep(step.id, {
                          operation: e.target.value as FormulaOperator,
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {OPERATION_OPTIONS.map((op) => (
                        <option key={op.value} value={op.value}>
                          [{op.symbol}] {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step Description / Notes */}
                <div>
                  <label className="font-semibold text-slate-700 block text-xs mb-1">
                    Keterangan Penjelasan Langkah (Untuk Buku Hitungan)
                  </label>
                  <input
                    type="text"
                    value={step.notes || ''}
                    onChange={(e) => handleUpdateStep(step.id, { notes: e.target.value })}
                    placeholder="Contoh: Perhitungan bahan berdasarkan luas bidang atap terpasang."
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            ))
          )}

          {/* Owner Explanatory Notes */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Catatan Penjelasan Transparan Owner</span>
            </h3>
            <textarea
              rows={3}
              value={calcConfig.explanatoryNotes || ''}
              onChange={(e) => setCalcConfig({ ...calcConfig, explanatoryNotes: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Tuliskan catatan penjelasan transparan untuk pelanggan pada dokumen Buku Hitungan..."
            />
          </div>
        </div>

        {/* Right Column: Live Interactive Simulation Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Simulasi Hitungan Draf</h3>
              </div>
              <AdminBadge variant="amber">Live In-Memory</AdminBadge>
            </div>

            {/* Simulation Parameters Input */}
            <div className="space-y-3 text-xs bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Parameter Pengujian Simulasi</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block text-[11px]">Panjang (m):</label>
                  <input
                    type="number"
                    min={1}
                    value={simLength}
                    onChange={(e) => setSimLength(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[11px]">Lebar (m):</label>
                  <input
                    type="number"
                    min={1}
                    value={simWidth}
                    onChange={(e) => setSimWidth(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-bold"
                  />
                </div>
              </div>

              {allowedMaterials.length > 0 && (
                <div>
                  <label className="text-slate-400 block text-[11px]">Bahan Test:</label>
                  <select
                    value={simMaterialId}
                    onChange={(e) => setSimMaterialId(e.target.value)}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                  >
                    {allowedMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {allowedFrames.length > 0 && (
                <div>
                  <label className="text-slate-400 block text-[11px]">Rangka Test:</label>
                  <select
                    value={simFrameId}
                    onChange={(e) => setSimFrameId(e.target.value)}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                  >
                    {allowedFrames.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Simulation Results Output */}
            {simulationResult ? (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Luas Terhitung:</span>
                  <span className="font-bold text-slate-200">
                    {simulationResult.billableUnits.actual} m²
                    {simulationResult.billableUnits.minimumApplied && (
                      <span className="text-amber-400 ml-1">(Min. Billing Applied)</span>
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Rincian Per Langkah:</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {simulationResult.steps.map((st, i) => (
                      <div
                        key={i}
                        className="bg-slate-800/90 p-2.5 rounded-lg text-xs space-y-1 border border-slate-700/50"
                      >
                        <div className="flex items-center justify-between text-slate-200 font-semibold">
                          <span>{st.name}</span>
                          <span className="text-amber-400">Rp {st.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Estimasi Total Simulasi:</span>
                  <span className="text-lg font-black text-amber-400">
                    Rp {simulationResult.grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-800/50 rounded-xl italic">
                Langkah perhitungan belum dapat disimulasikan. Pastikan parameter terisi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
