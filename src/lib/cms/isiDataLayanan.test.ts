import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { calculateEstimate } from '../estimator/pricingEngine';
import { buildWhatsAppLeadUrl } from '../whatsapp';
import {
  daftarKolomKosong,
  isianDariLayanan,
  kolomKosong,
  periksaIsian,
  terapkanIsian,
  teksHarga,
  teksLama,
} from './isiDataLayanan';

const alderon = () => JSON.parse(JSON.stringify(COMPREHENSIVE_DATASET.services[0]));

describe('Isi data layanan', () => {
  it('1. Layanan bawaan tercatat kosong di harga, lama pengerjaan, dan bahan', () => {
    for (const svc of COMPREHENSIVE_DATASET.services) {
      assert.deepEqual(kolomKosong(svc), ['harga', 'lama', 'bahan']);
    }
    assert.equal(daftarKolomKosong(alderon()), 'harga, lama pengerjaan, bahan standar');
  });

  it('2. Isian kosong tidak berubah jadi angka 0', () => {
    const isian = isianDariLayanan(alderon());
    assert.equal(isian.harga, '');
    assert.equal(isian.minimum, '');
    assert.equal(isian.hariMin, '');

    const hasil = terapkanIsian(alderon(), isian);
    assert.equal(hasil.pricingRules.length, 0);
    assert.equal(hasil.minimumBilling, undefined);
    assert.equal(hasil.durationRanges.length, 0);
    assert.deepEqual(hasil.bahanStandar, []);
  });

  it('3. Isian lengkap masuk ke kalkulator dengan angka yang sama', () => {
    const isian = {
      ...isianDariLayanan(alderon()),
      harga: '800.000',
      minimum: '10',
      hariMin: '3',
      hariMax: '5',
      bahan: [
        { bagian: 'Atap', bahan: 'Alderon RS' },
        { bagian: '', bahan: '' },
      ],
    };
    assert.deepEqual(periksaIsian(isian), {});

    const svc = terapkanIsian(alderon(), isian);
    assert.equal(teksHarga(svc), `${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(800000)} / m²`);
    assert.equal(teksLama(svc), '3 sampai 5 hari kerja');
    assert.deepEqual(svc.bahanStandar, [{ bagian: 'Atap', bahan: 'Alderon RS' }], 'baris kosong dibuang');
    assert.equal(svc.source, 'owner');
    assert.deepEqual(kolomKosong(svc), []);

    const ds = { ...COMPREHENSIVE_DATASET, services: [svc] };
    const { snapshot } = calculateEstimate({ serviceId: svc.id, length: 2, width: 4 }, ds);
    assert.equal(snapshot.billableUnits.applied, 10, 'minimum 10 m² dipakai');
    assert.equal(snapshot.breakdown.total, 8000000);
    assert.equal(snapshot.duration.text, '3 - 5 hari kerja');
  });

  it('4. Isian yang setengah jadi ditolak dengan pesan yang jelas', () => {
    const dasar = isianDariLayanan(alderon());
    assert.ok(periksaIsian({ ...dasar, title: ' ' }).title);
    assert.ok(periksaIsian({ ...dasar, harga: '0' }).harga);
    assert.ok(periksaIsian({ ...dasar, hariMin: '3' }).lama, 'cuma satu sisi lama pengerjaan');
    assert.ok(periksaIsian({ ...dasar, hariMin: '5', hariMax: '3' }).lama);
    assert.ok(periksaIsian({ ...dasar, bahan: [{ bagian: 'Atap', bahan: '' }] }).bahan);
  });

  it('5. Ganti cara ukur ikut mengganti satuan harga dan minimum', () => {
    const isian = { ...isianDariLayanan(alderon()), measurementType: 'meter' as const, harga: '600000', minimum: '4' };
    const svc = terapkanIsian(alderon(), isian);
    assert.equal(svc.pricingRules[0].model, 'per_m');
    assert.equal(svc.pricingRules[0].unitLabel, 'meter');
    assert.deepEqual(svc.minimumBilling, { minimumLength: 4 });
  });

  it('6. Pesan WhatsApp tanpa harga tidak membawa Rp 0 atau lama pengerjaan tebakan', () => {
    const ds = JSON.parse(JSON.stringify(COMPREHENSIVE_DATASET));
    const { snapshot } = calculateEstimate({ serviceId: ds.services[0].id, length: 5, width: 4 }, ds);
    const url = buildWhatsAppLeadUrl(snapshot, { customerName: 'Budi', cityOrDistrict: 'Sayung' }, ds);
    const pesan = decodeURIComponent(url.split('?text=')[1]);

    assert.ok(!pesan.includes('Rp'), 'tidak ada angka rupiah');
    assert.ok(!pesan.includes('hari kerja'), 'tidak ada lama pengerjaan');
    assert.ok(pesan.includes('Harganya belum ada di website'));
    assert.ok(!pesan.includes('\n\n\n'), 'tidak ada baris kosong dobel');
  });

  it('7. Pesan WhatsApp membawa bahan standar dan harga setelah diisi', () => {
    const svc = terapkanIsian(alderon(), {
      ...isianDariLayanan(alderon()),
      harga: '800000',
      bahan: [{ bagian: 'Atap', bahan: 'Alderon RS' }],
    });
    const ds = { ...COMPREHENSIVE_DATASET, services: [svc] };
    const { snapshot } = calculateEstimate({ serviceId: svc.id, length: 5, width: 4 }, ds);
    const pesan = decodeURIComponent(
      buildWhatsAppLeadUrl(snapshot, { customerName: 'Budi', cityOrDistrict: 'Sayung' }, ds).split('?text=')[1]
    );
    assert.ok(pesan.includes('Bahan standar: Atap: Alderon RS'));
    assert.ok(pesan.includes('16.000.000'));
  });
});
