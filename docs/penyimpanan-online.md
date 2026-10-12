# Penyimpanan online dan login admin

Harga, bahan, dan pengaturan yang diisi pemilik di `/admin` disimpan di Upstash Redis. Foto
disimpan di Vercel Blob. Halaman depan membaca keduanya.

## Cara kerja

- **Data admin** (harga, bahan, pengaturan, draf, riwayat) jadi satu nilai JSON di Redis, dengan
  nomor versi. Kuncinya diturunkan dari `ADMIN_SESSION_SECRET`, jadi tidak bisa ditebak, dan
  Production dan Preview (rahasianya beda) tidak saling menimpa walau memakai database yang sama.
- **Kenapa bukan Blob:** berkas Blob public yang ditimpa di-cache CDN sampai 60 detik. Admin bisa
  membaca versi basi, kelihatan "tidak tersimpan", lalu ditolak waktu menyimpan. Redis selalu
  membaca versi terbaru. Data lama yang masih di Blob dipindah otomatis: kalau Redis belum punya
  data, admin membaca dari Blob, dan simpanan pertama menaruhnya di Redis.
- **Foto layanan** disimpan di Blob di folder `foto/<id-layanan>/`. Sebelum diunggah, foto
  dikecilkan di browser (sisi terpanjang 1600 px, WebP), karena Vercel menolak kiriman di atas
  4,5 MB.
- **Dua perangkat** (mis. dua HP) yang mengedit bersamaan: yang menyimpan belakangan dengan
  data basi ditolak dan tombol Simpan berganti jadi Muat ulang, bukan diam-diam menimpa. Cek
  versinya dijalankan di dalam Redis sekaligus, jadi dua simpanan bersamaan tidak bisa sama-sama lolos.
- **Halaman depan** dirender tiap kunjungan, tapi datanya di-cache dan baru dibaca ulang dari Redis
  setelah admin menyimpan.
- **Login**: satu kata sandi (`ADMIN_PASSWORD`). Sesi berlaku 30 hari. Mengganti
  `ADMIN_SESSION_SECRET` mengeluarkan semua sesi, tapi juga memindah alamat data, jadi jangan
  diganti setelah dipakai.

## Pasang di Vercel

1. Buka project `landingpagekanopi` di Vercel, menu **Storage**, buat store baru jenis **Blob**,
   lalu sambungkan ke project ini. Vercel otomatis menambah `BLOB_READ_WRITE_TOKEN`.
2. Di **Settings > Environment Variables**, tambah:
   - `ADMIN_PASSWORD`: kata sandi admin.
   - `ADMIN_SESSION_SECRET`: string acak panjang. Isi nilai **berbeda** untuk Production dan
     Preview, supaya coba-coba di Preview tidak menyentuh data asli.
3. **Redeploy** supaya variabel baru terbaca.
4. Buka `/admin`, masuk, isi satu layanan, lalu cek halaman depan dari HP lain.

## Di laptop

Salin `.env.example` jadi `.env.local`, isi `ADMIN_PASSWORD` dan `ADMIN_SESSION_SECRET`,
kosongkan `BLOB_READ_WRITE_TOKEN`. Data tersimpan di folder `.data/` (tidak ikut di-commit).

## Halaman admin

Admin dibuat untuk HP. Empat tab di bawah layar:

- **Beranda** (`/admin`): klik ke WhatsApp 7 atau 30 hari terakhir dibanding periode sebelumnya,
  alur kunjungan → isi ukuran → klik WhatsApp, asal pengunjung, layanan yang paling sering ditanya,
  tombol WhatsApp yang paling sering diklik, dan daftar yang masih kosong di website.
- **Layanan** (`/admin/layanan`): daftar dengan saringan "Belum lengkap". Tiap layanan punya halaman
  ubah sendiri (`/admin/layanan/<id>`) dengan bagian Harga, Bahan, Foto, Info, Tampilan, tombol
  Simpan yang nempel di bawah, dan "Lihat hasil" yang menampilkan kartu persis seperti di website.
