import { NextRequest } from 'next/server';
import { periksaKejadian } from '../../../lib/statistik/kejadian';
import { catatKejadian } from '../../../lib/server/statistik';

export const dynamic = 'force-dynamic';

const BOT = /bot|crawl|spider|slurp|preview|headless/i;

// Dipanggil halaman depan lewat sendBeacon. Selalu 204 untuk kiriman yang sah, termasuk kalau
// penghitung belum dipasang atau sedang gagal: pengunjung tidak boleh kena efeknya.
export async function POST(req: NextRequest) {
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });

  const teks = await req.text().catch(() => '');
  if (!teks || teks.length > 1000) return new Response(null, { status: 400 });
  let isi: unknown;
  try {
    isi = JSON.parse(teks);
  } catch {
    return new Response(null, { status: 400 });
  }
  const kejadian = periksaKejadian(isi);
  if (!kejadian) return new Response(null, { status: 400 });

  await catatKejadian(kejadian).catch((e) => console.error('Gagal mencatat kejadian', e));
  return new Response(null, { status: 204 });
}
