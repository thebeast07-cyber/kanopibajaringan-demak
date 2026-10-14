import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import {
  isianDariConfig,
  rapikanLinkMaps,
  nomorWaInternasional,
  nomorWaTampil,
  periksaPengaturan,
  tambahKota,
  terapkanPengaturan,
} from './pengaturan';

test('nomor WA: berbagai cara ketik jadi format wa.me', () => {
  assert.equal(nomorWaInternasional('0822 2813 2455'), '6282228132455');
  assert.equal(nomorWaInternasional('+62 822-2813-2455'), '6282228132455');
  assert.equal(nomorWaInternasional('6282228132455'), '6282228132455');
  assert.equal(nomorWaInternasional('82228132455'), '6282228132455');
});

test('nomor WA: yang bukan nomor HP ditolak', () => {
  assert.equal(nomorWaInternasional(''), null);
  assert.equal(nomorWaInternasional('0822'), null);
  assert.equal(nomorWaInternasional('024 1234 567'), null);
  assert.equal(nomorWaInternasional('0822 2813 2455 9999 1'), null);
});

test('nomor WA tampil dengan spasi biasa', () => {
  assert.equal(nomorWaTampil('6282228132455'), '0822 2813 2455');
});

test('pengaturan: isian bolak-balik tanpa mengubah data', () => {
  const c = COMPREHENSIVE_DATASET.businessConfig;
  const isian = isianDariConfig(c);
  assert.equal(isian.nomorWa, '0822 2813 2455');
  assert.deepEqual(periksaPengaturan(isian), {});
  const hasil = terapkanPengaturan(c, isian);
  assert.equal(hasil.frontlineContact!.whatsappNumber, c.frontlineContact.whatsappNumber);
  assert.equal(hasil.frontlineContact!.name, c.frontlineContact.name);
  assert.deepEqual(hasil.serviceAreas, c.serviceAreas);
  assert.equal(hasil.businessName, c.businessName);
});

test('pengaturan: isian wajib diperiksa', () => {
  const salah = periksaPengaturan({ nomorWa: '123', kota: [], namaUsaha: ' ', tagline: '', catatanHarga: '', linkMaps: 'https://contoh.com', alamat: '' });
  assert.ok(salah.nomorWa);
  assert.ok(salah.kota);
  assert.ok(salah.namaUsaha);
  assert.ok(salah.linkMaps);
});

test('link Maps dari tombol Bagikan dirapikan, link lain ditolak', () => {
  assert.equal(rapikanLinkMaps('https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9?g_st=ic'), 'https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9');
  assert.equal(
    rapikanLinkMaps('3 Putra Kanopi https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9'),
    'https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9'
  );
  assert.ok(rapikanLinkMaps('https://www.google.com/maps/place/3+Putra/@-6.9,110.6,17z'));
  assert.equal(rapikanLinkMaps('https://instagram.com/3putra'), null);
  assert.equal(rapikanLinkMaps('maps.app.goo.gl/abc'), null);
});

test('kota baru dirapikan dan tidak dobel', () => {
  assert.deepEqual(tambahKota(['Demak'], '  kudus '), ['Demak', 'Kudus']);
  assert.deepEqual(tambahKota(['Demak'], 'demak'), ['Demak']);
  assert.deepEqual(tambahKota(['Demak'], 'kabupaten   semarang'), ['Demak', 'Kabupaten Semarang']);
  assert.deepEqual(tambahKota(['Demak'], '   '), ['Demak']);
});
