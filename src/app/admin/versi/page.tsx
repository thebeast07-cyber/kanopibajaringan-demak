'use client';

import React, { useEffect, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { PricingVersionSchema } from '../../../types/domain';
import {
  ImpactPreviewResult,
  PublishValidationResult,
} from '../../../lib/cms/publishValidation';
import {
  GitBranch,
  Plus,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';

export default function AdminVersiPage() {
  const [versions, setVersions] = useState<PricingVersionSchema[]>([]);
  const [impactPreview, setImpactPreview] = useState<ImpactPreviewResult | null>(null);
  const [validationResult, setValidationResult] = useState<PublishValidationResult | null>(null);
  const [draftReason, setDraftReason] = useState<string>('Penyesuaian harga bahan & upah tukang');
  const [authorName, setAuthorName] = useState<string>('Owner');
  const [notice, setNotice] = useState<string>('');

  const refreshData = () => {
    setVersions(defaultCmsRepository.getVersions());
    setImpactPreview(defaultCmsRepository.getImpactPreview());
    setValidationResult(defaultCmsRepository.validateCurrentDraft());
  };

  useEffect(() => {
    refreshData();
    return defaultCmsRepository.subscribe(() => {
      refreshData();
    });
  }, []);

  const handleCreateDraft = () => {
    if (!draftReason) return;
    const newDraft = defaultCmsRepository.createDraftVersion(draftReason, authorName || 'Owner');
    setNotice(`Draf versi baru (${newDraft.version}) berhasil dibuat!`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handlePublish = (version: string) => {
    try {
      defaultCmsRepository.publishVersion(version, authorName || 'Owner');
      setNotice(`Versi ${version} telah resmi DIPUBLIKASIKAN ke website utama!`);
      setTimeout(() => setNotice(''), 3000);
    } catch (err: any) {
      alert(err?.message || 'Gagal mempublikasikan draf');
    }
  };

  const handleRevert = (version: string) => {
    const restored = defaultCmsRepository.revertToVersion(version, authorName || 'Owner');
    setNotice(`Versi historis ${version} dikembalikan melalui versi baru ${restored.version}!`);
    setTimeout(() => setNotice(''), 3000);
  };

  const hasDraft = defaultCmsRepository.hasDraft();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-amber-600" />
            <span>Versi Harga & Pengendalian Immutability (Versioning System)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Setiap penyesuaian aturan bisnis disimpan dalam versi terikat terisolasi. Versi yang sudah dipublikasikan bersifat immutable (tidak dapat diubah secara diam-diam).
          </p>
        </div>
        <a
          href="/admin/panduan#s14-impact-preview"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors shrink-0 self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>Panduan Publish & Versi</span>
        </a>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Impact Preview & Structural Validation Card (Shown when an active draft exists) */}
      {hasDraft && impactPreview && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-amber-400">
                Pratinjau Dampak Perubahan Harga (Impact Preview)
              </h3>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-semibold">
              Skenario Acuan: 5m × 4m ({impactPreview.serviceTitle})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Versi Dipublikasikan ({impactPreview.publishedVersion}):</span>
              <div className="text-2xl font-bold text-white font-mono">
                Rp {impactPreview.publishedTotal.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-1">
              <span className="text-xs text-amber-400 font-medium">Draf Versi Aktif ({impactPreview.draftVersion}):</span>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                Rp {impactPreview.draftTotal.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Selisih & Perubahan:</span>
              <div className="flex items-center gap-2">
                {impactPreview.difference > 0 ? (
                  <span className="text-2xl font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <TrendingUp className="w-5 h-5" />+{impactPreview.percentageDifference}%
                  </span>
                ) : impactPreview.difference < 0 ? (
                  <span className="text-2xl font-bold text-rose-400 flex items-center gap-1 font-mono">
                    <TrendingDown className="w-5 h-5" />{impactPreview.percentageDifference}%
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-slate-300 font-mono">0% (Sama)</span>
                )}
              </div>
            </div>
          </div>

          {/* Structural Validation Status */}
          {validationResult && (
            <div className="pt-2">
              {validationResult.valid ? (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Validasi Struktural Draf: <strong>Draf Layak & Valid untuk Dipublikasikan</strong> (Bebas kesalahan referensi/relasi data).</span>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Validasi Gagal: Draf memiliki kesalahan referensi data!</span>
                  </div>
                  <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-200">
                    {validationResult.issues.map((iss, idx) => (
                      <li key={idx}>{iss.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Draft Action */}
      {!hasDraft && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Buat Draf Versi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Alasan Perubahan Versi Baru</label>
              <input
                type="text"
                value={draftReason}
                onChange={(e) => setDraftReason(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Contoh: Kenaikan harga spandek & penyesuaian minimal billing"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCreateDraft}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Draf Versi Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
          Daftar Versi Harga & Status Publikasi
        </div>

        <div className="divide-y divide-slate-100">
          {versions.map((ver) => (
            <div key={ver.version} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/80 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-slate-900">{ver.version}</strong>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      ver.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : ver.status === 'draft'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {ver.status}
                  </span>
                </div>
                <div className="text-slate-600">{ver.createdReason}</div>
                <div className="text-[10px] text-slate-400">
                  Dibuat oleh: {ver.createdBy} • {new Date(ver.createdAt).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ver.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(ver.version)}
                    disabled={Boolean(validationResult && !validationResult.valid)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                      validationResult && !validationResult.valid
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Publikasikan Versi Ini</span>
                  </button>
                )}

                {ver.status === 'archived' && (
                  <button
                    onClick={() => handleRevert(ver.version)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kembalikan Versi Ini</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
