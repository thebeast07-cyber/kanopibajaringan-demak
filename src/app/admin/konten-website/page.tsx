'use client';

import React from 'react';
import { AdminSection, AdminCard, AdminEmptyState, AdminBadge } from '../../../components/admin/ui';
import { Globe } from 'lucide-react';

export default function AdminKontenWebsitePage() {
  return (
    <div className="space-y-6">
      <AdminSection
        title="Pengelolaan Konten Website"
        description="Atur nama usaha, tagline, FAQ, dan informasi kontak WhatsApp pemilik"
      >
        <AdminCard>
          <AdminEmptyState
            icon={<Globe className="w-8 h-8 text-amber-500" />}
            title="Kelola Informasi Website"
            description="Fitur penyuntingan teks website, FAQ pelanggan, dan kontak operasional."
            action={<AdminBadge variant="amber">STATUS: MODUL FONDASI SIAP</AdminBadge>}
          />
        </AdminCard>
      </AdminSection>
    </div>
  );
}
