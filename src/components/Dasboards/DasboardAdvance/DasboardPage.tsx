// File: components/DashboardPage.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

import FilterBar from '@/components/Dasboards/DasboardAdvance/FilterBar';
import KPIStats from '@/components/Dasboards/DasboardAdvance/KPIStats';
import MainCharts from '@/components/Dasboards/DasboardAdvance/MainCharts';
import DataTable, { DataItem } from '@/components/Dasboards/DasboardAdvance/DataTabel';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxWYt1R2Z1A0TPkdmhHhdzWa142urbqiFfq9XbV6AAy2GwYGNbwXfznJ6UYzHeCTcW2iA/exec';
const fetcher = (url: string) =>
  axios
    .get<{ status: string; data: DataItem[] }>(url)
    .then((r) => r.data.data);

export default function DashboardPage() {
  const { data = [], error, mutate } = useSWR<DataItem[]>(API_URL, fetcher);

  const [jenisFilter, setJenisFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [onlyToday, setOnlyToday] = useState<boolean>(true); // 🆕 toggle

  // 🟢 Auto-set tanggal ke hari ini jika toggle aktif
  useEffect(() => {
    if (onlyToday) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [onlyToday]);

  // 🟢 Auto refresh setiap 60 detik jika diaktifkan
  useEffect(() => {
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(() => mutate(), 60000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, mutate]);

  const jenisOptions = useMemo(
    () => ['All', ...Array.from(new Set(data.map((d) => d.jenisBiaya)))],
    [data]
  );

  const filteredData = useMemo(
    () =>
      data.filter((d) => {
        if (jenisFilter !== 'All' && d.jenisBiaya !== jenisFilter) return false;
        const isoDate = d.date.split('T')[0];
        if (startDate && isoDate < startDate) return false;
        if (endDate && isoDate > endDate) return false;
        if (
          searchTerm &&
          !d.keterangan.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      }),
    [data, jenisFilter, startDate, endDate, searchTerm]
  );

  const months = useMemo(
    () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    []
  );

  const monthly = useMemo(
    () =>
      Array(12)
        .fill(0)
        .map(
          (_, i) =>
            filteredData
              .filter((d) => new Date(d.date).getMonth() === i)
              .reduce((sum, x) => sum + x.jumlah, 0)
        ),
    [filteredData]
  );

  const breakdown = useMemo(
    () =>
      Object.entries(
        filteredData.reduce((acc: Record<string, number>, x) => {
          acc[x.jenisBiaya] = (acc[x.jenisBiaya] || 0) + x.jumlah;
          return acc;
        }, {})
      ),
    [filteredData]
  );

  const total = useMemo(
    () => filteredData.reduce((s, x) => s + x.jumlah, 0),
    [filteredData]
  );
  const avg = useMemo(
    () => (filteredData.length ? total / filteredData.length : 0),
    [total, filteredData]
  );

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        Date: new Date(item.date).toLocaleDateString(),
        Jenis: item.jenisBiaya,
        Keterangan: item.keterangan,
        Jumlah: item.jumlah,
        Status: item.status,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `dashboard_${jenisFilter}.xlsx`);
  };

  if (error)
    return <div className="p-4 text-red-500">Error loading data</div>;
  if (!data.length) return <div className="p-4">Loading…</div>;

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ duration: 0.4 }}
    >
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard Statistik</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* 🆕 Toggle Hari Ini */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyToday}
              onChange={(e) => setOnlyToday(e.target.checked)}
            />
            Hanya Tampilkan Hari Ini
          </label>

          <FilterBar
            jenisOptions={jenisOptions}
            jenisFilter={jenisFilter}
            setJenisFilter={setJenisFilter}
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
        originalLength={data.length}
      />
    </motion.div>
  );
}
