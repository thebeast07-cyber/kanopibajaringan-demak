import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { FOLDER_FOTO_LOKAL } from '../../../../lib/server/penyimpanan';

// Cuma kepakai di mode lokal (tanpa Vercel Blob). Di Vercel, foto disajikan langsung dari Blob.
const TIPE: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };

export async function GET(_req: Request, { params }: { params: { nama: string } }) {
  const nama = path.basename(params.nama);
  const tipe = TIPE[path.extname(nama)];
  if (!tipe) return new NextResponse('Tidak ada', { status: 404 });
  try {
    const isi = await fs.readFile(path.join(FOLDER_FOTO_LOKAL, nama));
    return new NextResponse(isi, { headers: { 'Content-Type': tipe, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new NextResponse('Tidak ada', { status: 404 });
  }
}
