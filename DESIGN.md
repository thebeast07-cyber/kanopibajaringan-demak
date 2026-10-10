# DESIGN.md — 3 Putra

Arah visual untuk landing page 3 Putra. Ditulis dari jawaban pemilik proyek, bukan tebakan agen.
Dipakai sebagai **arah**; `antislop.md` dipakai sebagai **filter** di atasnya.

---

## Identitas

- **Nama usaha:** 3 Putra
- **Bidang:** kanopi, baja ringan, pagar, railing, tralis. Harga borongan per m² / per meter / per unit, sudah termasuk bahan dan jasa pasang.
- **Wilayah layanan:** Tangerang, Tangerang Selatan, Jakarta Barat, Jakarta Selatan, Depok, Bogor, Bekasi
  _(diambil dari `serviceAreas` di data proyek, bukan dari jawaban pemilik. Perlu dikonfirmasi.)_

**Masih kosong, perlu diisi pemilik:**

- Nama lengkap usaha (apakah "3 Putra" saja, atau ada lanjutannya?)
- Kota basis / lokasi workshop
- Siapa yang beli: pemilik rumah komplek, pemilik ruko, kontraktor, atau campur?

---

## Kepribadian

> **Slengekan santai.**

Kalau usaha ini orang: ngobrolnya cair, nggak kaku, nggak sok korporat. Bukan sales yang ngejar, bukan
perusahaan yang nulis "Kami berkomitmen memberikan solusi terbaik". Ngomong apa adanya, to the point,
tapi nggak asal-asalan.

Konsekuensi buat copy: pakai "kamu", bukan "Anda". Kalimat pendek. Nggak ada kata yang nggak dipakai
orang pas ngobrol.

---

## Rasa yang dituju

> **Enak, rapi, estetik.**

"Enak" dan "rapi" itu yang memimpin. Halaman harus gampang dibaca, nggak bikin capek, nggak rame.
"Estetik" didapat dari kerapian dan jarak antar elemen, bukan dari dekorasi yang ditempel.

Ini juga sejalan sama fungsi halamannya: orang datang buat tahu satu hal (kanopi segini harganya
berapa) lalu lanjut ke WhatsApp. Apa pun yang menghalangi dua hal itu harus minggir.

---

## Palet — "Rumah teduh"

Dua warna inti + satu aksen. Netral (putih, hitam, abu) nggak dihitung.

| Peran | Hex | Dipakai di |
|---|---|---|
| **Krem** (latar) | `#FAF8F5` | Latar halaman |
| **Hijau tua** (inti) | `#1B3B2B` | Teks judul, header, footer, permukaan gelap |
| **Amber** (aksen) | `#D97706` | **Hanya** angka harga dan tombol WhatsApp |

Alasan: hijau tua dan krem dibaca sebagai teduh dan rumahan, nyambung sama produknya (kanopi itu
memang jualan keteduhan). Amber dipakai seiprit supaya yang paling dicari orang, yaitu angka
harganya, jadi satu-satunya hal paling terang di layar.

**Yang dibuang:** `brand` biru `#0284C7` di `tailwind.config.ts` (nganggur, cuma 9 dari 1.176
pemakaian warna) dan amber yang sekarang kesebar ke mana-mana (256 pemakaian). Aksen yang muncul
di setiap elemen bukan aksen lagi.

Abu-abu netral (`slate`) tetap boleh buat teks sekunder dan garis, asal nggak jadi warna identitas.

## Tipografi

| Peran | Huruf | Berat |
|---|---|---|
| Judul & angka | **Fraunces** | 600 |
| Badan & antarmuka | **Figtree** | 400 / 600 |

Alasan: Fraunces punya lengkungan yang hangat, jadi judulnya nggak kerasa kayak situs korporat,
cocok sama kepribadian slengekan santai. Figtree dipertahankan buat badan teks karena netral dan
enak dibaca di HP, dan sudah ada di proyek.

**Yang dibuang:** Work Sans. Dipilih tanpa alasan oleh generator sebelumnya.

Dilarang: huruf monospace besar sebagai gaya-gayaan, dan label huruf kapital dengan jarak
antar huruf yang lebar (R-06).

---

## Dial

> Dibaca sebagai: landing page kontraktor lokal buat calon pelanggan rumahan, gaya santai tapi rapi,
> dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

| Dial | Nilai | Alasan |
|---|---|---|
| **ENERGY** | 2 (Balanced) | "Slengekan santai" bukan halaman yang teriak, tapi "estetik" juga bukan halaman birokrasi yang datar. Di tengah. |
| **RHYTHM** | 2 (Konsisten dengan beberapa variasi) | Section kalkulator harus beda jelas dari section lain karena di situ tujuan halamannya. Sisanya boleh seragam. |
| **MOTION** | 1 (Hover saja) | Orang datang buat cek harga lalu ke WA. Animasi scroll cuma nambah waktu tunggu. Nggak ada alasan UX buat gerak. |

---

## Motif identitas — angka sebagai bintang

Seluruh usaha ini dijual per ukuran, dan satu-satunya alasan orang buka halaman ini adalah mau tahu
angkanya. Jadi angka yang dijadikan motif:

- Harga dan ukuran selalu ditulis pakai **Fraunces 600**, ukuran besar, bukan huruf badan.
- **Amber hanya muncul di angka harga dan tombol WhatsApp.** Tidak di tempat lain. Sama sekali.
- Ukuran selalu ditulis dengan pola yang sama: `5 m × 2 m` (pakai `×`, bukan `x`), diikuti hasilnya
  dalam kurung kalau kena minimum: `5 m × 2 m (10 m² → ditagih 12 m²)`.

Pola ini diulang di hero, kartu layanan, kalkulator, dan pesan WhatsApp. Itu yang bikin halamannya
kerasa punya 3 Putra, bukan punya template.

---

## Yang sudah dibereskan

- Nama usaha "Kanopi & Baja Ringan Pro" dan email `sales@kanopibajaringanpro.id` (dua-duanya
  karangan generator) diganti jadi 3 Putra, email dikosongkan.
- Tiga proyek portofolio karangan beserta testimoni palsunya dihapus. `portfolios: []`.
- Semua klaim garansi dihapus karena pemilik belum mengonfirmasi ada garansi apa.

## Yang masih kosong dan perlu diisi pemilik

| Butuh | Kenapa penting |
|---|---|
| Nama lengkap usaha, kota basis, siapa yang beli | Belum terjawab, ada di bagian Identitas di atas |
| Foto proyek asli | Section portofolio sekarang kosong; isi lewat `/admin/portofolio` |
| Ketentuan garansi yang sebenarnya | Kalau ada, isi `guaranteeTerms` di `businessConfig` |
| Bukti sertifikasi SNI | Klaim "bahan standar SNI" masih tampil di halaman layanan |

Nomor WhatsApp asli: 082228132455.
