// File: components/DataTable.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface DataItem {
  no: number;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
  status: string;
}

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
}

const DataTable: React.FC<DataTableProps> = ({ filteredData, originalLength }) => {
  return (
    <motion.div
      className="overflow-x-auto"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ delay: 0.8 }}
    >
      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredData.length} of {originalLength} records
      </div>
      <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-200 dark:bg-gray-700">
          <tr>
            {['Date', 'Jenis', 'Jumlah', 'Keterangan', 'Status'].map(h => (
              <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredData.map((r, i) => (
            <motion.tr
              key={`${r.no}-${r.keterangan}-${i}`}
              className="border-b border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              <td className="px-4 py-2 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-2 whitespace-nowrap">{r.jenisBiaya}</td>
              <td className="px-4 py-2 whitespace-nowrap">Rp {r.jumlah.toLocaleString()}</td>
              <td className="px-4 py-2 whitespace-nowrap">{r.keterangan}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                {r.status ? <a href={r.status} className="underline">View</a> : '-'}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default DataTable;
