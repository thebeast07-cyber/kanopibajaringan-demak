import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angkaId, angkaUkuran, luas, rapikanKetikanUkuran } from './ukuran';

test('kolom dikosongkan tetap kosong, tidak jadi 0', () => {
  assert.equal(rapikanKetikanUkuran(''), '');
  assert.equal(angkaUkuran(''), 0);
});

test('nol di depan dibuang, tapi 0,5 tetap', () => {
  assert.equal(rapikanKetikanUkuran('05'), '5');
  assert.equal(rapikanKetikanUkuran('0012'), '12');
  assert.equal(rapikanKetikanUkuran('0,5'), '0,5');
  assert.equal(rapikanKetikanUkuran('0'), '0');
});

test('koma dan titik sama-sama tanda desimal, titik tampil sebagai koma', () => {
  assert.equal(rapikanKetikanUkuran('3,5'), '3,5');
  assert.equal(rapikanKetikanUkuran('3.5'), '3,5');
  assert.equal(rapikanKetikanUkuran('3.'), '3,');
  assert.equal(rapikanKetikanUkuran('.5'), ',5');
  assert.equal(angkaUkuran('3,5'), 3.5);
  assert.equal(angkaUkuran('3.5'), 3.5);
  assert.equal(angkaUkuran(',5'), 0.5);
});

test('lagi ngetik: "3," masih boleh, dibaca 3', () => {
  assert.equal(rapikanKetikanUkuran('3,'), '3,');
  assert.equal(angkaUkuran('3,'), 3);
});

test('cuma satu tanda desimal dan maksimal 2 angka di belakangnya', () => {
  assert.equal(rapikanKetikanUkuran('3,5,2'), '3,52');
  assert.equal(rapikanKetikanUkuran('3,456'), '3,45');
  assert.equal(rapikanKetikanUkuran('2.5.'), '2,5');
});

test('huruf, spasi, dan satuan yang ikut ketempel dibuang', () => {
  assert.equal(rapikanKetikanUkuran('3,5 m'), '3,5');
  assert.equal(rapikanKetikanUkuran('abc'), '');
  assert.equal(rapikanKetikanUkuran('-4'), '4');
});

test('jumlah unit: angka bulat saja', () => {
  assert.equal(rapikanKetikanUkuran('3,5', false), '35');
  assert.equal(rapikanKetikanUkuran('07', false), '7');
  assert.equal(rapikanKetikanUkuran('', false), '');
});

test('luas dibulatkan 2 angka di belakang koma dan ditulis cara Indonesia', () => {
  assert.equal(luas(3.3, 2.7), 8.91);
  assert.equal(luas(3.5, 4), 14);
  assert.equal(angkaId(3.5), '3,5');
  assert.equal(angkaId(8.91), '8,91');
  assert.equal(angkaId(12), '12');
  assert.equal(angkaId(1250), '1.250');
});
