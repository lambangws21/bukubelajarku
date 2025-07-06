'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Search, Pencil, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
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

  const visibleData = useMemo(() => {
    return intertainData.filter((item) => {
      const inRange = (!startDate || item.tanggal >= startDate) && (!endDate || item.tanggal <= endDate);
      const matchesSearch = !searchTerm || item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());
      return inRange && matchesSearch;
    });
  }, [intertainData, startDate, endDate, searchTerm]);

  const handleDelete = async (no: number) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await fetch('/api/delete-intertain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no })
      });
      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Data berhasil dihapus');
        location.reload();
      } else {
        toast.error('Gagal menghapus data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus.');
    }
  };

  const handleEdit = (item: IntertainItem) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      visibleData.map((item) => ({
        Tanggal: item.tanggal,
        Jenis: item.jenis,
        Keterangan: item.keterangan,
        Jumlah: item.jumlah,
        'Rumah Sakit': item.rumahSakit,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Intertain');
    XLSX.writeFile(wb, 'IntertainData.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Tanggal', 'Jenis', 'Keterangan', 'Jumlah', 'Rumah Sakit']],
      body: visibleData.map((item) => [
        item.tanggal,
        item.jenis,
        item.keterangan,
        'Rp ' + item.jumlah.toLocaleString('id-ID'),
        item.rumahSakit,
      ]),
      startY: 10,
    });
    doc.save('IntertainData.pdf');
  };

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ delay: 0.8 }}
    >
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-2 py-1 rounded-md text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-2 py-1 rounded-md text-sm"
          />
          <div className="relative">
            <Search className="absolute left-2 top-2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2 py-1 border rounded-md text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded flex items-center gap-1">
            <FileDown className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded flex items-center gap-1">
            <FileDown className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Tanggal', 'Jenis', 'Keterangan', 'Jumlah', 'Rumah Sakit', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {visibleData.map((r, i) => (
              <motion.tr
                key={`${r.no}-${r.rumahSakit}-${i}`}
                className="border-b border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="px-4 py-2 whitespace-nowrap">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.jenis}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.keterangan}</td>
                <td className="px-4 py-2 whitespace-nowrap">Rp {r.jumlah.toLocaleString('id-ID')}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.rumahSakit}</td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-800" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.no)} className="text-red-600 hover:text-red-800" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
            {visibleData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Tidak ada data ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editData && (
        <FormEditIntertainModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditData(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditData(null);
            location.reload();
          }}
          initialData={editData}
        />
      )}
    </motion.div>
  );
};

export default DataTable;
