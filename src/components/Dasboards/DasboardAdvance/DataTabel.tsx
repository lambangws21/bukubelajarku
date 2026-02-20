"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FileText, Wallet, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";

export interface DataItem {
  no: number;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
  status: string;
}

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
  onEdit?: (item: DataItem) => void;
  onDelete?: (no: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const formatDateSafe = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "-";
  return format(parsed, "dd MMMM yyyy", { locale: id });
};

const formatCurrency = (amount: number) =>
  `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;

const buildPageNumbers = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, -1, total];
  if (current >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  return [1, -1, current - 1, current, current + 1, -1, total];
};

const DataTable: React.FC<DataTableProps> = ({
  filteredData,
  originalLength,
  onEdit,
  onDelete,
}) => {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const showActions = Boolean(onEdit || onDelete);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [filteredData]);

  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const visibleRows = useMemo(
    () => sortedData.slice(startIndex, endIndex),
    [sortedData, startIndex, endIndex]
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalRows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageNumbers = useMemo(
    () => buildPageNumbers(clampedPage, totalPages),
    [clampedPage, totalPages]
  );

  return (
    <motion.div
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Menampilkan{" "}
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
            {totalRows}
          </span>{" "}
          dari <span className="font-semibold">{originalLength}</span> data.
        </p>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="advance-page-size" className="text-slate-500 dark:text-slate-400">
            Baris:
          </label>
          <select
            id="advance-page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              {[
                "Tanggal",
                "Jenis Biaya",
                "Jumlah",
                "Klaim Oleh",
                "Keterangan",
                "Bukti",
                ...(showActions ? ["Aksi"] : []),
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {visibleRows.map((row, index) => (
              <tr
                key={`${row.no}-${row.date}-${index}`}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-800 dark:text-slate-100">
                  {formatDateSafe(row.date)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                  <div className="inline-flex items-center gap-2">
                    {row.jenisBiaya === "Biaya Operasi" ? (
                      <FileText size={14} className="text-cyan-600" />
                    ) : (
                      <Wallet size={14} className="text-emerald-600" />
                    )}
                    {row.jenisBiaya || "-"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(row.jumlah)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                  {row.klaimOleh || "-"}
                </td>
                <td className="max-w-xs px-4 py-3 text-slate-700 dark:text-slate-300">
                  <p className="truncate">{row.keterangan || "-"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.status ? (
                    <button
                      type="button"
                      onClick={() => setModalImage(row.status)}
                      className="rounded-md ring-1 ring-slate-200 transition hover:opacity-85 dark:ring-slate-700"
                    >
                      <div className="h-12 w-16 overflow-hidden rounded-md">
                        <SafeImage
                          src={row.status}
                          alt="Bukti Klaim"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Tidak ada</span>
                  )}
                </td>
                {showActions ? (
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      {onEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="rounded-full p-1.5 text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => onDelete(row.no)}
                          className="rounded-full p-1.5 text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {!visibleRows.length ? (
              <tr>
                <td
                  colSpan={showActions ? 7 : 6}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Tidak ada data yang sesuai filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {totalRows > 0
            ? `Baris ${startIndex + 1}-${endIndex} dari ${totalRows}`
            : "Tidak ada baris"}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={clampedPage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          {pageNumbers.map((value, idx) =>
            value === -1 ? (
              <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={value}
                type="button"
                onClick={() => setPage(value)}
                className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs ${
                  clampedPage === value
                    ? "bg-cyan-600 text-white"
                    : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                }`}
              >
                {value}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={clampedPage === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {modalImage ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setModalImage(null)}
        >
          <motion.div
            className="relative max-h-[90vh] max-w-[90vw]"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-slate-800 shadow"
              title="Tutup"
            >
              <X size={18} />
            </button>
            <SafeImage
              src={modalImage}
              alt="Bukti Klaim Penuh"
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default DataTable;
