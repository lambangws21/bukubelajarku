"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  GitCommit,
  Edit3,
  RefreshCcw,
  Plus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Minus,
  Search,
} from "lucide-react";
import { useStockHistory } from "@/hooks/useStockHistory";
import { StockRow } from "@/types/stock";

type ChangeInfo = {
  before: string | number;
  after: string | number;
};

type Props = {
  sheet: string;
  No: number;
  localChanges?: Partial<Record<keyof StockRow, ChangeInfo>>;
};

export default function HistoryTimeline({
  sheet,
  No,
  localChanges,
}: Props) {
  const { data, loading, error } = useStockHistory(sheet, No);
  const [search, setSearch] = useState("");

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return data.filter((h) =>
      `${h.Action} ${h.Sheet} ${h.No}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <GitCommit size={14} /> Timeline Perubahan
        </h4>

        <div className="relative w-52">
          <Search size={14} className="absolute left-2 top-2.5 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter history…"
            className="pl-7 pr-2 py-1.5 border rounded text-xs w-full dark:bg-zinc-800"
          />
        </div>
      </div>

      {/* LOCAL CHANGES */}
      {localChanges && Object.keys(localChanges).length > 0 && (
        <div className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20">
          <div className="text-xs font-semibold text-yellow-700 mb-1">
            🔥 Perubahan Terakhir (Session Ini)
          </div>

          <ul className="text-xs space-y-1">
            {Object.entries(localChanges).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2">
                <Edit3 size={12} className="text-yellow-600" />
                <span className="font-medium">{k}</span>:
                <span className="text-zinc-500">{String(v.before)}</span>
                →
                <span className="font-semibold">{String(v.after)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SERVER HISTORY */}
      {loading && (
        <div className="text-xs italic text-zinc-400">
          Loading history…
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500">
          Error: {error}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-xs italic text-zinc-400">
          Tidak ada history
        </div>
      )}

      {/* TIMELINE */}
      <div className="relative pl-6 space-y-4">
        {/* vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-700" />

        {filtered.map((h, i) => (
          <motion.div
            key={`${h.Timestamp}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex gap-3"
          >
            {/* DOT */}
            <div className="relative z-10">
              <div className="w-3 h-3 rounded-full bg-blue-600 mt-1" />
            </div>

            {/* CONTENT */}
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg px-3 py-2 text-xs w-full">
              <div className="flex justify-between items-center">
                <span className="font-semibold flex items-center gap-1">
                  {h.Action === "UPDATE" && (
                    <Edit3 size={12} className="text-amber-600" />
                  )}
                  {h.Action === "CREATE" && (
                    <Plus size={12} className="text-green-600" />
                  )}
                  {h.Action === "MUTASI" && (
                    <RefreshCcw size={12} className="text-blue-600" />
                  )}
                  {h.Action}
                </span>

                <span className="text-zinc-500">
                  {new Date(h.Timestamp).toLocaleString()}
                </span>
              </div>

              <div className="mt-1 text-zinc-600">
                Sheet: <b>{h.Sheet}</b> • No #{h.No}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
