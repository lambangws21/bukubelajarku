// File: components/FormModal.tsx
'use client';

import React, { useState } from 'react';
import axios from 'axios';

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

const API_URL = 'https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec';

const FormModal: React.FC<FormModalProps> = ({ visible, onClose, onSuccess, initialData }) => {
  const [date, setDate] = useState(initialData?.date || '');
  const [rumahSakit, setRumahSakit] = useState(initialData?.rumahSakit || '');
  const [tindakanOperasi, setTindakanOperasi] = useState(initialData?.tindakanOperasi || '');
  const [operator, setOperator] = useState(initialData?.operator || '');
  const [jumlah, setJumlah] = useState(initialData?.jumlah || 0);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !rumahSakit || !tindakanOperasi || !operator || jumlah <= 0) {
      alert("Harap lengkapi semua field dengan benar.");
      return;
    }

    try {
      setIsSubmitting(true);
      let fileBase64 = '';
      let fileName = '';
      let mimeType = '';

      if (file) {
        fileName = file.name;
        mimeType = file.type;
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        fileBase64 = btoa(String.fromCharCode(...bytes));
      }

      const payload = initialData
        ? {
            methodOverride: 'PUT',
            no: initialData.no,
            date,
            rumahSakit,
            tindakanOperasi,
            operator,
            jumlah
          }
        : {
            date,
            rumahSakit,
            tindakanOperasi,
            operator,
            jumlah,
            fileName,
            fileBase64,
            mimeType
          };

      await axios.post(API_URL, payload);
      onSuccess();
    } catch (error) {
      alert('Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{initialData ? 'Edit' : 'Tambah'} Data Operasi</h2>
        <div className="space-y-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
          <input type="text" placeholder="Rumah Sakit" value={rumahSakit} onChange={e => setRumahSakit(e.target.value)} className="input" />
          <input type="text" placeholder="Tindakan Operasi" value={tindakanOperasi} onChange={e => setTindakanOperasi(e.target.value)} className="input" />
          <input type="text" placeholder="Operator" value={operator} onChange={e => setOperator(e.target.value)} className="input" />
          <input type="number" placeholder="Jumlah" value={jumlah} onChange={e => setJumlah(Number(e.target.value))} className="input" />
          {!initialData && <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="input" />}
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:scale-105"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormModal;
