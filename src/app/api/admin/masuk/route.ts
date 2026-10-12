import { NextRequest, NextResponse } from 'next/server';
import { NAMA_COOKIE, UMUR_SESI_DETIK, adminSiap, buatTokenSesi, kataSandiBenar } from '../../../../lib/server/sesiAdmin';

export async function POST(req: NextRequest) {
  if (!adminSiap()) {
    return NextResponse.json(
      { pesan: 'Kata sandi admin belum dipasang. Isi ADMIN_PASSWORD dan ADMIN_SESSION_SECRET di pengaturan Vercel.' },
      { status: 503 }
    );
  }

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !(await kataSandiBenar(password))) {
    // Jeda kecil biar tebak-tebakan kata sandi berulang jadi lambat.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ pesan: 'Kata sandinya salah.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(NAMA_COOKIE, await buatTokenSesi(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && !process.env.ADMIN_COOKIE_INSECURE,
    path: '/',
    maxAge: UMUR_SESI_DETIK,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NAMA_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
