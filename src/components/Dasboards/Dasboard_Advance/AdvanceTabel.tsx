'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, FileDown, Search } from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdvanceItem } from '@/types/advance';

interface AdvanceTableProps {
  data: AdvanceItem[];
  onEdit?: (item: AdvanceItem) => void;
  onDelete?: (item: AdvanceItem) => void;
}

export default function AdvanceTable({ data, onEdit, onDelete }: AdvanceTableProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const isInRange =
        (!startDate || item.tanggal >= startDate) &&
        (!endDate || item.tanggal <= endDate);
      const matchesSearch =
        !searchTerm || item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());
      return isInRange && matchesSearch;
    });
  }, [data, startDate, endDate, searchTerm]);

  const handleExportExcel = async () => {
    try {
      if (!filteredData.length) {
        alert('Tidak ada data untuk diexport');
        return;
      }
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Advance');
  
      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'Keterangan', key: 'keterangan', width: 35 },
        { header: 'Jumlah', key: 'jumlah', width: 18 },
      ];
  
      filteredData.forEach((item) => {
        worksheet.addRow({
          tanggal: item.tanggal,
          keterangan: item.keterangan || '-',
          jumlah: item.jumlah,
        });
      });
  
      /* ===== STYLING ===== */
  
      // Freeze header
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  
      // Header style
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
  
      // Body rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
  
        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
  
          // Kolom jumlah → format Rupiah
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
      a.download = 'Advance.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal export Excel');
    }
  };
  

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Tanggal', 'Keterangan', 'Jumlah']],
      body: filteredData.map((item) => [
        item.tanggal,
        item.keterangan || '-',
        'Rp ' + item.jumlah.toLocaleString('id-ID'),
      ]),
    });
    doc.save('Advance.pdf');
  };

  return (
    <motion.div className="space-y-4 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
            placeholder="Dari tanggal"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
            placeholder="Sampai tanggal"
          />
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-md pl-8 pr-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
            />
            <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FileDown className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full table-auto border-collapse rounded-xl overflow-hidden shadow-md">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm">
            <tr>
              <th className="px-4 py-2 text-left border dark:border-gray-700">Tanggal</th>
              <th className="px-4 py-2 text-left border dark:border-gray-700">Keterangan</th>
              <th className="px-4 py-2 text-right border dark:border-gray-700">Jumlah (Rp)</th>
              <th className="px-4 py-2 text-center border dark:border-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
            {filteredData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 py-2 border dark:border-gray-700">{item.tanggal}</td>
                <td className="px-4 py-2 border dark:border-gray-700">{item.keterangan || '-'}</td>
                <td className="px-4 py-2 border text-right dark:border-gray-700">
                  Rp {item.jumlah.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-2 border text-center dark:border-gray-700 space-x-2">
                  <button
                    onClick={() => onEdit?.(item)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Yakin ingin menghapus data ini?')) {
                        onDelete?.(item);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Tidak ada data advance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile List View */}
      <div className="block md:hidden space-y-3">
        {filteredData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm space-y-1"
          >
            <p className="text-sm"><strong>Tanggal:</strong> {item.tanggal}</p>
            <p className="text-sm"><strong>Keterangan:</strong> {item.keterangan || '-'}</p>
            <p className="text-sm"><strong>Jumlah:</strong> Rp {item.jumlah.toLocaleString('id-ID')}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => onEdit?.(item)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Yakin ingin menghapus data ini?')) {
                    onDelete?.(item);
                  }
                }}
                className="text-red-600 hover:text-red-800 dark:text-red-400"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Tidak ada data advance.
          </div>
        )}
      </div>
    </motion.div>
  );
}
