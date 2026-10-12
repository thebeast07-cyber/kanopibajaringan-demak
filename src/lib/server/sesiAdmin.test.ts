import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { adminSiap, buatTokenSesi, kataSandiBenar, tokenSesiSah, UMUR_SESI_DETIK } from './sesiAdmin';

describe('Sesi admin', () => {
  before(() => {
    process.env.ADMIN_PASSWORD = 'rahasia-uji';
    process.env.ADMIN_SESSION_SECRET = 'kunci-uji-yang-panjang';
  });

  it('1. Kata sandi benar diterima, yang salah ditolak', async () => {
    assert.equal(adminSiap(), true);
    assert.equal(await kataSandiBenar('rahasia-uji'), true);
    assert.equal(await kataSandiBenar('rahasia-uj'), false);
    assert.equal(await kataSandiBenar(''), false);
  });

  it('2. Token sesi sah sampai kedaluwarsa', async () => {
    const sekarang = Date.now();
    const token = await buatTokenSesi(sekarang);
    assert.equal(await tokenSesiSah(token, sekarang), true);
    assert.equal(await tokenSesiSah(token, sekarang + (UMUR_SESI_DETIK + 5) * 1000), false);
  });

  it('3. Token yang diutak-atik atau dari kunci lain ditolak', async () => {
    const token = await buatTokenSesi();
    const [exp, sig] = token.split('.');
    assert.equal(await tokenSesiSah(`${Number(exp) + 999999}.${sig}`), false, 'masa berlaku dipanjangkan sendiri');
    assert.equal(await tokenSesiSah(`${exp}.${sig.replace(/.$/, sig.endsWith('a') ? 'b' : 'a')}`), false);
    assert.equal(await tokenSesiSah(undefined), false);

    process.env.ADMIN_SESSION_SECRET = 'kunci-lain';
    assert.equal(await tokenSesiSah(token), false, 'ganti kunci = semua sesi lama keluar');
    process.env.ADMIN_SESSION_SECRET = 'kunci-uji-yang-panjang';
  });

  it('4. Tanpa kata sandi terpasang, tidak ada sesi yang sah', async () => {
    const token = await buatTokenSesi();
    const simpan = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    assert.equal(adminSiap(), false);
    assert.equal(await tokenSesiSah(token), false);
    process.env.ADMIN_PASSWORD = simpan;
  });
});
