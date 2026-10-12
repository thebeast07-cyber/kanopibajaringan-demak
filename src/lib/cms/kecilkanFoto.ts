// Foto dari kamera HP biasanya 3-8 MB, sedangkan Vercel menolak kiriman di atas 4,5 MB.
// Dikecilkan di browser dulu: pelanggan juga nggak perlu mengunduh foto sebesar itu.
const SISI_TERPANJANG = 1600;
const KUALITAS = 0.82;

function keBlob(canvas: HTMLCanvasElement, tipe: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipe, KUALITAS));
}

export async function kecilkanFoto(file: File): Promise<Blob> {
  let gambar: ImageBitmap;
  try {
    gambar = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} nggak bisa dibaca browser ini. Coba kirim dalam format JPG atau PNG.`);
  }

  const skala = Math.min(1, SISI_TERPANJANG / Math.max(gambar.width, gambar.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(gambar.width * skala);
  canvas.height = Math.round(gambar.height * skala);
  canvas.getContext('2d')!.drawImage(gambar, 0, 0, canvas.width, canvas.height);
  gambar.close();

  // Browser lama yang belum bisa WebP mengembalikan PNG; untuk foto, JPEG lebih kecil.
  const webp = await keBlob(canvas, 'image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await keBlob(canvas, 'image/jpeg');
  if (!jpeg) throw new Error(`${file.name} gagal dikecilkan.`);
  return jpeg;
}

// Preview link di WhatsApp: belum ada sumber yang memastikan WebP didukung, dan gambar di atas
// sekitar 300 KB sering tidak ditampilkan. Jadi dibuat JPEG 1200x630 terpisah, dipotong di tengah.
const OG_LEBAR = 1200;
const OG_TINGGI = 630;
const OG_MAKS_BYTE = 280 * 1024;

export async function buatPratinjauOg(file: File): Promise<Blob> {
  let gambar: ImageBitmap;
  try {
    gambar = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} nggak bisa dibaca browser ini. Coba kirim dalam format JPG atau PNG.`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = OG_LEBAR;
  canvas.height = OG_TINGGI;
  const skala = Math.max(OG_LEBAR / gambar.width, OG_TINGGI / gambar.height);
  const w = gambar.width * skala;
  const h = gambar.height * skala;
  canvas.getContext('2d')!.drawImage(gambar, (OG_LEBAR - w) / 2, (OG_TINGGI - h) / 2, w, h);
  gambar.close();

  for (const kualitas of [0.8, 0.7, 0.6, 0.5]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', kualitas));
    if (blob && blob.size <= OG_MAKS_BYTE) return blob;
  }
  throw new Error(`${file.name}: preview untuk WhatsApp gagal dibuat.`);
}
