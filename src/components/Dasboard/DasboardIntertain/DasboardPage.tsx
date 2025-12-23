'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import ExcelJS from 'exceljs';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import FilterBar from '@/components/Dasboards/DasboardAsistensi/FilterBar';
import KPIStats from '@/components/Dasboards/DasboardAsistensi/KPIStats';
import MainCharts from '@/components/Dasboards/DasboardAsistensi/MainCharts';
import DataTable, {
  DataItem,
} from '@/components/Dasboards/DasboardAsistensi/DataTabel';
import FormModal from '@/components/Dasboards/DasboardAsistensi/FormModal';

/* ================= TYPES ================= */
interface ApiResponse {
  status: string;
  data: DataItem[];
}

/* ================= API ================= */
const API_URL =
  'https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec';

/* ================= FETCHER ================= */
const fetcher = async (url: string): Promise<DataItem[]> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch data');
  const json: ApiResponse = await res.json();
  return json.data;
};

/* ================= COMPONENT ================= */
export default function DashboardPage() {
  const { data = [], error, mutate, isLoading } = useSWR(API_URL, fetcher);

  const [rumahSakitFilter, setRumahSakitFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    if (!autoRefresh) return;

    const id = window.setInterval(() => {
      mutate();
    }, 60000);

    return () => clearInterval(id);
  }, [autoRefresh, mutate]);

  /* ================= OPTIONS ================= */
  const rumahSakitOptions = useMemo(
    () => ['All', ...Array.from(new Set(data.map((d) => d.rumahSakit)))],
    [data]
  );

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (rumahSakitFilter !== 'All' && d.rumahSakit !== rumahSakitFilter)
        return false;

      const iso = d.date.split('T')[0];
      if (startDate && iso < startDate) return false;
      if (endDate && iso > endDate) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !d.tindakanOperasi.toLowerCase().includes(term) &&
          !d.operator.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data, rumahSakitFilter, startDate, endDate, searchTerm]);

  /* ================= STATS ================= */
  const months = useMemo(
    () => [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    []
  );

  const monthly = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        filteredData
          .filter((d) => new Date(d.date).getMonth() === i)
          .reduce((sum, x) => sum + x.jumlah, 0)
      ),
    [filteredData]
  );

  const breakdown = useMemo(
    () =>
      Object.entries(
        filteredData.reduce<Record<string, number>>((acc, x) => {
          acc[x.rumahSakit] = (acc[x.rumahSakit] || 0) + x.jumlah;
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
    [filteredData, total]
  );

  /* ================= EXPORT ================= */
  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Dashboard Operasi');
  
    // ================= HEADER =================
    ws.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Rumah Sakit', key: 'rs', width: 25 },
      { header: 'Tindakan', key: 'tindakan', width: 30 },
      { header: 'Operator', key: 'operator', width: 25 },
      { header: 'Jumlah (Rp)', key: 'jumlah', width: 18 },
      { header: 'Status', key: 'status', width: 20 },
    ];
  
    // ================= STYLE HEADER =================
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }, // gray-200
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  
    // ================= DATA =================
    filteredData.forEach((item) => {
      ws.addRow({
        date: new Date(item.date).toLocaleDateString('id-ID'),
        rs: item.rumahSakit,
        tindakan: item.tindakanOperasi,
        operator: item.operator,
        jumlah: item.jumlah,
        status: item.status || '-',
      });
    });
  
    // ================= FORMAT CELL =================
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
  
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
  
        // Kolom jumlah
        if (colNumber === 5) {
          cell.numFmt = '"Rp" #,##0';
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });
  
    // ================= FREEZE HEADER =================
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  
    // ================= DOWNLOAD =================
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${rumahSakitFilter}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  /* ================= CRUD ================= */
  const handleAddClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: DataItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (no: number) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodOverride: 'DELETE', no }),
      });
      mutate();
    } catch {
      alert('Gagal menghapus data.');
    }
  };

  /* ================= STATE ================= */
  if (error)
    return <div className="p-4 text-red-500">Error loading data</div>;

  if (isLoading)
    return <div className="p-4">Loading…</div>;

  /* ================= UI ================= */
  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">
          Dashboard Operasi
        </h1>

        <div className="flex gap-2">
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
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-2xl text-sm hover:scale-105"
          >
            <Plus size={16} className="mr-1" />
            Tambah Data
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
        originalLength={data.length}
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
