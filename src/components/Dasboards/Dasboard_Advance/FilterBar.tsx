"use client";

import React, { useState } from "react";
import { RefreshCw, Clock, Download, Search, Plus } from "lucide-react";
import { motion } from "framer-motion";
import FormBiayaModal from "@/components/Dasboards/Dasboard_Advance/FormBiaya";
import FormAdvanceModal from "@/components/Dasboards/Dasboard_Advance/FormAdvance";
import FormInputIntertainModal from "@/components/Dasboards/Dasboard_Advance/FormInputIntertain";

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
}

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
}) => {
  const [isIntertainOpen, setIsIntertainOpen] = useState(false);

  return (
    <>
      <motion.div
        className="w-full flex flex-wrap items-center gap-2 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <select
          value={jenisFilter}
          onChange={(e) => setJenisFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white text-sm shadow"
        >
          {jenisOptions.map((j, i) => (
            <option key={`${j}-${i}`}>{j}</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white text-sm shadow"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white text-sm shadow"
        />

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari keterangan..."
            title="Cari keterangan"
            className="pl-10 sm:pl-3 px-3 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white text-sm shadow w-full"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 sm:hidden">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-full text-sm shadow hover:bg-blue-700 transition"
          title="Export Data"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={mutate}
          className="flex items-center justify-center p-2 rounded-full border bg-white dark:bg-gray-800 dark:text-white shadow"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center justify-center p-2 rounded-full border shadow ${
            autoRefresh
              ? "bg-green-100 dark:bg-green-700"
              : "bg-white dark:bg-gray-800"
          }`}
          title="Toggle Auto-Refresh"
        >
          <Clock
            size={18}
            className={
              autoRefresh
                ? "text-green-600 dark:text-green-300"
                : "text-gray-500"
            }
          />
        </button>

        <button
          onClick={() => setIsIntertainOpen(true)}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-full text-sm shadow hover:bg-purple-700 transition"
          title="Tambah Intertain"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Intertain</span>
        </button>

        {/* <FormBiayaModal  /> */}
        <FormAdvanceModal />
      </motion.div>

      {/* Modal Intertain */}
      <FormInputIntertainModal
        isOpen={isIntertainOpen}
        onClose={() => setIsIntertainOpen(false)}
        onSuccess={mutate}
      />
    </>
  );
};

export default FilterBar;
