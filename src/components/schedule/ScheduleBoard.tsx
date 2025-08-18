// components/new-schedule/ScheduleBoard.tsx
'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, SortDesc, CalendarX } from 'lucide-react';
import type { Schedule } from '@/types/schedule';
import { ScheduleCard } from '@/components/schedule/ScheduleCard';

type ScheduleBoardProps = {
  schedules: Schedule[];
  isLoading: boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (submissionId: number) => void;
};

const boardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function ScheduleBoard({ schedules, isLoading, onEdit, onDelete }: ScheduleBoardProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const filteredSchedules = useMemo(() => {
    let data = schedules;

    // filter hari ini
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      data = data.filter((s) => s['Tanggal Operasi']?.startsWith(today));
    }

    // search
    if (search.trim()) {
      data = data.filter(
        (s) =>
          s.Hospital?.toLowerCase().includes(search.toLowerCase()) ||
          s.Operator?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // sort
    data = [...data].sort((a, b) => {
      const dateA = new Date(a['Tanggal Operasi'] ?? '').getTime();
      const dateB = new Date(b['Tanggal Operasi'] ?? '').getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return data;
  }, [schedules, search, filter, sort]);

  if (isLoading) {
    return <div className="text-center p-10 dark:text-white">Memuat data dari server...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">
        Jadwal Terkonfirmasi
      </h2>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari rumah sakit atau operator..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <button
            onClick={() => setFilter(filter === 'all' ? 'today' : 'all')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Filter size={18} />
            {filter === 'all' ? 'Semua' : 'Hari Ini'}
          </button>

          {/* Sort */}
          <button
            onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {sort === 'newest' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            {sort === 'newest' ? 'Terbaru' : 'Terlama'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        variants={boardVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredSchedules.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <CalendarX size={48} className="mb-3" />
              </motion.div>
              <p>Belum ada jadwal yang sesuai.</p>
            </motion.div>
          ) : (
            filteredSchedules.map((schedule) => (
              <motion.div
                key={schedule['Submission ID']}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ScheduleCard
                  schedule={schedule}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
