// app/jadwal/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function formatJam(jamISO: string): string {
  if (!jamISO) return "-";
  const date = new Date(jamISO);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatTanggal(tanggalISO: string): string {
  if (!tanggalISO) return "-";
  const date = new Date(tanggalISO);
  return isNaN(date.getTime()) ? tanggalISO : date.toLocaleDateString("id-ID");
}

function normalizeJadwalData(raw: any[]) {
  return raw
    .filter((item) => item["Rumah Sakit"] && item["Dokter"])
    .map((item, idx) => ({
      id: idx + 1,
      tanggal: formatTanggal(item["Tanggal"]),
      tanggalAsli: item["Tanggal"],
      rumahSakit: item["Rumah Sakit"] || "-",
      alamat: item["Alamat"] || "-",
      dokter: item["Dokter"] || "-",
      waktuMulai: formatJam(item["Waktu Visit"]),
      waktuSelesai: formatJam(item["Waktu Selesai"] || item[""]),
      status: item["Status"] || "Belum Visit",
    }));
}

export default function JadwalPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStatus, setSelectedStatus] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbwtK10lWBGRcRw8I_yOFYXNQWJqXAi6k-BDkUOyYYk7gcfX5UKYZBBYQqklgASNf3Ow/exec");
      const rawData = await res.json();
      const parsed = normalizeJadwalData(rawData);
      setData(parsed);
    } catch (err) {
      console.error("Gagal mengambil data jadwal!", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: number) => {
    setStatusChangeId(id);
    setPassword("");
    setError("");
  };

  const confirmStatusChange = async (status: string) => {
    if (password === "admin123") {
      const target = data.find((item) => item.id === statusChangeId);
      if (!target) return;

      const updatedItem = { ...target, status };

      try {
        setUpdating(true);
        await fetch("/api/updateStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedItem }),
        });
        await fetchData();
      } catch (err) {
        console.error("Gagal update status ke Google Sheet", err);
      } finally {
        setUpdating(false);
        setStatusChangeId(null);
      }
    } else {
      setError("Sandi salah");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((row) => {
    let rowDate = "";
    if (row.tanggalAsli?.includes("/")) {
      const [day, month, year] = row.tanggalAsli.split("/");
      rowDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else if (!isNaN(Date.parse(row.tanggalAsli))) {
      rowDate = new Date(row.tanggalAsli).toISOString().split("T")[0];
    }
    const dateMatch = rowDate === selectedDate;
    const statusMatch = selectedStatus === "All" || row.status === selectedStatus;
    return dateMatch && statusMatch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">📅 Jadwal Visit RS</h1>

      <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div>
          <label className="text-sm font-medium">Filter berdasarkan tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="ml-2 border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="ml-2 border px-2 py-1 rounded"
          >
            <option value="All">Semua</option>
            <option value="Belum Visit">Belum Visit</option>
            <option value="Sedang Visit">Sedang Visit</option>
            <option value="Sudah Visit">Sudah Visit</option>
          </select>
        </div>
      </div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500"
        >
          Memuat data...
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {updating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-2 flex justify-center"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded text-sm shadow-sm">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Menyimpan perubahan ke Google Sheet...</span>
              </div>
            </motion.div>
          )}
          <div className="overflow-x-auto rounded-lg border bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">No</th>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">RS</th>
                  <th className="p-3 text-left">Dokter</th>
                  <th className="p-3 text-left">Waktu</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{row.tanggal}</td>
                    <td className="p-3">
                      <div className="font-medium">{row.rumahSakit}</div>
                      <div className="text-xs text-gray-500">{row.alamat}</div>
                    </td>
                    <td className="p-3">{row.dokter}</td>
                    <td className="p-3">{row.waktuMulai} - {row.waktuSelesai}</td>
                    <td className="p-3">
                      {row.status === "Belum Visit" ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{row.status}</span>
                      ) : row.status === "Sedang Visit" ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{row.status}</span>
                      ) : row.status === "Sudah Visit" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{row.status}</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{row.status}</span>
                      )}
                    </td>
                    <td className="p-3 space-x-2">
                      <button onClick={() => handleStatusChange(row.id)} className="text-blue-500 hover:underline text-xs">Ubah Status</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {statusChangeId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white p-6 rounded shadow-md max-w-sm w-full"
            >
              <h2 className="text-lg font-semibold mb-4">Konfirmasi Aksi</h2>
              <input
                type="password"
                placeholder="Masukkan sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border px-3 py-2 w-full rounded mb-2"
              />
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => { setStatusChangeId(null); }} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                <button onClick={() => confirmStatusChange("Sedang Visit")} className="px-4 py-2 bg-blue-500 text-white rounded">Sedang</button>
                <button onClick={() => confirmStatusChange("Sudah Visit")} className="px-4 py-2 bg-green-600 text-white rounded">Selesai</button>
                <button onClick={() => confirmStatusChange("Belum Visit")} className="px-4 py-2 bg-yellow-500 text-white rounded">Belum</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
