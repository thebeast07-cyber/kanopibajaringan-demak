'use client';

import React, { useEffect, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { CompleteDataset, EstimatorInput } from '../../../types/domain';
import { generateBukuHitungan, BukuHitunganDocument } from '../../../lib/estimator/formulaEngine';
import { BookOpen, Printer, Download, CheckCircle2, FileText, Info } from 'lucide-react';

export default function AdminBukuHitunganPage() {
  const [dataset, setDataset] = useState<CompleteDataset | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('svc-kanopi-alderon');
  const [testLength, setTestLength] = useState<number>(5);
  const [testWidth, setTestWidth] = useState<number>(4);
  const [doc, setDoc] = useState<BukuHitunganDocument | null>(null);

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
    const firstMat = dataset.materials.find((m) => service.allowedMaterialIds.includes(m.id)) || dataset.materials[0];
    const firstFrame = dataset.frames.find((f) => service.allowedFrameIds.includes(f.id)) || dataset.frames[0];
    const firstLabor = dataset.laborOptions.find((l) => service.allowedLaborIds.includes(l.id)) || dataset.laborOptions[0];

    const input: EstimatorInput = {
      serviceId: service.id,
      length: testLength,
      width: testWidth,
      materialId: firstMat?.id,
      frameId: firstFrame?.id,
      laborId: firstLabor?.id,
    };

    try {
      const generated = generateBukuHitungan(input, dataset);
      setDoc(generated);
    } catch (e) {
      console.error(e);
    }
  }, [dataset, selectedServiceId, testLength, testWidth]);

  if (!dataset || !doc) return <div className="p-8 text-slate-500">Memuat Buku Hitungan...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Buku Hitungan: Dokumen Penjelasan Transparan Owner</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjelasan transparan tempat setiap angka kalkulasi berasal, dihasilkan langsung dari Pricing Engine secara konsisten.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Cetak Dokumen Hitungan</span>
        </button>
      </div>

      {/* Inputs Sandbox */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Pilih Layanan</label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
          >
            {dataset.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Panjang Sampel (m)</label>
          <input
            type="number"
            value={testLength}
            onChange={(e) => setTestLength(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Lebar Sampel (m)</label>
          <input
            type="number"
            value={testWidth}
            onChange={(e) => setTestWidth(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-900"
          />
        </div>
      </div>

      {/* Generated Document Sheet */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-900 print:shadow-none print:border-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-amber-600">
              Dokumen Resmi Kalkulasi Transparan
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{doc.serviceTitle}</h2>
            <div className="text-xs text-slate-500 mt-1">Versi Aturan: {doc.pricingVersion}</div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Dimensi Sampel:</div>
            <strong className="text-sm font-bold text-slate-900">{doc.inputSummary.dimensionsText}</strong>
          </div>
        </div>

        {/* Minimum Threshold Warning if Applied */}
        {doc.inputSummary.minimumApplied && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Catatan Minimum Billing: Luas aktual proyek berada di bawah batas minimum pengerjaan. Maka biaya dihitung menggunakan acuan minimum <strong>{doc.inputSummary.appliedUnitsText}</strong>.
            </span>
          </div>
        )}

        {/* Breakdown Steps */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Rincian Langkah Kalkulasi Bisnis:
          </h3>

          <div className="space-y-3">
            {doc.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {step.stepNumber}. {step.name}
                  </div>
                  <div className="text-slate-500">{step.description}</div>
                  <div className="text-amber-800 font-mono text-[11px] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded inline-block">
                    Rumus: {step.formulaText}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Subtotal Step</div>
                  <div className="text-base font-bold text-slate-900">
                    Rp {step.subtotal.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grand Total Footer */}
        <div className="p-5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Estimasi Awal Proyek:</div>
            <div className="text-xs text-amber-400 mt-0.5">Durasi Pengerjaan: {doc.durationText || 'data kosong'}</div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-amber-400">
              Rp {doc.grandTotal.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Explanatory Notes */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <strong className="text-slate-900 font-semibold block">Catatan Penjelasan Owner:</strong>
          <p>{doc.explanatoryNotes}</p>
        </div>
      </div>
    </div>
  );
}
