// File: components/stock/stockSummary.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Box, Layers, BarChart2, Database } from "lucide-react";

interface StockSummaryProps {
  activeSheet: string;
  totalStok: number;
  allSheetTotals: Record<string, number>;
  sheets: string[];
}

export default function StockSummary({
  activeSheet,
  totalStok,
  allSheetTotals,
  sheets,
}: StockSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Card 1: Total Implan di Sheet Aktif */}
      <Card className="flex items-center p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
          <BarChart2 className="w-6 h-6 text-green-600 dark:text-green-300" />
        </div>
        <div className="ml-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Implan ({activeSheet})
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {totalStok.toLocaleString()} Unit
          </p>
        </div>
      </Card>

      {/* Card 2: Total Semua Implan */}
      <Card className="p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center mb-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h3 className="ml-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
            Total Semua Implan
          </h3>
        </div>
        <ul className="space-y-2">
          {sheets.map((name) => (
            <li
              key={name}
              className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{name}</span>
              </div>
              <span className="font-medium">
                { (allSheetTotals[name] || 0).toLocaleString() }
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
