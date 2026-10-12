import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Mode lokal ke folder sementara, supaya tes tidak menulis ke .data proyek.
const folder = mkdtempSync(path.join(tmpdir(), 'cms-uji-'));
process.env.CMS_DATA_DIR = folder;
delete process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.BLOB_STORE_ID;
delete process.env.VERCEL;

describe('Penyimpanan admin (mode lokal)', () => {
  let p: typeof import('./penyimpanan');
  before(async () => {
    p = await import('./penyimpanan');
  });
  after(() => rmSync(folder, { recursive: true, force: true }));

  it('1. Belum pernah disimpan: kosong, data terbit pakai bawaan tanpa harga', async () => {
    assert.equal(p.jenisPenyimpanan(), 'lokal');
    const { state, etag } = await p.bacaState();
    assert.equal(state, null);
    assert.equal(etag, null);
    assert.ok(p.stateAwal().publishedDataset.services.every((s) => s.pricingRules.length === 0));
  });

  it('2. Simpan lalu baca lagi menghasilkan data yang sama', async () => {
    const state = p.stateAwal();
    state.publishedDataset.services[0].title = 'Kanopi Uji';
    const { etag } = await p.simpanState(state, null);
    const baca = await p.bacaState();
    assert.equal(baca.state?.publishedDataset.services[0].title, 'Kanopi Uji');
    assert.equal(baca.etag, etag);
  });

  it('3. Simpan dari perangkat yang datanya sudah basi ditolak', async () => {
    const { etag: etagA } = await p.bacaState();
    const state = (await p.bacaState()).state!;

    state.publishedDataset.services[0].title = 'Dari HP';
    await p.simpanState(state, etagA);

    // Laptop masih memegang etag lama.
    state.publishedDataset.services[0].title = 'Dari laptop';
    await assert.rejects(() => p.simpanState(state, etagA), p.KonflikPenyimpanan);
    assert.equal((await p.bacaState()).state?.publishedDataset.services[0].title, 'Dari HP');
  });

  it('4. Foto tersimpan dan bisa dihapus', async () => {
    const url = await p.simpanFoto(Buffer.from('isi-foto'), 'image/webp', 'svc-kanopi-alderon');
    assert.match(url, /^\/api\/foto\/svc-kanopi-alderon-[0-9a-f]{16}\.webp$/);
    const file = path.join(p.FOLDER_FOTO_LOKAL, path.basename(url));
    assert.ok(existsSync(file));
    await p.hapusFoto(url);
    assert.ok(!existsSync(file));
  });

  it('5. Format selain JPG, PNG, WebP ditolak', async () => {
    await assert.rejects(() => p.simpanFoto(Buffer.from('x'), 'image/gif', 'svc'));
  });

  it('6. Di Vercel tanpa Blob: baca kosong, simpan ditolak dengan pesan khusus', async () => {
    process.env.VERCEL = '1';
    try {
      assert.equal(p.jenisPenyimpanan(), 'belum-dipasang');
      await assert.rejects(() => p.simpanState(p.stateAwal(), null), p.PenyimpananBelumDipasang);
    } finally {
      delete process.env.VERCEL;
    }
  });
});
