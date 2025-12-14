"use client";

import { useState } from "react";
import { useStockMutation } from "@/hooks/useStockMutation";
import { StockRow } from "@/types/stock";

interface DeleteConfirmModalProps {
  open: boolean;
  row: StockRow | null;
  sheet: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({
  open,
  row,
  sheet,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const { deleteRow } = useStockMutation(sheet);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open || !row) return null;

  const submit = async () => {
    setLoading(true);
    setErrMsg(null);

    try {
      await deleteRow(row.No);
      onSuccess();
      onClose();
    } catch (err) {
      setErrMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow w-[350px] space-y-4">

        <h2 className="text-lg font-bold text-red-600">Hapus Data?</h2>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aksi ini tidak dapat dibatalkan.
        </p>

        <div className="text-sm bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
          <div className="font-semibold">{row.Deskripsi}</div>
          <div className="text-xs text-zinc-500">Batch: {row.Batch}</div>
          <div className="text-xs text-red-500 font-semibold">
            No: #{row.No}
          </div>
        </div>

        {errMsg && <p className="text-red-500 text-sm">{errMsg}</p>}

        <div className="flex justify-end gap-2 pt-3">
          <button
            className="px-3 py-2 text-sm border rounded"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>

          <button
            className="px-3 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-40"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
