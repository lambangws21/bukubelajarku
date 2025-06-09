// File: src/components/stock/formStockDialog.tsx
"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Item {
  Tanggal?: string;
  Ref: string;
  Lot: string;
  Nama: string;
  Jumlah: string;
}

export interface StockFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<Item> & { tanggal?: string };
  formSheet: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFormSubmit: () => Promise<void>;
  setFormSheet: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  editingLot: string | null;
}

export default function StockFormDialog({
  isOpen,
  onClose,
  formData,
  formSheet,
  onFormChange,
  onFormSubmit,
  setFormSheet,
  isLoading,
  editingLot,
}: StockFormDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        /* Overlay */
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Dialog Container */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative"
            initial={{ y: -30, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-2 right-2 text-gray-600 dark:text-gray-300"
              onClick={onClose}
              whileHover={{ rotate: 90 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <X />
            </motion.button>

            {/* Title */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {editingLot ? 'Edit Stok' : 'Tambah Stok'}
            </h2>

            {/* Sheet Selector */}
            <label className="block mb-2">
              <span className="text-gray-700 dark:text-gray-300">Implant</span>
              <motion.select
                className="mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none"
                value={formSheet}
                onChange={(e) => setFormSheet(e.target.value)}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <option value="TKR">TKR</option>
                <option value="Bipolar">Bipolar</option>
                <option value="THR">THR</option>
                <option value="Stem">Stem</option>
                <option value="UKA">UKA</option>
                <option value="Opt">Opt</option>
                <option value="Heads">Heads</option>
              </motion.select>
            </label>

            {/* Form Fields */}
            {[
              { label: 'Tanggal', name: 'tanggal', type: 'date' },
              { label: 'Ref', name: 'Ref', type: 'text' },
              { label: 'Note', name: 'Lot', type: 'text', disabled: !!editingLot },
              { label: 'Nama', name: 'Nama', type: 'text' },
              { label: 'Jumlah', name: 'Jumlah', type: 'number' },
            ].map(({ label, name, type, disabled }) => (
              <label className="block mb-2" key={name}>
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
                <motion.input
                  type={type}
                  name={name}
                  value={formData[name as keyof typeof formData] || ''}
                  onChange={onFormChange}
                  disabled={disabled}
                  className={
                    `mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none transition ` +
                    (disabled ? 'opacity-50 cursor-not-allowed' : '')
                  }
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
              </label>
            ))}

            {/* Submit Button */}
            <motion.button
              className={
                `w-full py-2 rounded text-white mb-2 ` +
                (isLoading
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700')
              }
              onClick={async () => !isLoading && await onFormSubmit()}
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.03 } : undefined}
              whileTap={!isLoading ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.2 }}
            >
              {isLoading
                ? 'Sedang memproses...'
                : editingLot
                ? 'Update Data'
                : 'Tambah Data'}
            </motion.button>

            {/* Cancel Button */}
            <motion.button
              className="w-full py-2 rounded text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              onClick={onClose}
              whileHover={{ backgroundColor: '#f3f4f6', scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Batal
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
