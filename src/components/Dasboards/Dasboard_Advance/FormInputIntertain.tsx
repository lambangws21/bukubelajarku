'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Gift, X } from 'lucide-react';

export interface IntertainFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    tanggal: string;
    jenis: string;
    keterangan: string;
    jumlah: number;
    rumahSakit: string;
  } | null;
}

export default function IntertainFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: IntertainFormModalProps) {
  const [tanggal, setTanggal] = useState('');
  const [jenis, setJenis] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [rumahSakit, setRumahSakit] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTanggal(initialData.tanggal);
      setJenis(initialData.jenis);
      setKeterangan(initialData.keterangan);
      setJumlah(initialData.jumlah);
      setRumahSakit(initialData.rumahSakit);
    } else {
      setTanggal('');
      setJenis('');
      setKeterangan('');
      setJumlah('');
      setRumahSakit('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !jenis || !jumlah || !rumahSakit) {
      toast.error('Isi semua field wajib!');
      return;
    }
    setLoading(true);
    try {
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData
        ? `/api/intertain?id=${initialData.id}`
        : '/api/intertain';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, jenis, keterangan, jumlah, rumahSakit }),
      });

      const result = await res.json();
      if (result.status === 'success') {
        toast.success(`Data berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Gagal memproses data.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memproses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg bg-white dark:bg-gray-900 text-black dark:text-white border dark:border-gray-700 rounded-xl shadow-lg relative px-5 py-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                {initialData ? 'Edit Intertain' : 'Tambah Intertain'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-md border dark:border-gray-600 dark:bg-gray-800"
                required
              />
              <input
                type="text"
                placeholder="Jenis"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="w-full px-3 py-2 rounded-md border dark:border-gray-600 dark:bg-gray-800"
                required
              />
              <input
                type="text"
                placeholder="Keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 rounded-md border dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="number"
                placeholder="Jumlah"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border dark:border-gray-600 dark:bg-gray-800"
                required
              />
              <input
                type="text"
                placeholder="Rumah Sakit"
                value={rumahSakit}
                onChange={(e) => setRumahSakit(e.target.value)}
                className="w-full px-3 py-2 rounded-md border dark:border-gray-600 dark:bg-gray-800"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
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
