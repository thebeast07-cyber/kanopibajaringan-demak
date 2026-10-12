import { Redis } from '@upstash/redis';

/**
 * Integrasi Upstash di Vercel kadang memberi nama KV_REST_API_*, kadang UPSTASH_REDIS_REST_*,
 * kadang cuma alamat rediss:// (KV_URL / REDIS_URL). Dari alamat rediss:// Upstash, alamat REST
 * adalah host yang sama lewat https, dan kata sandinya dipakai sebagai token REST (konsol
 * Upstash menulisnya "Password (token)"). Cadangan saja: pasangan REST di atas didahulukan.
 */
export function alamatDariEnv(env: Record<string, string | undefined>): { url: string; token: string } | null {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };

  const tcp = env.KV_URL || env.REDIS_URL || env.KV_REDIS_URL;
  if (!tcp) return null;
  try {
    const u = new URL(tcp);
    if (!u.hostname.endsWith('.upstash.io') || !u.password) return null;
    return { url: `https://${u.hostname}`, token: decodeURIComponent(u.password) };
  } catch {
    return null;
  }
}

function alamat(): { url: string; token: string } | null {
  return alamatDariEnv(process.env);
}

export function redisTerpasang(): boolean {
  return alamat() !== null;
}

let klien: Redis | null = null;
let alamatKlien = '';

/** Klien Redis, atau null kalau belum dipasang. Nilai dibaca apa adanya (string), tanpa ubah JSON otomatis. */
export function redis(): Redis | null {
  const a = alamat();
  if (!a) return null;
  if (!klien || alamatKlien !== a.url) {
    klien = new Redis({ url: a.url, token: a.token, automaticDeserialization: false });
    alamatKlien = a.url;
  }
  return klien;
}
