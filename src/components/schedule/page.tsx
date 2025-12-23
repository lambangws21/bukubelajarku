"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Schedule } from "@/types/schedule";
import { getSchedules } from "@/lib/scheduleApi";

import AddScheduleModal from "@/components/schedule/AddSchedlueForm";
import NewAddScheduleModal from "@/components/schedule/NewAddScheduleForm";
import OperationCard from "@/components/schedule/NewCard";
import { PlusIcon } from "lucide-react";

/* ================= HELPERS ================= */
function getTodayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

type PinPurpose = "ADD_FORM1" | "ADD_FORM2" | "EDIT" | "DELETE";

/* ================= PIN MODAL ================= */

type PinModalProps = {
  open: boolean;
  purpose: PinPurpose | null;
  onCancel: () => void;
  onVerified: () => void;
};

function PinModal({
  open,
  purpose,
  onCancel,
  onVerified,
}: PinModalProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={`${purpose}-${open}`}
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <PinModalContent
          purpose={purpose}
          onCancel={onCancel}
          onVerified={onVerified}
        />
      </motion.div>
    </AnimatePresence>
  );
}

function PinModalContent({
  purpose,
  onCancel,
  onVerified,
}: {
  purpose: PinPurpose | null;
  onCancel: () => void;
  onVerified: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const EXPECTED_PIN =
    (typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SCHEDULE_PIN) ||
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
          {purpose?.startsWith("ADD")
            ? "Masukkan PIN untuk Membuat Jadwal"
            : purpose === "EDIT"
            ? "Masukkan PIN untuk Mengedit Jadwal"
            : "Masukkan PIN untuk Menghapus Jadwal"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          PIN diperlukan untuk melanjutkan aksi ini.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="•••••"
          autoFocus
          className="w-full rounded-lg border px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
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
  );
}

/* ================= PAGE ================= */

export default function HomePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isForm1Open, setIsForm1Open] = useState(false);
  const [isForm2Open, setIsForm2Open] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);

  const today = getTodayLocal();
  const [selectedDate] = useState(today);
  const [filterDoctor] = useState("");
  const [filterTS] = useState("");

  const [pinOpen, setPinOpen] = useState(false);
  const [pinPurpose, setPinPurpose] = useState<PinPurpose | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
  
    (async () => {
      // setState sekarang ADA DI ASYNC CONTEXT
      setIsLoading(true);
  
      const data = await getSchedules();
  
      if (!mounted) return;
  
      setSchedules(data);
      setIsLoading(false);
    })();
  
    return () => {
      mounted = false;
    };
  }, []);
  
  

  const handleFormSuccess = async () => {
    setIsForm1Open(false);
    setIsForm2Open(false);
  
    setIsLoading(true);
    const data = await getSchedules();
    setSchedules(data);
    setIsLoading(false);
  };
  

  const handlePinVerified = () => {
    if (pinPurpose === "ADD_FORM1") setIsForm1Open(true);
    if (pinPurpose === "ADD_FORM2") setIsForm2Open(true);
    if (pinPurpose === "EDIT") setIsForm1Open(true);
    if (pinPurpose === "DELETE" && pendingDeleteId) {
      console.log("Delete ID:", pendingDeleteId);
      setPendingDeleteId(null);
    }
    setPinOpen(false);
  };

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
      <AddScheduleModal
        isOpen={isForm1Open}
        onClose={() => setIsForm1Open(false)}
        onAddPending={() => {}}
        onSuccess={handleFormSuccess}
        scheduleToEdit={scheduleToEdit}
      />

      <NewAddScheduleModal
        isOpen={isForm2Open}
        onClose={() => setIsForm2Open(false)}
        onAddPending={() => {}}
        onSuccess={handleFormSuccess}
        scheduleToEdit={scheduleToEdit}
      />

      <PinModal
        open={pinOpen}
        purpose={pinPurpose}
        onCancel={() => setPinOpen(false)}
        onVerified={handlePinVerified}
      />

      <div className="p-4 md:p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <AnimatePresence>
          {isLoading ? (
            <p>Memuat data…</p>
          ) : filteredSchedules.length === 0 ? (
            <p>Tidak ada jadwal</p>
          ) : (
            filteredSchedules.map((schedule) => (
              <motion.div
                key={schedule["Submission ID"]}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <OperationCard
                  schedule={schedule}
                  onEdit={() => {
                    setScheduleToEdit(schedule);
                    setPinPurpose("EDIT");
                    setPinOpen(true);
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
