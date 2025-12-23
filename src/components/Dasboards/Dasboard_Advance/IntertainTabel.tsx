'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Search, Pencil, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import FormEditIntertainModal from '@/components/Dasboards/Dasboard_Advance/FormEditIntertain';

export interface IntertainItem {
  no: number;
  tanggal: string;
  jenis: string;
  keterangan: string;
  jumlah: number;
  rumahSakit: string;
}

interface DataTableProps {
  intertainData: IntertainItem[];
}

const DataTable: React.FC<DataTableProps> = ({ intertainData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editData, setEditData] = useState<IntertainItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ================= FILTER ================= */

  const visibleData = useMemo(() => {
    return intertainData.filter((item) => {
      const inRange =
        (!startDate || item.tanggal >= startDate) &&
        (!endDate || item.tanggal <= endDate);

      const matchesSearch =
        !searchTerm ||
        item.keterangan.toLowerCase().includes(searchTerm.toLowerCase());

      return inRange && matchesSearch;
    });
  }, [intertainData, startDate, endDate, searchTerm]);

  /* ================= ACTIONS ================= */

  const handleDelete = async (no: number) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const res = await fetch('/api/delete-intertain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no }),
      });

      const result = await res.json();

      result.status === 'success'
        ? (toast.success('Data berhasil dihapus'), location.reload())
        : toast.error('Gagal menghapus data');
    } catch {
      toast.error('Terjadi kesalahan saat menghapus');
    }
  };

  const handleEdit = (item: IntertainItem) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  /* ================= EXPORT EXCEL (ExcelJS) ================= */

  const handleExportExcel = async () => {
    if (!visibleData.length) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Intertain');

    worksheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Jenis', key: 'jenis', width: 20 },
      { header: 'Keterangan', key: 'keterangan', width: 35 },
      { header: 'Jumlah', key: 'jumlah', width: 18 },
      { header: 'Rumah Sakit', key: 'rumahSakit', width: 25 },
    ];

    visibleData.forEach((item) => {
      worksheet.addRow({
        tanggal: item.tanggal,
        jenis: item.jenis,
        keterangan: item.keterangan,
        jumlah: item.jumlah,
        rumahSakit: item.rumahSakit,
      });
    });

    /* === STYLING === */

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const header = worksheet.getRow(1);
    header.font = { bold: true };
    header.alignment = { horizontal: 'center', vertical: 'middle' };

    header.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

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
    a.download = 'IntertainData.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= EXPORT PDF ================= */

  const handleExportPDF = () => {
    if (!visibleData.length) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const doc = new jsPDF();

    autoTable(doc, {
      head: [['Tanggal', 'Jenis', 'Keterangan', 'Jumlah', 'Rumah Sakit']],
      body: visibleData.map((item) => [
        item.tanggal,
        item.jenis,
        item.keterangan,
        `Rp ${item.jumlah.toLocaleString('id-ID')}`,
        item.rumahSakit,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
      startY: 10,
    });

    doc.save('IntertainData.pdf');
  };

  /* ================= UI ================= */

  return (
    <motion.div className="space-y-4">
      {/* FILTER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border px-2 py-1 rounded text-sm" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border px-2 py-1 rounded text-sm" />
          <div className="relative">
            <Search className="absolute left-2 top-2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2 py-1 border rounded text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
            <FileDown size={14} /> Excel
          </button>
          <button onClick={handleExportPDF} className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
            <FileDown size={14} /> PDF
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded shadow">
        <table className="w-full text-sm bg-white dark:bg-gray-800">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Tanggal', 'Jenis', 'Keterangan', 'Jumlah', 'Rumah Sakit', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((r, i) => (
              <motion.tr key={r.no} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td className="px-4 py-2">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-2">{r.jenis}</td>
                <td className="px-4 py-2">{r.keterangan}</td>
                <td className="px-4 py-2">Rp {r.jumlah.toLocaleString('id-ID')}</td>
                <td className="px-4 py-2">{r.rumahSakit}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleEdit(r)} className="text-blue-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(r.no)} className="text-red-600">
                    <Trash2 size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
            {!visibleData.length && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && editData && (
        <FormEditIntertainModal
          isOpen
          initialData={editData}
          onClose={() => {
            setIsModalOpen(false);
            setEditData(null);
          }}
          onSuccess={() => location.reload()}
        />
      )}
    </motion.div>
  );
};

export default DataTable;
