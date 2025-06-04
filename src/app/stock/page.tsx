"use client";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Save,
  Trash2,
  BarChart,
  Download,
  Clock,
  Plus,
} from "lucide-react";
import { CSVLink } from "react-csv";
import {
  BarChart as Rechart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const SHEETS = ["TKR", "Bipolar", "THR"];
const BASE_API =
  "https://script.google.com/macros/s/AKfycbzem39PAWzjAIsRZg-m17LB_ufa6_qu3e20SqtYSAeCW7Vg6nk2ZqdgMVk3B_0mGBKJ/exec";

export default function StockPage() {
  // State utama
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

  // Fetch data stok berdasarkan sheet & pencarian
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
    } catch (_err) {
      toast.error("Gagal mengambil data");
      setItems([]);
      setTotalStok(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeSheet, searchQuery]);

  // Fetch data log aktivitas (sheet "Riwayat")
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_API}?sheet=Riwayat`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (_err) {
      toast.error("Gagal memuat log aktivitas");
      setLogs([]);
    }
  }, []);

  // Fetch total stok tiap sheet (untuk ringkasan)
  const fetchAllSheetTotals = useCallback(async () => {
    try {
      const totals: Record<string, number> = {};
      await Promise.all(
        SHEETS.map(async (sheetName) => {
          const res = await fetch(`${BASE_API}?sheet=${sheetName}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            totals[sheetName] = data.reduce(
              (sum: number, item: any) => sum + (parseInt(item.Jumlah) || 0),
              0
            );
          } else {
            totals[sheetName] = 0;
          }
        })
      );
      setAllSheetTotals(totals);
    } catch (_err) {
      toast.error("Gagal memuat total semua sheet");
      setAllSheetTotals({});
    }
  }, []);

  // Handle input perubahan di form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Batasi input hanya angka untuk field Jumlah
    if (name === "Jumlah" && value && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form (tambah atau edit)
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
      // Refresh semua data yang dibutuhkan
      await Promise.all([fetchItems(), fetchLogs(), fetchAllSheetTotals()]);
    } catch (_err) {
      toast.error("Gagal mengirim data");
    } finally {
      setIsLoading(false);
    }
  };

  // Hapus satu item berdasarkan lot
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
    } catch (_err) {
      toast.error("Gagal menghapus data");
    } finally {
      setIsLoading(false);
    }
  };

  // Inisialisasi dan polling setiap 1 menit
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

  // Panggil fetchItems otomatis saat searchQuery atau activeSheet berubah
  useEffect(() => {
    fetchItems();
  }, [searchQuery, activeSheet, fetchItems]);

  // Data untuk grafik batang
  const chartData = items.map((item) => ({
    nama: item.Nama,
    jumlah: parseInt(item.Jumlah) || 0,
  }));

  // Hanya 10 entri terakhir (urut teratas pertama)
  const recentLogs = logs.slice().reverse().slice(0, 10);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Judul & ringkasan stok */}
      <h1 className="text-2xl font-bold flex items-center gap-2">
        📦 Manajemen Stok <BarChart size={20} />
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">
            Total Implan Sheet Aktif ({activeSheet})
          </p>
          <p className="text-lg font-semibold">{totalStok} Unit</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Semua Sheet</p>
          <ul className="text-sm mt-2 space-y-1">
            {SHEETS.map((name) => (
              <li key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="font-semibold">{allSheetTotals[name] || 0}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Kontrol filter, export, dan tambah data */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          onClick={() => {
            fetchItems();
            fetchLogs();
            fetchAllSheetTotals();
          }}
        >
          🔄 Refresh Manual
        </Button>

        <Select value={activeSheet} onValueChange={setActiveSheet}>
          <SelectTrigger className="w-[180px]">{activeSheet}</SelectTrigger>
          <SelectContent>
            {SHEETS.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Cari barang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <CSVLink
          data={items}
          filename={`stok-${activeSheet}.csv`}
          className="ml-auto"
        >
          <Button variant="outline" className="flex items-center gap-1">
            <Download size={16} /> Export CSV
          </Button>
        </CSVLink>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="flex items-center gap-1">
              <Plus size={16} /> Tambah / Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLot ? "Edit Data" : "Tambah Data"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3">
              <Select value={formSheet} onValueChange={setFormSheet}>
                <SelectTrigger className="w-full">{formSheet}</SelectTrigger>
                <SelectContent>
                  {SHEETS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                name="tanggal"
                value={formData.tanggal || ""}
                onChange={handleFormChange}
              />
              <Input
                name="Lot"
                placeholder="Lot"
                value={formData.Lot || ""}
                onChange={handleFormChange}
              />
              <Input
                name="Ref"
                placeholder="Ref"
                value={formData.Ref || ""}
                onChange={handleFormChange}
              />
              <Input
                name="Nama"
                placeholder="Nama"
                value={formData.Nama || ""}
                onChange={handleFormChange}
              />
              <Input
                name="Jumlah"
                placeholder="Jumlah"
                value={formData.Jumlah || ""}
                onChange={handleFormChange}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleFormSubmit}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save size={16} /> {editingLot ? "Update" : "Tambah"} Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <hr className="my-4" />

      {/* Grafik batang */}
      <div className="h-72 bg-white rounded-xl p-4 border">
        <ResponsiveContainer width="100%" height="100%">
          <Rechart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <XAxis dataKey="nama" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="jumlah" fill="#8884d8" />
          </Rechart>
        </ResponsiveContainer>
      </div>

      {/* Riwayat Aktivitas (hanya 10 item terakhir, dengan scroll) */}
      <h2 className="text-xl font-semibold flex items-center gap-2">
        📜 Riwayat Aktivitas <Clock size={18} />
      </h2>
      <div className="max-h-80 overflow-y-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-2">Waktu</th>
              <th className="p-2">Aksi</th>
              <th className="p-2">Sheet</th>
              <th className="p-2">Lot</th>
              <th className="p-2">Ref</th>
              <th className="p-2">Nama</th>
              <th className="p-2">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.length > 0 ? (
              recentLogs.map((log, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 whitespace-nowrap">{log.Timestamp}</td>
                  <td className="p-2 text-blue-600 font-medium">{log.Aksi}</td>
                  <td className="p-2">{log.Sheet}</td>
                  <td className="p-2">{log.Lot}</td>
                  <td className="p-2">{log.Ref}</td>
                  <td className="p-2">{log.Nama}</td>
                  <td className="p-2">{log.Jumlah}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  Tidak ada data log yang tersedia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Daftar item dengan tombol Edit & Hapus (maksimal 10 item) */}
      <h2 className="text-xl font-semibold">Daftar Item</h2>
      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          items.slice(0, 10).map((item) => (
            <Card key={item.Lot} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{item.Nama}</div>
                <div className="text-sm text-gray-500">
                  Lot: {item.Lot} | Ref: {item.Ref}
                </div>
                <div className="text-xs text-gray-400">Jumlah: {item.Jumlah}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({ ...item, tanggal: item.Tanggal });
                    setEditingLot(item.Lot);
                    setFormSheet(activeSheet);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(item.Lot)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
