import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProyekGaleriSchema } from '../../types/domain';
import {
  isianDariProyek,
  judulProyek,
  periksaProyek,
  pesanWaGaleri,
  proyekBaru,
  proyekTampil,
  ringkasProyek,
  teksDipasang,
  terapkanProyek,
} from './galeri';

const foto = { url: 'https://contoh.blob/foto.webp', og: 'https://contoh.blob/og.jpg' };
const proyek = (p: Partial<ProyekGaleriSchema>): ProyekGaleriSchema => ({
  id: 'gal-1',
  judul: 'Kanopi Alderon',
  lokasi: 'Sayung, Demak',
  fotos: [foto],
  tampil: true,
  dibuat: '2026-10-01T00:00:00.000Z',
  ...p,
});

test('bulan pemasangan ditulis dalam bahasa Indonesia', () => {
  assert.equal(teksDipasang('2026-05'), 'Mei 2026');
  assert.equal(teksDipasang('2025-12'), 'Desember 2025');
  assert.equal(teksDipasang(''), null);
  assert.equal(teksDipasang(undefined), null);
  assert.equal(teksDipasang('2026-13'), null);
  assert.equal(teksDipasang('Mei 2026'), null);
});

test('ringkasan dan judul melewati bagian yang kosong', () => {
  assert.equal(ringkasProyek({ lokasi: 'Sayung, Demak', dipasang: '2026-05' }), 'Sayung, Demak · Mei 2026');
  assert.equal(ringkasProyek({ lokasi: 'Sayung, Demak' }), 'Sayung, Demak');
  assert.equal(judulProyek({ judul: 'Kanopi Alderon', lokasi: 'Sayung, Demak' }), 'Kanopi Alderon di Sayung, Demak');
  assert.equal(judulProyek({ judul: 'Kanopi Alderon', lokasi: ' ' }), 'Kanopi Alderon');
});

test('yang tampil cuma yang dinyalakan dan punya foto, terbaru dipasang duluan', () => {
  const hasil = proyekTampil([
    proyek({ id: 'lama', dipasang: '2025-03' }),
    proyek({ id: 'baru', dipasang: '2026-08' }),
    proyek({ id: 'tanpa-bulan', dibuat: '2026-10-05T00:00:00.000Z' }),
    proyek({ id: 'disembunyikan', tampil: false, dipasang: '2026-09' }),
    proyek({ id: 'tanpa-foto', fotos: [], dipasang: '2026-09' }),
  ]);
  assert.deepEqual(
    hasil.map((p) => p.id),
    ['baru', 'lama', 'tanpa-bulan']
  );
  assert.deepEqual(proyekTampil(undefined), []);
});

test('pesan WhatsApp tanpa harga, membawa link halaman proyek', () => {
  const pesan = pesanWaGaleri('3 Putra', { judul: 'Kanopi Alderon', lokasi: 'Sayung, Demak' }, 'https://3putra.id/galeri/gal-1');
  assert.equal(
    pesan,
    'Halo 3 Putra, saya lihat foto Kanopi Alderon di Sayung, Demak dari galeri website. Saya mau yang seperti ini, bisa dibantu?\n\nhttps://3putra.id/galeri/gal-1'
  );
  assert.doesNotMatch(pesan, /Rp/);
});

test('isian wajib: foto, nama produk, lokasi; bulan boleh kosong', () => {
  const kosong = periksaProyek(isianDariProyek(proyekBaru(new Date('2026-10-12T00:00:00Z'))));
  assert.ok(kosong.fotos && kosong.judul && kosong.lokasi);
  assert.equal(kosong.dipasang, undefined);
  assert.deepEqual(periksaProyek(isianDariProyek(proyek({}))), {});
  assert.ok(periksaProyek({ ...isianDariProyek(proyek({})), dipasang: '2026-00' }).dipasang);
});

test('isian bolak-balik: kolom kosong jadi tidak ada, preview WA ikut tersimpan', () => {
  const awal = proyek({ dipasang: '2026-05', ukuran: '5 m × 6 m' });
  const hasil = terapkanProyek(awal, { ...isianDariProyek(awal), ukuran: '  ', keterangan: ' Rangka hollow ' });
  assert.equal(hasil.ukuran, undefined);
  assert.equal(hasil.keterangan, 'Rangka hollow');
  assert.equal(hasil.dipasang, '2026-05');
  assert.equal(hasil.fotos[0].og, foto.og);
  assert.equal(hasil.dibuat, awal.dibuat);
});
