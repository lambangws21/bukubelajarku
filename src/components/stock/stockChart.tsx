// File: components/stock/StockChart.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart as Rechart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CustomLabelList from "@/components/stock/customLabelList"; // impor komponen baru

interface StockChartProps {
  chartData: { nama: string; jumlah: number }[];
}

export default function StockChart({ chartData }: StockChartProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 640); // breakpoint sm
    };
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  return (
    <div className="h-64 sm:h-80 bg-gray-900 rounded-lg px-2 sm:px-4 pt-4 pb-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Rechart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 20 : 60 }}
        >
          <XAxis
            dataKey="nama"
            stroke="#6B7280"
            height={isMobile ? 20 : 60}
            tick={isMobile ? false : { fill: "#9CA3AF", fontSize: 9 }}
            axisLine={!isMobile}
            tickLine={false}
            interval={0}
            dy={isMobile ? 0 : 10}
            angle={isMobile ? 0 : -45}
            textAnchor={isMobile ? "middle" : "end"}
            hide={isMobile}
          />

          <YAxis
            stroke="#6B7280"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

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

          <Bar
            dataKey="jumlah"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            barSize={isMobile ? 20 : 28}
            animationDuration={800}
          >
            {/* Panggil CustomLabelList hanya saat desktop */}
            {!isMobile && (
              <CustomLabelList
                dataKey="jumlah"
                position="insideTop"
                fill="#FFFFFF"
                fontSize={11}
                fontWeight={500}
              />
            )}
          </Bar>
        </Rechart>
      </ResponsiveContainer>
    </div>
  );
}
