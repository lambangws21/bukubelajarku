"use client";

import React, { useState, useMemo, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import axios from "axios";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar,
  RefreshCcw,
  Download,
  Plus,
  Filter,
  Wallet,
  Coins,
  Heart,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import monkeyAnimation from "@/components/hear-no-evil-monkey.json";
import Lottie from "lottie-react";

import KPIStats from "@/components/Dasboards/Dasboard_Advance/KPIStats";
import MainCharts from "@/components/Dasboards/Dasboard_Advance/MainCharts";
import DataTable from "@/components/Dasboards/Dasboard_Advance/DataTabel";
import AdvanceStats from "@/components/Dasboards/Dasboard_Advance/AdvanceStats";
import AdvanceTable from "@/components/Dasboards/Dasboard_Advance/AdvanceTabel";
import IntertainDashboard from "@/components/Dasboards/Dasboard_Advance/IntertainTabel";
import AdvanceFormModal from "@/components/Dasboards/Dasboard_Advance/AdvanceFormModal";
import IntertainFormModal from "@/components/Dasboards/Dasboard_Advance/FormInputIntertain";
import BiayaFormModal from "@/components/Dasboards/Dasboard_Advance/FormBiaya";

import { AdvanceItem, ApiResponse } from "@/types/advance";

const BASE_API_URL =
  "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

const fetcher = (url: string) =>
  axios.get<ApiResponse>(url).then((r) => r.data);

export default function DashboardPage() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // State untuk filter dan modal
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [jenisFilter, setJenisFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [editingAdvance, setEditingAdvance] = useState<AdvanceItem | null>(
    null
  );

  const [modalState, setModalState] = useState<{
    type: "biaya" | "advance" | "intertain" | null;
    open: boolean;
  }>({ type: null, open: false });

  // API URL dinamis sesuai bulan & tahun terpilih
  const API_URL = useMemo(() => {
    let url = `${BASE_API_URL}?sheet=ALL`;
    if (selectedMonth && selectedYear) {
      url += `&month=${selectedMonth}&year=${selectedYear}`;
    }
    return url;
  }, [selectedMonth, selectedYear]);

  const { data, error, mutate } = useSWR<ApiResponse>(API_URL, fetcher);
  const { mutate: globalMutate } = useSWRConfig();

  // Auto refresh data tiap 60 detik jika aktif
  useEffect(() => {
    if (!autoRefresh) return;
    const intervalId = window.setInterval(() => mutate(), 60000);
    return () => clearInterval(intervalId);
  }, [autoRefresh, mutate]);

  // Derived lists dan options filter jenis biaya
  const dataList = useMemo(() => data?.data ?? [], [data]);
  const jenisOptions = useMemo(
    () => ["All", ...Array.from(new Set(dataList.map((d) => d.jenisBiaya)))],
    [dataList]
  );

  // Filter data sesuai filter aktif
  const filteredData = useMemo(
    () =>
      dataList.filter((d) => {
        const isoDate = d.date?.split("T")[0] || "";
        return (
          (jenisFilter === "All" || d.jenisBiaya === jenisFilter) &&
          (!startDate || isoDate >= startDate) &&
          (!endDate || isoDate <= endDate) &&
          (!searchTerm ||
            d.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }),
    [dataList, jenisFilter, startDate, endDate, searchTerm]
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthly = useMemo(
    () =>
      Array(12)
        .fill(0)
        .map((_, i) =>
          filteredData
            .filter(
              (d) =>
                d.date &&
                !isNaN(new Date(d.date).getTime()) &&
                new Date(d.date).getMonth() === i
            )
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

  // Export ke XLSX
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        Date: new Date(item.date).toLocaleDateString(),
        Jenis: item.jenisBiaya,
        Keterangan: item.keterangan,
        Jumlah: item.jumlah,
        klaimOleh: item.klaimOleh,
        Status: item.status,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `dashboard_${jenisFilter}.xlsx`);
  };

  // Delete Advance Item
  const handleDeleteAdvance = async (item: AdvanceItem) => {
    const res = await fetch(BASE_API_URL, {
      method: "POST",
      body: JSON.stringify({
        methodOverride: "DELETE",
        sheet: "Sheet3",
        no: item.no,
      }),
    });

    const result = await res.json();
    if (result.status === "success") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await globalMutate(API_URL);
    }
  };

  // Handlers dropdown filter
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedMonth(Number(e.target.value));
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedYear(Number(e.target.value));
  const handleJenisFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setJenisFilter(e.target.value);

  if (error) return <div className="p-4 text-red-500">Error loading data</div>;
  if (!data)
    return (
      <div className="p-4">
        <Lottie
          animationData={monkeyAnimation}
          loop={true}
          className="w-48 h-48"
        />
      </div>
    );

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <TooltipProvider>
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

          {/* Pilih Bulan & Tahun */}
          <div className="flex items-center gap-2 px-3 py-2">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="rounded-xl border px-2 py-1 dark:bg-gray-700 dark:text-gray-200"
              aria-label="Pilih Bulan"
            >
              {months.map((month, idx) => (
                <option key={month} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="rounded-xl border px-2 py-1 dark:bg-gray-700 dark:text-gray-200"
              aria-label="Pilih Tahun"
            >
              {Array(5)
                .fill(0)
                .map((_, i) => {
                  const year = currentYear - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Filter Jenis Biaya */}
          <select
            value={jenisFilter}
            onChange={handleJenisFilterChange}
            className="rounded-xl border px-2 py-1 dark:bg-gray-700 dark:text-gray-200"
            aria-label="Filter Jenis Biaya"
          >
            {jenisOptions.map((jenis) => (
              <option key={jenis} value={jenis}>
                {jenis}
              </option>
            ))}
          </select>

          {/* Tombol action */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => mutate()}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Refresh Data"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh Data</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleExport}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Export Data"
                >
                  <Download className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Export Data</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setModalState({ type: "biaya", open: true })}
                  className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                  aria-label="Tambah Biaya"
                >
                  <Wallet className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Tambah Biaya</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setModalState({ type: "advance", open: true })}
                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                  aria-label="Tambah Advance"
                >
                  <Coins className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Tambah Advance</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    setModalState({ type: "intertain", open: true })
                  }
                  className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition"
                  aria-label="Tambah Intertain"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Tambah Intertain</TooltipContent>
            </Tooltip>
          </div>
        </header>
      </TooltipProvider>

      <KPIStats entries={filteredData.length} total={total} avg={avg} />
      <AdvanceStats advance={data.advance ?? null} />
      <MainCharts
        months={months}
        monthly={monthly}
        breakdown={breakdown}
        filteredCount={filteredData.length}
      />

      <Tabs defaultValue="biaya" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="biaya">Data Biaya</TabsTrigger>
          <TabsTrigger value="advance">Data Advance</TabsTrigger>
          <TabsTrigger value="intertain">Data Intertain</TabsTrigger>
        </TabsList>
        <TabsContent value="biaya">
          <DataTable
            filteredData={filteredData}
            originalLength={dataList.length}
          />
        </TabsContent>
        <TabsContent value="advance">
          {data.advance?.items && (
            <AdvanceTable
              data={data.advance.items}
              onEdit={(item) => {
                setEditingAdvance(item);
                setModalState({ type: "advance", open: true });
              }}
              onDelete={handleDeleteAdvance}
            />
          )}
        </TabsContent>
        <TabsContent value="intertain">
          <IntertainDashboard intertainData={data.intertain ?? []} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        {modalState.open && modalState.type === "biaya" && (
          <BiayaFormModal
            isOpen
            onClose={() => setModalState({ type: null, open: false })}
            onSuccess={() => globalMutate(API_URL)}
          />
        )}
        {modalState.open && modalState.type === "advance" && (
          <AdvanceFormModal
            isOpen
            initialData={editingAdvance}
            onClose={() => {
              setEditingAdvance(null);
              setModalState({ type: null, open: false });
            }}
            onSuccess={() => {
              setEditingAdvance(null);
              globalMutate(API_URL);
            }}
          />
        )}
        {modalState.open && modalState.type === "intertain" && (
          <IntertainFormModal
            isOpen
            onClose={() => setModalState({ type: null, open: false })}
            onSuccess={() => globalMutate(API_URL)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
