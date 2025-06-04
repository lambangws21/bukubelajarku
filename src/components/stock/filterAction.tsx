// File: src/components/stock/filterAction.tsx
import { PlusCircleIcon, RefreshCcw } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

export interface FilterActionsProps {
  sheets: string[];
  activeSheet: string;
  // Tambahkan kedua baris di bawah ini:
  onSelectSheet: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  onSearch: Dispatch<SetStateAction<string>>;
  onRefresh: () => Promise<any>;
  onOpenDialog: () => void;
}

export default function FilterActions({
  sheets,
  activeSheet,
  onSelectSheet,
  searchQuery,
  onSearch,
  onRefresh,
  onOpenDialog,
}: FilterActionsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* 1. Dropdown Pemilihan Sheet */}
      <select
        className="border px-2 py-1 rounded"
        value={activeSheet}
        onChange={(e) => onSelectSheet(e.target.value)}
      >
        {sheets.map((sheet) => (
          <option key={sheet} value={sheet}>
            {sheet}
          </option>
        ))}
      </select>

      {/* 2. Input Pencarian */}
      <input
        type="text"
        className="border px-2 py-1 rounded flex-1"
        placeholder="Cari..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
      />

      {/* 3. Tombol Refresh */}
      <button
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
        onClick={() => onRefresh()}
      >
        <RefreshCcw className="w-5 h-5" />
      </button>

      {/* 4. Tombol Tambah Data (buka dialog) */}
      <button
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
        onClick={onOpenDialog}
      >
        <PlusCircleIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
