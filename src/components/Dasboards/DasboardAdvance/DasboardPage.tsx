// File: components/DashboardPage.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import ExcelJS from "exceljs";

import { motion } from "framer-motion";

import FilterBar from "@/components/Dasboards/DasboardAdvance/FilterBar";
import KPIStats from "@/components/Dasboards/DasboardAdvance/KPIStats";
import MainCharts from "@/components/Dasboards/DasboardAdvance/MainCharts";
import DataTable, {
  DataItem,
} from "@/components/Dasboards/DasboardAdvance/DataTabel";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxWYt1R2Z1A0TPkdmhHhdzWa142urbqiFfq9XbV6AAy2GwYGNbwXfznJ6UYzHeCTcW2iA/exec";
const fetcher = async (url: string): Promise<DataItem[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch data");
  const json: { status: string; data: DataItem[] } = await res.json();
  return json.data;
};

export default function DashboardPage() {
  const { data = [], error, mutate } = useSWR<DataItem[]>(API_URL, fetcher);

  const [jenisFilter, setJenisFilter] = useState<string>("All");
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [onlyToday, setOnlyToday] = useState<boolean>(true); // 🆕 toggle

  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  const startDate = useMemo(
    () => (onlyToday ? todayISO : manualStartDate),
    [onlyToday, todayISO, manualStartDate]
  );

  const endDate = useMemo(
    () => (onlyToday ? todayISO : manualEndDate),
    [onlyToday, todayISO, manualEndDate]
  );

  // 🟢 Auto-set tanggal ke hari ini jika toggle aktif

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
    () => ["All", ...Array.from(new Set(data.map((d) => d.jenisBiaya)))],
    [data]
  );

  const filteredData = useMemo(
    () =>
      data.filter((d) => {
        if (jenisFilter !== "All" && d.jenisBiaya !== jenisFilter) return false;
        const isoDate = d.date.split("T")[0];
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
    () => [
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
    ],
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

  const handleExportExcel = async () => {
    try {
      if (!filteredData.length) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Dashboard");

      worksheet.columns = [
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Jenis Biaya", key: "jenis", width: 22 },
        { header: "Keterangan", key: "keterangan", width: 35 },
        { header: "Jumlah", key: "jumlah", width: 18 },
        { header: "Status", key: "status", width: 15 },
      ];

      filteredData.forEach((item) => {
        worksheet.addRow({
          tanggal: new Date(item.date).toLocaleDateString("id-ID"),
          jenis: item.jenisBiaya,
          keterangan: item.keterangan,
          jumlah: item.jumlah,
          status: item.status ?? "-",
        });
      });

      /* ===== STYLING ===== */

      // Freeze header
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      // Header style
      const header = worksheet.getRow(1);
      header.font = { bold: true };
      header.alignment = { horizontal: "center", vertical: "middle" };

      header.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Body style
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;

        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          const key = worksheet.columns[col - 1]?.key;
          if (key === "jumlah") {
            cell.numFmt = "#,##0";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_${jenisFilter}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal export Excel");
    }
  };

  if (error) return <div className="p-4 text-red-500">Error loading data</div>;
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
            setStartDate={setManualStartDate}
            endDate={endDate}
            setEndDate={setManualEndDate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            mutate={mutate}
            handleExport={handleExportExcel}
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
      <DataTable filteredData={filteredData} originalLength={data.length} />
    </motion.div>
  );
}
