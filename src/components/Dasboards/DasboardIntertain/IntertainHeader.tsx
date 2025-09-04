'use client';

import { useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { IntertainItem } from '@/types/intertain';

interface IntertainHeaderProps {
  data: IntertainItem[];
  search: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
}

export default function IntertainHeader({
  data,
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: IntertainHeaderProps) {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.jumlah, 0);
  }, [data]);

  const rumahSakitList = Array.from(new Set(data.map((d) => d.rumahSakit))).filter(Boolean);

  return (
    <div className="space-y-4 mb-4">
      {/* Card Total */}
      <div className="bg-blue-600 text-white rounded-lg p-4 shadow flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Total Pengeluaran Intertain</h2>
          <p className="text-lg font-bold">
            Rp {total.toLocaleString('id-ID')}
          </p>
        </div>
        <Building2 className="w-10 h-10 opacity-30" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari jenis atau keterangan..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md text-sm w-full"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full sm:w-1/3 border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Semua Rumah Sakit</option>
          {rumahSakitList.map((rs, i) => (
            <option key={i} value={rs}>{rs}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
