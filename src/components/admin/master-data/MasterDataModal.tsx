import React from 'react';
import { X } from 'lucide-react';
import { AdminButton } from '../ui';

export interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

export function MasterDataModal({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  submitLabel = 'Simpan Perubahan',
  isSubmitting = false,
  children,
}: MasterDataModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <AdminButton type="button" variant="outline" size="md" onClick={onClose}>
              Batal
            </AdminButton>
            <AdminButton type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : submitLabel}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
