// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Schedule } from "@/types/schedule";
import { getSchedules, deleteSchedule } from "@/lib/scheduleApi";

import { AddScheduleModal } from "@/components/schedule/AddSchedlueForm";
import OperationCard from "@/components/schedule/NewCard";
import { PlusIcon } from "lucide-react";

// ===== Helpers =====
function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type PinPurpose = "ADD" | "EDIT" | "DELETE";

// ===== PIN Modal (inline) =====
function PinModal({
  open,
  purpose,
  onCancel,
  onVerified,
  title,
  hint,
}: {
  open: boolean;
  purpose: PinPurpose | null;
  onCancel: () => void;
  onVerified: () => void;
  title?: string;
  hint?: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
    }
  }, [open]);

  const EXPECTED_PIN =
    (typeof window !== "undefined" &&
      (process.env.NEXT_PUBLIC_SCHEDULE_PIN || "")) ||
    "12341";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === EXPECTED_PIN) {
      onVerified();
    } else {
      setError("PIN salah. Silakan coba lagi.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/70 dark:border-gray-800"
          >
            <div className="px-6 pt-6 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {title ??
                  (purpose === "ADD"
                    ? "Masukkan PIN untuk Membuat Jadwal"
                    : purpose === "EDIT"
                    ? "Masukkan PIN untuk Mengedit Jadwal"
                    : "Masukkan PIN untuk Menghapus Jadwal")}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {hint ??
                  "PIN diperlukan untuk melanjutkan aksi ini demi keamanan."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <input
                type="password"
                inputMode="numeric"
                placeholder="•••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== PAGE =====
export default function HomePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Add/Edit (form)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);

  // Filters
  const today = getTodayLocal();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterTS, setFilterTS] = useState("");

  // PIN flow state
  const [pinOpen, setPinOpen] = useState(false);
  const [pinPurpose, setPinPurpose] = useState<PinPurpose | null>(null);
  const [pendingEdit, setPendingEdit] = useState<Schedule | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Fetch
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

  // ===== Actions guarded by PIN =====
  const requestPin = (purpose: PinPurpose, payload?: Schedule | number) => {
    setPinPurpose(purpose);
    if (purpose === "EDIT" && payload && typeof payload !== "number") {
      setPendingEdit(payload);
    } else {
      setPendingEdit(null);
    }
    if (purpose === "DELETE" && typeof payload === "number") {
      setPendingDeleteId(payload);
    } else if (purpose !== "DELETE") {
      setPendingDeleteId(null);
    }
    setPinOpen(true);
  };

  const proceedAfterPin = async () => {
    setPinOpen(false);

    if (pinPurpose === "ADD") {
      setScheduleToEdit(null);
      setIsFormOpen(true);
    } else if (pinPurpose === "EDIT" && pendingEdit) {
      setScheduleToEdit(pendingEdit);
      setIsFormOpen(true);
    } else if (pinPurpose === "DELETE" && pendingDeleteId != null) {
      try {
        await deleteSchedule(pendingDeleteId);
        alert("Jadwal berhasil dihapus.");
        fetchConfirmedSchedules();
      } catch (error) {
        console.error("Gagal menghapus jadwal:", error);
        alert("Gagal menghapus jadwal.");
      } finally {
        setPendingDeleteId(null);
      }
    }

    // reset
    setPinPurpose(null);
    setPendingEdit(null);
  };

  // ===== Handlers for UI =====
  const handleOpenAddRequested = () => requestPin("ADD");
  const handleOpenEditRequested = (schedule: Schedule) =>
    requestPin("EDIT", schedule);
  const handleDeleteRequested = (submissionId: number) =>
    requestPin("DELETE", submissionId);

  const handleFormClose = () => setIsFormOpen(false);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchConfirmedSchedules();
  };

  // ===== Filtered data =====
  const filteredSchedules = schedules.filter((s) => {
    const byDate = selectedDate
      ? s["Tanggal Operasi"]?.startsWith(selectedDate)
      : true;
    const byDoctor = filterDoctor
      ? (s.Operator || "").toLowerCase().includes(filterDoctor.toLowerCase())
      : true;
    const byTS = filterTS
      ? (s["Team TS"] || "").toLowerCase().includes(filterTS.toLowerCase())
      : true;
    return byDate && byDoctor && byTS;
  });

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Modal Form Add/Edit */}
      <AddScheduleModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onAddPending={() => {}}
        onSuccess={handleFormSuccess}
        scheduleToEdit={scheduleToEdit}
      />

      {/* PIN Modal */}
      <PinModal
        open={pinOpen}
        purpose={pinPurpose}
        onCancel={() => {
          setPinOpen(false);
          setPinPurpose(null);
          setPendingEdit(null);
          setPendingDeleteId(null);
        }}
        onVerified={proceedAfterPin}
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
          onClick={handleOpenAddRequested}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 sm:py-2 sm:px-4 rounded-full sm:rounded-lg shadow-lg transition-all self-end sm:self-center"
        >
    <PlusIcon className="w-6 h-6 hover:animate-spin rotate-3" />
          <span className="hidden sm:inline">Buat Jadwal</span>
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
            placeholder="Filter Dokter…"
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />

          <input
            type="text"
            placeholder="Filter Team TS…"
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
            <p className="text-gray-500 dark:text-gray-400">Memuat data…</p>
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
                  onEdit={handleOpenEditRequested}
                  onDelete={handleDeleteRequested}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
