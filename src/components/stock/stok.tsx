"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Boxes, Search } from "lucide-react";
import StockModal from "@/components/stock/NewStokModal";
import LoadingSpinner from "@/components/stock/LoadingSpinner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ------------------------- Types ------------------------- */
interface ApiStokBarang {
  noStok?: string | number;
  deskripsi?: string;
  jumlah?: string | number;
  permintaan?: string;
}

interface StokBarang {
  noStok: string;
  deskripsi: string;
  jumlah: number;
  permintaan: string;
}

/* ---------------------- Main Component ------------------- */
export default function StockTable() {
  const [stokData, setStokData] = useState<StokBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStok, setSelectedStok] = useState<StokBarang | null>(null);
  const [permintaanListOpen, setPermintaanListOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayPermintaan, setDisplayPermintaan] = useState(0);
  const prevPermintaan = useRef(0);

  /* ---------------- Fetch Stok ---------------- */
  const fetchStok = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stok");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { stokBarang?: ApiStokBarang[] };

      const mapped: StokBarang[] = (data.stokBarang ?? []).map((item) => ({
        noStok: String(item.noStok ?? ""),
        deskripsi: String(item.deskripsi ?? ""),
        jumlah: Number(item.jumlah ?? 0),
        permintaan: String(item.permintaan ?? "").trim(),
      }));

      setStokData(mapped);
    } catch (err) {
      console.error("❌ Gagal memuat data stok:", err);
      setStokData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Update Stok ---------------- */
  const updateStok = async (
    noStok: string,
    jumlah: number,
    permintaan: string
  ) => {
    try {
      await fetch("/api/stok", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noStok, jumlah, permintaan }),
      });
      await fetchStok();
    } catch (err) {
      console.error("❌ Gagal memperbarui stok:", err);
    }
  };

  useEffect(() => {
    fetchStok();
  }, []);

  /* ---------------- Data Permintaan ---------------- */
  const permintaanItems = stokData.filter((s) => s.permintaan !== "");
  const totalPermintaan = permintaanItems.length;
  const totalData = stokData.length;

  /* ---------------- Counter Animasi ---------------- */
  useEffect(() => {
    const start = prevPermintaan.current;
    const end = totalPermintaan;
    const duration = 2500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const value = Math.floor(start + (end - start) * eased);
      setDisplayPermintaan(value);
      if (t < 1) requestAnimationFrame(animate);
      else prevPermintaan.current = end;
    };

    requestAnimationFrame(animate);
  }, [totalPermintaan]);

  /* ---------------- Export PDF ---------------- */
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Daftar Permintaan", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["No Stok", "Deskripsi", "Jumlah", "Permintaan"]],
      body: permintaanItems.map((it) => [
        it.noStok,
        it.deskripsi,
        it.jumlah,
        it.permintaan,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [200, 0, 0] },
    });

    doc.save("Daftar_Permintaan.pdf");
  };

  /* ---------------- Filter Data ---------------- */
  const q = searchTerm.trim().toLowerCase();
  const filteredData = q
    ? stokData.filter(
        (item) =>
          item.noStok.toLowerCase().includes(q) ||
          item.deskripsi.toLowerCase().includes(q)
      )
    : stokData;

  /* ---------------- Render ---------------- */
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="hidden sm:block sm:text-2xl font-extrabold animate-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          STOK IMPLAN DENPASAR
        </h1>

        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Total data */}
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
            <Boxes className="w-5 h-5 hidden sm:block" />
            <span className="text-lg font-semibold">
              {totalData} <span className="text-xs">pcs</span>
            </span>
          </div>

          {/* Bell permintaan */}
          <button
            onClick={() => totalPermintaan > 0 && setPermintaanListOpen(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition ${
              totalPermintaan > 0
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 hover:bg-red-100"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Bell
              className={`w-5 h-5 ${
                totalPermintaan > 0 ? "animate-bounce text-red-600" : ""
              }`}
            />
            <span className="font-semibold">
              {displayPermintaan} <span className="text-xs">pcs</span>
            </span>
          </button>

          {/* Search */}
          <div className="relative w-40 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari stok/deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border rounded-full pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Tabel */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-auto max-h-[56vh] border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                <tr>
                  <th className="p-3 border">No Stok</th>
                  <th className="p-3 border">Deskripsi</th>
                  <th className="p-3 border w-28">Jumlah</th>
                  <th className="p-3 border">Permintaan</th>
                  <th className="p-3 border w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.noStok}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-900 ${
                        item.permintaan
                          ? "bg-red-50 dark:bg-red-900/30 animate-pulse"
                          : ""
                      }`}
                    >
                      <td className="p-3 border">{item.noStok}</td>
                      <td className="p-3 border">{item.deskripsi}</td>
                      <td className="p-3 border">{item.jumlah}</td>
                      <td className="p-3 border">{item.permintaan || "-"}</td>
                      <td className="p-3 border text-center">
                        <button
                          onClick={() => {
                            setSelectedStok(item);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {filteredData.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Tidak ada data
              </div>
            ) : (
              filteredData.map((item) => (
                <div
                  key={item.noStok}
                  className={`p-3 border rounded-lg shadow-sm ${
                    item.permintaan
                      ? "bg-red-50 dark:bg-red-900/20 animate-pulse"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm font-semibold">{item.noStok}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {item.deskripsi}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-amber-200 rounded-full px-3 py-[2px] text-orange-700">
                        {item.jumlah}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStok(item);
                          setModalOpen(true);
                        }}
                        className="mt-2 px-2 py-1 bg-yellow-500 text-white rounded-xl text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded-xl ${
                        item.permintaan
                          ? "bg-red-200 text-red-700 font-semibold"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600"
                      }`}
                    >
                      {item.permintaan || "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal Edit */}
      <StockModal
        isOpen={modalOpen}
        stok={selectedStok}
        onClose={() => setModalOpen(false)}
        onSave={updateStok}
      />

      {/* Modal Permintaan */}
      {permintaanListOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-lg max-w-4xl w-full animate-fadeIn">
            <div className="flex justify-between mb-3 items-center">
              <h3 className="text-lg font-semibold text-red-700">
                Daftar Permintaan
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => setPermintaanListOpen(false)}
                  className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[60vh] border rounded">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 border">No Stok</th>
                    <th className="p-3 border">Deskripsi</th>
                    <th className="p-3 border">Jumlah</th>
                    <th className="p-3 border">Permintaan</th>
                  </tr>
                </thead>
                <tbody>
                  {permintaanItems.map((it) => (
                    <tr
                      key={it.noStok}
                      className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900"
                    >
                      <td className="p-3 border">{it.noStok}</td>
                      <td className="p-3 border">{it.deskripsi}</td>
                      <td className="p-3 border">{it.jumlah}</td>
                      <td className="p-3 border font-semibold text-red-500">
                        {it.permintaan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(6px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 300ms ease-out;
            }
            @keyframes textShimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
            .animate-text {
              background-size: 200% auto;
              animation: textShimmer 4s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
