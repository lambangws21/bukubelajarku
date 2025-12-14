"use client";

import { gasPOST, gasDELETE } from "@/lib/gas";
import { StockPayload } from "@/types/stock";

export function useStockMutation(sheet: string) {
  const mutateIn = async (No: number, qty: number) => {
    const body: StockPayload = {
      sheet,
      action: "mutasi",
      No,
      qty,
      type: "in",
    };

    return gasPOST(body);
  };

  const mutateOut = async (No: number, qty: number) => {
    const body: StockPayload = {
      sheet,
      action: "mutasi",
      No,
      qty,
      type: "out",
    };

    return gasPOST(body);
  };

  const duplicateRow = async (No: number) => {
    const body: StockPayload = {
      sheet,
      action: "duplicate",
      No,
    };

    return gasPOST(body);
  };

  const deleteRow = async (No: number) => {
    return gasDELETE(sheet, No);
  };

  return {
    mutateIn,
    mutateOut,
    duplicateRow,
    deleteRow,
  };
}
