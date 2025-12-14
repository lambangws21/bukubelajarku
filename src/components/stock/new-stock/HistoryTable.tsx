"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  Clock,
  Package,
} from "lucide-react";

/* =========================
   TYPES (NO any)
========================= */
type HistoryRow = {
  Timestamp: string;
  Action: string;
  Sheet: string;
  No: number;
  Before: string;
  After: string;
  by?: string;
};

type HistoryResponse = {
  status: "success" | "error";
  sheet: string;
  data: HistoryRow[];
  message?: string;
};

/* =========================
   SAFE JSON PARSER
========================= */
function safeParseJSON<T extends object>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* =========================
   ACTION BADGE
========================= */
function ActionBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    MUTASI_IN: "bg-purple-100 text-purple-700",
    MUTASI_OUT: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${
        map[action] ?? "bg-zinc-200 text-zinc-700"
      }`}
    >
      {action}
    </span>
  );
}

/* =========================
   DIFF VIEWER (PREMIUM)
========================= */
function DiffViewer({
  beforeRaw,
  afterRaw,
}: {
  beforeRaw: string;
  afterRaw: string;
}) {
  const [open, setOpen] = useState(false);

  const before = safeParseJSON<Record<string, unknown>>(beforeRaw);
  const after = safeParseJSON<Record<string, unknown>>(afterRaw);

  if (!before || !after) {
    return <div className="text-xs italic text-zinc-400">No detail</div>;
  }

  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  );

  const iconFor = (b: unknown, a: unknown) => {
    if (typeof b === "number" && typeof a === "number") {
      if (a > b) return <Plus size={14} className="text-green-600" />;
      if (a < b) return <Minus size={14} className="text-red-600" />;
    }
    if (b !== a) return <Edit3 size={14} className="text-amber-600" />;
    return null;
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Lihat detail perubahan
      </button>

      {open && (
        <div className="mt-2 rounded-lg border bg-zinc-50 dark:bg-zinc-900 p-2 space-y-1">
          {keys.map((key) => {
            const b = before[key];
            const a = after[key];
            const changed = b !== a;

            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-2 py-1 rounded ${
                  changed
                    ? "bg-amber-50 dark:bg-zinc-800"
                    : "opacity-60"
                }`}
              >
                <div className="w-28 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {key}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">
                    {String(b ?? "-")}
                  </span>
                  <ArrowRight size={14} className="text-zinc-400" />
                  <span className="font-semibold">
                    {String(a ?? "-")}
                  </span>
                </div>

                <div className="ml-auto">{iconFor(b, a)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================
   HISTORY TIMELINE PREMIUM
========================= */
export default function HistoryTimelinePremium() {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbzYixMvNT2jkoKl-P0973ijFkM0XCQRb8oEMyFKTB-BmbKd_HyirtYvdgO-v84xgVF3mA/exec?action=history&sheet=History",
          { cache: "no-store" }
        );

        const json: HistoryResponse = await res.json();
        if (json.status === "success") setData(json.data);
        else setError(json.message ?? "GAS error");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) return <div className="text-zinc-500">Loading history…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {data.map((row) => (
        <div
          key={`${row.Timestamp}-${row.No}`}
          className="relative flex gap-4"
        >
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 mt-2" />
            <div className="flex-1 w-px bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Card */}
          <div className="flex-1 rounded-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <ActionBadge action={row.Action} />
                  <span className="text-sm font-semibold">
                    #{row.No}
                  </span>
                </div>

                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(row.Timestamp).toLocaleString()}
                </div>
              </div>

              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <Package size={14} />
                {row.Sheet}
              </div>
            </div>

            <DiffViewer
              beforeRaw={row.Before}
              afterRaw={row.After}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
