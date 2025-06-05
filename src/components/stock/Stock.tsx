// File: pages/stock.tsx

import React, { useEffect, useState, useCallback } from "react";
import { BarChart } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/exportToPdf";

import StockSummary from "@/components/stock/stockSummary";
import FilterActions from "@/components/stock/filterAction";
import StockChart from "@/components/stock/stockChart";
import ActivityLog from "@/components/stock/activityLog";
import ItemsList from "@/components/stock/itemList";
import StockFormDialog from "@/components/stock/formStockDialog";

interface Item {
  Tanggal?: string;
  Ref: string;
  Lot: string;
  Nama: string;
  Jumlah: string;
}

interface LogEntry {
  Timestamp: string;
  Aksi: string;
  Sheet: string;
  Lot: string;
  Ref: string;
  Nama: string;
  Jumlah: string;
}

// Tambahkan UKA dan Stem seperti sebelumnya
const SHEETS = ["TKR", "Bipolar", "THR", "UKA", "Stem", "Opt", "Heads",];
const BASE_API =
  "https://script.google.com/macros/s/AKfycbzem39PAWzjAIsRZg-m17LB_ufa6_qu3e20SqtYSAeCW7Vg6nk2ZqdgMVk3B_0mGBKJ/exec";

export default function StockPage() {
  // ===== State utama =====
  const [activeSheet, setActiveSheet] = useState<string>(SHEETS[0]);
  const [formSheet, setFormSheet] = useState<string>(SHEETS[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [formData, setFormData] = useState<Partial<Item> & { tanggal?: string }>({});
  const [editingLot, setEditingLot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [totalStok, setTotalStok] = useState<number>(0);
  const [allSheetTotals, setAllSheetTotals] = useState<Record<string, number>>({});

  // ===== Fungsi fetch item berdasarkan sheet & searchQuery =====
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_API}?sheet=${activeSheet}&search=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (!Array.isArray(data)) {
        setItems([]);
        setTotalStok(0);
        return;
      }

      const formatted: Item[] = data.map((d: any) => ({
        Tanggal: d.Tanggal,
        Ref: d.Ref,
        Lot: d.Lot,
        Nama: d.Nama,
        Jumlah: d.Jumlah,
      }));

      setItems(formatted);
      const total = formatted.reduce(
        (sum, item) => sum + (parseInt(item.Jumlah) || 0),
        0
      );
      setTotalStok(total);
    } catch {
      toast.error("Gagal mengambil data");
      setItems([]);
      setTotalStok(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeSheet, searchQuery]);

  // ===== Fungsi fetch riwayat log =====
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_API}?sheet=Riwayat`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat log aktivitas");
      setLogs([]);
    }
  }, []);

  // ===== Fungsi fetch total stok tiap sheet untuk ringkasan =====
  const fetchAllSheetTotals = useCallback(async () => {
    try {
      const totals: Record<string, number> = {};
      await Promise.all(
        SHEETS.map(async (sheetName) => {
          const res = await fetch(`${BASE_API}?sheet=${sheetName}`);
          const data = await res.json();
          totals[sheetName] = Array.isArray(data)
            ? data.reduce((sum: number, i: any) => sum + (parseInt(i.Jumlah) || 0), 0)
            : 0;
        })
      );
      setAllSheetTotals(totals);
    } catch {
      toast.error("Gagal memuat total semua sheet");
      setAllSheetTotals({});
    }
  }, []);

  // ===== Handler perubahan form input =====
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "Jumlah" && value && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== Handler submit form (tambah / edit) =====
  const handleFormSubmit = async () => {
    const { Lot, Ref, Nama, Jumlah, tanggal } = formData;
    if (!Lot || !Ref || !Nama || !Jumlah || !tanggal) {
      toast.error("Semua field wajib diisi!");
      return;
    }
    const payload = {
      sheet: formSheet,
      action: editingLot ? "update" : "add",
      lot: editingLot || Lot,
      ref: Ref,
      nama: Nama,
      jumlah: Jumlah,
      tanggal,
    };

    setIsLoading(true);
    try {
      await fetch(BASE_API, {
        method: "POST",
        body: JSON.stringify({ ...payload, log: true }),
      });
      toast.success(editingLot ? "Data diperbarui" : "Data ditambahkan");
      setFormData({});
      setEditingLot(null);
      setDialogOpen(false);
      await Promise.all([fetchItems(), fetchLogs(), fetchAllSheetTotals()]);
    } catch {
      toast.error("Gagal mengirim data");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Handler hapus satu item berdasarkan lot =====
  const handleDelete = async (lot: string) => {
    if (!confirm(`Yakin ingin menghapus item dengan Lot: ${lot}?`)) return;
    setIsLoading(true);
    try {
      await fetch(BASE_API, {
        method: "POST",
        body: JSON.stringify({ sheet: activeSheet, action: "delete", lot, log: true }),
      });
      toast.success("Data dihapus");
      await Promise.all([fetchItems(), fetchLogs(), fetchAllSheetTotals()]);
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Inisialisasi & polling setiap 60s =====
  useEffect(() => {
    fetchItems();
    fetchLogs();
    fetchAllSheetTotals();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchItems();
        fetchLogs();
        fetchAllSheetTotals();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchItems, fetchLogs, fetchAllSheetTotals]);

  // ===== Jalankan fetchItems otomatis saat searchQuery atau activeSheet berubah =====
  useEffect(() => {
    fetchItems();
  }, [searchQuery, activeSheet, fetchItems]);

  // ===== Siapkan data untuk chart & 10 log terakhir =====
  const chartData = items.map((item) => ({
    nama: item.Nama,
    jumlah: parseInt(item.Jumlah) || 0,
  }));
  const recentLogs = logs.slice().reverse().slice(0, 10);

  // ===== Handler untuk mengisi form saat klik “Edit” =====
  const handleEdit = (item: Item) => {
    setFormData({ ...item, tanggal: item.Tanggal });
    setEditingLot(item.Lot);
    setFormSheet(activeSheet);
    setDialogOpen(true);
  };

  // ===== Handler untuk Export Excel/PDF =====
  const handleExportExcel = () => {
    exportToExcel(items, `stok-${activeSheet}`);
  };

  const handleExportPDF = () => {
    exportToPDF(items, `stok-${activeSheet}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 w-full">
      {/* Judul */}
      <h1 className="text-2xl font-bold flex items-center gap-2 w-full">
        📦 Manajemen Stok <BarChart size={20} />
      </h1>

      {/* 1. Ringkasan stok */}
      <StockSummary
        sheets={SHEETS}
        activeSheet={activeSheet}
        totalStok={totalStok}
        allSheetTotals={allSheetTotals}
      />

      {/* 2. Kontrol filter, pencarian, export, tambah data */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <FilterActions
          sheets={SHEETS}
          activeSheet={activeSheet}
          onSelectSheet={setActiveSheet}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onRefresh={() =>
            Promise.all([fetchItems(), fetchLogs(), fetchAllSheetTotals()])
          }
          onOpenDialog={() => setDialogOpen(true)}
        />

        {/* Tombol Export Excel & PDF */}
        <div className="flex gap-2 mt-2 lg:mt-0">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={handleExportExcel}
          >
            Export Excel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={handleExportPDF}
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* 3. Grafik batang */}
      <StockChart chartData={chartData} />

      {/* 4. Riwayat aktivitas (10 entri terakhir) */}
      <ActivityLog logs={recentLogs} />


      {/* 5. Daftar item (10 item pertama) */}
      <ItemsList
        items={items}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 6. Dialog form tambah/edit */}
      <StockFormDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingLot(null);
          setFormData({});
        }}
        formData={formData}
        formSheet={formSheet}
        onFormChange={handleFormChange}
        onFormSubmit={handleFormSubmit}
        setFormSheet={setFormSheet}
        isLoading={isLoading}
        editingLot={editingLot}
      />
    </div>
  );
}
