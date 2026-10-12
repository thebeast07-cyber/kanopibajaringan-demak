import { HalamanDepan } from '@/components/landing/HalamanDepan';
import { bacaDatasetTerbit } from '@/lib/server/penyimpanan';

// Halaman dibangun ulang tiap admin menyimpan (revalidatePath di /api/admin/state);
// angka ini cuma jaring pengaman kalau sinyal itu terlewat.
export const revalidate = 3600;

export default async function HomePage() {
  const dataset = await bacaDatasetTerbit();
  return <HalamanDepan dataset={dataset} />;
}
