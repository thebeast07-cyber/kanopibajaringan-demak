'use client';

import React, { useState, useMemo } from 'react';
import {
  CompleteDataset,
  EstimatorInput,
  ServiceSchema,
  MaterialSchema,
  FrameSchema,
  LaborOptionSchema,
  FinishingSchema,
  AddOnSchema,
  SiteConditionSchema,
} from '@/types/domain';
import { calculateEstimate } from '@/lib/estimator/pricingEngine';
import { getCustomInputDescriptors, CustomInputDescriptor } from '@/lib/estimator/formulaEngine';
import { buildWhatsAppLeadUrl, formatRupiah } from '@/lib/whatsapp';
import {
  Calculator,
  Ruler,
  CheckCircle2,
  PhoneCall,
  Clock,
  Layers,
  Info,
  ChevronRight,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';

interface EstimatorWizardProps {
  dataset: CompleteDataset;
  initialServiceId?: string;
}

export function EstimatorWizard({ dataset, initialServiceId }: EstimatorWizardProps) {
  const defaultService = dataset.services[0];
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || defaultService?.id || ''
  );

  const activeService: ServiceSchema =
    dataset.services.find((s) => s.id === selectedServiceId) || defaultService;

  // Allowed Options
  const availableMaterials: MaterialSchema[] = useMemo(
    () => dataset.materials.filter((m) => activeService.allowedMaterialIds.includes(m.id)),
    [dataset.materials, activeService]
  );

  const availableFrames: FrameSchema[] = useMemo(
    () => dataset.frames.filter((f) => activeService.allowedFrameIds.includes(f.id)),
    [dataset.frames, activeService]
  );

  const availableLaborOptions: LaborOptionSchema[] = useMemo(
    () => dataset.laborOptions.filter((l) => activeService.allowedLaborIds.includes(l.id)),
    [dataset.laborOptions, activeService]
  );

  const availableFinishings: FinishingSchema[] = useMemo(
    () => dataset.finishings.filter((fn) => activeService.allowedFinishingIds.includes(fn.id)),
    [dataset.finishings, activeService]
  );

  const availableAddOns: AddOnSchema[] = useMemo(
    () => dataset.addOns.filter((a) => activeService.allowedAddOnIds.includes(a.id)),
    [dataset.addOns, activeService]
  );

  const availableSiteConditions: SiteConditionSchema[] = useMemo(
    () => dataset.siteConditions.filter((sc) => activeService.allowedSiteConditionIds.includes(sc.id)),
    [dataset.siteConditions, activeService]
  );

  // Inputs State
  const [lengthInput, setLengthInput] = useState<number>(5);
  const [widthInput, setWidthInput] = useState<number>(4);
  const [quantityInput, setQuantityInput] = useState<number>(1);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    availableMaterials[0]?.id || ''
  );
  const [selectedFrameId, setSelectedFrameId] = useState<string>(
    availableFrames[0]?.id || ''
  );
  const [selectedLaborId, setSelectedLaborId] = useState<string>(
    availableLaborOptions[0]?.id || ''
  );
  const [selectedFinishingId, setSelectedFinishingId] = useState<string>(
    availableFinishings[0]?.id || ''
  );

  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [customInputsState, setCustomInputsState] = useState<Record<string, number>>({});

  const calculationConfig = useMemo(() => {
    return dataset.calculationConfigs?.find((c) => c.serviceId === activeService.id);
  }, [dataset, activeService.id]);

  const customInputDescriptors: CustomInputDescriptor[] = useMemo(() => {
    return getCustomInputDescriptors(calculationConfig);
  }, [calculationConfig]);

  // Lead Info
  const [customerName, setCustomerName] = useState<string>('');
  const [cityOrDistrict, setCityOrDistrict] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Step Tracking (1..5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const newService = dataset.services.find((s) => s.id === serviceId) || defaultService;

    const newMats = dataset.materials.filter((m) => newService.allowedMaterialIds.includes(m.id));
    const newFrames = dataset.frames.filter((f) => newService.allowedFrameIds.includes(f.id));
    const newLabors = dataset.laborOptions.filter((l) => newService.allowedLaborIds.includes(l.id));
    const newFinish = dataset.finishings.filter((fn) => newService.allowedFinishingIds.includes(fn.id));

    setSelectedMaterialId(newMats[0]?.id || '');
    setSelectedFrameId(newFrames[0]?.id || '');
    setSelectedLaborId(newLabors[0]?.id || '');
    setSelectedFinishingId(newFinish[0]?.id || '');
    setSelectedAddonIds([]);
    setSelectedConditionIds([]);
    setCustomInputsState({});
  };

  const currentInput: EstimatorInput = {
    serviceId: activeService.id,
    length: lengthInput,
    width: widthInput,
    quantity: quantityInput,
    materialId: selectedMaterialId,
    frameId: selectedFrameId,
    laborId: selectedLaborId,
    finishingId: selectedFinishingId,
    addonIds: selectedAddonIds,
    siteConditionIds: selectedConditionIds,
    customInputs: customInputsState,
    notes: additionalNotes,
  };

  const calculationResult = useMemo(() => {
    try {
      return calculateEstimate(currentInput, dataset);
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [currentInput, dataset]);

  const toggleAddon = (addonId: string) => {
    if (selectedAddonIds.includes(addonId)) {
      setSelectedAddonIds(selectedAddonIds.filter((id) => id !== addonId));
    } else {
      setSelectedAddonIds([...selectedAddonIds, addonId]);
    }
  };

  const toggleCondition = (condId: string) => {
    if (selectedConditionIds.includes(condId)) {
      setSelectedConditionIds(selectedConditionIds.filter((id) => id !== condId));
    } else {
      setSelectedConditionIds([...selectedConditionIds, condId]);
    }
  };

  const snapshot = calculationResult?.snapshot;

  const handleOpenWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshot) return;
    if (!customerName || !cityOrDistrict) {
      alert('Mohon isi Nama Lengkap dan Lokasi/Kecamatan Anda.');
      return;
    }

    const whatsappUrl = buildWhatsAppLeadUrl(
      snapshot,
      {
        customerName,
        cityOrDistrict,
        additionalNotes,
      },
      dataset
    );

    window.open(whatsappUrl, '_blank');
  };

  const isGerobakOrBooth =
    activeService?.category === 'gerobak' || activeService?.category === 'booth';
  const materialLabel = isGerobakOrBooth ? 'Material Body & Dinding' : 'Material Atap';
  const materialStepHeading = isGerobakOrBooth
    ? '03. Pilih Material Body & Dinding'
    : '03. Pilih Material Penutup Atap';

  return (
    <section id="kalkulator" className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] text-[#1C1917] border-b border-[#E7E2DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#EAF5ED] border border-[#C2E3CD] text-[#15803D] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-[#16A34A]" />
            <span>KALKULATOR ESTIMASI BIAYA PROYEK</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight font-heading">
            Hitung Perkiraan Biaya Kanopi & Atap Anda
          </h2>
          <p className="text-base text-[#57534E]">
            Masukkan dimensi area dan spesifikasi material pilihan untuk mendapatkan rincian estimasi biaya baku dan waktu pengerjaan.
          </p>
        </div>

        {/* Estimator Split Configurator Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Controls Panel */}
          <div className="lg:col-span-7 bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 space-y-7 shadow-sm">
            
            {/* Step Progression Bar */}
            <div className="grid grid-cols-5 gap-1.5 border-b border-[#E7E2DA] pb-5 text-center text-xs font-semibold">
              {[
                { step: 1, label: '01 Jenis' },
                { step: 2, label: '02 Ukuran' },
                { step: 3, label: isGerobakOrBooth ? '03 Body' : '03 Atap' },
                { step: 4, label: '04 Rangka' },
                { step: 5, label: '05 Tambahan' },
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => setCurrentStep(item.step)}
                    className={`py-2.5 px-1 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#1B3B2B] text-white font-bold shadow-sm'
                        : isPassed
                        ? 'bg-[#EAF5ED] text-[#15803D] font-bold border border-[#C2E3CD]'
                        : 'bg-[#FAF8F5] text-[#78716C] border border-[#E7E2DA] hover:text-[#1C1917]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* STEP 01: Service Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1917] font-heading">
                  01. Pilih Jenis Pekerjaan Konstruksi
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {dataset.services.map((svc) => {
                    const isSelected = svc.id === selectedServiceId;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => handleServiceChange(svc.id)}
                        className={`p-4 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-[#EAF5ED] border-[#16A34A] text-[#15803D] font-semibold shadow-sm'
                            : 'bg-white border-[#E7E2DA] text-[#1C1917] hover:border-[#A8A095]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#1C1917] font-heading">{svc.title}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />}
                        </div>
                        <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed line-clamp-2">{svc.shortDescription}</p>
                        <span className="text-[11px] font-medium text-[#78716C] uppercase block mt-2.5">
                          Acuan Perhitungan: {svc.measurementType}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end border-t border-[#E7E2DA]">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>Lanjut: Masukkan Ukuran</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 02: Dimensions */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#E7E2DA] pb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1917] font-heading">
                    02. Masukkan Dimensi Proyek
                  </label>
                  <span className="text-xs font-semibold uppercase bg-[#EAF5ED] text-[#15803D] px-2.5 py-1 rounded-lg border border-[#C2E3CD]">
                    Satuan: {activeService.measurementType}
                  </span>
                </div>

                {activeService.measurementType === 'm2' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-[#57534E]">
                        <span>Panjang (Meter):</span>
                        <span className="text-[#1C1917] font-bold">{lengthInput} m</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={lengthInput}
                        onChange={(e) => setLengthInput(parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-4 py-3 text-[#1C1917] font-bold text-lg focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-[#57534E]">
                        <span>Lebar (Meter):</span>
                        <span className="text-[#1C1917] font-bold">{widthInput} m</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={widthInput}
                        onChange={(e) => setWidthInput(parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-4 py-3 text-[#1C1917] font-bold text-lg focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>
                  </div>
                )}

                {activeService.measurementType === 'meter' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-[#57534E]">
                      <span>Panjang Total (Meter Lari):</span>
                      <span className="text-[#1C1917] font-bold">{lengthInput} m</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={lengthInput}
                      onChange={(e) => setLengthInput(parseFloat(e.target.value) || 1)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-4 py-3 text-[#1C1917] font-bold text-lg focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                )}

                {activeService.measurementType === 'unit' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-[#57534E]">
                      <span>Jumlah Unit / Pasang:</span>
                      <span className="text-[#1C1917] font-bold">{quantityInput} unit</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-4 py-3 text-[#1C1917] font-bold text-lg focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                )}

                {/* Dynamic Custom Input Descriptors */}
                {customInputDescriptors.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[#E7E2DA]">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#16A34A]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1C1917] font-heading">
                        Parameter Input Spesifik (Kustom)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customInputDescriptors.map((descriptor) => {
                        const val =
                          customInputsState[descriptor.key] ?? descriptor.defaultValue ?? 1;
                        return (
                          <div key={descriptor.key} className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-[#57534E]">
                              <span>{descriptor.label}:</span>
                              <span className="text-[#1C1917] font-bold">
                                {val} {descriptor.unit || ''}
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={val}
                              onChange={(e) => {
                                const num = parseFloat(e.target.value) || 0;
                                setCustomInputsState((prev) => ({
                                  ...prev,
                                  [descriptor.key]: num,
                                }));
                              }}
                              className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-4 py-3 text-[#1C1917] font-bold text-lg focus:outline-none focus:border-[#16A34A]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Minimum Billing Callout */}
                {snapshot && snapshot.billableUnits.applied > snapshot.billableUnits.actual && (
                  <div className="flex items-start gap-3 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                    <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[11px]">Ketentuan Minimum Order:</p>
                      <p className="text-xs text-[#78350F] mt-0.5 leading-relaxed">
                        Ukuran aktual ({snapshot.billableUnits.actual} {snapshot.billableUnits.unitType}) berada di bawah batas minimum billing. Perhitungan tagihan dihitung dari minimum <strong>{snapshot.billableUnits.applied} {snapshot.billableUnits.unitType}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-[#E7E2DA]">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] font-semibold text-xs uppercase"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>Lanjut: {materialLabel}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 03: Material */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1917] font-heading">
                  {materialStepHeading}
                </label>

                {availableMaterials.length > 0 && (
                  <div className="space-y-2.5">
                    {availableMaterials.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                          m.id === selectedMaterialId
                            ? 'bg-[#EAF5ED] border-[#16A34A] text-[#15803D] font-semibold shadow-sm'
                            : 'bg-white border-[#E7E2DA] text-[#1C1917] hover:border-[#A8A095]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="material"
                          checked={m.id === selectedMaterialId}
                          onChange={() => setSelectedMaterialId(m.id)}
                          className="mt-1 accent-[#16A34A]"
                        />
                        <div>
                          <p className="font-bold text-sm text-[#1C1917] font-heading">{m.name}</p>
                          <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">{m.specification}</p>
                          {m.warrantyInfo && (
                            <span className="text-[11px] text-[#15803D] font-medium block mt-1">🛡️ {m.warrantyInfo}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-[#E7E2DA]">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] font-semibold text-xs uppercase"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>Lanjut: Spesifikasi Rangka</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 04: Frame */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1917] font-heading">
                  04. Pilih Spesifikasi Rangka Utama
                </label>

                {availableFrames.length > 0 && (
                  <div className="space-y-2.5">
                    {availableFrames.map((f) => (
                      <label
                        key={f.id}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                          f.id === selectedFrameId
                            ? 'bg-[#EAF5ED] border-[#16A34A] text-[#15803D] font-semibold shadow-sm'
                            : 'bg-white border-[#E7E2DA] text-[#1C1917] hover:border-[#A8A095]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="frame"
                          checked={f.id === selectedFrameId}
                          onChange={() => setSelectedFrameId(f.id)}
                          className="mt-1 accent-[#16A34A]"
                        />
                        <div>
                          <p className="font-bold text-sm text-[#1C1917] font-heading">{f.name}</p>
                          <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">{f.specification}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {availableFinishings.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-semibold text-[#57534E]">Finishing & Pengecatan:</span>
                    <div className="space-y-2">
                      {availableFinishings.map((fn) => (
                        <label
                          key={fn.id}
                          className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            fn.id === selectedFinishingId
                              ? 'bg-[#EAF5ED] border-[#16A34A] text-[#15803D] font-semibold shadow-sm'
                              : 'bg-white border-[#E7E2DA] text-[#1C1917] hover:border-[#A8A095]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="finishing"
                            checked={fn.id === selectedFinishingId}
                            onChange={() => setSelectedFinishingId(fn.id)}
                            className="mt-1 accent-[#16A34A]"
                          />
                          <div>
                            <p className="font-bold text-sm text-[#1C1917] font-heading">{fn.name}</p>
                            <p className="text-xs text-[#57534E] mt-0.5">{fn.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-[#E7E2DA]">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] font-semibold text-xs uppercase"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(5)}
                    className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>Lanjut: Tambahan</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 05: Addons & Site Conditions */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1917] font-heading">
                  05. Pekerjaan Tambahan & Akses Lokasi (Opsional)
                </label>

                {availableAddOns.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-[#57534E]">Pekerjaan Tambahan:</span>
                    <div className="space-y-2">
                      {availableAddOns.map((addon) => {
                        const checked = selectedAddonIds.includes(addon.id);
                        return (
                          <label
                            key={addon.id}
                            className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              checked
                                ? 'bg-[#EAF5ED] border-[#16A34A] text-[#15803D] font-semibold shadow-sm'
                                : 'bg-white border-[#E7E2DA] text-[#1C1917] hover:border-[#A8A095]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAddon(addon.id)}
                              className="mt-1 accent-[#16A34A]"
                            />
                            <div>
                              <p className="font-bold text-sm text-[#1C1917] font-heading">{addon.name}</p>
                              <p className="text-xs text-[#57534E] mt-0.5">{addon.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSiteConditions.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-semibold text-[#57534E]">Kondisi Akses Lokasi:</span>
                    <div className="space-y-2">
                      {availableSiteConditions.map((cond) => {
                        const checked = selectedConditionIds.includes(cond.id);
                        return (
                          <label
                            key={cond.id}
                            className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              checked
                                ? 'bg-[#EAF5ED] border-[#16A34A] text-[#15803D] font-semibold shadow-sm'
                                : 'bg-white border-[#E7E2DA] text-[#1C1917] hover:border-[#A8A095]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCondition(cond.id)}
                              className="mt-1 accent-[#16A34A]"
                            />
                            <div>
                              <p className="font-bold text-sm text-[#1C1917] font-heading">{cond.name}</p>
                              <p className="text-xs text-[#57534E] mt-0.5">{cond.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-[#E7E2DA]">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] font-semibold text-xs uppercase"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <div className="text-xs font-bold text-[#15803D] flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> SIAP KIRIM HASIL VIA WA
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Professional Estimate Result Sheet */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-7 space-y-6 shadow-md sticky top-24">
              
              <div className="flex items-center justify-between border-b border-[#E7E2DA] pb-3.5 text-xs font-bold text-[#1C1917]">
                <span className="uppercase flex items-center gap-2 text-[#15803D]">
                  <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" /> HASIL ESTIMASI PROYEK
                </span>
                <span className="text-[#78716C] text-[11px] font-semibold">RINGKASAN BIAYA</span>
              </div>

              {snapshot ? (
                <div className="space-y-5">
                  {/* Dominant Price Highlight */}
                  <div className="p-4 bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl space-y-1">
                    <span className="text-xs text-[#78716C] font-medium">Perkiraan Total Biaya Proyek:</span>
                    <div className="text-3xl font-bold text-[#1C1917] font-heading">
                      {formatRupiah(snapshot.breakdown.total)}
                    </div>
                    <p className="text-[11px] text-[#78716C]">
                      Volume Dihitung: {snapshot.billableUnits.applied} {snapshot.billableUnits.unitType}
                    </p>
                  </div>

                  {/* Duration Highlight */}
                  <div className="flex items-center gap-3 p-3.5 bg-[#EAF5ED] border border-[#C2E3CD] rounded-xl text-xs">
                    <Clock className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <div>
                      <span className="text-[#57534E]">Estimasi Waktu Pengerjaan:</span>
                      <p className="font-bold text-[#1C1917] text-sm mt-0.5 font-heading">{snapshot.duration.text}</p>
                    </div>
                  </div>

                  {/* Itemized Table Breakdown */}
                  <div className="space-y-2.5 text-xs border-t border-[#E7E2DA] pt-4">
                    <p className="font-bold text-[#1C1917] uppercase tracking-wider text-[11px] mb-2 font-heading">
                      Rincian Komponen Biaya:
                    </p>
                    <div className="flex justify-between text-[#57534E]">
                      <span>Biaya Dasar Rangka:</span>
                      <span className="text-[#1C1917] font-bold">{formatRupiah(snapshot.breakdown.baseCost)}</span>
                    </div>
                    <div className="flex justify-between text-[#57534E]">
                      <span>Material Penutup:</span>
                      <span className="text-[#1C1917] font-bold">{formatRupiah(snapshot.breakdown.materialCost)}</span>
                    </div>
                    {snapshot.breakdown.frameCost > 0 && (
                      <div className="flex justify-between text-[#57534E]">
                        <span>Pilihan Rangka:</span>
                        <span className="text-[#1C1917] font-bold">{formatRupiah(snapshot.breakdown.frameCost)}</span>
                      </div>
                    )}
                    {snapshot.breakdown.laborCost > 0 && (
                      <div className="flex justify-between text-[#57534E]">
                        <span>Jasa Pemasangan:</span>
                        <span className="text-[#1C1917] font-bold">{formatRupiah(snapshot.breakdown.laborCost)}</span>
                      </div>
                    )}
                    {snapshot.breakdown.finishingCost > 0 && (
                      <div className="flex justify-between text-[#57534E]">
                        <span>Pengecatan / Finishing:</span>
                        <span className="text-[#1C1917] font-bold">{formatRupiah(snapshot.breakdown.finishingCost)}</span>
                      </div>
                    )}
                    {snapshot.breakdown.addOnsCost > 0 && (
                      <div className="flex justify-between text-[#57534E]">
                        <span>Pekerjaan Tambahan:</span>
                        <span className="text-[#1C1917] font-bold">{formatRupiah(snapshot.breakdown.addOnsCost)}</span>
                      </div>
                    )}
                    {snapshot.breakdown.percentageAdjustmentsTotal > 0 && (
                      <div className="flex justify-between text-[#15803D]">
                        <span>Akses Lokasi Khusus:</span>
                        <span className="font-bold">+{formatRupiah(snapshot.breakdown.percentageAdjustmentsTotal)}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer WhatsApp Submission Form */}
                  <form onSubmit={handleOpenWhatsApp} className="space-y-3 pt-4 border-t border-[#E7E2DA]">
                    <p className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-heading">
                      Kirim Rincian Hasil ke WhatsApp:
                    </p>
                    
                    <div>
                      <input
                        type="text"
                        placeholder="Nama Lengkap Anda *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-3.5 py-3 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Kota / Kecamatan Anda *"
                        value={cityOrDistrict}
                        onChange={(e) => setCityOrDistrict(e.target.value)}
                        required
                        className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-3.5 py-3 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>

                    <div>
                      <textarea
                        placeholder="Catatan Tambahan (mis: Jadwal survei lokasi)"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-3.5 py-3 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:translate-y-0.5 mt-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Kirim Hasil Estimasi ke WhatsApp</span>
                    </button>
                  </form>

                  <div className="p-3.5 bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl text-[11px] text-[#78716C] leading-relaxed">
                    ℹ️ <strong>Catatan Survei:</strong> Estimasi harga di atas merupakan perkiraan awal. Kepastian penawaran final ditentukan secara transparan setelah survei lokasi gratis oleh Tim Owner.
                  </div>
                </div>
              ) : (

                <div className="py-12 text-center text-[#78716C] text-xs">
                  Pilih opsi di samping untuk kalkulasi otomatis.
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

