"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, GitCommit } from "lucide-react";
import { useStockHistory } from "@/hooks/useStockHistory";
import { StockRow } from "@/types/stock";

/* ================= TYPES ================= */
type Props = {
  open: boolean;
  onClose: () => void;
  sheet: string;
  No: number;
  localChanges?: Partial<
    Record<keyof StockRow, { before: string | number; after: string | number }>
  >;
};

type DiffItem = {
  key: string;
  before: string | number;
  after: string | number;
};

/* ================= HELPERS ================= */
function parseDiff(beforeRaw: string, afterRaw: string): DiffItem[] {
  try {
    const before = JSON.parse(beforeRaw) as Record<string, unknown>;
    const after = JSON.parse(afterRaw) as Record<string, unknown>;

    return Object.keys({ ...before, ...after })
      .filter((k) => before[k] !== after[k])
      .map((k) => ({
        key: k,
        before: before[k] as string | number,
        after: after[k] as string | number,
      }));
  } catch {
    return [];
  }
}

function badge(action: string) {
  if (action.includes("mutasi"))
    return "bg-purple-100 text-purple-700";
  if (action.includes("duplicate"))
    return "bg-blue-100 text-blue-700";
  return "bg-green-100 text-green-700";
}

/* ================= COMPONENT ================= */
export default function HistoryTimelineModal({
  open,
  onClose,
  sheet,
  No,
  localChanges,
}: Props) {
  const { data, loading, error } = useStockHistory(sheet, No);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-xl p-5"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">
                📜 History Timeline • No #{No}
              </h2>
              <button onClick={onClose}>
                <X />
              </button>
            </div>

            {/* CONTENT */}
            <div className="max-h-[60vh] overflow-y-auto space-y-6">
              {/* LOCAL CHANGES */}
              {localChanges && Object.keys(localChanges).length > 0 && (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 h-full w-px bg-yellow-400" />
                  <div className="flex items-start gap-3">
                    <GitCommit className="text-yellow-500" size={18} />
                    <div>
                      <div className="text-xs font-semibold text-yellow-600">
                        Session Ini
                      </div>
                      <ul className="mt-1 space-y-1 text-xs">
                        {Object.entries(localChanges).map(([k, v]) => (
                          <li key={k}>
                            <b>{k}</b>:{" "}
                            <span className="line-through text-red-500">
                              {String(v.before)}
                            </span>{" "}
                            →{" "}
                            <span className="text-green-600 font-semibold">
                              {String(v.after)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SERVER HISTORY */}
              {loading && (
                <div className="text-center text-sm text-zinc-400">
                  Loading history…
                </div>
              )}

              {error && (
                <div className="text-center text-sm text-red-500">
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                data.map((h, i) => {
                  const diffs = parseDiff(h.Before, h.After);

                  return (
                    <div key={`${h.Timestamp}-${i}`} className="relative pl-6">
                      <div className="absolute left-2 top-2 h-full w-px bg-zinc-300 dark:bg-zinc-700" />

                      <div className="flex items-start gap-3">
                        <GitCommit size={18} className="text-zinc-500" />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${badge(
                                h.Action
                              )}`}
                            >
                              {h.Action}
                            </span>
                            <span className="text-zinc-400">
                              {new Date(h.Timestamp).toLocaleString()}
                            </span>
                            <span className="text-zinc-400">
                              by {h.By}
                            </span>
                          </div>

                          {diffs.length === 0 ? (
                            <div className="italic text-zinc-400 text-xs">
                              Tidak ada perubahan data
                            </div>
                          ) : (
                            <ul className="space-y-1 text-xs">
                              {diffs.map((d) => (
                                <li key={d.key}>
                                  <b>{d.key}</b>:{" "}
                                  <span className="line-through text-red-500">
                                    {String(d.before)}
                                  </span>{" "}
                                  →{" "}
                                  <span className="text-green-600 font-semibold">
                                    {String(d.after)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
