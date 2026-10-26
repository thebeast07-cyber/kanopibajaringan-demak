import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as kirimJejak } from '../../app/api/jejak/route';
import { GET as bacaStatistikAdmin } from '../../app/api/admin/statistik/route';
import { ASAL, SUMBER_WA, TUJUAN_LINK, periksaKejadian, tentukanAsal } from '../statistik/kejadian';

// Jalur lengkap: halaman kirim kejadian → /api/jejak → Redis → /api/admin/statistik.
// Redis-nya tiruan server REST Upstash yang menjawab dengan format aslinya (base64, HGETALL
// berupa daftar datar), dan dipanggil lewat klien @upstash/redis yang asli. Tes ringkas()
// yang pakai objek buatan sendiri dulu lolos padahal Beranda admin selalu nol.

const isi = new Map<string, Map<string, number>>();
const b64 = (v: string) => Buffer.from(v).toString('base64');

function jalankan(perintah: string[]): unknown {
  const [nama, kunci, ...arg] = perintah;
  const hash = isi.get(kunci) ?? new Map<string, number>();
  switch (nama.toLowerCase()) {
    case 'hincrby': {
      const baru = (hash.get(arg[0]) ?? 0) + Number(arg[1]);
      hash.set(arg[0], baru);
      isi.set(kunci, hash);
      return baru;
    }
    case 'expire':
      return isi.has(kunci) ? 1 : 0;
    case 'hgetall':
      return Array.from(hash).flatMap(([k, v]) => [k, String(v)]);
    default:
      throw new Error(`Perintah ${nama} belum ditiru`);
  }
}

function jawab(hasil: unknown, base64: boolean): unknown {
  if (!base64) return hasil;
  if (typeof hasil === 'string') return b64(hasil);
  if (Array.isArray(hasil)) return hasil.map((v) => (typeof v === 'string' ? b64(v) : v));
  return hasil;
}

const fetchAsli = globalThis.fetch;
globalThis.fetch = (async (alamat: string | URL | Request, init?: RequestInit) => {
  const url = new URL(String(alamat instanceof Request ? alamat.url : alamat));
  if (url.hostname !== 'tiruan.upstash.io') return fetchAsli(alamat, init);
  const header = new Headers(init?.headers);
  const base64 = header.get('Upstash-Encoding') === 'base64';
  const badan = JSON.parse(String(init?.body));
  const isiJawaban =
    url.pathname === '/pipeline'
      ? (badan as string[][]).map((p) => ({ result: jawab(jalankan(p), base64) }))
      : { result: jawab(jalankan(badan as string[]), base64) };
  return new Response(JSON.stringify(isiJawaban), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

process.env.KV_REST_API_URL = 'https://tiruan.upstash.io';
process.env.KV_REST_API_TOKEN = 'token-tiruan';

beforeEach(() => isi.clear());

const UA_HP = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';

async function kirim(kejadian: unknown, ua = UA_HP): Promise<number> {
  const req = new NextRequest('https://www.kanopibajaringandemak.my.id/api/jejak', {
    method: 'POST',
    body: JSON.stringify(kejadian),
    headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
  });
  return (await kirimJejak(req)).status;
}

async function statistik(hari = 7) {
  const res = await bacaStatistikAdmin(new NextRequest(`https://www.kanopibajaringandemak.my.id/api/admin/statistik?hari=${hari}`));
  assert.equal(res.status, 200);
  return res.json();
}

test('jalur lengkap: kunjungan dan klik dari brosur sampai Beranda admin', async () => {
  assert.equal(await kirim({ jenis: 'kunjungan', asal: tentukanAsal('?utm_source=brosur', '', 'x') }), 204);
  assert.equal(await kirim({ jenis: 'kunjungan', asal: 'instagram' }), 204);
  assert.equal(await kirim({ jenis: 'klik_wa', sumber: 'halaman-link', pertama: true, aksiPertama: true }), 204);
  assert.equal(await kirim({ jenis: 'klik_wa', sumber: 'kalkulator', layanan: 'svc-a', pertama: false, aksiPertama: false }), 204);
  assert.equal(await kirim({ jenis: 'klik_link', tujuan: 'instagram' }), 204);
  assert.equal(await kirim({ jenis: 'isi_ukuran', layanan: 'svc-a', aksiPertama: false }), 204);

  const s = await statistik();
  assert.equal(s.terpasang, true);
  assert.equal(s.sekarang.kunjungan, 2);
  assert.equal(s.sekarang.klikWa, 2);
  assert.equal(s.sekarang.kunjunganKlikWa, 1);
  assert.equal(s.sekarang.kunjunganBeraksi, 1);
  assert.equal(s.sekarang.isiUkuran, 1);
  assert.deepEqual(s.sekarang.asal, [
    { kunci: 'brosur', jumlah: 1 },
    { kunci: 'instagram', jumlah: 1 },
  ]);
  assert.deepEqual(s.sekarang.sumberWa, [
    { kunci: 'halaman-link', jumlah: 1 },
    { kunci: 'kalkulator', jumlah: 1 },
  ]);
  assert.deepEqual(s.sekarang.layananWa, [{ kunci: 'svc-a', jumlah: 1 }]);
  assert.deepEqual(s.sekarang.klikLink, [{ kunci: 'instagram', jumlah: 1 }]);
  assert.equal(s.sebelumnya.kunjungan, 0);
});

test('jalur lengkap: kiriman ngawur ditolak dan tidak ikut terhitung', async () => {
  assert.equal(await kirim({ jenis: 'kunjungan', asal: 'spanduk' }), 400);
  assert.equal(await kirim({ jenis: 'klik_link', tujuan: 'youtube' }), 400);
  assert.equal(await kirim({ jenis: 'kunjungan', asal: 'brosur' }, 'Googlebot/2.1'), 204);
  const s = await statistik();
  assert.equal(s.sekarang.kunjungan, 0);
});

// Kalau ada asal, tombol WA, atau tujuan link baru yang lupa didaftarkan di pemeriksa,
// kiriman dari halaman kena 400 dan diam-diam hilang. Ini yang mengunci daftarnya.
test('semua nilai yang bisa dikirim halaman lolos pemeriksaan server', () => {
  for (const asal of ASAL) assert.ok(periksaKejadian({ jenis: 'kunjungan', asal }), asal);
  for (const sumber of SUMBER_WA) {
    assert.ok(periksaKejadian({ jenis: 'klik_wa', sumber, pertama: true, aksiPertama: true }), sumber);
  }
  for (const tujuan of TUJUAN_LINK) assert.ok(periksaKejadian({ jenis: 'klik_link', tujuan }), tujuan);
  for (const utm of ['brosur', 'instagram', 'ig', 'maps', 'wa', 'tiktok', 'fb', 'acak']) {
    assert.ok(periksaKejadian({ jenis: 'kunjungan', asal: tentukanAsal(`?utm_source=${utm}`, '', 'x') }), utm);
  }
});
