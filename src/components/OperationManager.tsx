"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import { Calendar, Search, RefreshCw, Clock } from "lucide-react";
import SelectOption from "@/components/selectOption";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

type OperationItem = {
  id: string;
  date: string;
  dokter: string;
  tindakanOperasi: string;
  rumahSakit: string;
  jumlah: number;
  klaim: string;
  namaPerawat: string;
};

type OperationManagerProps = {
  operationsData: OperationItem[];
  isLoading: boolean;
  onDataChange?: () => void | Promise<void>;
  user?: unknown;
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const parseOperationDate = (value?: unknown): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Numeric values: Excel serial or unix timestamp
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      // Unix timestamp in milliseconds
      if (numeric > 1_000_000_000_000) {
        const parsed = new Date(numeric);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      // Unix timestamp in seconds
      if (numeric > 1_000_000_000) {
        const parsed = new Date(numeric * 1000);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      // Excel serial date
      if (numeric > 10_000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const parsed = new Date(excelEpoch.getTime() + numeric * 86400000);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
    }
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = new Date(raw.length > 10 ? raw : `${raw}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const ymdSlash = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymdSlash) {
    const [, y, m, d] = ymdSlash;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) {
    const [, d, m, y] = dash;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const sanitized = raw
    .replace(/\((WIB|WITA|WIT)\)/gi, "")
    .replace(/\bWIB\b/gi, "GMT+0700")
    .replace(/\bWITA\b/gi, "GMT+0800")
    .replace(/\bWIT\b/gi, "GMT+0900")
    .trim();

  const parsed = new Date(sanitized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseYearFallback = (value?: unknown): number | null => {
  if (!value) return null;
  const matched = String(value).match(/\b(19\d{2}|20\d{2})\b/);
  return matched ? Number(matched[1]) : null;
};

const formatDateLabel = (value?: unknown) => {
  const parsed = parseOperationDate(value);
  if (!parsed) return String(value || "-");
  return parsed.toLocaleDateString("id-ID");
};

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function OperationManager({
  operationsData,
  isLoading,
  onDataChange,
}: OperationManagerProps) {
  const [showAllData, setShowAllData] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [search, setSearch] = useState("");
  const [tindakanFilter, setTindakanFilter] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const tindakanList = useMemo(
    () => Array.from(new Set(operationsData.map((d) => d.tindakanOperasi))).sort(),
    [operationsData]
  );

  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(
        operationsData
          .map((item) => parseOperationDate(item.date)?.getFullYear() ?? parseYearFallback(item.date))
          .filter((year): year is number => typeof year === "number")
      )
    ).sort((a, b) => b - a);
  }, [operationsData]);

  useEffect(() => {
    if (!autoRefresh || !onDataChange) return;
    const timer = window.setInterval(() => {
      void onDataChange();
    }, 60000);
    return () => clearInterval(timer);
  }, [autoRefresh, onDataChange]);

  const filtered = useMemo(
    () =>
      operationsData.filter((item) => {
        const parsedDate = parseOperationDate(item.date);
        if (selectedDate) {
          if (!parsedDate || toIsoDate(parsedDate) !== selectedDate) return false;
        }
        if (selectedYear !== "all") {
          if (!parsedDate || parsedDate.getFullYear() !== Number(selectedYear)) return false;
        }
        if (startDate) {
          if (!parsedDate) return false;
          const start = new Date(`${startDate}T00:00:00`);
          if (parsedDate < start) return false;
        }
        if (endDate) {
          if (!parsedDate) return false;
          const end = new Date(`${endDate}T23:59:59.999`);
          if (parsedDate > end) return false;
        }

        if (search) {
          const term = search.toLowerCase();
          if (
            !item.rumahSakit.toLowerCase().includes(term) &&
            !item.tindakanOperasi.toLowerCase().includes(term) &&
            !item.dokter.toLowerCase().includes(term) &&
            (item.namaPerawat ?? "").toLowerCase().includes(term) === false &&
            (item.klaim ?? "").toLowerCase().includes(term) === false
          ) {
            return false;
          }
        }

        if (tindakanFilter.length > 0 && !tindakanFilter.includes(item.tindakanOperasi)) {
          return false;
        }

        return true;
      }),
    [operationsData, selectedDate, selectedYear, startDate, endDate, search, tindakanFilter]
  );

  const displayedData = useMemo(
    () => {
      const hasActiveFilter =
        selectedYear !== "all" ||
        Boolean(selectedDate) ||
        Boolean(startDate) ||
        Boolean(endDate) ||
        Boolean(search.trim()) ||
        tindakanFilter.length > 0;

      if (showAllData && !hasActiveFilter) {
        return operationsData;
      }
      return filtered;
    },
    [
      showAllData,
      operationsData,
      filtered,
      selectedYear,
      selectedDate,
      startDate,
      endDate,
      search,
      tindakanFilter,
    ]
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
          displayedData
            .filter((d) => {
              const dt = parseOperationDate(d.date);
              return dt ? dt.getMonth() === i : false;
            })
            .reduce((sum, x) => sum + x.jumlah, 0)
        ),
    [displayedData]
  );

  const breakdown = useMemo(
    () =>
      Object.entries(
        displayedData.reduce((acc: Record<string, number>, x) => {
          acc[x.tindakanOperasi] = (acc[x.tindakanOperasi] || 0) + x.jumlah;
          return acc;
        }, {})
      ),
    [displayedData]
  );

  const totalOps = displayedData.length;
  const totalAmount = displayedData.reduce((sum, x) => sum + x.jumlah, 0);
  const avgAmount = totalOps ? totalAmount / totalOps : 0;

  const fmt = (value: number) =>
    value.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });

  const kpis = [
    { label: "Total Ops", value: totalOps.toString() },
    { label: "Total Amount", value: fmt(totalAmount) },
    { label: "Avg Amount", value: fmt(Math.round(avgAmount)) },
  ];

  const fade = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  if (isLoading) return <p className="p-4">Loading...</p>;
  if (!operationsData.length) return <p className="p-4 text-muted-foreground">Belum ada data operasi.</p>;

  return (
    <motion.div
      className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100"
      initial="hidden"
      animate="visible"
      variants={fade}
      transition={{ duration: 0.4 }}
    >
      <header className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
            title="Filter tanggal"
          />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
            title="Filter tahun"
          >
            <option value="all">Semua Tahun</option>
            {yearOptions.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setSelectedDate("");
              setSelectedYear("all");
              setStartDate("");
              setEndDate("");
            }}
            className="px-3 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
            title="Reset filter tanggal dan tahun"
          >
            Reset Tanggal
          </button>
          <label className="inline-flex items-center gap-2 px-3 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm">
            <input
              type="checkbox"
              checked={showAllData}
              onChange={(e) => setShowAllData(e.target.checked)}
            />
            Semua Data
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-2 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
            />
          </div>

          <SelectOption
            options={tindakanList}
            selected={tindakanFilter}
            onChange={(vals) => setTindakanFilter(vals as string[])}
            multiple
          />

          <button
            type="button"
            onClick={() => {
              if (onDataChange) void onDataChange();
            }}
            className="p-2 bg-white dark:bg-gray-800 rounded-3xl disabled:opacity-50"
            title="Refresh"
            disabled={!onDataChange}
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className="p-2 bg-white dark:bg-gray-800 rounded-3xl disabled:opacity-50"
            title="Auto Refresh"
            disabled={!onDataChange}
          >
            <Clock size={18} className={autoRefresh ? "text-green-500" : "text-gray-500"} />
          </button>
        </div>
      </header>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        initial="hidden"
        animate="visible"
        variants={fade}
        transition={{ delay: 0.2 }}
      >
        {kpis.map(({ label, value }) => (
          <motion.div
            key={label}
            className="p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded shadow"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-xs uppercase opacity-75">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <motion.div
          className="lg:col-span-3"
          initial="hidden"
          animate="visible"
          variants={fade}
          transition={{ delay: 0.4 }}
        >
          <Chart
            type="bar"
            data={{
              labels: months,
              datasets: [
                {
                  type: "bar",
                  label: "Jumlah",
                  data: monthly,
                  backgroundColor: (ctx: ScriptableContext<"bar">) => {
                    const gc = ctx.chart.ctx;
                    const grad = gc.createLinearGradient(0, 0, 0, 200);
                    grad.addColorStop(0, "rgba(34,197,94,0.8)");
                    grad.addColorStop(1, "rgba(34,197,94,0.3)");
                    return grad;
                  },
                },
              ],
            }}
            options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
          />
        </motion.div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fade}
          transition={{ delay: 0.6 }}
        >
          <Doughnut
            data={{
              labels: breakdown.map((b) => b[0]),
              datasets: [
                {
                  data: breakdown.map((b) => b[1]),
                  backgroundColor: ["#10b981", "#3b82f6", "#eab308", "#ec4899"],
                },
              ],
            }}
            options={{
              cutout: "50%",
              plugins: { legend: { position: "right" } },
            }}
          />
        </motion.div>
      </div>

      <motion.div initial="hidden" animate="visible" variants={fade} transition={{ delay: 0.8 }}>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[640px] w-full text-sm bg-white dark:bg-gray-800 rounded shadow">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                {["Date", "RS", "Operasi", "Dokter", "Jumlah", "Klaim"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedData.map((r, idx) => (
                <motion.tr
                  key={r.id || String(idx)}
                  className="border-b border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatDateLabel(r.date)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.rumahSakit || "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.tindakanOperasi || "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.dokter || "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{fmt(Number(r.jumlah || 0))}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.klaim ? (
                      isHttpUrl(r.klaim) ? (
                        <a href={r.klaim} className="underline" target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        r.klaim
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                </motion.tr>
              ))}
              {displayedData.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={6}>
                    Data belum tersedia.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
