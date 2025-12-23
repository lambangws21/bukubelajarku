'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil,
  Trash2,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Building2,
} from 'lucide-react';
import ExcelJS from 'exceljs';

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

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    return data
      .filter(
        (item) =>
          item.jenis.toLowerCase().includes(search.toLowerCase()) ||
          item.keterangan.toLowerCase().includes(search.toLowerCase()) ||
          item.rumahSakit.toLowerCase().includes(search.toLowerCase())
      )
      .filter((item) => !filter || item.rumahSakit === filter);
  }, [data, search, filter]);

  /* ================= TOTAL ================= */
  const total = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.jumlah, 0),
    [filteredData]
  );

  const rumahSakitList = useMemo(
    () => Array.from(new Set(data.map((d) => d.rumahSakit))).filter(Boolean),
    [data]
  );

  /* ================= EXPORT EXCEL ================= */
  const exportToExcel = async () => {
    if (!filteredData.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Intertain');

    worksheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Jenis', key: 'jenis', width: 20 },
      { header: 'Keterangan', key: 'keterangan', width: 35 },
      { header: 'Jumlah', key: 'jumlah', width: 18 },
      { header: 'Rumah Sakit', key: 'rumahSakit', width: 25 },
    ];

    filteredData.forEach((item) => {
      worksheet.addRow({
        tanggal: item.tanggal,
        jenis: item.jenis,
        keterangan: item.keterangan,
        jumlah: item.jumlah,
        rumahSakit: item.rumahSakit,
      });
    });

    /* ===== STYLE ===== */
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, col) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (worksheet.columns[col - 1]?.key === 'jumlah') {
          cell.numFmt = '"Rp"#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Intertain.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* TOTAL CARD */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-5 shadow-lg flex justify-between mb-6">
        <div>
          <h2 className="text-sm font-medium">Total Pengeluaran Intertain</h2>
          <p className="text-2xl font-bold mt-1">
            Rp {total.toLocaleString('id-ID')}
          </p>
        </div>
        <Building2 className="w-10 h-10 opacity-20" />
      </div>

      {/* FILTER */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jenis, keterangan..."
            className="pl-10 pr-4 py-2 border rounded-md w-full text-sm"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Semua Rumah Sakit</option>
          {rumahSakitList.map((rs) => (
            <option key={rs} value={rs}>
              {rs}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setInputOpen(true)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Tambah
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-md text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Jenis</th>
              <th className="px-4 py-3 text-left">Keterangan</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3 text-left">Rumah Sakit</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.no} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.tanggal}</td>
                <td className="px-4 py-3">{item.jenis}</td>
                <td className="px-4 py-3">{item.keterangan}</td>
                <td className="px-4 py-3 text-right">
                  Rp {item.jumlah.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">{item.rumahSakit}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setEditOpen(true);
                      }}
                      className="text-blue-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(item)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      <FormInputIntertainModal
        isOpen={inputOpen}
        onClose={() => setInputOpen(false)}
        onSuccess={onRefresh}
      />

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
