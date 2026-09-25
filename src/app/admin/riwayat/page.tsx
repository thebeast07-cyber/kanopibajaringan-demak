'use client';

import React, { useEffect, useState } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { AuditLogEntry } from '../../../types/domain';
import { History, User, Clock, Tag } from 'lucide-react';

export default function AdminRiwayatPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setLogs(defaultCmsRepository.getAuditLogs());
    return defaultCmsRepository.subscribe(() => {
      setLogs(defaultCmsRepository.getAuditLogs());
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <span>Riwayat Perubahan Aturan & Harga (Audit Log)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Catatan Jejak Audit lengkap mencatat pembuat perubahan, tanggal, item yang diubah, serta nilai lama dan baru.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Waktu Perubahan</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Item Yang Diubah</th>
              <th className="py-3 px-4">Nilai Lama (Semula)</th>
              <th className="py-3 px-4">Nilai Baru (Sesudah)</th>
              <th className="py-3 px-4">Pembuat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  Belum ada riwayat perubahan yang terdeteksi.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 uppercase">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.item}</td>
                  <td className="py-3 px-4 text-slate-400 line-through">{log.oldValue}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{log.newValue}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.author}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
