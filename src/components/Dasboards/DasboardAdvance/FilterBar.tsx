// File: components/FilterBar.tsx
'use client';

import React from 'react';
import { RefreshCw, Clock, Download } from 'lucide-react';

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
  handleExport
}) => {
  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <select
        value={jenisFilter}
        onChange={e => setJenisFilter(e.target.value)}
        className="px-3 py-1 rounded-2xl border bg-white dark:bg-gray-800 text-sm"
      >
        {jenisOptions.map((j, i) => <option key={`${j}-${i}`}>{j}</option>)}
      </select>
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className="px-3 py-1 rounded-2xl border bg-white dark:bg-gray-800 text-sm"
      />
      <input
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        className="px-3 py-1 rounded-2xl border bg-white dark:bg-gray-800 text-sm"
      />
      <input
        type="text"
        placeholder="Search keterangan..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="px-3 py-1 rounded-2xl border bg-white dark:bg-gray-800 text-sm"
      />
      <button onClick={mutate} className="p-2 rounded-2xl border bg-white dark:bg-gray-800" title="Refresh">
        <RefreshCw size={18} />
      </button>
      <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        className="p-2 rounded-2xl border bg-white dark:bg-gray-800"
        title="Toggle Auto-Refresh"
      >
        <Clock size={18} className={autoRefresh ? 'text-green-500' : 'text-gray-500'} />
      </button>
      <button
        onClick={handleExport}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-2xl text-sm"
      >
        <Download size={16} className="mr-1" /> Export
      </button>
    </div>
  );
};

export default FilterBar;
