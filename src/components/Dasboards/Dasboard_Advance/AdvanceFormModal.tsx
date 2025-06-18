import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdvanceItem } from '@/types/advance';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvanceFormModalProps {
  initialData: AdvanceItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdvanceFormModal({ initialData, onClose, onSuccess }: AdvanceFormModalProps) {
  const [tanggal, setTanggal] = useState<string>(initialData.tanggal);
  const [jumlah, setJumlah] = useState<number>(initialData.jumlah);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/advance/editDeleteData', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no: initialData.no,
          tanggal,
          jumlah,
        }),
      });

      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Advance berhasil diperbarui!');
        onSuccess();
      } else {
        toast.error(result.message || 'Gagal memperbarui data.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyimpan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h2 className="text-lg font-bold mb-4 text-center">Edit Advance</h2>
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
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Dialog>
  );
}
