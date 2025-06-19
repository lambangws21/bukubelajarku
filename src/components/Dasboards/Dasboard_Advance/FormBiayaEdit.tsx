'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdvanceItem } from '@/types/advance';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

interface AdvanceFormModalProps {
  initialData: AdvanceItem;
  onClose: () => void;
  onSuccess: () => void;
  sheet?: string;
}

export default function AdvanceFormModal({
  initialData,
  onClose,
  onSuccess,
  sheet = 'Sheet1',
}: AdvanceFormModalProps) {
  // ✅ Format tanggal menjadi yyyy-MM-dd (kompatibel untuk input[type="date"])
  const [tanggal, setTanggal] = useState<string>(() => {
    const date = new Date(initialData.tanggal);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]; // "yyyy-MM-dd"
  });

  const [jumlah, setJumlah] = useState<number>(initialData.jumlah);
  const [jenisBiaya, setJenisBiaya] = useState<string>(initialData.jenisBiaya || '');
  const [keterangan, setKeterangan] = useState<string>(initialData.keterangan || '');
  const [klaimOleh, setKlaimOleh] = useState<string>(initialData.klaimOleh || '');
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
          jenisBiaya,
          keterangan,
          klaimOleh,
          sheet,
        }),
      });

      const result = await res.json();
      if (result.status === 'success') {
        toast.success('Data berhasil diperbarui!');
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
      <motion.div
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-md mx-auto mt-20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Edit Biaya Operasional</h2>
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
            <label className="block text-sm font-medium mb-1">Jenis Biaya</label>
            <Input
              type="text"
              value={jenisBiaya}
              onChange={(e) => setJenisBiaya(e.target.value)}
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
          <div>
            <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
            <Input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Klaim Oleh</label>
            <Input
              type="text"
              value={klaimOleh}
              onChange={(e) => setKlaimOleh(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </motion.div>
    </Dialog>
  );
}
