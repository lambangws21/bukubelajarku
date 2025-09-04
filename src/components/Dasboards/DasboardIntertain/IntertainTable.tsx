'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil,
  Trash2,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Building2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { IntertainItem } from '@/types/intertain';
import FormInputIntertainModal from '@/components/Dasboards/DasboardIntertain/formInput';
import FormEditIntertainModal from '@/components/Dasboards/DasboardIntertain/formEdit';

interface IntertainTableProps {
  data: IntertainItem[];
  onDelete?: (item: IntertainItem) => void;
  onRefresh: () => void;
}

export default function IntertainTable({
  data,
  onDelete,
  onRefresh,
}: IntertainTableProps) {
  const [inputOpen, setInputOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IntertainItem | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const filteredData = data
    .filter(
      (item) =>
        item.jenis.toLowerCase().includes(search.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(search.toLowerCase()) ||
        item.rumahSakit.toLowerCase().includes(search.toLowerCase())
    )
    .filter((item) => !filter || item.rumahSakit === filter);

  const total = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.jumlah, 0);
  }, [filteredData]);

  const rumahSakitList = Array.from(new Set(data.map((d) => d.rumahSakit))).filter(Boolean);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Intertain');
    XLSX.writeFile(workbook, 'Intertain.xlsx');
  };

  return (
    <motion.div className="p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Total Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-medium tracking-wide">Total Pengeluaran Intertain</h2>
          <p className="text-2xl font-bold mt-1">Rp {total.toLocaleString('id-ID')}</p>
        </div>
        <Building2 className="w-10 h-10 opacity-20" />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari jenis, keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Semua Rumah Sakit</option>
          {rumahSakitList.map((rs, i) => (
            <option key={i} value={rs}>
              {rs}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setInputOpen(true)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition"
          >
            <PlusCircle className="w-4 h-4" /> Tambah
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Jenis</th>
              <th className="px-4 py-3 text-left">Keterangan</th>
              <th className="px-4 py-3 text-right">Jumlah (Rp)</th>
              <th className="px-4 py-3 text-left">Rumah Sakit</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-100">
            {filteredData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.tanggal}</td>
                <td className="px-4 py-3">{item.jenis}</td>
                <td className="px-4 py-3">{item.keterangan}</td>
                <td className="px-4 py-3 text-right">
                  Rp {item.jumlah.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">{item.rumahSakit}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setEditOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(item)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400 italic">
                  Tidak ada data ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Input */}
      <FormInputIntertainModal
        isOpen={inputOpen}
        onClose={() => setInputOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Modal Edit */}
      {selectedItem && (
        <FormEditIntertainModal
          initialData={selectedItem}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            onRefresh();
            setEditOpen(false);
          }}
        />
      )}
    </motion.div>
  );
}
