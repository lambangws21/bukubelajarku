"use client";

import { X } from "lucide-react";
import { useStockHistory } from "@/hooks/useStockHistory";

interface HistoryModalProps {
  open: boolean;
  sheet: string;
  No: number;
  onClose: () => void;
}

export default function HistoryModal({
  open,
  sheet,
  No,
  onClose,
}: HistoryModalProps) {
  const { data, loading } = useStockHistory(sheet, No);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-3xl shadow-lg border dark:border-zinc-800">
        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b dark:border-zinc-800">
          <h3 className="font-bold">📜 History – No #{No}</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {loading && <div className="text-sm">Loading history...</div>}

          {!loading && data.length === 0 && (
            <div className="text-sm text-zinc-500">
              Tidak ada history
            </div>
          )}

          {data.map((h, i) => (
            <div
              key={i}
              className="relative pl-5 border-l-2 border-blue-500"
            >
              <div className="absolute -left-1.5 top-1 w-3 h-3 bg-blue-500 rounded-full" />

              <div className="text-xs text-zinc-500">
                {new Date(h.Timestamp).toLocaleString()}
              </div>

              <div className="font-semibold text-sm">
                {h.Action}
              </div>

              <div className="text-xs text-zinc-500 mb-1">
                by {h.By}
              </div>

              {h.After && (
                <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded overflow-x-auto">
{JSON.stringify(JSON.parse(h.After), null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
