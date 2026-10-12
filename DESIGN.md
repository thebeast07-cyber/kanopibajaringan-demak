# DESIGN.md: 3 Putra

Arah visual untuk landing page 3 Putra. Ditulis dari jawaban pemilik proyek, bukan tebakan agen.
Dipakai sebagai **arah**; `antislop.md` dipakai sebagai **filter** di atasnya.

---

## Identitas

- **Nama resmi:** 3 Putra Spesialis Kanopi dan Baja Ringan
- **Bidang:** kanopi, baja ringan, pagar, railing, tralis. Harga borongan per m² / per meter / per unit, sudah termasuk bahan dan jasa pasang.
- **Wilayah layanan:** Demak, Semarang
  _Pemilik sendiri bilang cakupan idealnya Jawa, tapi yang difokuskan dulu Jawa Tengah dan sekitarnya._
  _Dua kota ini yang pasti disebut, jadi dua inilah yang dipasang. Daftar sebenarnya masih perlu discovery._

**Cara nama dipakai di halaman**

Nama resminya panjang, jadi di `businessConfig` dipecah dua: `businessName` = "3 Putra" dan
`tagline` = "Spesialis kanopi dan baja ringan". Keduanya tampil bertumpuk, jadi kebaca sebagai
nama utuh tanpa bikin wordmark sepanjang satu baris.

Di footer nama utuhnya selalu kelihatan. Di navbar baris tagline disembunyikan di bawah
breakpoint `sm`, karena header setinggi 64px di HP nggak muat dua baris tanpa jadi sumpek.
Jadi di layar HP nama panjangnya cuma muncul di footer dan di judul tab. Nama penuhnya juga
dipakai di `<title>` halaman dan di `authors`, karena di situ yang kebaca mesin pencari.

**Masih kosong, perlu diisi pemilik:**

- Kota basis / lokasi workshop
- Daftar kota yang beneran dilayani
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

## Palet: ikut logo

Dua warna inti + satu aksen, diambil dari logo 3 Putra pilihan pemilik. Netral (putih, hitam, abu) nggak dihitung.

| Peran | Hex | Dipakai di |
|---|---|---|
| **Krem** (latar) | `#FAF8F5` | Latar halaman |
| **Navy** (inti) | `#0B2D5B` | Teks judul, header, footer, permukaan gelap |
| **Oranye** (aksen) | `#FF8A3D` | **Hanya** angka harga dan tombol WhatsApp |

Oranye logo cuma 2.2:1 di atas krem, jadi nggak boleh jadi warna teks di latar terang:

- Tombol WhatsApp: latar oranye `#FF8A3D`, teks navy (5.8:1). Hover `#F37A2A` (4.9:1).
- Angka harga di latar terang: oranye gelap `#B54A0B` (5.0:1).
- Angka harga di permukaan navy: oranye logo `#FF8A3D` (5.8:1).

Oranye dipakai seiprit supaya yang paling dicari orang, yaitu angka harganya dan tombol
untuk lanjut ngobrol, jadi satu-satunya hal paling terang di layar.

Palet sebelumnya ("Rumah teduh", hijau tua `#1B3B2B` + amber `#D97706`) diganti waktu pemilik
milih logo navy-oranye, supaya merek di website, seragam, dan truk satu warna.

## Logo

Board logo dari pemilik digambar ulang jadi SVG (bukan tracing otomatis), file-nya di `public/brand/`:

| File | Dipakai di |
|---|---|
| `logo-3putra.svg` | Logo lengkap bertumpuk dengan tagline. Cetak, spanduk, dokumen |
| `logo-3putra-putih.svg` | Versi untuk latar navy atau foto gelap |
| `logo-3putra-hitam.svg` | Satu warna: stempel, fotokopi, sablon satu warna |
| `logo-3putra-mendatar.svg` / `-putih.svg` | Tanda + "3 PUTRA" berdampingan. Navbar dan footer website (`src/components/brand/Logo.tsx`) |
| `ikon-3putra.svg` | Tanda saja, tanpa tulisan |
| `ikon-3putra-app.svg` / `-oranye.svg` | Ikon kotak: favicon (`src/app/icon.svg`), foto profil WA dan IG |
| `og-logo.png` | Gambar preview link selama pemilik belum unggah foto layanan |

Tagline di logo "Konstruksi & Metal Work". Di website, tagline teks tetap "Spesialis kanopi dan
baja ringan" dari `businessConfig`.

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

## Motif identitas: angka sebagai bintang

Seluruh usaha ini dijual per ukuran, dan satu-satunya alasan orang buka halaman ini adalah mau tahu
angkanya. Jadi angka yang dijadikan motif:

- Harga dan ukuran selalu ditulis pakai **Fraunces 600**, ukuran besar, bukan huruf badan.
- **Oranye hanya muncul di angka harga dan tombol WhatsApp.** Tidak di tempat lain. Sama sekali.
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
- Tujuh kota Jabodetabek di `serviceAreas` dihapus. Itu juga karangan generator, dan tampil di
  navbar, hero, footer, dan jawaban FAQ seolah-olah fakta. Diganti Demak dan Semarang.
- Klaim "bahan standar SNI" dihapus dari section layanan dan dari deskripsi layanan baja ringan.
- Em dash dibersihkan dari seluruh `src/`, termasuk tanda `—` yang dipakai jadi penampung kosong
  di angka harga kalkulator. Sekarang di situ ada kalimat: "Isi ukurannya dulu, harganya nanti
  muncul di sini."

## Sudah dikonfirmasi pemilik

- Survei lokasi gratis.
- Pelanggan boleh batal tanpa biaya kalau harga final setelah survei nggak cocok.
- Sebelum setuju harga final, pelanggan belum terikat apa-apa.

Kalimat-kalimat itu di hero, alur kerja, FAQ, dan ajakan bawah boleh tetap tampil.
Deskripsi singkat tiap layanan (mis. "kedap suara hujan", "anti rayap") masih isian lama
dan akan direvisi sesuai arahan pemilik lewat `/admin/isi-data`.

## Yang masih kosong dan perlu diisi pemilik

| Butuh | Kenapa penting |
|---|---|
| Harga borongan, minimum, dan bahan standar tiap layanan | Semua angka bawaan sudah direset karena bukan dari pemilik. Isi lewat `/admin/isi-data`; selama kosong, website nggak nampilin angkanya. Lama pengerjaan boleh kosong |
| Daftar kota yang beneran dilayani | Sekarang cuma Demak dan Semarang, hasil tebakan paling aman |
| Kota basis / workshop, siapa yang beli | Belum terjawab, ada di bagian Identitas di atas |
| Foto proyek asli | Unggah per layanan di `/admin/isi-data`, tampil sebagai galeri geser di kartu layanan |
| Ketentuan garansi yang sebenarnya | Kalau ada, isi `guaranteeTerms` di `businessConfig` |
| Bukti SNI dan garansi pabrik di master data bahan | `materials` dan `frames` masih menyimpan `Standar SNI`, `Sertifikat SNI Tempered Glass`, dan `Garansi pabrik 10 tahun`. Nggak tampil di mana pun dan halaman pengaturnya sudah dihapus, jadi aman dibuang dari dataset |

Nomor WhatsApp asli: 082228132455.
