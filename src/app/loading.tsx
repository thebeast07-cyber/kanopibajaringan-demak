import { LogoLoading } from '@/components/brand/LogoLoading';

// Tampil selama halaman berikutnya masih dimuat, termasuk waktu web pertama kali dibuka.
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-kertas px-4">
      <LogoLoading />
    </div>
  );
}
