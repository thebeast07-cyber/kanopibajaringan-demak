import { NextRequest, NextResponse } from 'next/server';
import { PenyimpananBelumDipasang, hapusFoto, simpanFoto } from '../../../../lib/server/penyimpanan';

// Vercel menolak body di atas 4,5 MB; foto sudah dikecilkan di browser sebelum dikirim.
const BATAS_BYTE = 4 * 1024 * 1024;
const TIPE_BOLEH = ['image/webp', 'image/jpeg', 'image/png'];

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get('foto');
  const serviceId = String(form?.get('serviceId') || '');

  if (!(file instanceof Blob) || !TIPE_BOLEH.includes(file.type)) {
    return NextResponse.json({ pesan: 'Format foto harus JPG, PNG, atau WebP.' }, { status: 400 });
  }
  if (file.size > BATAS_BYTE) {
    return NextResponse.json({ pesan: 'Foto masih terlalu besar setelah dikecilkan (maksimal 4 MB).' }, { status: 413 });
  }

  try {
    const url = await simpanFoto(Buffer.from(await file.arrayBuffer()), file.type, serviceId);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof PenyimpananBelumDipasang) {
      return NextResponse.json({ pesan: 'Penyimpanan online belum dipasang di Vercel.' }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ pesan: 'Gagal mengunggah foto. Coba lagi.' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const { urls } = ((await req.json().catch(() => ({}))) ?? {}) as { urls?: string[] };
  if (!Array.isArray(urls)) return NextResponse.json({ pesan: 'Daftar foto nggak ada.' }, { status: 400 });
  // Gagal hapus berkas lama tidak menggagalkan apa pun: datanya sudah tidak menunjuk ke sana.
  await Promise.allSettled(urls.map((u) => hapusFoto(u)));
  return NextResponse.json({ ok: true });
}
