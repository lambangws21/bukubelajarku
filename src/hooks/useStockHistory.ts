"use client";

import { useEffect, useState } from "react";
import { gasGetHistory } from "@/lib/gas";

/* =========================
   TYPES
========================= */
export interface StockHistoryRow {
  Timestamp: string;
  Action: string;
  Sheet: string;
  No: number;
  Before: string;
  After: string;
  By: string;
}

interface UseStockHistoryResult {
  data: StockHistoryRow[];
  loading: boolean;
  error: string | null;
}

/* =========================
   HOOK (FIXED & SAFE)
========================= */
export function useStockHistory(
  sheet: string,
  No?: number
): UseStockHistoryResult {
  const [data, setData] = useState<StockHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ HARD GUARD
    if (typeof No !== "number") {
      setData([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function run(no: number) {
      setLoading(true);

      try {
        const res = await gasGetHistory(sheet, no);
        if (!active) return;

        // 🔥 FILTER BY No (INI KUNCINYA)
        const filtered = (res.data ?? []).filter(
          (h) => Number(h.No) === Number(no)
        );

        setData(filtered);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError((err as Error).message);
        setData([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    run(No);

    return () => {
      active = false;
    };
  }, [sheet, No]);

  return { data, loading, error };
}
