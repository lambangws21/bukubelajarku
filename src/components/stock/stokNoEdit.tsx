"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Boxes, Search } from "lucide-react";
import StockModal from "@/components/stock/NewStokModal";
import LoadingSpinner from "@/components/stock/LoadingSpinner";

interface ApiStokBarang {
  noStok?: unknown;
  deskripsi?: unknown;
  jumlah?: unknown;
  permintaan?: unknown;
}

interface StokBarang {
  noStok: string;
  deskripsi: string;
  jumlah: number;
  permintaan: string;
}

export default function StockTable() {
  const [stokData, setStokData] = useState<StokBarang[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedStok, setSelectedStok] = useState<StokBarang | null>(null);
  const [permintaanListOpen, setPermintaanListOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [displayPermintaan, setDisplayPermintaan] = useState<number>(0);
  const prevPermintaan = useRef<number>(0);

  // fetch & normalize API data (no any)
  const fetchStok = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stok");
      if (!res.ok) {
        console.error("Gagal ambil /api/stok:", res.status);
        setStokData([]);
        return;
      }
      const data = (await res.json()) as { stokBarang?: ApiStokBarang[] };

      const mapped: StokBarang[] = (data.stokBarang ?? []).map((item) => ({
        noStok: String(item.noStok ?? ""),
        deskripsi: String(item.deskripsi ?? ""),
        jumlah: Number(item.jumlah ?? 0),
        permintaan: String(item.permintaan ?? "").trim(),
      }));

      setStokData(mapped);
    } catch (err) {
      console.error("Gagal memuat data stok", err);
      setStokData([]);
    } finally {
      setLoading(false);
    }
  };

  // update stok via API
  const updateStok = async (noStok: string, jumlah: number, permintaan: string) => {
    try {
      await fetch("/api/stok", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no: noStok, jumlah, permintaan }),
      });
      await fetchStok();
    } catch (err) {
      console.error("Gagal memperbarui stok", err);
    }
  };

  useEffect(() => {
    fetchStok();
  }, []);

  // rekap
  const permintaanItems = stokData.filter((s) => s.permintaan !== "");
  const totalPermintaan = permintaanItems.length;
  const totalData = stokData.length;

  // animated counter
  useEffect(() => {
    const start = prevPermintaan.current;
    const end = totalPermintaan;
    const duration = 450;
    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // gentle ease
      const value = Math.floor(start + (end - start) * eased);
      setDisplayPermintaan(value);
      if (t < 1) requestAnimationFrame(animate);
      else prevPermintaan.current = end;
    };

    requestAnimationFrame(animate);
  }, [totalPermintaan]);

  // search filter — safe because normalized to strings
  const q = searchTerm.trim().toLowerCase();
  const filteredData = q
    ? stokData.filter(
        (item) =>
          item.noStok.toLowerCase().includes(q) ||
          item.deskripsi.toLowerCase().includes(q)
      )
    : stokData;

  return (
    <div className="p-4 space-y-4">
      {/* Header / Rekapan */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-shrink-1 justify-center">
          <div
            className="hidden sm:block sm:text-2xl font-extrabold animate-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent transition-transform duration-300 hover:scale-105 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300"
            aria-hidden
          >
            STOK IMPLAN DENPASAR
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* total items */}
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
            <Boxes className="w-5 h-5 hidden sm:block" />
            <span className="sm:hidden sm:text-2xl font-extrabold animate-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent transition-transform duration-300 hover:scale-105 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300">Total Implan Denpasar</span>
            <span className="text-lg bg-purple-500/50 rounded-4xl sm:rounded-xl px-2.5 py-0.5 sm:text-base font-semibold">{totalData}<span className="sm:inline text-xs "> pcs</span></span>
          </div>

          {/* bell with tooltip (right on md+, above on small) */}
          <div className="relative">
            <button
              onClick={() => totalPermintaan > 0 && setPermintaanListOpen(true)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition text-sm sm:text-base ${
                totalPermintaan > 0
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 hover:bg-red-100"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
              aria-label="Daftar permintaan"
            >
              <Bell className={`w-5 h-5 ${totalPermintaan > 0 ? "animate-bounce text-red-600" : ""}`} />
              <span className="font-semibold">{displayPermintaan} <span className="sm:inline text-xs "> pcs</span></span>
            </button>

            {/* tooltip: right on md+, above on sm */}
            <div
              role="tooltip"
              className="pointer-events-none absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20"
            >
              {/* on small screens place above */}
              <div className="sm:invisible sm:absolute" />
            </div>

            {/* custom tooltip implementations */}
            {/* desktop (md+) -> right */}
            <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 text-xs bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              Permintaan Implan
            </div>

            {/* mobile -> above */}
            <div className="block md:hidden absolute left-1/2 -translate-x-1/2 -top-10 whitespace-nowrap px-3 py-1 text-xs bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              Permintaan Implan
            </div>
          </div>

          {/* search with icon */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari noStok / deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:w-64 w-40 bg-gray-100 border rounded-full pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* content */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Desktop / md+ table */}
          <div className="hidden md:block overflow-auto max-h-[56vh] border rounded-lg">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                <tr>
                  <th className="p-3 border dark:border-gray-700 text-left">No Stok</th>
                  <th className="p-3 border dark:border-gray-700 text-left">Deskripsi</th>
                  <th className="p-3 border dark:border-gray-700 text-left w-28">Jumlah</th>
                  <th className="p-3 border dark:border-gray-700 text-left w-28">Permintaan</th>
                  {/* <th className="p-3 border dark:border-gray-700 text-center w-28">Aksi</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-gray-500">Tidak ada data</td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const hasPermintaan = item.permintaan !== "";
                    return (
                      <tr
                        key={`${item.noStok}-${item.deskripsi}`}
                        className={`transition hover:bg-gray-50 dark:hover:bg-gray-900 ${
                          hasPermintaan ? "bg-red-50 dark:bg-red-900/30 animate-pulse" : ""
                        }`}
                      >
                        <td className="p-3 border dark:border-gray-700">{item.noStok}</td>
                        <td className="p-3 border dark:border-gray-700">{item.deskripsi}</td>
                        <td className="p-3 border dark:border-gray-700 text-center">{item.jumlah}</td>
                        <td className="p-3 border dark:border-gray-700 text-center">{item.permintaan || "-"}</td>
                        {/* <td className="p-3 border dark:border-gray-700 text-center">
                          <button
                            onClick={() => {
                              setSelectedStok(item);
                              setModalOpen(true);
                            }}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                          >
                            Edit
                          </button>
                        </td> */}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filteredData.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Tidak ada data</div>
            ) : (
              filteredData.map((item) => {
                const hasPermintaan = item.permintaan !== "";
                return (
                  <div
                    key={`${item.noStok}-${item.deskripsi}`}
                    className={`p-3 border rounded-lg shadow-sm dark:border-gray-700 transition ${
                      hasPermintaan ? "bg-red-50 dark:bg-red-900/20 animate-pulse" : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold">{item.noStok}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{item.deskripsi}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold bg-amber-200 rounded-full px-3 py-[2px] text-orange-700">{item.jumlah}</div>
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
                      <span className={`inline-block px-2 py-1 rounded-xl  ${hasPermintaan ? "bg-red-200 animate-bounce px-2 py-[2px] rounded-xl dark:bg-red-200 text-red-700 font-semibold" : "bg-gray-100 dark:bg-gray-700 text-gray-600"}`}>
                        {hasPermintaan ? item.permintaan : "-"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Modal Edit */}
      <StockModal isOpen={modalOpen} stok={selectedStok} onClose={() => setModalOpen(false)} onSave={updateStok} />

      {/* Modal Daftar Permintaan (tabel) */}
      {permintaanListOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-lg max-w-4xl w-full animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-red-200">Daftar Permintaan</h3>
              <button onClick={() => setPermintaanListOpen(false)} className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-sm">
                Tutup
              </button>
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
                    <tr key={`${it.noStok}-${it.deskripsi}`} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900">
                      <td className="p-3 border text-center text-xs">{it.noStok}</td>
                      <td className="p-3 border">{it.deskripsi}</td>
                      <td className="p-3 border text-center">{it.jumlah}</td>
                      <td className="p-3 border font-semibold text-red-500 text-center w-20">{it.permintaan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* local styles */}
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(6px) scale(0.995);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 200ms ease-out;
            }
            @keyframes textShimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
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
