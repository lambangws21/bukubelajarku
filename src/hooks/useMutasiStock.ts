"use client";

import { useState } from "react";
import { StockRow, StockPayload } from "@/types/stock";
import { gasPOST } from "@/lib/gas";

interface MutasiOptions {
  sheet: string;
  row: StockRow;
}

export type MutasiType = "in" | "out";

export interface UseMutasiStockResult {
  loading: boolean;
  error: string | null;
  success: boolean;
  mutate: (type: MutasiType, qty: number) => Promise<void>;
}

/* -------------------------------------------------------
   useMutasiStock — MUTASI IN / OUT
------------------------------------------------------- */
export function useMutasiStock({
  sheet,
  row,
}: MutasiOptions): UseMutasiStockResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutate = async (type: MutasiType, qty: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (qty <= 0) throw new Error("Qty harus lebih besar dari 0");

      if (type === "out" && qty > row.Qty) {
        throw new Error("Qty OUT tidak boleh melebihi stok tersedia");
      }

      // ✅ PAYLOAD BENAR (TANPA mutation)
      const body: StockPayload = {
        sheet,
        action: "mutasi",
        No: row.No,
        qty,
        type,
      };

      await gasPOST(body);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    mutate,
  };
}
