"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Schedule } from "@/types/schedule";
import { getSchedules } from "@/lib/scheduleApi";

import AddScheduleModal from "@/components/schedule/AddSchedlueForm";
import NewAddScheduleModal from "@/components/schedule/NewAddScheduleForm";
import OperationCard from "@/components/schedule/NewCard";
import { PlusIcon } from "lucide-react";

// ===== Helpers =====
function getTodayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

type PinPurpose = "ADD" | "EDIT" | "DELETE";

// ===== PIN Modal =====
function PinModal({
  open,
  purpose,
  onCancel,
  onVerified,
}: {
  open: boolean;
  purpose: PinPurpose | null;
  onCancel: () => void;
  onVerified: () => void;
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
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="px-6 pt-6 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {purpose === "ADD"
                  ? "Masukkan PIN untuk Membuat Jadwal"
                  : purpose === "EDIT"
                  ? "Masukkan PIN untuk Mengedit Jadwal"
                  : "Masukkan PIN untuk Menghapus Jadwal"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                PIN diperlukan untuk melanjutkan aksi ini demi keamanan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <input
                type="password"
                placeholder="•••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
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

  // Modal states
  const [isForm1Open, setIsForm1Open] = useState(false);
  const [isForm2Open, setIsForm2Open] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);

  // Filters
  const today = getTodayLocal();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterTS, setFilterTS] = useState("");

  // PIN flow
  const [pinOpen, setPinOpen] = useState(false);
  const [pinPurpose, setPinPurpose] = useState<PinPurpose | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // ===== Handlers =====
  const handleFormSuccess = () => {
    setIsForm1Open(false);
    setIsForm2Open(false);
    fetchSchedules();
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
      {/* Form 1 */}
      <AddScheduleModal
        isOpen={isForm1Open}
        onClose={() => setIsForm1Open(false)}
        onAddPending={() => {}}
        onSuccess={handleFormSuccess}
        scheduleToEdit={scheduleToEdit}
      />

      {/* Form 2 */}
      <NewAddScheduleModal
        isOpen={isForm2Open}
        onClose={() => setIsForm2Open(false)}
        onAddPending={() => {}}
        onSuccess={handleFormSuccess}
        scheduleToEdit={scheduleToEdit}
      />

      {/* PIN Modal */}
      <PinModal
        open={pinOpen}
        purpose={pinPurpose}
        onCancel={() => setPinOpen(false)}
        onVerified={() => setPinOpen(false)}
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

        {/* Responsive Action Buttons */}
        <div className="flex gap-2">
          {/* Mobile: satu tombol */}
          <button
            onClick={() => {
              setPinPurpose("ADD");
              setPinOpen(true);
              setIsForm1Open(true);
            }}
            className="sm:hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah
          </button>

          {/* Desktop: dua tombol */}
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => {
                setPinPurpose("ADD");
                setPinOpen(true);
                setIsForm1Open(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow"
            >
              <PlusIcon className="h-5 w-5" />
              Form 1
            </button>
            <button
              onClick={() => {
                setPinPurpose("ADD");
                setPinOpen(true);
                setIsForm2Open(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow"
            >
              <PlusIcon className="h-5 w-5" />
              Form 2
            </button>
          </div>
        </div>
      </div>

      {/* List */}
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
                  onEdit={() => {
                    setScheduleToEdit(schedule);
                    setPinPurpose("EDIT");
                    setPinOpen(true);
                    setIsForm1Open(true);
                  }}
                  onDelete={() => {
                    setPendingDeleteId(schedule["Submission ID"] as number);
                    setPinPurpose("DELETE");
                    setPinOpen(true);
                  }}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
