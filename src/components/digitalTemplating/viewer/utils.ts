import type React from "react";
import { XRAY_BASE_HEIGHT, XRAY_BASE_WIDTH } from "./constants";

export type CanvasMode = "fit" | "oneToOne";

export type XrayTransform = {
  rect: DOMRect;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const adjustRulerMm = (mm: number) => {
  const sign = Math.sign(mm) || 1;
  const abs = Math.abs(mm);
  const bucket = Math.floor(abs);
  if (bucket >= 10 && bucket <= 19) return mm + 7 * sign;
  if (bucket >= 20 && bucket <= 25) return mm + 7 * sign;
  if (bucket >= 25 && bucket <= 29) return mm + 5 * sign;
  if (bucket >= 30 && bucket <= 39) return mm + 15 * sign;
  if (bucket >= 40 && bucket <= 49) return mm + 10 * sign;
  if (bucket === 25) return mm + 20 * sign;
  if (bucket === 29) return mm + 5 * sign;
  if (bucket === 90) return mm + 85 * sign;
  if (bucket === 150) return mm + 75 * sign;
  if (bucket === 140) return mm + 85 * sign;
  if (bucket >= 130) return mm + 87 * sign;
  return mm;
};

export const getXrayTransform = (
  stageRef: React.RefObject<HTMLDivElement>,
  zoom: number,
  mode: CanvasMode,
  cover = false
): XrayTransform | null => {
  const rect = stageRef.current?.getBoundingClientRect();
  if (!rect) return null;
  const fitScale = Math.min(rect.width / XRAY_BASE_WIDTH, rect.height / XRAY_BASE_HEIGHT);
  const coverScale = Math.max(rect.width / XRAY_BASE_WIDTH, rect.height / XRAY_BASE_HEIGHT);
  const baseScale = cover ? coverScale : mode === "oneToOne" ? 1 : fitScale;
  const scale = baseScale * zoom;
  const width = XRAY_BASE_WIDTH * scale;
  const height = XRAY_BASE_HEIGHT * scale;
  const offsetX = (rect.width - width) / 2;
  const offsetY = (rect.height - height) / 2;
  return { rect, scale, offsetX, offsetY };
};

export const distancePointToSegmentSq = (
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    const dx = point.x - a.x;
    const dy = point.y - a.y;
    return dx * dx + dy * dy;
  }
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  const dx = point.x - cx;
  const dy = point.y - cy;
  return dx * dx + dy * dy;
};

export const clampStagePoint = (p: { x: number; y: number }) => ({
  x: Math.min(XRAY_BASE_WIDTH, Math.max(0, p.x)),
  y: Math.min(XRAY_BASE_HEIGHT, Math.max(0, p.y)),
});

