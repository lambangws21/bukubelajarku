// components/smarthip/implantData.ts

export type StemOffset = "STD" | "HIGH";

export type StemSize = {
  size: number;
  distalCanal: number; // mm
  stemLength: number;  // mm
};

export const STEM_LIBRARY: StemSize[] = [
  { size: 8, distalCanal: 8.5, stemLength: 120 },
  { size: 9, distalCanal: 9.5, stemLength: 130 },
  { size: 10, distalCanal: 10.5, stemLength: 140 },
  { size: 11, distalCanal: 11.5, stemLength: 150 },
];
