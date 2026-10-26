import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kolomHitungan, periksaKejadian, ringkas, tanggalJakarta, tanggalMundur, tentukanAsal } from './kejadian';

const HOST = '3putra.vercel.app';

test('asal: link berlabel didahulukan dari referrer', () => {
  assert.equal(tentukanAsal('?utm_source=instagram&utm_medium=bio', 'https://www.google.com/', HOST), 'instagram');
  assert.equal(tentukanAsal('?utm_source=google-maps', '', HOST), 'google-maps');
  assert.equal(tentukanAsal('?utm_source=WhatsApp', '', HOST), 'whatsapp');
  assert.equal(tentukanAsal('?utm_source=brosur', '', HOST), 'lainnya');
});

test('asal: dibaca dari referrer kalau tanpa label', () => {
  assert.equal(tentukanAsal('', '', HOST), 'langsung');
  assert.equal(tentukanAsal('', 'https://l.instagram.com/?u=x', HOST), 'instagram');
  assert.equal(tentukanAsal('', 'https://m.facebook.com/', HOST), 'facebook');
  assert.equal(tentukanAsal('', 'https://www.google.co.id/', HOST), 'google');
  assert.equal(tentukanAsal('', 'https://web.whatsapp.com/', HOST), 'whatsapp');
  assert.equal(tentukanAsal('', `https://${HOST}/admin`, HOST), 'langsung');
  assert.equal(tentukanAsal('', 'https://contoh-blog.id/artikel', HOST), 'lainnya');
  assert.equal(tentukanAsal('', 'bukan url', HOST), 'lainnya');
});

test('periksa: kejadian sah diterima, sisanya ditolak', () => {
  assert.deepEqual(periksaKejadian({ jenis: 'kunjungan', asal: 'instagram' }), { jenis: 'kunjungan', asal: 'instagram' });
  assert.deepEqual(
    periksaKejadian({ jenis: 'klik_wa', sumber: 'kalkulator', layanan: 'svc-kanopi-alderon', pertama: true, aksiPertama: false }),
    { jenis: 'klik_wa', sumber: 'kalkulator', layanan: 'svc-kanopi-alderon', pertama: true, aksiPertama: false }
  );
  assert.deepEqual(periksaKejadian({ jenis: 'klik_wa', sumber: 'hero' }), {
    jenis: 'klik_wa',
    sumber: 'hero',
    pertama: false,
    aksiPertama: false,
  });

  assert.equal(periksaKejadian(null), null);
  assert.equal(periksaKejadian('kunjungan'), null);
  assert.equal(periksaKejadian({ jenis: 'kunjungan', asal: 'mars' }), null);
  assert.equal(periksaKejadian({ jenis: 'klik_wa', sumber: 'tombol-palsu' }), null);
  assert.equal(periksaKejadian({ jenis: 'isi_ukuran', layanan: 'Kanopi Alderon / RS' }), null);
  assert.equal(periksaKejadian({ jenis: 'isi_ukuran', layanan: 'x'.repeat(61) }), null);
  assert.equal(periksaKejadian({ jenis: 'hapus_semua' }), null);
});

test('kolom: tiap kejadian menambah kolom yang pas', () => {
  assert.deepEqual(kolomHitungan({ jenis: 'kunjungan', asal: 'google' }), ['kunjungan', 'asal:google']);
  assert.deepEqual(kolomHitungan({ jenis: 'isi_ukuran', layanan: 'svc-a', aksiPertama: true }), [
    'isi_ukuran',
    'ukuran_layanan:svc-a',
    'sesi_aksi',
  ]);
  assert.deepEqual(
    kolomHitungan({ jenis: 'klik_wa', sumber: 'hero', pertama: false, aksiPertama: false }),
    ['klik_wa', 'wa_sumber:hero']
  );
  assert.deepEqual(
    kolomHitungan({ jenis: 'klik_wa', sumber: 'kalkulator', layanan: 'svc-a', pertama: true, aksiPertama: true }),
    ['klik_wa', 'wa_sumber:kalkulator', 'wa_layanan:svc-a', 'sesi_klik_wa', 'sesi_aksi']
  );
});

test('ringkas: menjumlah beberapa hari dan mengurutkan peringkat', () => {
  const hasil = ringkas([
    { kunjungan: '10', 'asal:instagram': '6', 'asal:langsung': '4', klik_wa: '3', 'wa_sumber:hero': '2', 'wa_sumber:kalkulator': '1', sesi_klik_wa: '2', sesi_aksi: '3', isi_ukuran: '2' },
    null,
    { kunjungan: 5, 'asal:langsung': 5, klik_wa: 1, 'wa_sumber:kalkulator': 1, 'wa_layanan:svc-a': 1, sesi_klik_wa: 1, sesi_aksi: 1 },
  ]);
  assert.equal(hasil.kunjungan, 15);
  assert.equal(hasil.klikWa, 4);
  assert.equal(hasil.kunjunganKlikWa, 3);
  assert.equal(hasil.kunjunganBeraksi, 4);
  assert.equal(hasil.isiUkuran, 2);
  assert.deepEqual(hasil.asal, [
    { kunci: 'langsung', jumlah: 9 },
    { kunci: 'instagram', jumlah: 6 },
  ]);
  // Seri: urut abjad, biar urutan tidak loncat-loncat tiap dimuat.
  assert.deepEqual(hasil.sumberWa, [
    { kunci: 'hero', jumlah: 2 },
    { kunci: 'kalkulator', jumlah: 2 },
  ]);
  assert.deepEqual(hasil.layananWa, [{ kunci: 'svc-a', jumlah: 1 }]);
});

test('ringkas: bentuk HGETALL mentah dari Redis (daftar datar) ikut terbaca', () => {
  const hasil = ringkas([['kunjungan', '2', 'asal:instagram', '2', 'klik_wa', '1', 'wa_sumber:hero', '1'], []]);
  assert.equal(hasil.kunjungan, 2);
  assert.equal(hasil.klikWa, 1);
  assert.deepEqual(hasil.asal, [{ kunci: 'instagram', jumlah: 2 }]);
  assert.deepEqual(hasil.sumberWa, [{ kunci: 'hero', jumlah: 1 }]);
});

test('ringkas: tanpa data semuanya nol', () => {
  const hasil = ringkas([]);
  assert.equal(hasil.kunjungan, 0);
  assert.deepEqual(hasil.asal, []);
});

test('tanggal ikut WIB, bukan UTC', () => {
  // 18.30 UTC tanggal 11 = 01.30 WIB tanggal 12.
  assert.equal(tanggalJakarta(new Date('2026-10-11T18:30:00Z')), '2026-10-12');
  assert.equal(tanggalJakarta(new Date('2026-10-11T16:59:00Z')), '2026-10-11');
  assert.deepEqual(tanggalMundur(new Date('2026-10-12T05:00:00Z'), 3), ['2026-10-12', '2026-10-11', '2026-10-10']);
});
