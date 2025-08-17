// File: components/DataTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, X, FileText, Wallet } from 'lucide-react';
import { DataItem } from "@/types/advance";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import AdvanceFormModal from "@/components/Dasboards/Dasboard_Advance/FormBiayaEdit";
import { toast } from "react-toastify";

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
  onRefresh?: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ filteredData, originalLength, onRefresh }) => {
  const [editItem, setEditItem] = useState<DataItem | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredData]);

  const handleDelete = async (no: number) => {
    if (!confirm("Yakin ingin menghapus data ini secara permanen?")) return;

    try {
      const res = await fetch("/api/advance/editDeleteData", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no, sheet: "Sheet1" }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Data berhasil dihapus!");
        onRefresh?.();
      } else {
        toast.error(result.message || "Gagal menghapus data.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus data.");
    }
  };
  
  const openImageModal = (url: string) => setModalImage(url);
  const closeImageModal = () => setModalImage(null);

  return (
    <motion.div
      className="w-full rounded-lg shadow-xl"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-700 dark:text-gray-300 rounded-t-lg">
        Menampilkan <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sortedData.length}</span> dari <span className="font-semibold">{originalLength}</span> data advance
      </div>

      {/* --- Tampilan Desktop & Tablet (Tabel) --- */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="overflow-y-auto max-h-[500px] rounded-b-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {['Tanggal', 'Jenis Biaya', 'Jumlah', 'Klaim Oleh', 'Keterangan', 'Bukti', 'Aksi'].map(h => (
                  <th key={h} className="px-6 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.length > 0 ? (
                sortedData.map((r, i) => (
                  <motion.tr
                    key={`${r.no}-${r.keterangan}-${i}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{format(new Date(r.date), 'dd MMMM yyyy', { locale: id })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      {r.jenisBiaya === 'Operasi' ? <FileText size={16} className="text-blue-500" /> : <Wallet size={16} className="text-green-500" />}
                      {r.jenisBiaya}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600 dark:text-green-400">Rp {r.jumlah.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{r.klaimOleh}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{r.keterangan}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.status ? (
                        <button onClick={() => openImageModal(r.status)} className="focus:outline-none hover:opacity-80 transition-opacity">
                          <div className="relative w-16 h-12 rounded-md overflow-hidden shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                            <Image src={r.status} alt="Bukti Klaim" layout="fill" objectFit="cover" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-gray-400">Tidak ada bukti</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditItem(r)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900">
                        <Pencil size={18} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.no)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900">
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data yang tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Tampilan Mobile (Card) --- */}
      <div className="sm:hidden p-4 space-y-4">
        {sortedData.length > 0 ? (
          sortedData.map((r, i) => (
            <motion.div
              key={`${r.no}-${r.keterangan}-${i}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Tanggal</div>
                <div className="text-right text-gray-900 dark:text-gray-100">{format(new Date(r.date), 'dd MMMM yyyy', { locale: id })}</div>
                
                <div className="font-semibold text-gray-700 dark:text-gray-300">Jenis Biaya</div>
                <div className="text-right text-gray-600 dark:text-gray-300 flex items-center justify-end gap-2">
                  {r.jenisBiaya === 'Operasi' ? <FileText size={14} className="text-blue-500" /> : <Wallet size={14} className="text-green-500" />}
                  {r.jenisBiaya}
                </div>
                
                <div className="font-semibold text-gray-700 dark:text-gray-300">Jumlah</div>
                <div className="text-right font-medium text-green-600 dark:text-green-400">Rp {r.jumlah.toLocaleString('id-ID')}</div>
                
                <div className="font-semibold text-gray-700 dark:text-gray-300">Klaim Oleh</div>
                <div className="text-right text-gray-600 dark:text-gray-300">{r.klaimOleh}</div>

                <div className="font-semibold text-gray-700 dark:text-gray-300">Keterangan</div>
                <div className="text-right text-gray-600 dark:text-gray-300 truncate">{r.keterangan}</div>

                <div className="font-semibold text-gray-700 dark:text-gray-300">Bukti</div>
                <div className="flex justify-end">
                  {r.status ? (
                    <button onClick={() => openImageModal(r.status)} className="focus:outline-none hover:opacity-80 transition-opacity">
                      <div className="relative w-16 h-12 rounded-md overflow-hidden shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                        <Image src={r.status} alt="Bukti Klaim" layout="fill" objectFit="cover" />
                      </div>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-right">Tidak ada</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditItem(r)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900">
                  <Pencil size={18} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.no)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900">
                  <Trash2 size={18} />
                </Button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            Tidak ada data yang tersedia.
          </div>
        )}
      </div>

      <AnimatePresence>
        {editItem && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <AdvanceFormModal
                initialData={{
                  no: editItem.no,
                  tanggal: editItem.date,
                  jumlah: editItem.jumlah,
                  jenisBiaya: editItem.jenisBiaya,
                  keterangan: editItem.keterangan,
                  klaimOleh: editItem.klaimOleh,
                }}
                onClose={() => setEditItem(null)}
                onSuccess={() => {
                  setEditItem(null);
                  onRefresh?.();
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {modalImage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeImageModal}
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
      </AnimatePresence>
    </motion.div>
  );
};

export default DataTable;