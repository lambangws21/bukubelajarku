// File: components/DataTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Wallet, Pencil, Trash2, X } from 'lucide-react';

export interface DataItem {
  no: number;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
  status: string; // URL gambar
}

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
  onEdit?: (item: DataItem) => void;
  onDelete?: (no: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ filteredData, originalLength, onEdit, onDelete }) => {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredData]);

  const openModal = (url: string) => {
    setModalImage(url);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
    <motion.div
      className="rounded-lg shadow-xl"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-700 dark:text-gray-300 rounded-t-lg">
        Menampilkan <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sortedData.length}</span> dari <span className="font-semibold">{originalLength}</span> data klaim
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {['Tanggal', 'Jenis Biaya', 'Jumlah', 'Klaim Oleh', 'Keterangan', 'Bukti', 'Aksi'].map(h => (
                <th key={h} className="px-6 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((r, i) => (
              <motion.tr
                key={`${r.no}-${r.keterangan}-${i}`}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{format(new Date(r.date), 'dd MMMM yyyy', { locale: id })}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  {r.jenisBiaya === 'Biaya Operasi' ? <FileText size={16} className="text-blue-500" /> : <Wallet size={16} className="text-green-500" />}
                  {r.jenisBiaya}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600 dark:text-green-400">Rp {r.jumlah.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{r.klaimOleh}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{r.keterangan}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {r.status ? (
                    <button onClick={() => openModal(r.status)} className="focus:outline-none hover:opacity-80 transition-opacity">
                      <div className="relative w-16 h-12 rounded-md overflow-hidden shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                        <Image
                          src={r.status}
                          alt="Bukti Klaim"
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    </button>
                  ) : (
                    <span className="text-gray-400">Tidak ada bukti</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                  {onEdit && (
                    <motion.button
                      onClick={() => onEdit(r)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900"
                      title="Edit Data"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Pencil size={18} />
                    </motion.button>
                  )}
                  {onDelete && (
                    <motion.button
                      onClick={() => onDelete(r.no)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                      title="Hapus Data"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  )}
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
      </div>

      {/* Modal untuk menampilkan gambar */}
      {modalImage && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 shadow-lg z-50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Tutup"
            >
              <X size={24} />
            </button>
            <Image
              src={modalImage}
              alt="Bukti Klaim Penuh"
              width={700}
              height={700}
              objectFit="contain"
              className="max-h-[80vh] max-w-[80vw]"
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DataTable;