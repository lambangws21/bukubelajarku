'use client';

import { useEffect, useState } from 'react';
import { IntertainItem } from '@/types/intertain';
import IntertainTable from '@/components/Dasboards/DasboardIntertain/Inter';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IntertainDashboard() {
  const [data, setData] = useState<IntertainItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intertain');
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else if (Array.isArray(json.intertain)) {
        setData(json.intertain);
      } else {
        console.error('Format response tidak valid:', json);
        toast.error('Format data tidak dikenali!');
      }
    } catch (error) {
      console.error('Gagal fetch data intertain:', error);
      toast.error('Gagal memuat data intertain');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: IntertainItem) => {
    const confirmed = window.confirm(`Yakin ingin menghapus data "${item.jenis}" di ${item.rumahSakit}?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/intertain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no: item.no }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        toast.success('Data berhasil dihapus');
        fetchData();
      } else {
        toast.error(json.message || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Gagal menghapus:', error);
      toast.error('Terjadi kesalahan saat menghapus');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600">Memuat data...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-semibold">Tidak ada data Intertain</p>
          <p className="text-sm mt-2">Silakan tambah data terlebih dahulu</p>
        </div>
      ) : (
        <IntertainTable
          data={data}
          onDelete={handleDelete}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
