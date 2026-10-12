import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  KonflikPenyimpanan,
  PenyimpananBelumDipasang,
  TAG_DATA,
  bacaState,
  jenisPenyimpanan,
  simpanState,
} from '../../../../lib/server/penyimpanan';
import { StorageState } from '../../../../lib/cms/localCmsRepository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { state, etag } = await bacaState();
    return NextResponse.json({ state, etag, jenis: jenisPenyimpanan() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ pesan: 'Penyimpanan online nggak bisa dibaca. Coba muat ulang sebentar lagi.' }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { state?: StorageState; etag?: string | null } | null;
  if (!body?.state?.publishedDataset?.services) {
    return NextResponse.json({ pesan: 'Data yang dikirim nggak lengkap.' }, { status: 400 });
  }

  try {
    const { etag } = await simpanState(body.state, body.etag ?? null);
    // Halaman depan ikut pakai data baru di permintaan berikutnya.
    revalidateTag(TAG_DATA);
    revalidatePath('/');
    return NextResponse.json({ etag });
  } catch (e) {
    if (e instanceof KonflikPenyimpanan) {
      return NextResponse.json(
        { pesan: 'Data sudah diubah dari perangkat lain. Muat ulang halaman supaya nggak saling timpa.' },
        { status: 409 }
      );
    }
    if (e instanceof PenyimpananBelumDipasang) {
      return NextResponse.json(
        { pesan: 'Penyimpanan online belum dipasang di Vercel, jadi perubahan nggak bisa disimpan.' },
        { status: 503 }
      );
    }
    console.error(e);
    return NextResponse.json({ pesan: 'Gagal menyimpan ke penyimpanan online. Coba lagi.' }, { status: 502 });
  }
}
