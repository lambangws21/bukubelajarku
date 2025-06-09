// File: src/components/stock/filterAction.tsx
"use client";

import React, { Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import { PlusCircleIcon, RefreshCcw, Search, ChevronDown } from "lucide-react";

export interface FilterActionsProps {
  sheets: string[];
  activeSheet: string;
  onSelectSheet: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  onSearch: Dispatch<SetStateAction<string>>;
  onRefresh: () => Promise<any>;
  onOpenDialog: () => void;
}

const selectVariants = {
  hover: { scale: 1.1 },
  focus: { scale: 1.03 },
};

const inputVariants = {
  hover: { scale: 1.01 },
  focus: { scale: 1.02 },
};

const buttonVariants = {
  hover: { scale: 1.1, rotate: 10 },
  tap: { scale: 0.9, rotate: -5 },
};

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
    <motion.div
      className="w-full bg-gray-800 rounded-lg shadow-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Sheet Selector */}
      <div className="relative w-full sm:w-40">
        <motion.select
          className="w-full appearance-none bg-gray-700 text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          value={activeSheet}
          onChange={(e) => onSelectSheet(e.target.value)}
          variants={selectVariants}
          whileHover="hover"
          whileFocus="focus"
        >
          {sheets.map((sheet) => (
            <option key={sheet} value={sheet} className="bg-gray-700 text-white">
              {sheet}
            </option>
          ))}
        </motion.select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <motion.input
          type="text"
          className="w-full bg-gray-700 text-white placeholder-gray-400 pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          placeholder="Cari implan di sini..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          variants={inputVariants}
          whileHover="hover"
          whileFocus="focus"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          className="flex-none bg-green-500 text-white p-2 rounded-full shadow-md"
          onClick={() => onRefresh()}
          aria-label="Refresh"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <RefreshCcw className="w-5 h-5" />
        </motion.button>
        <motion.button
          className="flex-none bg-blue-500 text-white p-2 rounded-full shadow-md"
          onClick={onOpenDialog}
          aria-label="Tambah Data"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <PlusCircleIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
