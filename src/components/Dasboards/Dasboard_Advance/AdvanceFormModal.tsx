'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { AdvanceItem } from '@/types/advance';

interface AdvanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AdvanceItem | null;
}

export default function AdvanceFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}: AdvanceFormModalProps) {
  const [tanggal, setTanggal] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = !!initialData?.no;

  useEffect(() => {
    if (initialData) {
      setTanggal(initialData.tanggal || '');
      setJumlah(initialData.jumlah || '');
      setKeterangan(initialData.keterangan || '');
    } else {
      setTanggal('');
      setJumlah('');
      setKeterangan('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    if (!tanggal || !jumlah || Number(jumlah) <= 0) {
      toast.error('Tanggal dan jumlah wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sheet: 'Sheet3',
        tanggal,
        jumlah: Number(jumlah),
        keterangan,
        ...(isEditMode && { no: initialData?.no }),
      };

      const res = await fetch('/api/advance/editSheet3', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.status === 'success') {
        toast.success(`Advance berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Gagal menyimpan data.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h2 className="text-lg font-bold mb-4 text-center">
                {isEditMode ? 'Edit Advance' : 'Tambah Advance'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal</label>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah</label>
                  <Input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Keterangan</label>
                  <Input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Data'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
