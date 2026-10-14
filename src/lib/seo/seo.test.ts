import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { dataUsaha, jsonUntukScript, judulDepan, judulGaleri, kotaJudul } from './index';

const BASE = 'https://landingpagekanopi.vercel.app';

test('judul halaman menyebut jenis jasa dan kota', () => {
  assert.equal(judulDepan(COMPREHENSIVE_DATASET), 'Jasa Kanopi & Baja Ringan Demak, Semarang | 3 Putra');
  assert.match(judulGaleri(COMPREHENSIVE_DATASET), /^Galeri Pemasangan Kanopi & Baja Ringan Demak, Semarang/);
  assert.equal(kotaJudul(['A', 'B', 'C', 'D']), 'A, B, C');
});

test('data usaha: tanpa alamat dan link Maps, kolomnya tidak ditulis', () => {
  const d = dataUsaha(COMPREHENSIVE_DATASET, BASE);
  assert.equal(d['@type'], 'RoofingContractor');
  assert.equal(d.telephone, '+6282228132455');
  assert.deepEqual(d.areaServed, [
    { '@type': 'City', name: 'Demak' },
    { '@type': 'City', name: 'Semarang' },
  ]);
  assert.equal('address' in d, false);
  assert.equal('hasMap' in d, false);
});

test('data usaha: alamat dan link Maps dari Pengaturan ikut', () => {
  const dataset = {
    ...COMPREHENSIVE_DATASET,
    businessConfig: {
      ...COMPREHENSIVE_DATASET.businessConfig,
      alamat: 'Jl. Contoh No. 1, Sayung, Demak',
      linkMaps: 'https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9',
    },
  };
  const d = dataUsaha(dataset, BASE);
  assert.deepEqual(d.address, { '@type': 'PostalAddress', streetAddress: 'Jl. Contoh No. 1, Sayung, Demak', addressCountry: 'ID' });
  assert.equal(d.hasMap, 'https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9');
  assert.deepEqual(d.sameAs, ['https://maps.app.goo.gl/4CA7YK4Y7fE8M7UJ9']);
});

test('JSON di script tidak bisa menutup tag', () => {
  assert.equal(jsonUntukScript({ a: '</script>' }).includes('</'), false);
});
