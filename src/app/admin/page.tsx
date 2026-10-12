import { redirect } from 'next/navigation';

// Admin cuma punya satu pekerjaan: mengisi data layanan.
export default function AdminPage() {
  redirect('/admin/isi-data');
}
