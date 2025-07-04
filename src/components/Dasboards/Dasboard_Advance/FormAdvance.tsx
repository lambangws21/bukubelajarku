'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postAdvance } from '@/lib/postAdvance';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Wallet, X } from 'lucide-react';

export default function FormAdvanceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [tanggal, setTanggal] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    if (!isLoading) {
      setIsOpen(false);
      setTanggal('');
      setJumlah('');
      setKeterangan('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !jumlah) {
      toast.error('Tanggal dan jumlah wajib diisi!');
      return;
    }

    setIsLoading(true);
    try {
      await postAdvance(tanggal, Number(jumlah), keterangan);
      toast.success('Advance berhasil ditambahkan!');
      closeModal();
    } catch (err: any) {
      toast.error('Gagal menambahkan advance: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
      >
        <Wallet className="w-4 h-4" /> Tambah Advance
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-white dark:bg-gray-900 text-black dark:text-white border dark:border-gray-700 rounded-xl shadow-lg relative px-5 py-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-center text-lg font-semibold mb-5">Tambah Data Advance</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 font-medium">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium">Keterangan</label>
                  <input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Uang Muka pembelian alat"
                    className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2 rounded-md text-white font-semibold text-sm transition ${
                    isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
