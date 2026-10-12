import { NextRequest, NextResponse } from 'next/server';
import { NAMA_COOKIE, tokenSesiSah } from './lib/server/sesiAdmin';

const BEBAS = new Set(['/admin/masuk', '/api/admin/masuk']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (BEBAS.has(pathname)) return NextResponse.next();

  if (await tokenSesiSah(req.cookies.get(NAMA_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ pesan: 'Perlu masuk dulu.' }, { status: 401 });
  }
  const tujuan = req.nextUrl.clone();
  tujuan.pathname = '/admin/masuk';
  tujuan.search = `?lanjut=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(tujuan);
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
