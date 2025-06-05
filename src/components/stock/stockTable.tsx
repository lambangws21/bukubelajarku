// File: components/stock/StockTable.tsx
"use client";

import React from "react";
import { List, Hash, Tag, Package, Calendar, Edit2, Trash2 } from "lucide-react";
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
  onEdit: (item: Item) => void;
  onDelete: (lot: string) => void;
}

export default function StockTable({
  sheetName,
  items,
  onEdit,
  onDelete,
}: StockTableProps) {
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-2">
        <List className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Data &quot;{sheetName}&quot;
        </h2>
      </div>
      <div className="max-h-64 overflow-y-auto border rounded-md bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full text-sm">
       
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="p-2 text-gray-700 dark:text-gray-200">{item.Nama}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-200">{item.Lot}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-200">{item.Ref}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-200">{item.Jumlah}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-200">
                    {item.Tanggal || "-"}
                  </td>
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
                </tr>
              ))
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
