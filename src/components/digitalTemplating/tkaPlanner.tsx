"use client";

import React, { useMemo, useState } from "react";

type Side = "Right" | "Left";

type ParseResult = {
  values: number[];
  error?: string;
};

function parseDegrees(input: string, min: number, max: number): ParseResult {
  const raw = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (raw.length === 0) return { values: [], error: "Input kosong." };

  const nums: number[] = [];
  for (const r of raw) {
    const n = Number(r);
    if (!Number.isFinite(n)) return { values: [], error: `Bukan angka: "${r}"` };
    if (n < min || n > max)
      return { values: [], error: `Derajat ${n} di luar range ${min}–${max}` };
    nums.push(n);
  }

  // unique + sort
  const uniq = Array.from(new Set(nums)).sort((a, b) => a - b);
  return { values: uniq };
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  // SVG arc: start->end, small arc
  const start = degToRad(startDeg);
  const end = degToRad(endDeg);
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);

  const largeArcFlag = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweepFlag = endDeg > startDeg ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;
}

/** =======================
 *  FEMUR CORONAL PANEL (Distal Femur valgus cut)
 *  - Femur mechanical axis = vertical
 *  - 0° line = perpendicular to axis = horizontal baseline
 *  - Cut line = rotated from horizontal by +/- valgus depending side
 *    Right: +angle (up on lateral/right side)
 *    Left : -angle (mirror)
 *  ======================= */
function FemurPanel({
  angleDeg,
  side,
  width = 420,
  height = 320,
}: {
  angleDeg: number;
  side: Side;
  width?: number;
  height?: number;
}) {
  // coordinate system: (0,0) top-left
  const cx = width / 2;
  const yTop = 30;
  const yBottom = height - 30;

  const yCut = height * 0.65;
  const axisX = cx;

  const sign = side === "Right" ? 1 : -1;
  const theta = degToRad(angleDeg * sign);

  // Baseline horizontal line (0°)
  const baseX1 = 40;
  const baseX2 = width - 40;

  // Cut line: y = yCut - tan(theta) * (x - cx)
  const tan = Math.tan(theta);
  const cutX1 = baseX1;
  const cutX2 = baseX2;
  const cutY1 = yCut - tan * (cutX1 - cx);
  const cutY2 = yCut - tan * (cutX2 - cx);

  // Arc display near center at cut intersection
  // For convenience: arc from 0° to (angleDeg*sign) in screen coords
  // In SVG, angle 0° points to +x, and positive angle goes clockwise? Actually SVG uses y-down,
  // so standard math angles appear flipped. We'll just draw a small arc with handpicked endpoints:
  // Use our arcPath helper with start/end in degrees but accept y-down; it still looks like an arc.
  const arcR = 28;
  const arcStart = 0;
  const arcEnd = angleDeg * sign;

  const arcD =
    arcEnd >= 0
      ? arcPath(cx, yCut, arcR, arcStart, arcEnd)
      : arcPath(cx, yCut, arcR, arcEnd, arcStart);

  const medialLabel = side === "Right" ? "Medial" : "Medial";
  const lateralLabel = side === "Right" ? "Lateral" : "Lateral";
  // For Left, medial/lateral are mirrored on the image
  const leftText = side === "Right" ? medialLabel : lateralLabel;
  const rightText = side === "Right" ? lateralLabel : medialLabel;

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="font-semibold">
          Distal Femur Cut – {side} (Valgus {angleDeg}°)
        </div>
        <div className="text-xs opacity-70">Coronal plane (schematic)</div>
      </div>

      <svg width={width} height={height} className="w-full">
        {/* Axis */}
        <line x1={axisX} y1={yTop} x2={axisX} y2={yBottom} stroke="currentColor" strokeWidth={2.2} />
        <text x={axisX} y={yTop - 6} textAnchor="middle" fontSize={11} fill="currentColor">
          Femur Mechanical Axis
        </text>

        {/* Baseline 0° */}
        <line
          x1={baseX1}
          y1={yCut}
          x2={baseX2}
          y2={yCut}
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="6 6"
          opacity={0.8}
        />
        <text x={cx} y={yCut + 16} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.75}>
          0° (perpendicular)
        </text>

        {/* Cut line */}
        <line x1={cutX1} y1={cutY1} x2={cutX2} y2={cutY2} stroke="currentColor" strokeWidth={2.8} />

        {/* Arc */}
        <path d={arcD} fill="none" stroke="currentColor" strokeWidth={1.8} />
        <text x={cx + 42} y={yCut - 4} textAnchor="middle" fontSize={12} fill="currentColor">
          {angleDeg}°
        </text>

        {/* Medial/Lateral */}
        <text x={baseX1} y={height * 0.25} textAnchor="start" fontSize={11} fill="currentColor" opacity={0.85}>
          {leftText}
        </text>
        <text x={baseX2} y={height * 0.25} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.85}>
          {rightText}
        </text>
      </svg>
    </div>
  );
}

/** =======================
 *  TIBIA SAGITTAL PANEL (Posterior slope)
 *  - Tibial shaft axis = vertical
 *  - 0° line = horizontal
 *  - Posterior is on the RIGHT (screen right)
 *  - Posterior slope means posterior side is lower -> line tilts downward to the right
 *  ======================= */
