import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { AddressInfo } from 'net';

// Tiruan kecil REST Upstash: cukup MGET dan EVAL skrip simpan, supaya jalur Redis bisa diuji
// tanpa jaringan. Skrip Lua-nya tidak dijalankan; logika bandingkan-lalu-simpan ditiru di sini.
const data = new Map<string, string>();
function jalankan(perintah: string[]): unknown {
  const [cmd, ...a] = perintah;
  if (cmd.toLowerCase() === 'mget') return a.map((k) => data.get(k) ?? null);
  if (cmd.toLowerCase() === 'eval') {
    const [, , kState, kVersi, harap, isi] = a;
    const sekarang = data.get(kVersi) ?? '0';
    if (sekarang !== harap) return [0, sekarang];
    const baru = String(Number(sekarang) + 1);
    data.set(kState, isi);
    data.set(kVersi, baru);
    return [1, baru];
  }
  throw new Error(`tidak didukung: ${cmd}`);
}
const b64 = (x: unknown): unknown =>
  typeof x === 'string' ? Buffer.from(x).toString('base64') : Array.isArray(x) ? x.map(b64) : x;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const isi = JSON.parse(body);
    const pipa = req.url?.startsWith('/pipeline');
    const enc = req.headers['upstash-encoding'] === 'base64';
    const hasil = (pipa ? isi : [isi]).map((p: string[]) => ({ result: enc ? b64(jalankan(p)) : jalankan(p) }));
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(pipa ? hasil : hasil[0]));
  });
});

describe('Penyimpanan admin (Redis)', () => {
  let p: typeof import('./penyimpanan');
  before(async () => {
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    process.env.KV_REST_API_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.KV_REST_API_TOKEN = 'uji';
    process.env.ADMIN_SESSION_SECRET = 'rahasia-uji';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    p = await import('./penyimpanan');
  });
  after(() => server.close());

  it('1. Redis dipakai untuk data admin, foto tetap ikut Blob/lokal', () => {
    assert.equal(p.tempatState(), 'redis');
    assert.equal(p.jenisPenyimpanan(), 'lokal');
  });

  it('2. Belum pernah disimpan: kosong dengan versi 0', async () => {
    assert.deepEqual(await p.bacaState(), { state: null, etag: '0' });
  });

  it('3. Simpan lalu langsung baca dapat data terbaru, tanpa jeda cache', async () => {
    const state = p.stateAwal();
    state.publishedDataset.businessConfig.serviceAreas = ['Demak', 'Kudus'];
    const { etag } = await p.simpanState(state, '0');
    assert.equal(etag, '1');
    const baca = await p.bacaState();
    assert.deepEqual(baca.state?.publishedDataset.businessConfig.serviceAreas, ['Demak', 'Kudus']);
    assert.equal(baca.etag, '1');
  });

  it('4. Simpan beruntun dari perangkat yang sama tetap lolos', async () => {
    const state = (await p.bacaState()).state!;
    state.publishedDataset.businessConfig.tagline = 'Satu';
    const a = await p.simpanState(state, '1');
    state.publishedDataset.businessConfig.tagline = 'Dua';
    const b = await p.simpanState(state, a.etag);
    assert.equal(b.etag, '3');
    assert.equal((await p.bacaState()).state?.publishedDataset.businessConfig.tagline, 'Dua');
  });

  it('5. Perangkat lain dengan versi basi ditolak, data tidak tertimpa', async () => {
    const state = (await p.bacaState()).state!;
    state.publishedDataset.businessConfig.tagline = 'Dari laptop basi';
    await assert.rejects(() => p.simpanState(state, '1'), p.KonflikPenyimpanan);
    assert.equal((await p.bacaState()).state?.publishedDataset.businessConfig.tagline, 'Dua');
  });

  it('6. Data terbit untuk pelanggan dibaca dari Redis', async () => {
    const { state } = await p.bacaState();
    assert.equal(state?.publishedDataset.businessConfig.tagline, 'Dua');
  });
});
