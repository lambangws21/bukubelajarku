// src/app/operasi/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import * as XLSX from "xlsx";
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

// register Chart.js modules
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

interface Operation {
  no: number;
  date: string;
  rumahSakit: string;
  tindakanOperasi: string;
  operator: string;
  jumlah: number;
  status: string;
}

const OPERATIONS_API_URL =
  "https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec";
const fetcher = (url: string) =>
  axios
    .get<{ status: string; data: Operation[] }>(url)
    .then((res) => res.data.data);

export default function OperasiDashboard() {
  const {
    data = [],
    error,
    mutate,
  } = useSWR<Operation[]>(OPERATIONS_API_URL, fetcher);

  // filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [tindakanFilter, setTindakanFilter] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // daftar unik tindakanOperasi
  const tindakanList = useMemo(
    () => Array.from(new Set(data.map((d) => d.tindakanOperasi))).sort(),
    [data]
  );

  // auto-refresh every minute
  useEffect(() => {
    let timer = 0;
    if (autoRefresh) timer = window.setInterval(mutate, 60000);
    return () => clearInterval(timer);
  }, [autoRefresh, mutate]);

  // filtered operations with tindakan filter
  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const iso = item.date.split("T")[0];
        if (startDate && iso < startDate) return false;
        if (endDate && iso > endDate) return false;
        if (search) {
          const term = search.toLowerCase();
          if (
            !item.rumahSakit.toLowerCase().includes(term) &&
            !item.tindakanOperasi.toLowerCase().includes(term) &&
            !item.operator.toLowerCase().includes(term)
          )
            return false;
        }
        if (
          tindakanFilter.length > 0 &&
          !tindakanFilter.includes(item.tindakanOperasi)
        ) {
          return false;
        }
        return true;
      }),
    [data, startDate, endDate, search, tindakanFilter]
  );

  // month labels
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

  // totals per month
  const monthly = useMemo(
    () =>
      Array(12)
        .fill(0)
        .map((_, i) =>
          filtered
            .filter((d) => new Date(d.date).getMonth() === i)
            .reduce((sum, x) => sum + x.jumlah, 0)
        ),
    [filtered]
  );

  // breakdown by tindakanOperasi
  const breakdown = useMemo(
    () =>
      Object.entries(
        filtered.reduce((acc: Record<string, number>, x) => {
          acc[x.tindakanOperasi] = (acc[x.tindakanOperasi] || 0) + x.jumlah;
          return acc;
        }, {})
      ),
    [filtered]
  );

  const totalOps = filtered.length;
  const totalAmount = filtered.reduce((sum, x) => sum + x.jumlah, 0);
  const avgAmount = totalOps ? totalAmount / totalOps : 0;

  // currency formatter
  const fmt = (value: number) =>
    value.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });

  const kpis = [
    { label: "Total Ops", value: totalOps.toString(), isCurrency: false },
    { label: "Total Amount", value: fmt(totalAmount), isCurrency: true },
    {
      label: "Avg Amount",
      value: fmt(Math.round(avgAmount)),
      isCurrency: true,
    },
  ];

  if (error) return <p className="p-4 text-red-500">Error loading data</p>;
  if (!data.length) return <p className="p-4">Loading…</p>;

  const fade = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100"
      initial="hidden"
      animate="visible"
      variants={fade}
      transition={{ duration: 0.4 }}
    >
      {/* Filters */}
      <header className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-500" />
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
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-2 py-1 rounded-3xl bg-white dark:bg-gray-800 border text-sm"
            />
          </div>

          {/* Filter Tindakan */}
          <SelectOption
            options={tindakanList}
            selected={tindakanFilter} // string[]
            onChange={(vals) => setTindakanFilter(vals as string[])}
            multiple
          />
          {/* Buttons */}
          <button
            onClick={() => mutate()}
            className="p-2 bg-white dark:bg-gray-800 rounded-3xl"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="p-2 bg-white dark:bg-gray-800 rounded-3xl"
            title="Auto Refresh"
          >
            <Clock
              size={18}
              className={autoRefresh ? "text-green-500" : "text-gray-500"}
            />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
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

      {/* Charts */}
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

      {/* Data Table */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fade}
        transition={{ delay: 0.8 }}
      >
        {/* wrap dengan overflow container */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[640px] w-full text-sm bg-white dark:bg-gray-800 rounded shadow">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                {["Date", "RS", "Operasi", "Operator", "Jumlah", "Status"].map(
                  (h) => (
                    <th key={h} className="px-4 py-2 text-left">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <motion.tr
                  key={idx}
                  className="border-b border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.rumahSakit}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.tindakanOperasi}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{r.operator}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {fmt(r.jumlah)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.status ? (
                      <a href={r.status} className="underline">
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
