// File: src/components/stock/formStockDialog.tsx
import React from "react";
import { Dispatch, SetStateAction } from "react";

interface Item {
  Tanggal?: string;
  Ref: string;
  Lot: string;
  Nama: string;
  Jumlah: string;
}

export interface StockFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<Item> & { tanggal?: string };
  formSheet: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormSubmit: () => Promise<void>;
  setFormSheet: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  editingLot: string | null;
}

export default function StockFormDialog({
  isOpen,
  onClose,
  formData,
  formSheet,
  onFormChange,
  onFormSubmit,
  setFormSheet,
  isLoading,
  editingLot,
}: StockFormDialogProps) {
  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Container dialog */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Tombol Close */}
        <button
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {editingLot ? "Edit Stok" : "Tambah Stok"}
        </h2>

        {/* Dropdown untuk memilih sheet */}
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-300">Implant</span>
          <select
            className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition"
            value={formSheet}
            onChange={(e) => setFormSheet(e.target.value)}
          >
            <option value="TKR">TKR</option>
            <option value="Bipolar">Bipolar</option>
            <option value="THR">THR</option>
          </select>
        </label>

        {/* Input Tanggal */}
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-300">Tanggal</span>
          <input
            type="date"
            name="tanggal"
            className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition"
            value={formData.tanggal || ""}
            onChange={onFormChange}
          />
        </label>

        {/* Input Ref */}
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-300">Ref</span>
          <input
            type="text"
            name="Ref"
            className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition"
            value={formData.Ref || ""}
            onChange={onFormChange}
          />
        </label>

        {/* Input Lot */}
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-300">Lot</span>
          <input
            type="text"
            name="Lot"
            className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.Lot || ""}
            onChange={onFormChange}
            disabled={!!editingLot}
          />
        </label>

        {/* Input Nama */}
        <label className="block mb-2">
          <span className="text-gray-700 dark:text-gray-300">Nama</span>
          <input
            type="text"
            name="Nama"
            className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition"
            value={formData.Nama || ""}
            onChange={onFormChange}
          />
        </label>

        {/* Input Jumlah */}
        <label className="block mb-4">
          <span className="text-gray-700 dark:text-gray-300">Jumlah</span>
          <input
            type="number"
            name="Jumlah"
            className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition"
            value={formData.Jumlah || ""}
            onChange={onFormChange}
          />
        </label>

        {/* Tombol Submit */}
        <button
          className={`w-full py-2 rounded text-white ${
            isLoading
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          } transition mb-2`}
          onClick={async () => {
            if (!isLoading) {
              await onFormSubmit();
            }
          }}
          disabled={isLoading}
        >
          {isLoading
            ? "Sedang memproses..."
            : editingLot
            ? "Update Data"
            : "Tambah Data"}
        </button>

        {/* Tombol Batal */}
        <button
          className="w-full py-2 rounded text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={onClose}
        >
          Batal
        </button>
      </div>
    </div>
  );
}
