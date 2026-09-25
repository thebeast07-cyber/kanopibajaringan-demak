'use client';

import React from 'react';
import { AdminSection, AdminCard, AdminEmptyState, AdminBadge } from '../../../components/admin/ui';
import { Settings } from 'lucide-react';

export default function AdminPengaturanPage() {
  return (
    <div className="space-y-6">
      <AdminSection
        title="Pengaturan Sistem & Pengadaan"
        description="Atur preferensi sistem, batas minimum billing global, dan sinkronisasi data"
      >
        <AdminCard>
          <AdminEmptyState
            icon={<Settings className="w-8 h-8 text-amber-500" />}
            title="Pengaturan General"
            description="Konfigurasi parameter global usaha kontraktor dan keamanan data."
            action={<AdminBadge variant="amber">STATUS: MODUL FONDASI SIAP</AdminBadge>}
          />
        </AdminCard>
      </AdminSection>
    </div>
  );
}
