'use client';

import React from 'react';
import { AdminSection, AdminCard, AdminEmptyState, AdminBadge } from '../../../components/admin/ui';
import { Briefcase } from 'lucide-react';

export default function AdminPortofolioPage() {
  return (
    <div className="space-y-6">
      <AdminSection
        title="Pengelolaan Portofolio Proyek"
        description="Kelola galeri proyek kanopi, baja ringan, dan renovasi yang ditampilkan di website"
      >
        <AdminCard>
          <AdminEmptyState
            icon={<Briefcase className="w-8 h-8 text-amber-500" />}
            title="Kelola Galeri Proyek"
            description="Fitur upload foto proyek, lokasi, dan spesifikasi pekerjaan untuk membangun kepercayaan pelanggan."
            action={<AdminBadge variant="amber">STATUS: MODUL FONDASI SIAP</AdminBadge>}
          />
        </AdminCard>
      </AdminSection>
    </div>
  );
}
