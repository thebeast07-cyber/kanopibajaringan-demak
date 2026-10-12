import { NextRequest, NextResponse } from 'next/server';
import { bacaStatistik, statistikTerpasang } from '../../../../lib/server/statistik';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!statistikTerpasang()) return NextResponse.json({ terpasang: false });
  const hari = req.nextUrl.searchParams.get('hari') === '30' ? 30 : 7;
  try {
    return NextResponse.json({ terpasang: true, ...(await bacaStatistik(hari)) });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { pesan: 'Statistik lagi nggak bisa dibaca. Coba muat ulang sebentar lagi.' },
      { status: 502 }
    );
  }
}
