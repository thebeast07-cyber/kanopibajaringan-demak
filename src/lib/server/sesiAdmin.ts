// Dipakai di middleware (edge) dan route handler (node), jadi cuma pakai Web Crypto.

export const NAMA_COOKIE = 'sesi_admin';
export const UMUR_SESI_DETIK = 60 * 60 * 24 * 30;

export function adminSiap(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

async function tandaTangan(data: string): Promise<string> {
  const kunci = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET || ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', kunci, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function samaPersis(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i++) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

export async function buatTokenSesi(sekarangMs = Date.now()): Promise<string> {
  const kedaluwarsa = Math.floor(sekarangMs / 1000) + UMUR_SESI_DETIK;
  return `${kedaluwarsa}.${await tandaTangan(`admin.${kedaluwarsa}`)}`;
}

export async function tokenSesiSah(token: string | undefined, sekarangMs = Date.now()): Promise<boolean> {
  if (!token || !adminSiap()) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) * 1000 < sekarangMs) return false;
  return samaPersis(sig, await tandaTangan(`admin.${exp}`));
}

/** Bandingkan kata sandi lewat hash supaya lama prosesnya tidak membocorkan panjangnya. */
export async function kataSandiBenar(masukan: string): Promise<boolean> {
  const hash = async (t: string) =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t))), (b) =>
      b.toString(16).padStart(2, '0')
    ).join('');
  return samaPersis(await hash(masukan), await hash(process.env.ADMIN_PASSWORD || ''));
}
