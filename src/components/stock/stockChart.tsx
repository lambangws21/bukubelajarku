// File: components/stock/stockChart.tsx
"use client";

import React from "react";
import {
  BarChart as Rechart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface StockChartProps {
  chartData: { nama: string; jumlah: number }[];
}

export default function StockChart({ chartData }: StockChartProps) {
  return (
    // Tambahkan padding-bottom ekstra agar label tidak terpotong
    <div className="h-80 bg-gray-900 rounded-lg px-4 pt-4 pb-7 w-full">
      <ResponsiveContainer width="100%" height="110%">
        <Rechart
          data={chartData}
          // Margin bottom ditingkatkan, serta top/right/left tetap sama
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          {/* 
            XAxis:
            - height ditingkatkan jadi 80px (untuk memberi ruang tajuk yang besar)
            - angle & textAnchor untuk memutar label 45°
          */}
          <XAxis
            dataKey="nama"
            stroke="#6B7280"
            height={90}
            tick={{ fill: "#9CA3AF", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            dy={10}
            angle={-45}
            textAnchor="end"
          />

          {/* YAxis tetap sederhana */}
          <YAxis
            stroke="#6B7280"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          {/* Tooltip gelap */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "#374151",
            }}
            labelStyle={{ color: "#9CA3AF", fontSize: 12 }}
            itemStyle={{ color: "#F9FAFB", fontSize: 12 }}
            formatter={(value: any) => [value, "Jumlah"]}
            labelFormatter={(label: string) => `Nama: ${label}`}
          />

          {/* Batang hijau dengan LabelList menampilkan nilai */}
          <Bar
            dataKey="jumlah"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            barSize={28}
            animationDuration={800}
          >
            <LabelList
              dataKey="jumlah"
              position="insideTop"
              fill="#FFFFFF"
              fontSize={11}
              fontWeight={500}
            />
          </Bar>
        </Rechart>
      </ResponsiveContainer>
    </div>
  );
}
