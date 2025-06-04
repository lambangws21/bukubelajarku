// File: components/StockChart.tsx
"use client";

import React from "react";
import {
  BarChart as Rechart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StockChartProps {
  chartData: { nama: string; jumlah: number }[];
}
export default function StockChart({ chartData }: StockChartProps) {
  return (
    <div className="h-72 bg-white rounded-xl p-4 border w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Rechart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="nama" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="jumlah" fill="#8884d8" />
        </Rechart>
      </ResponsiveContainer>
    </div>
  );
}