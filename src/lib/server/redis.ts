import { Redis } from '@upstash/redis';

// Integrasi Upstash di Vercel kadang memberi nama KV_REST_API_*, kadang UPSTASH_REDIS_REST_*.
function alamat(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
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
