import React from 'react';
import { AdminButton, AdminBadge } from '../ui';
import Link from 'next/link';
import { Plus, ShieldAlert, GitCommit, BookOpen } from 'lucide-react';

export interface MasterDataHeaderProps {
  title: string;
  description: string;
  totalCount: number;
  hasDraft?: boolean;
  activeVersion?: string;
  actionLabel?: string;
  onAction?: () => void;
  helpHref?: string;
  helpLabel?: string;
}

export function MasterDataHeader({
  title,
  description,
  totalCount,
  hasDraft = false,
  activeVersion = 'v1.0.0',
  actionLabel = 'Tambah Data',
  onAction,
  helpHref,
  helpLabel = 'Panduan',
}: MasterDataHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <AdminBadge variant="default">{totalCount} Item</AdminBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          {helpHref && (
            <Link href={helpHref}>
              <AdminButton
                variant="outline"
                size="md"
                icon={<BookOpen className="w-4 h-4 text-amber-600" />}
              >
                {helpLabel}
              </AdminButton>
            </Link>
          )}

          {onAction && (
            <AdminButton
              onClick={onAction}
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              {actionLabel}
            </AdminButton>
          )}
        </div>
      </div>

      {hasDraft && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Mode Edit Draf Aktif:</span> Perubahan Anda akan disimpan dalam draf tanpa mengubah harga aktif di website publik hingga Anda menerbitkannya.
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] bg-amber-100/80 px-2 py-1 rounded border border-amber-300">
            <GitCommit className="w-3 h-3 text-amber-700" />
            <span>Versi Draf</span>
          </div>
        </div>
      )}
    </div>
  );
}
