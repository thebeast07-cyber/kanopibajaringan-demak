'use client';

import React from 'react';
import { AdminSection, AdminCard, AdminEmptyState, AdminBadge } from '../../../components/admin/ui';
import { FileText } from 'lucide-react';

export default function AdminEstimasiPage() {
  return (
    <div className="space-y-6">
      <AdminSection
        title="Daftar Estimasi Pelanggan"
        description="Pantau estimasi hitungan yang dibuat pengunjung dari website public"
      >
        <AdminCard>
          <AdminEmptyState
            icon={<FileText className="w-8 h-8 text-amber-500" />}
            title="Riwayat Estimasi Pelanggan"
            description="Fitur pemantauan hasil hitungan estimator publik dan konversi leads WhatsApp."
            action={<AdminBadge variant="amber">STATUS: MODUL FONDASI SIAP</AdminBadge>}
          />
        </AdminCard>
      </AdminSection>
    </div>
  );
}
