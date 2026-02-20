"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface DataItem {
  no: number;
  date: string;
  rumahSakit: string;
  tindakanOperasi: string;
  operator: string;
  jumlah: number;
  status: string;
}

interface DataTableProps {
  filteredData: DataItem[];
  originalLength: number;
  onEdit: (item: DataItem) => void;
  onDelete: (no: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const formatDateSafe = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "-";
  return format(parsed, "dd MMMM yyyy", { locale: id });
};

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  }, [filteredData]);

  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const pagedData = useMemo(
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Menampilkan{" "}
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">{totalRows}</span>{" "}
          dari <span className="font-semibold">{originalLength}</span> data operasi
        </p>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="asistensi-page-size" className="text-slate-500 dark:text-slate-400">
            Baris:
          </label>
          <select
            id="asistensi-page-size"
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
              {["Tanggal", "Rumah Sakit", "Tindakan Operasi", "Operator", "Jumlah", "Status", "Aksi"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pagedData.map((row, index) => (
              <tr
                key={`${row.no}-${row.rumahSakit}-${index}`}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-800 dark:text-slate-100">
                  {formatDateSafe(row.date)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                  {row.rumahSakit || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                  {row.tindakanOperasi || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                  {row.operator || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                  Rp {row.jumlah.toLocaleString("id-ID")}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.status ? (
                    <a
                      href={row.status}
                      className="inline-flex rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lihat
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-full p-1.5 text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                      title="Edit Data"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row.no)}
                      className="rounded-full p-1.5 text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      title="Hapus Data"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!pagedData.length ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  Tidak ada data yang tersedia.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {totalRows > 0 ? `Baris ${startIndex + 1}-${endIndex} dari ${totalRows}` : "Tidak ada baris"}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={clampedPage === 1}
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
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={clampedPage === totalPages}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DataTable);
