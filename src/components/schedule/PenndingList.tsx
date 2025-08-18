'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type PendingListProps = {
  hasPendingItems: boolean;
  onSendAll: () => void;
  isSending: boolean;
};

export function PendingList({ hasPendingItems, onSendAll, isSending }: PendingListProps) {
  const [timer, setTimer] = useState<number>(0); // countdown berjalan
  const [setting, setSetting] = useState<number>(0); // waktu yang dipilih user
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    if (isCounting && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (isCounting && timer === 0 && setting > 0) {
      onSendAll();
      setIsCounting(false);
    }
  }, [timer, isCounting, setting, onSendAll]);

  const startCountdown = () => {
    if (setting > 0 && hasPendingItems) {
      setTimer(setting);
      setIsCounting(true);
    }
  };

  const cancelCountdown = () => {
    setIsCounting(false);
    setTimer(0);
  };

  return (
    <div className="w-full flex flex-col gap-3 items-center">
      {/* Pilih timer */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Set Timer:</label>
        <select
          value={setting}
          onChange={(e) => setSetting(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value={0}>Manual</option>
          <option value={5}>5 detik</option>
          <option value={10}>10 detik</option>
          <option value={30}>30 detik</option>
        </select>
        {!isCounting ? (
          <button
            onClick={startCountdown}
            disabled={setting === 0 || !hasPendingItems}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:bg-gray-400"
          >
            Mulai
          </button>
        ) : (
          <button
            onClick={cancelCountdown}
            className="px-3 py-1 rounded bg-red-600 text-white text-sm"
          >
            Batal
          </button>
        )}
      </div>

      {/* Button utama */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={onSendAll}
        disabled={!hasPendingItems || isSending}
        className={`w-full rounded-lg py-3 px-4 font-semibold text-white shadow-md transition-colors duration-300
          ${(hasPendingItems && !isSending) 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
      >
        {isSending
          ? "Mengirim..."
          : timer > 0
          ? `Otomatis dalam ${timer}s`
          : "Kirim Semua Jadwal"}
      </motion.button>
    </div>
  );
}
