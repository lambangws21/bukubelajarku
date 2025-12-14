"use client";

import { useState } from "react";
import { StockRow } from "@/types/stock";
import { useStockMutation } from "@/hooks/useStockMutation";

interface MutateModalProps {
  open: boolean;
  row: StockRow | null;
  sheet: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MutateModal({
  open,
  row,
  sheet,
  onClose,
  onSuccess,
}: MutateModalProps) {
  const { mutateIn, mutateOut } = useStockMutation(sheet);

  const [qty, setQty] = useState<number>(0);
  const [type, setType] = useState<"in" | "out">("in");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open || !row) return null;

  const submit = async () => {
    if (qty <= 0) {
      setErrMsg("Qty harus lebih besar dari 0");
      return;
    }

    setLoading(true);
    setErrMsg(null);

    try {
      if (type === "in") {
        await mutateIn(row.No, qty);
      } else {
        await mutateOut(row.No, qty);
      }

      onSuccess();
      onClose();
      setQty(0);
      setType("in");
    } catch (err) {
      setErrMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow w-[340px] space-y-4">
        <h2 className="text-lg font-bold">Mutasi Stok</h2>

        <div className="text-sm space-y-1">
          <p className="font-semibold">{row.Deskripsi}</p>
          <p className="text-xs text-zinc-500">Batch: {row.Batch}</p>
          <p className="text-xs text-zinc-500">
            Stok Sekarang: {row.TotalQty}
          </p>
        </div>

        {/* Jenis Mutasi */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Jenis Mutasi</label>
          <select
            className="w-full px-3 py-2 border rounded dark:bg-zinc-800"
            value={type}
            onChange={(e) => setType(e.target.value as "in" | "out")}
          >
            <option value="in">IN (Mengisi stok)</option>
            <option value="out">OUT (Mengurangi stok)</option>
          </select>
        </div>

        {/* Qty Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Jumlah</label>
          <input
            type="number"
            min={1}
            className="w-full px-3 py-2 border rounded dark:bg-zinc-800"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>

        {/* Error Message */}
        {errMsg && <p className="text-red-500 text-sm">{errMsg}</p>}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm border rounded"
            disabled={loading}
          >
            Batal
          </button>

          <button
            onClick={submit}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-40"
            disabled={loading}
          >
            {loading ? "Processing..." : "Mutasi"}
          </button>
        </div>
      </div>
    </div>
  );
}
