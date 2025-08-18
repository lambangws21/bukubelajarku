"use client";

import { useState, useEffect } from "react";
import type { Schedule } from "@/types/schedule";
import { getSchedules, deleteSchedule } from "@/lib/scheduleApi";

import { AddScheduleModal } from "@/components/schedule/AddSchedlueForm";
import OperationCard from "@/components/schedule/NewCard"; 
import { motion, AnimatePresence } from "framer-motion";

// helper: ambil tanggal device user (format YYYY-MM-DD)
function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);

  const today = getTodayLocal();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterTS, setFilterTS] = useState("");

  const fetchConfirmedSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data jadwal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedSchedules();
  }, []);

  const handleOpenAddModal = () => {
    setScheduleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSuccess = () => {
    handleCloseModal();
    fetchConfirmedSchedules();
  };

  const handleDeleteConfirmed = async (submissionId: number) => {
    if (!window.confirm("Yakin ingin menghapus jadwal yang sudah terkonfirmasi ini?")) return;
    try {
      await deleteSchedule(submissionId);
      alert("Jadwal berhasil dihapus.");
      fetchConfirmedSchedules();
    } catch (error) {
      console.error("Gagal menghapus jadwal:", error);
      alert("Gagal menghapus jadwal.");
    }
  };

  // --- Filter utama ---
  const filteredSchedules = schedules.filter((s) => {
    const byDate = selectedDate ? s["Tanggal Operasi"]?.startsWith(selectedDate) : true;
    const byDoctor = filterDoctor
      ? s.Operator?.toLowerCase().includes(filterDoctor.toLowerCase())
      : true;
    const byTS = filterTS
      ? s["Team TS"]?.toLowerCase().includes(filterTS.toLowerCase())
      : true;

    return byDate && byDoctor && byTS;
  });

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AddScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddPending={() => {}}
        onSuccess={handleSuccess}
        scheduleToEdit={scheduleToEdit}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 md:p-8 border-b dark:border-gray-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manajemen Jadwal Operasi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 sm:py-2 sm:px-4 rounded-full sm:rounded-lg shadow-lg transition-all self-end sm:self-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Buat Jadwal Baru</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Filter kiri */}
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input
              type="date"
              className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                className="ml-2 text-sm text-blue-500 hover:underline"
              >
                Kembali ke hari ini
              </button>
            )}
          </label>

          <input
            type="text"
            placeholder="Filter Dokter..."
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />

          <input
            type="text"
            placeholder="Filter Team TS..."
            value={filterTS}
            onChange={(e) => setFilterTS(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Jumlah data */}
        <div className="text-gray-700 dark:text-gray-300 font-semibold">
          Jumlah data: {filteredSchedules.length}
        </div>
      </div>

      {/* List Card */}
      <div className="p-4 md:p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <AnimatePresence>
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
          ) : filteredSchedules.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Tidak ada jadwal</p>
          ) : (
            filteredSchedules.map((schedule) => (
              <motion.div
                key={schedule["Submission ID"]}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OperationCard
                  schedule={schedule}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteConfirmed}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
