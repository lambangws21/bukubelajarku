'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  isOpen: boolean;
  initialData?: {
    no: number;
    tanggal: string;
    jenis: string;
    keterangan: string;
    jumlah: number;
    rumahSakit: string;
  } | null;
}

export default function FormInputIntertainModal({ onSuccess, onClose, isOpen, initialData }: Props) {
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
      const url = initialData ? `/api/intertain?no=${initialData.no}` : '/api/intertain';

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
    } catch (err) {
      toast.error('Terjadi kesalahan saat memproses.');
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
            <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center">
              {initialData ? 'Edit Data Intertain' : 'Tambah Data Intertain'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Jenis"
                className="w-full border rounded px-3 py-2 text-sm"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Keterangan"
                className="w-full border rounded px-3 py-2 text-sm"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
              <input
                type="number"
                placeholder="Jumlah"
                className="w-full border rounded px-3 py-2 text-sm"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                required
              />
              <input
                type="text"
                placeholder="Rumah Sakit"
                className="w-full border rounded px-3 py-2 text-sm"
                value={rumahSakit}
                onChange={(e) => setRumahSakit(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded px-4 py-2 w-full"
              >
                {loading ? 'Menyimpan...' : initialData ? 'Perbarui' : 'Simpan'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
