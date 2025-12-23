'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
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
} from 'chart.js';
import { Chart, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { Calendar, Search, RefreshCw, Clock } from 'lucide-react';

/* ================= CHART REGISTER ================= */
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

/* ================= TYPES ================= */
interface Operation {
  no: number;
  date: string;
  rumahSakit: string;
  tindakanOperasi: string;
  operator: string;
  jumlah: number;
  status: string;
}

interface ApiResponse {
  status: string;
  data: Operation[];
}

/* ================= API ================= */
const OPERATIONS_API_URL =
  'https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec';

/* ================= FETCHER (NO AXIOS) ================= */
const fetcher = async (url: string): Promise<Operation[]> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch data');
  const json: ApiResponse = await res.json();
  return json.data;
};

/* ================= COMPONENT ================= */
export default function OperasiDashboard() {
  const { data = [], error, mutate, isLoading } = useSWR(
    OPERATIONS_API_URL,
    fetcher
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    if (!autoRefresh) return;

    const id = window.setInterval(() => {
      mutate();
    }, 60000);

    return () => clearInterval(id);
  }, [autoRefresh, mutate]);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return data.filter((item) => {
      const iso = item.date.split('T')[0];

      if (startDate && iso < startDate) return false;
      if (endDate && iso > endDate) return false;

      if (search) {
        const term = search.toLowerCase();
        if (
          !item.rumahSakit.toLowerCase().includes(term) &&
          !item.tindakanOperasi.toLowerCase().includes(term) &&
          !item.operator.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data, startDate, endDate, search]);

  /* ================= MONTH LABELS ================= */
  const months = useMemo(
    () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    []
  );

  /* ================= MONTHLY TOTAL ================= */
  const monthly = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        filtered
          .filter((d) => new Date(d.date).getMonth() === i)
          .reduce((sum, x) => sum + x.jumlah, 0)
      ),
    [filtered]
  );

  /* ================= BREAKDOWN ================= */
  const breakdown = useMemo(
    () =>
      Object.entries(
        filtered.reduce<Record<string, number>>((acc, x) => {
          acc[x.tindakanOperasi] =
            (acc[x.tindakanOperasi] || 0) + x.jumlah;
          return acc;
        }, {})
      ),
    [filtered]
  );

  /* ================= KPI ================= */
  const totalOps = filtered.length;
  const totalAmount = filtered.reduce((s, x) => s + x.jumlah, 0);
  const avgAmount = totalOps ? totalAmount / totalOps : 0;

  const formatRupiah = (v: number) =>
    v.toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    });

  /* ================= STATES ================= */
  if (error)
    return <p className="p-4 text-red-500">Error loading data</p>;

  if (isLoading)
    return <p className="p-4">Loading…</p>;

  const fade = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  /* ================= UI ================= */
  return (
    <motion.div
      className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100"
      initial="hidden"
      animate="visible"
      variants={fade}
      transition={{ duration: 0.4 }}
    >
      {/* ================= FILTER ================= */}
      <header className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 rounded bg-white dark:bg-gray-800 border text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 rounded bg-white dark:bg-gray-800 border text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-2 py-1 rounded bg-white dark:bg-gray-800 border text-sm"
            />
          </div>

          <button
            onClick={() => mutate()}
            className="p-2 bg-white dark:bg-gray-800 rounded"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={() => setAutoRefresh((p) => !p)}
            className="p-2 bg-white dark:bg-gray-800 rounded"
            title="Auto Refresh"
          >
            <Clock
              size={18}
              className={autoRefresh ? 'text-green-500' : 'text-gray-500'}
            />
          </button>
        </div>
      </header>

      {/* ================= KPI ================= */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        variants={fade}
      >
        {[
          { title: 'Total Ops', value: totalOps },
          { title: 'Total Amount', value: formatRupiah(totalAmount) },
          { title: 'Avg Amount', value: formatRupiah(Math.round(avgAmount)) },
        ].map((k) => (
          <motion.div
            key={k.title}
            className="p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded shadow"
            whileHover={{ scale: 1.03 }}
          >
            <div className="text-xs uppercase opacity-75">{k.title}</div>
            <div className="mt-1 text-2xl font-bold">{k.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <motion.div className="lg:col-span-3" variants={fade}>
          <Chart
            type="bar"
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Jumlah',
                  data: monthly,
                  backgroundColor: (ctx: ScriptableContext<'bar'>) => {
                    const gc = ctx.chart.ctx;
                    const grad = gc.createLinearGradient(0, 0, 0, 200);
                    grad.addColorStop(0, 'rgba(34,197,94,0.8)');
                    grad.addColorStop(1, 'rgba(34,197,94,0.3)');
                    return grad;
                  },
                },
              ],
            }}
            options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
          />
        </motion.div>

        <motion.div variants={fade}>
          <Doughnut
            data={{
              labels: breakdown.map((b) => b[0]),
              datasets: [
                {
                  data: breakdown.map((b) => b[1]),
                  backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#eab308',
                    '#ec4899',
                  ],
                },
              ],
            }}
            options={{ cutout: '50%', plugins: { legend: { position: 'right' } } }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
