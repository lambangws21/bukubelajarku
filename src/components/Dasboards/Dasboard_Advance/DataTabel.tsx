"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DataItem } from "@/types/advance";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdvanceFormModal from "@/components/Dasboards/Dasboard_Advance/FormBiayaEdit";
import { toast } from "react-toastify";

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
  onRefresh?: () => void;
}

// ✅ Menampilkan format tanggal readable dari yyyy-MM-dd
function parseDate(dateStr: string): string {
  const dateObj = new Date(dateStr);
  return isNaN(dateObj.getTime())
    ? "Invalid"
    : dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

const DataTable: React.FC<DataTableProps> = ({
  filteredData,
  originalLength,
  onRefresh,
}) => {
  const [editItem, setEditItem] = useState<DataItem | null>(null);

  const handleDelete = async (no: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const res = await fetch("/api/advance/editDeleteData", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no, sheet: "Sheet1" }),
      });

      const result = await res.json();
      if (result.status === "success") {
        toast.success("Data berhasil dihapus!");
        onRefresh?.();
      } else {
        toast.error(result.message || "Gagal menghapus data.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus.");
    }
  };

  return (
    <motion.div
      className="w-full overflow-x-auto"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ delay: 0.8 }}
    >
      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredData.length} of {originalLength} records
      </div>

      {/* Container scrollable */}
      <div className="overflow-auto max-h-[500px] rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              {[
                "Date",
                "Jenis",
                "Jumlah",
                "Keterangan",
                "Klaim Oleh",
                "Status",
                "Aksi",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left whitespace-nowrap sticky top-0 bg-gray-200 dark:bg-gray-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((r, i) => (
              <motion.tr
                key={`${r.no}-${r.keterangan}-${i}`}
                className={
                  i % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-900"
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="px-4 py-2 whitespace-nowrap">
                  {parseDate(r.date)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{r.jenisBiaya}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  Rp {r.jumlah.toLocaleString()}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{r.keterangan}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.klaimOleh}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {r.status ? (
                    <a href={r.status} className="underline">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditItem(r)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(r.no)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <AdvanceFormModal
            initialData={{
              no: editItem.no,
              tanggal: editItem.date,
              jumlah: editItem.jumlah,
              jenisBiaya: editItem.jenisBiaya,
              keterangan: editItem.keterangan,
              klaimOleh: editItem.klaimOleh,
            }}
            onClose={() => setEditItem(null)}
            onSuccess={() => {
              setEditItem(null);
              onRefresh?.();
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default DataTable;
