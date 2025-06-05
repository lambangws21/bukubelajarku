// File: components/stock/CustomLabelList.tsx
"use client";

import React from "react";
import { LabelList } from "recharts";

// Gunakan ComponentProps untuk mengambil tipe props LabelList secara otomatis
type LabelListComponentProps = React.ComponentProps<typeof LabelList>;

interface CustomLabelListProps extends Omit<LabelListComponentProps, "dataKey"> {
  /** Key data yang akan ditampilkan pada label */
  dataKey: string;
  /** Posisi label (default: "insideTop") */
  position?: LabelListComponentProps["position"];
  /** Warna teks (default: "#FFFFFF") */
  fill?: string;
  /** Ukuran font (default: 11) */
  fontSize?: number;
  /** Ketebalan font (default: 500) */
  fontWeight?: number;
  /** Offset vertikal/horisontal jika diperlukan */
  offset?: LabelListComponentProps["offset"];
}

export default function CustomLabelList({
  dataKey,
  position = "insideTop",
  fill = "#FFFFFF",
  fontSize = 11,
  fontWeight = 500,
  offset,
}: CustomLabelListProps) {
  return (
    <LabelList
      dataKey={dataKey}
      position={position}
      fill={fill}
      fontSize={fontSize}
      fontWeight={fontWeight}
      offset={offset}
    />
  );
}
