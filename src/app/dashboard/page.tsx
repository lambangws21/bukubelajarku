'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import ExcelJS from 'exceljs';
import { toast } from 'sonner';

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
  ScriptableContext
} from 'chart.js';
import { Chart, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, Download } from 'lucide-react';

// register chart components and filler for gradients
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

interface DataItem {
  no: number;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
  status: string;
}

const API_URL =
  'https://script.google.com/macros/s/AKfycbxWYt1R2Z1A0TPkdmhHhdzWa142urbqiFfq9XbV6AAy2GwYGNbwXfznJ6UYzHeCTcW2iA/exec';
  const fetcher = async (url: string): Promise<DataItem[]> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    const json: { status: string; data: DataItem[] } = await res.json();
    return json.data;
  };
  

export default function DashboardPage() {
  const { data = [], error, mutate } = useSWR<DataItem[]>(API_URL, fetcher);
  const [jenisFilter, setJenisFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(() => mutate(), 60000);
    }
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, mutate]);

  const jenisOptions = useMemo(
    () => ['All', ...Array.from(new Set(data.map(d => d.jenisBiaya)))],
    [data]
  );

  const filteredData = useMemo(
    () =>
      data.filter(d => {
        if (jenisFilter !== 'All' && d.jenisBiaya !== jenisFilter) return false;
        const isoDate = d.date.split('T')[0];
        if (startDate && isoDate < startDate) return false;
        if (endDate && isoDate > endDate) return false;
        if (searchTerm && !d.keterangan.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      }),
    [data, jenisFilter, startDate, endDate, searchTerm]
  );

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
            .filter(d => new Date(d.date).getMonth() === i)
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

  const total = useMemo(() => filteredData.reduce((s, x) => s + x.jumlah, 0), [filteredData]);
  const avg = useMemo(() => (filteredData.length ? total / filteredData.length : 0), [total, filteredData]);

  const handleExportExcel = async () => {
    try {
      if (!filteredData.length) {
        toast.warning('Tidak ada data untuk diexport');
        return;
      }
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dashboard');
  
      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'Jenis Biaya', key: 'jenis', width: 25 },
        { header: 'Keterangan', key: 'keterangan', width: 30 },
        { header: 'Jumlah', key: 'jumlah', width: 18 },
        { header: 'Status', key: 'status', width: 15 },
      ];
  
      filteredData.forEach((item) => {
        worksheet.addRow({
          tanggal: new Date(item.date).toLocaleDateString('id-ID'),
          jenis: item.jenisBiaya,
          keterangan: item.keterangan,
          jumlah: item.jumlah,
          status: item.status ? 'Ada' : '-',
        });
      });
  
      // Freeze header
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  
      // Header style
      const header = worksheet.getRow(1);
      header.font = { bold: true };
      header.alignment = { horizontal: 'center', vertical: 'middle' };
  
      header.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
  
      // Body style
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
  
        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
  
          if (worksheet.columns[col - 1]?.key === 'jumlah') {
            cell.numFmt = '"Rp"#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      });
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
  
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_${jenisFilter}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
  
      toast.success('Export Excel berhasil');
    } catch (e) {
      console.error(e);
      toast.error('Gagal export Excel');
    }
  };
  
  const handleExportCSV = () => {
    try {
      if (!filteredData.length) {
        toast.warning('Tidak ada data untuk diexport');
        return;
      }
  
      const headers = ['Tanggal', 'Jenis Biaya', 'Keterangan', 'Jumlah', 'Status'];
  
      const rows = filteredData.map((item) => [
        new Date(item.date).toLocaleDateString('id-ID'),
        item.jenisBiaya,
        item.keterangan,
        item.jumlah,
        item.status ?? '-',
      ]);
  
      const csv =
        [headers, ...rows]
          .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
          .join('\n');
  
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_${jenisFilter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
  
      toast.success('Export CSV berhasil');
    } catch {
      toast.error('Gagal export CSV');
    }
  };
  

  if (error) return <div className="p-4 text-red-500">Error loading data</div>;
  if (!data.length) return <div className="p-4">Loading…</div>;

  const fade = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      initial="hidden" animate="visible" variants={fade} transition={{ duration: 0.4 }}
    >
      <header className="flex flex-col  space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard Statistik</h1>
        <div className="flex  flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={jenisFilter}
            onChange={e => setJenisFilter(e.target.value)}
            className="px-3 py-1 rounded-2xl border bg-white hover:cursor-pointer dark:bg-gray-800 text-sm"
          >
            {jenisOptions.map(j => <option key={j} > {j}</option>)}
          </select>
          
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1 rounded-2xl border bg-white hover:cursor-pointer dark:bg-gray-800 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1 rounded-2xl border bg-white hover:cursor-pointer dark:bg-gray-800 text-sm"
          />
          <input
            type="text"
            placeholder="Search keterangan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1 rounded-2xl border bg-white hover:cursor-pointer dark:bg-gray-800 text-sm min-w-[120px]"
          />
          <button
            onClick={() => mutate()}
            className="p-2 rounded-4xl border bg-white hover:cursor-pointer dark:bg-gray-800"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="p-2 rounded-4xl border bg-white hover:cursor-pointer dark:bg-gray-800"
            title="Toggle Auto-Refresh"
          >
            <Clock size={18} className={autoRefresh ? 'text-green-500' : 'text-gray-500'} />
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center px-4 py-2 bg-blue-600 text-white hover:cursor-pointer rounded-2xl hover:scale-105 ease-in text-sm"
          >
            <Download size={16} className="mr-1" /> Export
          </button>
        </div>
      </header>

      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredData.length} of {data.length} records
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
        initial="hidden"
        animate="visible"
        variants={fade}
        transition={{ delay: 0.2 }}
      >
        {[
          { label: 'Entries', value: filteredData.length.toString() },
          { label: 'Total', value: `Rp ${total.toLocaleString()}` },
          { label: 'Average', value: `Rp ${avg.toFixed(0)}` },
        ].map(c => (
          <motion.div
            key={c.label}
            className="p-4 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-lg shadow flex flex-col"
            whileHover={{ scale: 1.03 }}
          >
            <span className="uppercase text-xs sm:text-sm opacity-75">{c.label}</span>
            <span className="text-2xl sm:text-3xl font-bold mt-1">{c.value}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          className="lg:col-span-2 h-64 sm:h-80"
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
                  type: 'bar',
                  label: 'Biaya',
                  data: monthly,
                  backgroundColor: (ctx: ScriptableContext<'bar'>) => {
                    const gc = ctx.chart.ctx;
                    const gradient = gc.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(59,130,246,0.8)');
                    gradient.addColorStop(1, 'rgba(59,130,246,0.3)');
                    return gradient;
                  }
                },
                {
                  type: 'line',
                  label: 'Rata2',
                  data: monthly.map(m => m / (filteredData.length / 12 || 1)),
                  borderColor: 'rgba(234,179,8,0.8)',
                  backgroundColor: 'rgba(234,179,8,0.2)',
                  fill: true,
                  tension: 0.4
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { padding: 10 } }},
              scales: { y: { beginAtZero: true, grid: { color: 'rgba(200,200,200,0.2)' }}, x: { grid: { display: false } }}
            }}
          />
        </motion.div>
        <motion.div
          className="h-64 sm:h-80"
          initial="hidden"
          animate="visible"
          variants={fade}
          transition={{ delay: 0.6 }}
        >
          <Doughnut
            data={{
              labels: breakdown.map(b => b[0]),
              datasets: [{ data: breakdown.map(b => b[1]), backgroundColor: ['#3b82f6','#10b981','#eab308','#ec4899'] }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '60%',
              plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 20 } }},
              animation: { duration: 500 }
            }}
          />
        </motion.div>
      </div>

      {/* Data Table */}
      <motion.div
        className="overflow-x-auto"
        initial="hidden"
        animate="visible"
        variants={fade}
        transition={{ delay: 0.8 }}
      >
        <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Date','Jenis','Jumlah','Keterangan','Status'].map(h => (
                <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map(r => (
              <motion.tr
                key={r.no}
                className="border-b border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: r.no * 0.02 }}
              >
                <td className="px-4 py-2 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.jenisBiaya}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.keterangan}</td>
                <td className="px-4 py-2 whitespace-nowrap">Rp {r.jumlah.toLocaleString()}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {r.status ? <a href={r.status} className="underline">View</a> : '-'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}