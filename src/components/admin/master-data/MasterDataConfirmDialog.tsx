import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AdminButton } from '../ui';

export interface MasterDataConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isProcessing?: boolean;
}

export function MasterDataConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  variant = 'warning',
  isProcessing = false,
}: MasterDataConfirmDialogProps) {
  if (!isOpen) return null;

  const variantButtonMap = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    primary: 'primary' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <AdminButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </AdminButton>
          <AdminButton
            variant={variantButtonMap[variant]}
            size="sm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Memproses...' : confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
