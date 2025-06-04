"use client";
import React from "react";
import { Card } from "@/components/ui/card";

interface StockSummaryProps {
  activeSheet: string;
  totalStok: number;
  allSheetTotals: Record<string, number>;
  sheets: string[];
}
export default function StockSummary({ activeSheet, totalStok, allSheetTotals, sheets }: StockSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <Card className="p-4">
        <p className="text-sm text-gray-500">Total Implan ({activeSheet})</p>
        <p className="text-lg font-semibold">{totalStok} Unit</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-gray-500">Total Semua Implan</p>
        <ul className="text-sm mt-2 space-y-1">
          {sheets.map((name) => (
            <li key={name} className="flex justify-between">
              <span>{name}</span>
              <span className="font-semibold">{allSheetTotals[name] || 0}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}