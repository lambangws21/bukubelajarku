// File: components/stock/StockTable.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { List, Edit2, Trash2, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Item {
  Tanggal?: string;
  Ref: string;
  Lot: string;
  Nama: string;
  Jumlah: string;
}

interface StockTableProps {
  sheetName: string;
  items: Item[];
  editedLot: string | null;  // Lot yang baru diedit
  onEdit: (item: Item) => void;
  onDelete: (lot: string) => void;
}

export default function StockTable({
  sheetName,
  items,
  editedLot,
  onEdit,
  onDelete,
}: StockTableProps) {
  return (
    <div className="w-full space-y-4">
      {/* Judul */}
      <div className="flex items-center gap-2">
        <List className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Data “{sheetName}”
        </h2>
      </div>

      {/* Kontainer Tabel */}
      <div className="max-h-80 overflow-y-auto border rounded-lg bg-white dark:bg-gray-800 shadow">
        <table className="w-full table-fixed text-sm">
          {/* Header */}
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="p-2 text-left text-gray-600 dark:text-gray-300">
                Nama
              </th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-300 flex items-center">
                <TagIcon className="mr-1 w-4 h-4" />Note
              </th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-300">
                Ref
              </th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-300">
                Stock
              </th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-300">
                Update
              </th>
              <th className="p-2 text-center text-gray-600 dark:text-gray-300">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => {
                const lowStock = Number(item.Jumlah) <= 1;
                const justEdited = item.Lot === editedLot;

                return (
                  <motion.tr
                    key={idx}
                    initial={justEdited ? { backgroundColor: "#FFF3CD" } : undefined}
                    animate={
                      justEdited
                        ? { backgroundColor: ["#FFF3CD", "transparent"] }
                        : undefined
                    }
                    transition={justEdited ? { duration: 1.5 } : undefined}
                    className={`
                      border-b
                      odd:bg-white even:bg-gray-50
                      dark:odd:bg-gray-800 dark:even:bg-gray-700
                      hover:bg-gray-100 dark:hover:bg-gray-600
                      transition
                    `}
                  >
                    {/* Nama */}
                    <td className="p-2 text-gray-700 dark:text-gray-200">
                      {item.Nama}
                    </td>

                    {/* Note (Lot) */}
                    <td className="p-2">
                      <span className="
                        inline-block px-2 py-1 text-xs font-semibold
                        text-white bg-indigo-500 rounded-full
                        dark:bg-indigo-600
                      ">
                        {item.Lot}
                      </span>
                    </td>

                    {/* Ref */}
                    <td className="p-2 text-gray-700 dark:text-gray-200">
                      {item.Ref}
                    </td>

                    {/* Stock (Jumlah) dengan pulse */}
                    <td className="p-2">
                      <motion.span
                        animate={lowStock ? { scale: [1, 1.2, 1] } : undefined}
                        transition={lowStock ? { duration: 1, repeat: Infinity } : undefined}
                        className="inline-block px-2"
                      >
                        {item.Jumlah}
                      </motion.span>
                    </td>

                    {/* Update (Tanggal) */}
                    <td className="p-2 text-gray-700 dark:text-gray-200">
                      {item.Tanggal
                        ? new Date(item.Tanggal).toLocaleDateString("id-ID")
                        : "-"}
                    </td>

                    {/* Aksi */}
                    <td className="p-2 text-center space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="p-1"
                        onClick={() => onEdit(item)}
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="p-1"
                        onClick={() => onDelete(item.Lot)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-300" />
                      </Button>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-4 text-gray-500 dark:text-gray-400"
                >
                  Tidak ada data untuk sheet ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
