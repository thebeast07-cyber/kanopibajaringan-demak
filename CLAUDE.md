<!-- antislop:start -->
## antislop

For UI, copy, people, mobile layout, or code comments work, read the antislop core and then the skill for the task. This project uses the Claude Code plugin install (`antislop@anti-slop`), so the files live in the plugin folder:

- Core: `~/.claude/plugins/cache/anti-slop/antislop/<version>/antislop.md`
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`

Design direction for this project lives in `DESIGN.md`. Read it for direction, then antislop as the filter.

Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.

Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.

If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.

To update antislop later: `claude plugin update antislop@anti-slop`.
<!-- antislop:end -->

## Preferensi pemilik (wajib diikuti)

### Ikon
- **Jangan pakai lucide-react atau set ikon siap pakai lain** (Heroicons, Feather, Tabler, dsb.).
  Pemilik menilainya kelihatan generik ("slop").
- Alurnya: cari referensi dulu (benda aslinya, logo 3 Putra, atau gaya ikon admin), gambar SVG
  sendiri, lalu **tunjukkan ke pemilik sebelum dipasang**, misalnya lembar pilihan A/B/C dalam
  bentuk gambar. Pasang setelah pemilik memilih.
- Gaya ikon yang sudah dipakai: grid 24×24, garis 2px, ujung dan sudut bulat, `currentColor`,
  ditulis langsung sebagai `<svg>` di komponen (lihat `NavAdmin.tsx` dan `BarBawah.tsx`).
- Sisa lucide yang masih ada: panah buka-tutup di `FaqSection.tsx`. Ganti juga kalau pemilik
  sudah memilih penggantinya.

### Cara kerja
- Gaya bahasa santai ("bro", "gua/lu"), langsung ke inti: masalah, penyebab, solusi, langkah
  berikutnya.
- Kalau pemilik bilang "observasi dulu" atau "no code dulu", jangan ubah file apa pun.
- Jangan ubah tampilan yang sudah jalan kalau tidak diminta. Fitur baru ditambahkan tanpa
  menggeser yang lama.
- Kerja di branch, push, pemilik tes di Preview Vercel. Masuk `main` hanya setelah pemilik
  bilang "merge".
