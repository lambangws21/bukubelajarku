// File: components/DataTable.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';

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
  return (
    <motion.div
      className="overflow-x-auto"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ delay: 0.8 }}
    >
      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Menampilkan {filteredData.length} dari {originalLength} data operasi
      </div>
      <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-200 dark:bg-gray-700">
          <tr>
            {['Tanggal', 'Rumah Sakit', 'Tindakan Operasi', 'Operator', 'Jumlah', 'Status'].map(h => (
              <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredData.map((r, i) => (
            <motion.tr
              key={`${r.no}-${r.rumahSakit}-${i}`}
              className="border-b border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              <td className="px-4 py-2 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-2 whitespace-nowrap">{r.rumahSakit}</td>
              <td className="px-4 py-2 whitespace-nowrap">{r.tindakanOperasi}</td>
              <td className="px-4 py-2 whitespace-nowrap">{r.operator}</td>
              <td className="px-4 py-2 whitespace-nowrap">Rp {r.jumlah.toLocaleString()}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                {r.status ? <a href={r.status} className="underline" target="_blank">View</a> : '-'}
              </td>
              {/* <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                <button
                  onClick={() => onEdit(r)}
                  className="text-blue-600 hover:scale-105"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onDelete(r.no)}
                  className="text-red-600 hover:scale-105"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </td> */}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default DataTable;
