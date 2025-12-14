"use client";

import { StockRow } from "@/types/stock";
import { StockHistoryRow } from "@/hooks/useStockHistory";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  row: StockRow | null;
  history: StockHistoryRow[];
}

export default function RowDetailModal({
  open,
  onClose,
  row,
  history,
}: Props) {
  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-3xl p-5 space-y-4 shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="font-bold text-lg">
            📦 Detail Stock #{row.No}
          </h2>
          <button onClick={onClose} className="hover:text-red-500">
            <X />
          </button>
        </div>

        {/* CURRENT DATA */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><b>No Stok:</b> {row.NoStok}</div>
          <div><b>Batch:</b> {row.Batch}</div>
          <div><b>Qty:</b> {row.Qty}</div>
          <div><b>Total:</b> {row.TotalQty}</div>
          <div><b>Terpakai:</b> {row.TERPAKAI}</div>
          <div><b>Refill:</b> {row.REFILL}</div>
          <div className="col-span-2">
            <b>Keterangan:</b> {row.KET || "-"}
          </div>
        </div>

        {/* HISTORY */}
        <div>
          <h3 className="font-semibold mb-2">🕒 Riwayat Perubahan</h3>

          {history.length === 0 ? (
            <div className="text-xs text-zinc-500 italic">
              Tidak ada history
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((h) => (
                <div
                  key={`${h.Timestamp}-${h.Action}`}
                  className="border rounded-md p-3 text-xs bg-zinc-50 dark:bg-zinc-800"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{h.Action}</span>
                    <span className="text-zinc-500">
                      {new Date(h.Timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-zinc-500 mt-1">
                    By: {h.By || "-"}
                  </div>

                  {h.Before && h.After && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">
                        Lihat perubahan
                      </summary>
                      <pre className="text-[10px] bg-black/5 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(
                          {
                            before: JSON.parse(h.Before),
                            after: JSON.parse(h.After),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
