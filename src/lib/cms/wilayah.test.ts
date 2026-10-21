import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { gabungKota, kotaSurveiGratis } from './wilayah';

const config = COMPREHENSIVE_DATASET.businessConfig;

test('gabung kota: satu, dua, dan tiga kota lebih', () => {
  assert.equal(gabungKota(['Demak']), 'Demak');
  assert.equal(gabungKota(['Demak', 'Semarang']), 'Demak dan Semarang');
  assert.equal(gabungKota(['Demak', 'Semarang', 'Kudus']), 'Demak, Semarang, dan Kudus');
});

test('kota survei gratis: urut seperti daftar kota dan cuma yang masih dilayani', () => {
  const c = { ...config, serviceAreas: ['Demak', 'Semarang', 'Kudus'], kotaSurveiGratis: ['Semarang', 'Solo', 'Demak'] };
  assert.deepEqual(kotaSurveiGratis(c), ['Demak', 'Semarang']);
});

test('kota survei gratis: data lama tanpa isian ini tidak menjanjikan gratis', () => {
  const { kotaSurveiGratis: _, ...lama } = config;
  assert.deepEqual(kotaSurveiGratis({ ...lama, serviceAreas: ['Demak', 'Semarang'] }), []);
});
