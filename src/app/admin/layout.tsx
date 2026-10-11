'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen w-full transition-all">
        <AdminHeader onToggleMobile={() => setMobileOpen((prev) => !prev)} />
        {/* Header fixed setinggi 64px, jadi jarak atas = 64px + jarak sisi. Dulu ditulis
            `pt-20 p-4 sm:p-6 lg:p-8`: sm:p-6/lg:p-8 menimpa pt-20 dan judul ketutup header. */}
        <main className="px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-[88px] lg:px-8 lg:pb-8 lg:pt-24 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
