// File: src/components/stock/filterAction.tsx
"use client";

import React, { Dispatch, SetStateAction } from "react";
import {
  PlusCircleIcon,
  RefreshCcw,
  Search,
  ChevronDown,
} from "lucide-react";

export interface FilterActionsProps {
  sheets: string[];
  activeSheet: string;
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
    <div className="w-full bg-gray-800 rounded-lg shadow-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* 1. Pilihan Sheet */}
      <div className="relative w-full sm:w-40">
        <select
          className="w-full appearance-none bg-gray-700 text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          value={activeSheet}
          onChange={(e) => onSelectSheet(e.target.value)}
        >
          {sheets.map((sheet) => (
            <option key={sheet} value={sheet}>
              {sheet}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>

      {/* 2. Input Pencarian dengan ikon */}
      <div className="relative w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          className="w-full bg-gray-700 text-white placeholder-gray-400 pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          placeholder="Cari..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* 3 & 4. Tombol Refresh dan Tombol Tambah Data sejajar */}
      <div className="flex gap-2">
        <button
          className="flex-none bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md transition transform hover:scale-105 hover:animate-spin/30"
          onClick={() => onRefresh()}
          aria-label="Refresh"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
        <button
          className="flex-none bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition transform hover:scale-105"
          onClick={onOpenDialog}
          aria-label="Tambah Data"
        >
          <PlusCircleIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
