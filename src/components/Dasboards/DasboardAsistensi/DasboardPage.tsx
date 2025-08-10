'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import FilterBar from '@/components/Dasboards/DasboardAsistensi/FilterBar';
import KPIStats from '@/components/Dasboards/DasboardAsistensi/KPIStats';
import MainCharts from '@/components/Dasboards/DasboardAsistensi/MainCharts';
import DataTable, { DataItem } from '@/components/Dasboards/DasboardAsistensi/DataTabel';
import FormModal from '@/components/Dasboards/DasboardAsistensi/FormInput';

// 🟢 Tipe respons API
interface ApiResponse {
  status: string;
  data: DataItem[];
}

const fetcher = (url: string): Promise<DataItem[]> =>
  axios.get<ApiResponse>(url).then((res) => res.data.data);

const API_URL =
  'https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString('id-ID');
};

export default function DashboardPage() {
  const { data, error, mutate } = useSWR<DataItem[]>(API_URL, fetcher);
  const [rumahSakitFilter, setRumahSakitFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [onlyToday, setOnlyToday] = useState<boolean>(true); // 🆕 Toggle Hari Ini

  // Update filter tanggal otomatis kalau onlyToday aktif
  useEffect(() => {
    if (onlyToday) {
      const today = new Date();
      const formatted = today.toISOString().split('T')[0];
      setStartDate(formatted);
      setEndDate(formatted);
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [onlyToday]);

  // Auto refresh setiap 60 detik jika aktif
  useEffect(() => {
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(() => mutate(), 60000);
    }
    return () => {
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [autoRefresh, mutate]);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const rumahSakitOptions = useMemo(() => {
    return ['All', ...Array.from(new Set(safeData.map((d) => d.rumahSakit)))];
  }, [safeData]);

  const filteredData = useMemo(() => {
    return safeData.filter((d) => {
      if (rumahSakitFilter !== 'All' && d.rumahSakit !== rumahSakitFilter) return false;
      const isoDate = d.date.split('T')[0];
      if (startDate && isoDate < startDate) return false;
      if (endDate && isoDate > endDate) return false;
      const searchLower = searchTerm.toLowerCase();
      if (
        searchTerm &&
        !(
          d.tindakanOperasi.toLowerCase().includes(searchLower) ||
          d.operator.toLowerCase().includes(searchLower)
        )
      )
        return false;
      return true;
    });
  }, [safeData, rumahSakitFilter, startDate, endDate, searchTerm]);

  const months = useMemo(
    () => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    []
  );

  const monthly = useMemo(
    () =>
      Array(12)
        .fill(0)
        .map((_, i) =>
          filteredData
            .filter((d) => new Date(d.date).getMonth() === i)
            .reduce((sum, x) => sum + x.jumlah, 0)
        ),
    [filteredData]
  );

  const breakdown = useMemo(() => {
    return Object.entries(
      filteredData.reduce((acc: Record<string, number>, x) => {
        acc[x.rumahSakit] = (acc[x.rumahSakit] || 0) + x.jumlah;
        return acc;
      }, {})
    );
  }, [filteredData]);

  const total = useMemo(() => filteredData.reduce((s, x) => s + x.jumlah, 0), [filteredData]);

  const avg = useMemo(() => (filteredData.length ? total / filteredData.length : 0), [
    total,
    filteredData,
  ]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        Tanggal: formatDate(item.date),
        RumahSakit: item.rumahSakit,
        Tindakan: item.tindakanOperasi,
        Operator: item.operator,
        Jumlah: item.jumlah,
        Status: item.status,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `dashboard_${rumahSakitFilter}.xlsx`);
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: DataItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (no: number) => {
    const confirmDelete = confirm('Yakin ingin menghapus data ini?');
    if (!confirmDelete) return;
    try {
      await axios.post(API_URL, {
        methodOverride: 'DELETE',
        no,
      });
      mutate();
    } catch {
      alert('Gagal menghapus data.');
    }
  };

  if (error)
    return (
      <div className="p-4 text-red-500">Error loading data</div>
    );
  if (!Array.isArray(data)) return <div className="p-4">Loading…</div>;

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ duration: 0.4 }}
    >
      <header className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard Operasi</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Toggle Hanya Hari Ini */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyToday}
              onChange={(e) => setOnlyToday(e.target.checked)}
            />
            Saat ini
          </label>

          <FilterBar
            rumahSakitOptions={rumahSakitOptions}
            rumahSakitFilter={rumahSakitFilter}
            setRumahSakitFilter={setRumahSakitFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            mutate={mutate}
            handleExport={handleExport}
          />
          <button
            onClick={handleAddClick}
            className="flex items-center px-3 py-3 bg-green-600 text-white rounded-full text-sm hover:scale-105 transition-transform"
          >
            <Plus size={16} className="rounded-full" />
          </button>
        </div>
      </header>

      <KPIStats entries={filteredData.length} total={total} avg={avg} />
      <MainCharts
        months={months}
        monthly={monthly}
        breakdown={breakdown}
        filteredCount={filteredData.length}
      />
      <DataTable
        filteredData={filteredData}
        originalLength={safeData.length}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <FormModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            mutate();
            setShowForm(false);
          }}
          initialData={editingItem}
        />
      )}
    </motion.div>
  );
}