- **Galeri** (`/admin/galeri`): foto hasil pemasangan asli, tanpa harga. Tiap proyek berisi foto,
  nama produk, lokasi, bulan dipasang, ukuran, dan keterangan. Waktu foto diunggah, browser juga
  membuat versi JPEG 1200×630 (maksimal 280 KB) khusus buat preview link di WhatsApp. Di website,
  galeri tampil di halaman depan (`#galeri`, maksimal 6), di `/galeri`, dan tiap proyek punya
  halaman sendiri `/galeri/<id>`. Tombol WhatsApp-nya mengirim nama produk plus link halaman
  proyek, jadi foto yang diklik pelanggan muncul sebagai preview di chat. Selama belum ada proyek
  yang tampil, bagian galeri dan menu Galeri tidak muncul.
- **Pengaturan** (`/admin/pengaturan`): nomor WhatsApp, kota yang dilayani, nama usaha, tagline,
  catatan soal harga, dan link promosi siap salin.

Alamat lama `/admin/isi-data` otomatis pindah ke `/admin/layanan`.

## Statistik di Beranda (Upstash Redis)

Vercel Web Analytics paket Hobby tidak menampilkan event custom, jadi klik WhatsApp dihitung sendiri
di database Upstash Redis (paket Free, 500 ribu perintah per bulan).

- Pasang: Vercel, menu **Storage**, **Create Database**, **Upstash** (Redis), paket Free, region
  Singapore, sambungkan ke Production dan Preview dengan prefix `KV`. Variabel `KV_REST_API_URL`
  dan `KV_REST_API_TOKEN` terisi otomatis. Nama `UPSTASH_REDIS_REST_*` juga dibaca.
- Yang disimpan cuma hitungan per hari (tanggal WIB), tanpa cookie dan tanpa data pribadi. Data
  lebih dari 400 hari terhapus sendiri.
- Hitungan Production, Preview, dan lokal dipisah (`jejak:<lingkungan>:<tanggal>`), jadi klik saat
  coba-coba di Preview tidak masuk angka asli.
- Browser yang pernah login admin tidak dihitung, termasuk saat membuka halaman depan.
- "Kunjungan" artinya satu tab browser yang membuka halaman depan, bukan orang unik. Klik WhatsApp di
  angka utama dihitung sekali per kunjungan.
- Tanpa Redis, website tetap jalan dan Beranda menulis "Penghitung kunjungan belum dipasang".
- Pencatat (`/api/jejak`) terbuka untuk umum karena dipanggil dari browser pengunjung. Isinya diperiksa
  ketat, tapi orang iseng tetap bisa menggelembungkan angka. Kalau angka tiba-tiba melonjak aneh,
  itu yang dicurigai.

## Statistik pengunjung (Vercel Web Analytics)

Website juga mengirim data ke Vercel Web Analytics. Kunjungan ke `/admin` dan browser pemilik tidak dihitung.
Aktifkan di menu **Analytics**, **Enable**, lalu redeploy. Di paket Hobby yang kelihatan: jumlah
pengunjung, halaman, asal pengunjung, negara, dan perangkat, dengan riwayat 1 bulan.

### Link berlabel supaya asal pengunjung kebaca

Dari aplikasi Instagram, Facebook, atau WhatsApp, asal pengunjung sering tidak terkirim dan tercatat
sebagai "langsung". Pakai link berlabel di tiap tempat promosi. Link-nya siap salin di
**Pengaturan > Link buat promosi**:

| Dipasang di | Link |
|---|---|
| Bio Instagram | `https://<domain>/?utm_source=instagram&utm_medium=bio` |
| Profil Google Maps / Google Bisnis | `https://<domain>/?utm_source=google-maps&utm_medium=profil` |
| Status atau broadcast WhatsApp | `https://<domain>/?utm_source=whatsapp&utm_medium=status` |
| Halaman Facebook | `https://<domain>/?utm_source=facebook&utm_medium=halaman` |
| Iklan (kalau ada) | `https://<domain>/?utm_source=<platform>&utm_medium=iklan&utm_campaign=<nama-iklan>` |
