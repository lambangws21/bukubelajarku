"use client";

import { PriceItem } from "@/types/priceItem";

export function usePriceActions() {
  const fetchPrices = async () => {
    const res = await fetch("/api/price-list", { cache: "no-store" });
    return res.json();
  };

  const addPrice = async (item: PriceItem) => {
    const res = await fetch("/api/price-list", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return res.json();
  };

  const updatePrice = async (item: PriceItem) => {
    const res = await fetch("/api/price-list", {
      method: "PUT",
      body: JSON.stringify(item),
    });
    return res.json();
  };

  const deletePrice = async (no: number) => {
    const res = await fetch("/api/price-list", {
      method: "DELETE",
      body: JSON.stringify({ no }),
    });
    return res.json();
  };

  return { fetchPrices, addPrice, updatePrice, deletePrice };
}
