"use client";

import { useEffect, useCallback, useState } from "react";
import { gasGET, gasPOST, gasPUT, gasDELETE } from "@/lib/gas";
import { StockRow, StockPayload } from "@/types/stock";

export function useStockCRUD({ sheet }: { sheet: string }) {
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= LOAD ================= */
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await gasGET(sheet);
      setData(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [sheet]);

  useEffect(() => {
    reload();
  }, [reload]); // ✅ ESLINT FIX

  /* ================= CREATE ================= */
  const createRow = async (row: StockRow) => {
    const payload: StockPayload = {
      sheet,
      action: "create",
      data: row,
    };

    await gasPOST(payload);
    await reload();
  };

  /* ================= UPDATE ================= */
  const updateRow = async (row: StockRow) => {
    const payload: StockPayload = {
      sheet,
      action: "update",
      data: row,
    };

    await gasPUT(payload);
    await reload();
  };

  /* ================= DELETE ================= */
  const deleteRow = async (No: number) => {
    await gasDELETE(sheet, No);
    await reload();
  };

  return {
    data,
    loading,
    error,
    reload,
    createRow,
    updateRow,
    deleteRow,
  };
}
