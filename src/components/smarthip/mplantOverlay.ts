// components/smarthip/implantOverlay.ts

import { Point } from "./geometry";
import { StemSize } from "./implantData";

export function recommendStem(
  canalDistalMm: number,
  stems: StemSize[]
): StemSize | null {
  return stems.reduce((prev, curr) =>
    Math.abs(curr.distalCanal - canalDistalMm) <
    Math.abs(prev.distalCanal - canalDistalMm)
      ? curr
      : prev
  );
}

export function drawStem(
  ctx: CanvasRenderingContext2D,
  center: Point,
  axisAngle: number,
  lengthPx: number
) {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(axisAngle);

  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.moveTo(0, -lengthPx * 0.15);
  ctx.lineTo(0, lengthPx);
  ctx.stroke();

  ctx.restore();
}
