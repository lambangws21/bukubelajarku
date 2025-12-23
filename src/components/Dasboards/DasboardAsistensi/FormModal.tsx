'use client';

import React, { useEffect, useState } from 'react';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    no: number;
    date: string;
    rumahSakit: string;
    tindakanOperasi: string;
    operator: string;
    jumlah: number;
    status: string;
  } | null;
}

const API_URL =
  'https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec';

export default function FormModal({
  visible,
  onClose,
  onSuccess,
  initialData,
}: FormModalProps) {
  const [date, setDate] = useState('');
  const [rumahSakit, setRumahSakit] = useState('');
  const [tindakanOperasi, setTindakanOperasi] = useState('');
  const [operator, setOperator] = useState('');
  const [jumlah, setJumlah] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= SYNC INITIAL DATA ================= */
  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setDate(initialData.date);
      setRumahSakit(initialData.rumahSakit);
      setTindakanOperasi(initialData.tindakanOperasi);
      setOperator(initialData.operator);
      setJumlah(initialData.jumlah);
    } else {
      setDate('');
      setRumahSakit('');
      setTindakanOperasi('');
      setOperator('');
      setJumlah(0);
      setFile(null);
    }
  }, [visible, initialData]);

  /* ================= FILE → BASE64 ================= */
  const fileToBase64 = (file: File): Promise<{
    fileBase64: string;
    fileName: string;
    mimeType: string;
  }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          fileBase64: result.split(',')[1],
          fileName: file.name,
          mimeType: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!date || !rumahSakit || !tindakanOperasi || !operator || jumlah <= 0) {
      alert('Harap lengkapi semua field dengan benar.');
      return;
    }

    try {
      setIsSubmitting(true);

      let filePayload = {};
      if (file && !initialData) {
        filePayload = await fileToBase64(file);
      }

      const payload = initialData
        ? {
            methodOverride: 'PUT',
            no: initialData.no,
            date,
            rumahSakit,
            tindakanOperasi,
            operator,
            jumlah,
          }
        : {
            date,
            rumahSakit,
            tindakanOperasi,
            operator,
            jumlah,
            ...filePayload,
          };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Request gagal');

      onSuccess();
      onClose();
    } catch (err) {
      alert('Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? 'Edit' : 'Tambah'} Data Operasi
        </h2>

        <div className="space-y-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <input type="text" placeholder="Rumah Sakit" value={rumahSakit} onChange={(e) => setRumahSakit(e.target.value)} className="input" />
          <input type="text" placeholder="Tindakan Operasi" value={tindakanOperasi} onChange={(e) => setTindakanOperasi(e.target.value)} className="input" />
          <input type="text" placeholder="Operator" value={operator} onChange={(e) => setOperator(e.target.value)} className="input" />
          <input type="number" placeholder="Jumlah" value={jumlah} onChange={(e) => setJumlah(Number(e.target.value))} className="input" />

          {!initialData && (
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
          )}
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:scale-105 transition"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
