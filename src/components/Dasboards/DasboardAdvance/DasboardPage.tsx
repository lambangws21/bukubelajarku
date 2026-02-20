"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ExcelJS from "exceljs";
import { motion } from "framer-motion";
import { PlusCircle, Wallet2 } from "lucide-react";

import FilterBar from "@/components/Dasboards/DasboardAdvance/FilterBar";
import KPIStats from "@/components/Dasboards/DasboardAdvance/KPIStats";
import MainCharts from "@/components/Dasboards/DasboardAdvance/MainCharts";
import DataTable, { DataItem } from "@/components/Dasboards/DasboardAdvance/DataTabel";
import FormAdvanceModal from "@/components/Dasboards/DasboardAdvance/FormAdvance";
import FormBiayaModal from "@/components/Dasboards/DasboardAdvance/FormBiaya";

const API_BASE = "/api/advance/getData?sheet=Sheet1";

type AdvanceApiRow = {
  no?: number | string;
  date?: string;
  jenisBiaya?: string;
  keterangan?: string;
  jumlah?: number | string;
  klaimOleh?: string;
  status?: string;
  fileUrl?: string;
  googleDriveId?: string;
};

const getDriveId = (value?: string) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) {
    return raw.split(",")[0]?.trim() || "";
  }

  const fromPath = raw.match(/\/d\/([^/]+)/)?.[1];
  if (fromPath) return fromPath;
  const fromQuery = raw.match(/[?&]id=([^&]+)/)?.[1];
  return fromQuery?.split(",")[0]?.trim() || "";
};

const buildDrivePreviewUrl = (googleDriveId?: string) => {
  const id = getDriveId(googleDriveId);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : "";
};

const mapAdvanceRow = (row: AdvanceApiRow, idx: number): DataItem => ({
  no: Number(row.no ?? idx + 1),
  date: String(row.date ?? ""),
  jenisBiaya: String(row.jenisBiaya ?? "-"),
  keterangan: String(row.keterangan ?? ""),
  jumlah: Number(row.jumlah ?? 0),
  klaimOleh: String(row.klaimOleh ?? "-"),
  status: String(row.status || row.fileUrl || buildDrivePreviewUrl(row.googleDriveId) || ""),
});

