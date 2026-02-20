"use client";

import React from "react";
import { RefreshCw, Clock3, Download, Search } from "lucide-react";

interface FilterBarProps {
  jenisOptions: string[];
  jenisFilter: string;
  setJenisFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  mutate: () => void;
  handleExport: () => void;
  dateInputsDisabled?: boolean;
}

const inputClass =
  "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-cyan-900/40";

const FilterBar: React.FC<FilterBarProps> = ({
  jenisOptions,
  jenisFilter,
  setJenisFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchTerm,
  setSearchTerm,
  autoRefresh,
  setAutoRefresh,
  mutate,
  handleExport,
  dateInputsDisabled = false,
}) => {
  return (
    <div className="grid w-full gap-2 md:grid-cols-12">
      <select
        value={jenisFilter}
        onChange={(e) => setJenisFilter(e.target.value)}
        className={`${inputClass} md:col-span-2`}
      >
        {jenisOptions.map((option, index) => (
          <option key={`${option}-${index}`} value={option}>
            {option}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={startDate}
        disabled={dateInputsDisabled}
        onChange={(e) => setStartDate(e.target.value)}
        className={`${inputClass} md:col-span-2 disabled:cursor-not-allowed disabled:opacity-60`}
      />

      <input
        type="date"
        value={endDate}
        disabled={dateInputsDisabled}
        onChange={(e) => setEndDate(e.target.value)}
        className={`${inputClass} md:col-span-2 disabled:cursor-not-allowed disabled:opacity-60`}
      />

      <div className="relative md:col-span-3">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Cari keterangan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} w-full pl-8`}
        />
      </div>

      <button
        type="button"
        onClick={mutate}
        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 md:col-span-1"
        title="Refresh"
      >
        <RefreshCw size={14} />
      </button>

      <button
        type="button"
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium transition md:col-span-1 ${
          autoRefresh
            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        }`}
        title="Toggle Auto Refresh"
      >
        <Clock3 size={14} />
      </button>

      <button
        type="button"
        onClick={handleExport}
        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-cyan-600 px-3 text-sm font-semibold text-white transition hover:bg-cyan-700 md:col-span-1"
      >
        <Download size={14} />
      </button>
    </div>
  );
};

export default FilterBar;
