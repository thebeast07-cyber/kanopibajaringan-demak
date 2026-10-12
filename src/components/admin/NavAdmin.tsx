'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Tab di bawah layar karena pemilik ngurus admin dari HP, satu tangan: jempol nyampe ke bawah.
const TAB = [
  {
    href: '/admin',
    label: 'Beranda',
    aktif: (p: string) => p === '/admin',
    ikon: (
      <>
        <path d="M3 11 L12 4 L21 11" />
        <path d="M6 10 V20 H18 V10" />
      </>
    ),
  },
  {
    href: '/admin/layanan',
    label: 'Layanan',
    aktif: (p: string) => p.startsWith('/admin/layanan'),
    ikon: (
      <>
        <rect x="4" y="4" width="16" height="6" rx="1.5" />
        <rect x="4" y="14" width="16" height="6" rx="1.5" />
      </>
    ),
  },
  {
    href: '/admin/galeri',
    label: 'Galeri',
    aktif: (p: string) => p.startsWith('/admin/galeri'),
    ikon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M3.5 16 L9 11 L13 15 L16 12.5 L20.5 16.5" />
        <circle cx="15.5" cy="8.5" r="1.5" />
      </>
    ),
  },
  {
    href: '/admin/pengaturan',
    label: 'Pengaturan',
    aktif: (p: string) => p.startsWith('/admin/pengaturan'),
    ikon: (
      <>
        <path d="M4 7 H20" />
        <path d="M4 17 H20" />
        <circle cx="9" cy="7" r="2.5" fill="white" />
        <circle cx="15" cy="17" r="2.5" fill="white" />
      </>
    ),
  },
];

export function NavAdmin() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Menu admin"
      className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-kertas-garis pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="max-w-xl mx-auto grid grid-cols-4">
        {TAB.map((t) => {
          const aktif = t.aktif(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={aktif ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 min-h-[60px] text-xs ${
                  aktif ? 'text-navy font-bold' : 'text-tinta-lembut font-semibold hover:text-navy'
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {t.ikon}
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
