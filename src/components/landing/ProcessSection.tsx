import React from 'react';
import { gabungKota } from '@/lib/cms/wilayah';

// Empat langkah ini memang alur kerjanya, bukan template "How It Works".
// Bedanya: langkah pertama terjadi di halaman ini, tiga sisanya di luar halaman.
// Hierarki itu yang dipakai jadi tampilan, bukan empat kartu kembar bernomor.
// Langkah pertama ikut kondisi data: selama harga belum diisi pemilik, kalkulator tidak
// mengeluarkan angka, jadi kalimatnya tidak boleh menjanjikan itu.
const LANGKAH_PERTAMA = {
  adaHarga: {
    judul: 'Kamu cek harga di sini',
    desc: 'Pilih layanan, masukkan ukuran. Harganya langsung keluar, nggak perlu daftar atau isi form panjang.',
  },
  belumAda: {
    judul: 'Kamu isi ukuran di sini',
    desc: 'Pilih layanan, masukkan ukuran, terus kirim lewat WhatsApp. Nggak perlu daftar atau isi form panjang.',
  },
};

const LANGKAH_CHAT = {
  judul: 'Lanjut chat WhatsApp',
  desc: 'Tombol di kalkulator langsung bikin pesan berisi ukuran dan hitungannya. Kamu tinggal kirim.',
};

const LANGKAH_HARGA = {
  judul: 'Harga pasti, baru dikerjakan',
  desc: 'Setelah survei kami kasih harga final. Kalau nggak cocok, boleh batal tanpa biaya.',
};

// Kata "gratis" cuma untuk kota yang dinyalakan pemilik di admin Pengaturan.
function langkahSurvei(kotaGratis: string[]) {
  return {
    judul: 'Kami survei lokasi',
    desc: `Kami datang, ukur langsung, cek kondisi tembok dan atapnya. ${
      kotaGratis.length > 0
        ? `Gratis di ${gabungKota(kotaGratis)}, dan kamu belum terikat apa-apa.`
        : 'Kamu belum terikat apa-apa.'
    }`,
  };
}

export function ProcessSection({ adaHarga, kotaGratis }: { adaHarga: boolean; kotaGratis: string[] }) {
  const LANGKAH: { judul: string; desc: string; disini?: boolean }[] = [
    { ...LANGKAH_PERTAMA[adaHarga ? 'adaHarga' : 'belumAda'], disini: true },
    LANGKAH_CHAT,
    langkahSurvei(kotaGratis),
    LANGKAH_HARGA,
  ];

  return (
    <section id="cara-kerja" className="py-16 sm:py-20 lg:py-24 bg-kertas text-tinta border-b border-kertas-garis">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3 mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            Habis ini ngapain?
          </h2>
          <p className="text-tinta-lembut leading-relaxed">
            Dari isi ukuran sampai dikerjakan, nggak ada biaya sampai kamu setuju harga finalnya.
          </p>
        </div>

        <ol className="space-y-px">
          {LANGKAH.map((item, i) => (
            <li
              key={item.judul}
              className={`flex gap-5 p-5 sm:p-6 ${
                item.disini
                  ? 'bg-white border border-kertas-garis rounded-2xl'
                  : 'border-b border-kertas-garis last:border-b-0'
              }`}
            >
              <span
                className={`font-heading text-2xl font-bold shrink-0 w-8 ${
                  item.disini ? 'text-oranye-gelap' : 'text-tinta-samar'
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-navy">{item.judul}</h3>
                <p className="text-sm text-tinta-lembut leading-relaxed">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