function TibiaPanel({
  slopeDeg,
  side,
  width = 420,
  height = 320,
}: {
  slopeDeg: number;
  side: Side;
  width?: number;
  height?: number;
}) {
  const cx = width / 2;
  const yTop = 30;
  const yBottom = height - 30;
  const yCut = height * 0.45;

  const baseX1 = 40;
  const baseX2 = width - 40;

  // Posterior to right. Posterior slope -> right side lower => negative tilt in y-down coords.
  const theta = degToRad(slopeDeg);
  const tan = Math.tan(theta);

  // Use: y = yCut + tan(theta)*(x - cx) so that x>cx => y larger (down) => posterior lower
  const cutX1 = baseX1;
  const cutX2 = baseX2;
  const cutY1 = yCut + tan * (cutX1 - cx);
  const cutY2 = yCut + tan * (cutX2 - cx);

  // Arc between baseline (0°) and cut, shown as slopeDeg
  // Since it slopes down to the right, angle is approximately +slope in this y-down convention,
  // but we just show the label.
  const arcR = 28;
  const arcStart = 0;
  const arcEnd = slopeDeg; // display
  const arcD = arcPath(cx, yCut, arcR, arcEnd, arcStart);

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="font-semibold">
          Tibial Cut – {side} (Posterior Slope {slopeDeg}°)
        </div>
        <div className="text-xs opacity-70">Sagittal plane (schematic)</div>
      </div>

      <svg width={width} height={height} className="w-full">
        {/* Axis */}
        <line x1={cx} y1={yTop} x2={cx} y2={yBottom} stroke="currentColor" strokeWidth={2.2} />
        <text x={cx} y={yTop - 6} textAnchor="middle" fontSize={11} fill="currentColor">
          Tibia Shaft Axis
        </text>

        {/* Baseline 0° */}
        <line
          x1={baseX1}
          y1={yCut}
          x2={baseX2}
          y2={yCut}
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="6 6"
          opacity={0.8}
        />
        <text x={cx} y={yCut - 10} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.75}>
          0° (no slope)
        </text>

        {/* Cut line */}
        <line x1={cutX1} y1={cutY1} x2={cutX2} y2={cutY2} stroke="currentColor" strokeWidth={2.8} />

        {/* Arc */}
        <path d={arcD} fill="none" stroke="currentColor" strokeWidth={1.8} />
        <text x={cx + 42} y={yCut + 6} textAnchor="middle" fontSize={12} fill="currentColor">
          {slopeDeg}°
        </text>

        {/* Anterior/Posterior */}
        <text x={baseX1} y={height * 0.2} textAnchor="start" fontSize={11} fill="currentColor" opacity={0.85}>
          Anterior
        </text>
        <text x={baseX2} y={height * 0.2} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.85}>
          Posterior
        </text>
      </svg>
    </div>
  );
}

export default function TKAPlannerPage() {
  const [valgusInput, setValgusInput] = useState<string>("3,5,7,9");
  const [slopeInput, setSlopeInput] = useState<string>("3,7");

  const valgus = useMemo(() => parseDegrees(valgusInput, 0, 15), [valgusInput]);
  const slopes = useMemo(() => parseDegrees(slopeInput, 0, 15), [slopeInput]);

  const sides: Side[] = ["Right", "Left"];

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold">TKA Cut Planner (Schematic)</h1>
      <p className="mt-1 text-sm opacity-80">
        Input derajat → tampilkan skema garis untuk distal femur valgus & tibial posterior slope (Right/Left).
      </p>

      <section className="mt-4 grid gap-3 rounded-xl border p-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Valgus distal femur (comma-separated)</label>
          <input
            value={valgusInput}
            onChange={(e) => setValgusInput(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
            placeholder="contoh: 3,5,7,9"
          />
          <div className="mt-1 text-xs opacity-70">Range: 0–15° (bisa kamu ubah)</div>
          {valgus.error ? <div className="mt-1 text-sm text-red-600">{valgus.error}</div> : null}
        </div>

        <div>
          <label className="text-sm font-semibold">Posterior slope tibia (comma-separated)</label>
          <input
            value={slopeInput}
            onChange={(e) => setSlopeInput(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
            placeholder="contoh: 3,7"
          />
          <div className="mt-1 text-xs opacity-70">Range: 0–15° (bisa kamu ubah)</div>
          {slopes.error ? <div className="mt-1 text-sm text-red-600">{slopes.error}</div> : null}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">A) Distal Femur (Coronal)</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {valgus.values.length > 0 ? (
            valgus.values.flatMap((a) =>
              sides.map((s) => <FemurPanel key={`f-${a}-${s}`} angleDeg={a} side={s} />)
            )
          ) : (
            <div className="opacity-70">Masukkan nilai valgus untuk menampilkan skema.</div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">B) Tibia (Sagittal)</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {slopes.values.length > 0 ? (
            slopes.values.flatMap((a) =>
              sides.map((s) => <TibiaPanel key={`t-${a}-${s}`} slopeDeg={a} side={s} />)
            )
          ) : (
            <div className="opacity-70">Masukkan nilai slope untuk menampilkan skema.</div>
          )}
        </div>
      </section>

      <footer className="mt-10 text-xs opacity-70">
        Catatan: Ini skema edukasi (garis & derajat), bukan pengganti planning klinis berbasis citra/DICOM.
      </footer>
    </main>
  );
}
