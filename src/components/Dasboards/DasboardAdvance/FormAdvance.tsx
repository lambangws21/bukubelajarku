'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postAdvance } from '@/lib/postAdvance';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { X } from 'lucide-react';

interface FormAdvanceModalProps {
  onSuccess?: () => void;
}

export default function FormAdvanceModal({ onSuccess }: FormAdvanceModalProps) {
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
      onSuccess?.();
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
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Tambah Advance
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 text-black dark:text-white border dark:border-gray-700 rounded-xl w-full max-w-md p-6 relative shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-semibold mb-4 text-center">Tambah Data Advance</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Keterangan</label>
                  <input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Advance biaya operasional"
                    className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2 rounded-md text-white font-semibold transition ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
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
