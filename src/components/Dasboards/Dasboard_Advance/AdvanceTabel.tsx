'use client';

import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { AdvanceItem } from '@/types/advance';

interface AdvanceTableProps {
  data: AdvanceItem[];
  onEdit?: (item: AdvanceItem) => void;
  onDelete?: (item: AdvanceItem) => void;
}

export default function AdvanceTable({ data, onEdit, onDelete }: AdvanceTableProps) {
  return (
    <motion.div
      className="overflow-x-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <table className="min-w-full table-auto border-collapse rounded-xl overflow-hidden shadow-md">
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm">
          <tr>
            <th className="px-4 py-2 text-left border dark:border-gray-700">No</th>
            <th className="px-4 py-2 text-left border dark:border-gray-700">Tanggal</th>
            <th className="px-4 py-2 text-right border dark:border-gray-700">Jumlah (Rp)</th>
            <th className="px-4 py-2 text-center border dark:border-gray-700">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <td className="px-4 py-2 border dark:border-gray-700">{item.no}</td>
              <td className="px-4 py-2 border dark:border-gray-700">{item.tanggal}</td>
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
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
                Tidak ada data advance.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );
}
