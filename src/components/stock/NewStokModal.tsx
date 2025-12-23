"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StokBarang {
  noStok: string;
  deskripsi: string;
  jumlah: number;
  permintaan: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  stok: StokBarang | null;
  onSave: (noStok: string, jumlah: number, permintaan: string) => void;
}

export default function StockModal({
  isOpen,
  onClose,
  stok,
  onSave,
}: ModalProps) {
  if (!isOpen || !stok) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={stok.noStok} // 🔑 INI KUNCI UTAMA
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <StockModalContent stok={stok} onClose={onClose} onSave={onSave} />
      </motion.div>
    </AnimatePresence>
  );
}

/* ================= CONTENT ================= */

function StockModalContent({
  stok,
  onClose,
  onSave,
}: {
  stok: StokBarang;
  onClose: () => void;
  onSave: (noStok: string, jumlah: number, permintaan: string) => void;
}) {
  // ✅ State diinisialisasi LANGSUNG dari props
  const [jumlah, setJumlah] = useState<number>(stok.jumlah);
  const [permintaan, setPermintaan] = useState<string>(stok.permintaan);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96"
    >
      <h2 className="text-lg font-semibold mb-2 dark:text-white">
        Edit Stok Barang
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        {stok.deskripsi}
      </p>

      <label className="block text-sm font-medium dark:text-gray-200">
        Jumlah
      </label>
      <input
        type="number"
        value={jumlah}
        onChange={(e) => setJumlah(Number(e.target.value))}
        className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 w-full rounded mb-3"
      />

      <label className="block text-sm font-medium dark:text-gray-200">
        Permintaan
      </label>
      <textarea
        value={permintaan}
        onChange={(e) => setPermintaan(e.target.value)}
        className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 w-full rounded mb-3"
      />

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
        >
          Batal
        </button>
        <button
          onClick={() => {
            onSave(stok.noStok, jumlah, permintaan);
            onClose();
          }}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          Simpan
        </button>
      </div>
    </motion.div>
  );
}
