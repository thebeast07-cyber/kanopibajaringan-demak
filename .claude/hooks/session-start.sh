#!/bin/bash
# Pasang plugin antislop tiap sesi cloud nyala. Container cloud selalu baru,
# jadi plugin yang terdaftar di settings.json belum ikut terunduh.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if [ -d "$HOME/.claude/plugins/cache/anti-slop/antislop" ]; then
  exit 0
fi

# Gagal install jangan sampai bikin sesi gagal start.
claude plugin marketplace add miqdadbadjuber/anti-slop >&2 || echo "antislop: gagal tambah marketplace" >&2
claude plugin install antislop@anti-slop >&2 || echo "antislop: gagal install plugin" >&2
exit 0
