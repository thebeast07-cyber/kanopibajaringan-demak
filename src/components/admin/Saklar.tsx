'use client';

import React from 'react';
import { kelasBantuan } from './gaya';

export function Saklar({
  id,
  nyala,
  onUbah,
  judul,
  bantuan,
}: {
  id: string;
  nyala: boolean;
  onUbah: (nyala: boolean) => void;
  judul: string;
  bantuan: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={nyala}
      onClick={() => onUbah(!nyala)}
      className="w-full flex items-center justify-between gap-4 min-h-[64px] py-2 text-left"
    >
      <span className="space-y-0.5">
        <span className="block text-[15px] font-semibold text-tinta">{judul}</span>
        <span className={`block ${kelasBantuan}`}>{bantuan}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${nyala ? 'bg-navy' : 'bg-tinta-batas'}`}
      >
        <span
          className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-[left] ${
            nyala ? 'left-[23px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  );
}
