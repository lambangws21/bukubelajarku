"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Download, FileSpreadsheet, RefreshCw, Clock3 } from "lucide-react";

import KPIStats from "@/components/Dasboards/DasboardAsistensi/KPIStats";
import MainCharts from "@/components/Dasboards/DasboardAsistensi/MainCharts";
import DataTable, { DataItem } from "@/components/Dasboards/DasboardAsistensi/DataTabel";
import FormModal from "@/components/Dasboards/DasboardAsistensi/FormInput";

interface ApiResponse {
  status: string;
  data: DataItem[];
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec";

const fetcher = async (url: string): Promise<DataItem[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil data");
  const json: ApiResponse = await res.json();
  return Array.isArray(json.data) ? json.data : [];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString("id-ID");
};

export default function DashboardPage() {
  const { data, error, mutate, isLoading } = useSWR<DataItem[]>(API_URL, fetcher, {
    revalidateOnFocus: false,
  });

  const [rumahSakitFilter, setRumahSakitFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [startMonth, setStartMonth] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(() => mutate(), 60_000);
    }
    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [autoRefresh, mutate]);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const rumahSakitOptions = useMemo(
    () => ["All", ...Array.from(new Set(safeData.map((d) => d.rumahSakit).filter(Boolean)))],
    [safeData]
  );

  const filteredData = useMemo(() => {
    const searchLower = deferredSearchTerm.trim().toLowerCase();

    return safeData.filter((row) => {
      if (rumahSakitFilter !== "All" && row.rumahSakit !== rumahSakitFilter) return false;

      if (startMonth && endMonth) {
        const start = new Date(`${startMonth}-01`);
        const end = new Date(`${endMonth}-01`);
        end.setMonth(end.getMonth() + 1);
        const rowDate = new Date(row.date);
        if (rowDate < start || rowDate >= end) return false;
      }

      if (
        searchLower &&
        !(
          row.tindakanOperasi.toLowerCase().includes(searchLower) ||
          row.operator.toLowerCase().includes(searchLower) ||
          row.rumahSakit.toLowerCase().includes(searchLower)
        )
      ) {
        return false;
      }

      return true;
    });
  }, [safeData, rumahSakitFilter, startMonth, endMonth, deferredSearchTerm]);

  const months = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
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
          acc[x.rumahSakit] = (acc[x.rumahSakit] || 0) + x.jumlah;
          return acc;
        }, {})
      ),
    [filteredData]
  );

  const total = useMemo(
    () => filteredData.reduce((sum, row) => sum + row.jumlah, 0),
    [filteredData]
  );
  const avg = useMemo(
    () => (filteredData.length ? total / filteredData.length : 0),
    [total, filteredData]
  );

  const handleExportExcel = async () => {
    try {
      if (!filteredData.length) {
        toast.warning("Tidak ada data untuk diexport");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Asistensi");

      worksheet.columns = [
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Rumah Sakit", key: "rumahSakit", width: 25 },
        { header: "Tindakan", key: "tindakan", width: 30 },
        { header: "Operator", key: "operator", width: 25 },
        { header: "Jumlah", key: "jumlah", width: 18 },
        { header: "Status", key: "status", width: 15 },
      ];

      filteredData.forEach((item) => {
        worksheet.addRow({
          tanggal: formatDate(item.date),
          rumahSakit: item.rumahSakit,
          tindakan: item.tindakanOperasi,
          operator: item.operator,
          jumlah: item.jumlah,
          status: item.status,
        });
      });

      worksheet.views = [{ state: "frozen", ySplit: 1 }];
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (worksheet.columns[colNumber - 1]?.key === "jumlah") {
            cell.numFmt = '"Rp"#,##0';
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
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `asistensi_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Export Excel berhasil");
    } catch (err) {
      console.error(err);
      toast.error("Gagal export Excel");
    }
  };

  const handleExportCSV = () => {
    try {
      if (!filteredData.length) {
        toast.warning("Tidak ada data untuk diexport");
        return;
      }

      const headers = ["Tanggal", "Rumah Sakit", "Tindakan", "Operator", "Jumlah", "Status"];
      const rows = filteredData.map((item) => [
        formatDate(item.date),
        item.rumahSakit,
        item.tindakanOperasi,
        item.operator,
        item.jumlah,
        item.status,
      ]);

      const csvContent = [headers, ...rows]
        .map((entry) => entry.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `asistensi_${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Export CSV berhasil");
    } catch {
      toast.error("Gagal export CSV");
    }
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
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          methodOverride: "DELETE",
          no,
        }),
      });

      if (!res.ok) {
        throw new Error("Request gagal");
      }

      toast.success("Data berhasil dihapus");
      void mutate();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus data");
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
        Error loading data asistensi.
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4 p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
              Asistensi Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Filter lebih cepat, tabel lebih ringan, dan input data langsung dari halaman ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void mutate()}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Refresh"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition ${
                autoRefresh
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              }`}
            >
              <Clock3 size={14} />
              Auto
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-cyan-600 bg-cyan-600 px-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
            <button
              type="button"
              onClick={handleAddClick}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={14} />
              Tambah Data
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-2 md:grid-cols-12">
          <select
            value={rumahSakitFilter}
            onChange={(e) => setRumahSakitFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 md:col-span-3"
          >
            {rumahSakitOptions.map((rumahSakit) => (
              <option key={rumahSakit} value={rumahSakit}>
                {rumahSakit}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
          />
          <input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
          />
          <input
            type="text"
            placeholder="Cari RS / Tindakan / Operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 md:col-span-5"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading data asistensi...
        </div>
      ) : (
        <>
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
        </>
      )}

      {showForm ? (
        <FormModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            void mutate();
            setShowForm(false);
          }}
          initialData={editingItem}
        />
      ) : null}
    </motion.div>
  );
}