const parseDateFlexible = (value?: string): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // 2026-02-20 or 2026-02-20T...
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = new Date(raw.length > 10 ? raw : `${raw}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // 20/02/2026
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // 20-02-2026
  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) {
    const [, d, m, y] = dash;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildMonthlyRequestUrls = (
  startDate: string,
  endDate: string,
  todayISO: string,
  onlyToday: boolean
) => {
  const monthUrl = (date: Date) =>
    `${API_BASE}&month=${date.getMonth() + 1}&year=${date.getFullYear()}`;

  if (onlyToday) {
    const today = parseDateFlexible(todayISO) || new Date();
    return [monthUrl(today)];
  }

  const start = parseDateFlexible(startDate);
  const end = parseDateFlexible(endDate);

  if (start && end) {
    const from = new Date(start.getFullYear(), start.getMonth(), 1);
    const to = new Date(end.getFullYear(), end.getMonth(), 1);
    const normalizedFrom = from <= to ? from : to;
    const normalizedTo = from <= to ? to : from;

    const urls: string[] = [];
    const cursor = new Date(normalizedFrom);
    let guard = 0;
    while (cursor <= normalizedTo && guard < 60) {
      urls.push(monthUrl(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
      guard += 1;
    }
    return urls;
  }

  const pivot = start || end || parseDateFlexible(todayISO) || new Date();
  return [monthUrl(pivot)];
};

const fetcher = async (urls: string[]): Promise<DataItem[]> => {
  const responses = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch data");
      const json: { status?: string; data?: AdvanceApiRow[] } = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    })
  );

  const flatRows = responses.flat();
  const seen = new Set<string>();
  const merged = flatRows.filter((row, idx) => {
    const key = `${row.no ?? idx}|${row.date ?? ""}|${row.jenisBiaya ?? ""}|${row.keterangan ?? ""}|${row.jumlah ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return merged.map((row, idx) => mapAdvanceRow(row, idx));
};

export default function DashboardPage() {
  const [jenisFilter, setJenisFilter] = useState<string>("All");
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [onlyToday, setOnlyToday] = useState<boolean>(false);

  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);
  const startDate = useMemo(
    () => (onlyToday ? todayISO : manualStartDate),
    [onlyToday, todayISO, manualStartDate]
  );
  const endDate = useMemo(
    () => (onlyToday ? todayISO : manualEndDate),
    [onlyToday, todayISO, manualEndDate]
  );

  const requestUrls = useMemo(
    () => buildMonthlyRequestUrls(startDate, endDate, todayISO, onlyToday),
    [startDate, endDate, todayISO, onlyToday]
  );

  const { data, error, mutate, isLoading } = useSWR<DataItem[]>(requestUrls, fetcher, {
    revalidateOnFocus: false,
  });

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(() => mutate(), 60_000);
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [autoRefresh, mutate]);

  const jenisOptions = useMemo(
    () => ["All", ...Array.from(new Set(safeData.map((d) => d.jenisBiaya)))],
    [safeData]
  );

  const filteredData = useMemo(
    () =>
      safeData.filter((row) => {
        if (jenisFilter !== "All" && row.jenisBiaya !== jenisFilter) return false;

        const rowDate = parseDateFlexible(row.date);
        const start = parseDateFlexible(startDate);
        const end = parseDateFlexible(endDate);
        if (rowDate && start && rowDate < start) return false;
        if (rowDate && end) {
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (rowDate > endOfDay) return false;
        }

        if (searchTerm && !row.keterangan.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        return true;
      }),
    [safeData, jenisFilter, startDate, endDate, searchTerm]
  );

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
            .filter((d) => {
              const parsed = parseDateFlexible(d.date);
              return parsed ? parsed.getMonth() === i : false;
            })
            .reduce((sum, item) => sum + item.jumlah, 0)
        ),
    [filteredData]
  );

  const breakdown = useMemo(
    () =>
      Object.entries(
        filteredData.reduce((acc: Record<string, number>, item) => {
          acc[item.jenisBiaya] = (acc[item.jenisBiaya] || 0) + item.jumlah;
          return acc;
        }, {})
      ),
    [filteredData]
  );

  const total = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.jumlah, 0),
    [filteredData]
  );
  const avg = useMemo(
    () => (filteredData.length ? total / filteredData.length : 0),
    [total, filteredData]
  );

  const handleExportExcel = async () => {
    if (!filteredData.length) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Advance");

      worksheet.columns = [
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Jenis Biaya", key: "jenis", width: 22 },
        { header: "Keterangan", key: "keterangan", width: 35 },
        { header: "Jumlah", key: "jumlah", width: 18 },
        { header: "Status", key: "status", width: 20 },
      ];

      filteredData.forEach((item) => {
        const parsedDate = parseDateFlexible(item.date);
        worksheet.addRow({
          tanggal: parsedDate ? parsedDate.toLocaleDateString("id-ID") : item.date,
          jenis: item.jenisBiaya,
          keterangan: item.keterangan,
          jumlah: item.jumlah,
          status: item.status ?? "-",
        });
      });

      worksheet.views = [{ state: "frozen", ySplit: 1 }];
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
      a.download = `advance_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal export Excel");
    }
  };

  const handleRefreshAfterSubmit = () => {
    setJenisFilter("All");
    setSearchTerm("");
    setOnlyToday(false);
    setManualStartDate("");
    setManualEndDate("");
    void mutate();
    window.setTimeout(() => {
      void mutate();
    }, 1500);
  };

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
        Error loading data advance.
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
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
              Advance Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tambah input, filter data, dan pantau tren advance dalam satu halaman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FormAdvanceModal onSuccess={handleRefreshAfterSubmit} />
            <FormBiayaModal onSuccess={handleRefreshAfterSubmit} />
            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-white/80 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-900/50 dark:bg-slate-900 dark:text-cyan-300">
              <Wallet2 size={14} />
              Input form aktif
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <PlusCircle size={14} />
            Filter Data
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyToday}
              onChange={(e) => setOnlyToday(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600"
            />
            Hanya hari ini
          </label>
        </div>

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
          mutate={() => {
            void mutate();
          }}
          handleExport={handleExportExcel}
          dateInputsDisabled={onlyToday}
        />
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading data advance...
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
          <DataTable filteredData={filteredData} originalLength={safeData.length} />
        </>
      )}
    </motion.div>
  );
}
