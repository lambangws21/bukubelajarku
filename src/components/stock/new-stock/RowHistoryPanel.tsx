"use client";

import { useStockHistory } from "@/hooks/useStockHistory";
import { StockRow } from "@/types/stock";

/* ================= TYPES ================= */
type Props = {
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

/* ================= COMPONENT ================= */
export default function HistoryPanel({ sheet, No, localChanges }: Props) {
  const { data, loading, error } = useStockHistory(sheet, No);

  return (
    <div className="space-y-4 text-xs">
      <strong>📜 Riwayat Perubahan (No #{No})</strong>

      {/* 🔥 LOCAL SESSION */}
      {localChanges && Object.keys(localChanges).length > 0 && (
        <div className="border-l-2 border-yellow-400 pl-3">
          <div className="font-semibold text-zinc-700 mb-1">
            Perubahan Terakhir (Session Ini)
          </div>

          <ul className="space-y-1">
            {Object.entries(localChanges).map(([k, v]) => (
              <li key={k} className="flex gap-2 items-center">
                <span className="w-28 font-medium">{k}</span>
                <span className="line-through text-red-500">
                  {String(v.before)}
                </span>
                <span className="text-zinc-400">→</span>
                <span className="font-semibold text-green-600">
                  {String(v.after)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🌐 SERVER HISTORY */}
      <div className="border-l-2 border-blue-400 pl-3 space-y-3">
        {loading && (
          <div className="italic text-zinc-400">Loading history…</div>
        )}

        {error && <div className="text-red-500">Error: {error}</div>}

        {!loading && !error && data.length === 0 && (
          <div className="italic text-zinc-400">
            Belum ada history untuk item ini
          </div>
        )}

        {!loading &&
          !error &&
          data.map((h) => {
            const diffs = parseDiff(h.Before, h.After);

            if (diffs.length === 0) return null;

            return (
              <div key={h.Timestamp} className="space-y-1">
                <div className="text-[11px] text-zinc-500">
                  <b>{h.Action}</b> •{" "}
                  {new Date(h.Timestamp).toLocaleString()}
                </div>

                <ul className="space-y-1">
                  {diffs.map((d) => (
                    <li
                      key={d.key}
                      className="flex gap-2 items-center"
                    >
                      <span className="w-28 font-medium">{d.key}</span>
                      <span className="font-semibold text-green-600">
                        {String(d.after)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </div>
    </div>
  );
}
