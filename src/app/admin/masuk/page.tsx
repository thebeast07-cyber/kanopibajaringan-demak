'use client';

import React, { useState } from 'react';

export default function AdminMasukPage() {
  const [kataSandi, setKataSandi] = useState('');
  const [pesan, setPesan] = useState('');
  const [proses, setProses] = useState(false);

  const masuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kataSandi) {
      setPesan('Isi kata sandinya dulu.');
      return;
    }
    setProses(true);
    setPesan('');
    try {
      const res = await fetch('/api/admin/masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: kataSandi }),
      });
      if (res.ok) {
        // Cuma terima tujuan di dalam /admin, biar link masuk nggak bisa dipakai buat
        // mengarahkan orang ke situs lain.
        const lanjut = new URLSearchParams(window.location.search).get('lanjut') || '';
        window.location.assign(lanjut.startsWith('/admin') ? lanjut : '/admin/isi-data');
        return;
      }
      const isi = await res.json().catch(() => ({}));
      setPesan(isi.pesan || 'Gagal masuk. Coba lagi.');
    } catch {
      setPesan('Koneksi putus. Cek internetnya lalu coba lagi.');
    }
    setProses(false);
  };

  return (
    <main className="min-h-screen bg-kertas text-tinta flex items-center justify-center px-4 py-12">
      <form onSubmit={masuk} noValidate className="w-full max-w-sm bg-white border border-kertas-garis rounded-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold text-hutan">Masuk ke admin</h1>
          <p className="text-sm text-tinta-lembut">Khusus pemilik 3 Putra.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="kata-sandi" className="block text-sm font-semibold text-tinta">
            Kata sandi
          </label>
          <input
            id="kata-sandi"
            type="password"
            autoComplete="current-password"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            aria-invalid={Boolean(pesan)}
            aria-describedby={pesan ? 'pesan-masuk' : undefined}
            className={`w-full min-h-[44px] px-3 rounded-lg bg-white text-tinta ${
              pesan ? 'border-2 border-tinta' : 'border border-tinta-batas'
            }`}
          />
        </div>

        {pesan && (
          <p id="pesan-masuk" role="alert" className="text-sm font-semibold text-tinta">
            {pesan}
          </p>
        )}

        <button
          type="submit"
          disabled={proses}
          className="w-full min-h-[44px] rounded-lg bg-hutan hover:bg-hutan-muda text-white font-semibold disabled:opacity-60"
        >
          {proses ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}
