// File: components/DataTable.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface DataItem {
  no: number;
  date: string;
  rumahSakit: string;
  tindakanOperasi: string;
  operator: string;
  jumlah: number;
  status: string;
}

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
  onEdit: (item: DataItem) => void;
  onDelete: (no: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ filteredData, originalLength, onEdit, onDelete }) => {
  // Sort data by date from newest to oldest
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredData]);

  return (
    <motion.div
      className="overflow-x-auto rounded-lg shadow-xl"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-700 dark:text-gray-300 rounded-t-lg">
        Menampilkan <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sortedData.length}</span> dari <span className="font-semibold">{originalLength}</span> data operasi
      </div>
      <table className="min-w-full text-sm bg-white dark:bg-gray-800 rounded-b-lg divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['Tanggal', 'Rumah Sakit', 'Tindakan Operasi', 'Operator', 'Jumlah', 'Status', 'Aksi'].map(h => (
              <th key={h} className="px-6 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedData.map((r, i) => (
            <motion.tr
              key={`${r.no}-${r.rumahSakit}-${i}`}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{format(new Date(r.date), 'dd MMMM yyyy', { locale: id })}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{r.rumahSakit}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{r.tindakanOperasi}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{r.operator}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600 dark:text-green-400">Rp {r.jumlah.toLocaleString('id-ID')}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {r.status ? <a href={r.status} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 underline" target="_blank" rel="noopener noreferrer">Lihat</a> : <span className="text-gray-400">-</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                <motion.button
                  onClick={() => onEdit(r)}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  title="Edit Data"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Pencil size={18} />
                </motion.button>
                <motion.button
                  onClick={() => onDelete(r.no)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                  title="Hapus Data"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={18} />
                </motion.button>
              </td>
            </motion.tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                Tidak ada data yang tersedia.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );
};

export default DataTable;