import { redirect } from 'next/navigation';

// Alamat lama dari versi admin satu halaman. Bookmark pemilik tetap jalan.
export default function IsiDataLama() {
  redirect('/admin/layanan');
}
