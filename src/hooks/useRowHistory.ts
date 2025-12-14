"use client";

import { useMemo } from "react";
import { StockHistoryRow } from "@/hooks/useStockHistory";

export function useRowHistory(
  history: StockHistoryRow[],
  sheet: string,
  No: number
) {
  return useMemo(() => {
    return history
      .filter(h => h.Sheet === sheet && Number(h.No) === Number(No))
      .reverse(); // terbaru di atas
  }, [history, sheet, No]);
}
