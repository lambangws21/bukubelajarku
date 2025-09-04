'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import { IntertainItem } from '@/types/intertain';

interface Props {
  initialData: IntertainItem;
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function FormEditIntertainModal({
  initialData,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [tanggal, setTanggal] = useState(initialData.tanggal || '');
  const [jenis, setJenis] = useState(initialData.jenis);
  const [keterangan, setKeterangan] = useState(initialData.keterangan);
  const [jumlah, setJumlah] = useState<number>(initialData.jumlah);
  const [rumahSakit, setRumahSakit] = useState(initialData.rumahSakit);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/advance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no: initialData.no,
          tanggal,
          jenis,
          keterangan,
          jumlah,
          rumahSakit,
        }),
      });

      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Data berhasil diperbarui');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Gagal memperbarui data.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center">Edit Data Intertain</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={rumahSakit}
                onChange={(e) => setRumahSakit(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded px-4 py-2 w-full"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
