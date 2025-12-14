"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { StockRow } from "@/types/stock";

type Props = {
  open: boolean;
  row: StockRow | null;
  onClose: () => void;
  onSave: (row: StockRow) => Promise<void>;
};

export default function EditModal({ open, row, onClose, onSave }: Props) {
  // form otomatis ikut berubah setiap row berubah, TANPA useEffect
  const initialForm = useMemo<StockRow | null>(() => {
    if (!row) return null;
    return { ...row };
  }, [row]);

  const [form, setForm] = useState<StockRow | null>(null);

  // ketika modal open: populate form dari initialForm
  if (open && initialForm && form?.No !== initialForm.No) {
    // inisialisasi form hanya sekali per baris
    setForm(initialForm);
  }

  if (!open || !form) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 p-4 rounded-lg w-full max-w-md shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-3">
          {form.No === 0 ? "Tambah Data" : "Edit Data"}
        </h3>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">

          {/* NoStok */}
          <label className="text-xs">NoStok</label>
          <input
            value={form.NoStok}
            onChange={(e) => setForm({ ...form, NoStok: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />

          {/* Deskripsi */}
          <label className="text-xs">Deskripsi</label>
          <input
            value={form.Deskripsi}
            onChange={(e) => setForm({ ...form, Deskripsi: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />

          {/* Batch */}
          <label className="text-xs">Batch</label>
          <input
            value={form.Batch}
            onChange={(e) => setForm({ ...form, Batch: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />

          {/* Qty / Terpakai / Refill */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs">Qty</label>
              <input
                type="number"
                value={form.Qty}
                onChange={(e) =>
                  setForm({ ...form, Qty: Number(e.target.value) })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="text-xs">TotalQty</label>
              <input
                type="number"
                value={form.TotalQty}
                onChange={(e) =>
                  setForm({ ...form, TotalQty: Number(e.target.value) })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>
            

            <div>
              <label className="text-xs">Terpakai</label>
              <input
                type="number"
                value={form.TERPAKAI}
                onChange={(e) =>
                  setForm({ ...form, TERPAKAI: Number(e.target.value) })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="text-xs">Refill</label>
              <input
                type="number"
                value={form.REFILL}
                onChange={(e) =>
                  setForm({ ...form, REFILL: Number(e.target.value) })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          

          {/* Keterangan */}
          <label className="text-xs">Keterangan</label>
          <input
            value={form.KET}
            onChange={(e) => setForm({ ...form, KET: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={async () => await onSave(form)}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
