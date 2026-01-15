"use client";

import { useId } from "react";

type Props = {
  // REAL SIZE (mm)
  wingHalfMm?: number;   // setengah panjang sisi atas dari tengah ke ujung (default 120mm => total 240mm)
  heightMm?: number;     // tinggi dari sisi atas ke ujung bawah (default 120mm)
  marginMm?: number;     // ruang untuk angka/tick (default 10mm)

  // Scale config (cm numbers like the photo: 0..11 on top)
  topCmMax?: number;     // default 11
  cmPerMm?: number;      // default 10mm per 1cm
};

type Pt = { x: number; y: number };

type TickKind = "minor" | "mid" | "major";

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function kindByMm(mm: number): TickKind {
  if (mm % 10 === 0) return "major";
  if (mm % 5 === 0) return "mid";
  return "minor";
}

function tickLen(kind: TickKind): number {
  if (kind === "major") return 4.2;
  if (kind === "mid") return 3.2;
  return 2.2;
}

function tickStroke(kind: TickKind): number {
  if (kind === "major") return 0.35;
  if (kind === "mid") return 0.25;
  return 0.18;
}

export default function ButterflyRulerReal({
  wingHalfMm = 120, // total top width 240mm (mirip foto)
  heightMm = 120,
  marginMm = 10,
  topCmMax = 11,
  cmPerMm = 10,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const clipId = `clip_bfly_${uid}`;

  // Canvas (mm)
  const W = wingHalfMm * 2 + marginMm * 2;
  const H = heightMm + marginMm * 2;

  // Butterfly geometry (a wide "V" with symmetry)
  // Top line from left to right (slightly angled wings feel)
  const topY = marginMm;
  const centerX = marginMm + wingHalfMm;
  const leftX = marginMm;
  const rightX = marginMm + wingHalfMm * 2;

  // Bottom apex
  const apex: Pt = { x: centerX, y: marginMm + heightMm };

  // Wing corners (top edge)
  const L: Pt = { x: leftX, y: topY + 8 };   // sedikit turun biar “wing”
  const R: Pt = { x: rightX, y: topY + 8 };

  // Inner corners (untuk bikin bentuk “butterfly” lebih real)
  const L2: Pt = { x: centerX - wingHalfMm * 0.62, y: topY };
  const R2: Pt = { x: centerX + wingHalfMm * 0.62, y: topY };

  // Outline polygon: L -> L2 -> R2 -> R -> apex -> back to L
  const outline = [L, L2, R2, R, apex];

  // Grid settings (mm)
  const gridMinor = 5;
  const gridMajor = 10;

  // Protractor (center)
  const proCx = centerX;
  const proCy = topY + heightMm * 0.58;
  const proR = Math.min(wingHalfMm * 0.62, heightMm * 0.46);

  // Top scale ticks (across entire top width)
  const topWidthMm = wingHalfMm * 2;
  const topTicksMm = Array.from({ length: topWidthMm + 1 }, (_, i) => i); // 0..topWidthMm

  // “cm numbers” like photo: 0 at center, then 1..topCmMax outward both sides
  const cmMarks = Array.from({ length: topCmMax + 1 }, (_, i) => i); // 0..11

  // Side scales along left and right edges (apex to wing corners)
  // We'll place ticks by projecting along the edge direction.
  function edgeTicks(edgeStart: Pt, edgeEnd: Pt, mmStep = 1) {
    const dx = edgeEnd.x - edgeStart.x;
    const dy = edgeEnd.y - edgeStart.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const count = Math.floor(len / mmStep);
    return Array.from({ length: count + 1 }, (_, i) => {
      const t = (i * mmStep) / len;
      return {
        mm: i * mmStep,
        x: edgeStart.x + ux * (i * mmStep),
        y: edgeStart.y + uy * (i * mmStep),
        ux,
        uy,
        len,
      };
    });
  }

  const leftEdge = edgeTicks(L, apex, 1);
  const rightEdge = edgeTicks(R, apex, 1);

  // Helper: perpendicular outward for edge ticks
  function perpOut(ux: number, uy: number, side: "left" | "right") {
    // perp ( -uy, ux ) gives left-normal of direction.
    const px = -uy;
    const py = ux;
    // decide outward: for left edge, outward is left-normal; for right edge, outward is right-normal
    const s = side === "left" ? 1 : -1;
    return { px: px * s, py: py * s };
  }

  return (
    <div className="w-full">
      {/* SVG in mm for printing 1:1 */}
      <svg width={`${W}mm`} height={`${H}mm`} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <clipPath id={clipId}>
            <polygon
              points={outline.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          </clipPath>

          <linearGradient id={`plastic_${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.24)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
        </defs>

        {/* Body */}
        <polygon
          points={outline.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={`url(#plastic_${uid})`}
          stroke="rgba(255,255,255,0.70)"
          strokeWidth={0.7}
        />

        {/* Inner grid (clipped) */}
        <g clipPath={`url(#${clipId})`} opacity={0.55}>
          {/* vertical */}
          {Array.from({ length: Math.floor(topWidthMm / gridMinor) + 1 }, (_, k) => k * gridMinor).map((mm) => {
            const x = leftX + mm + marginMm;
            const major = mm % gridMajor === 0;
            return (
              <line
                key={`gv_${mm}`}
                x1={x}
                y1={topY}
                x2={x}
                y2={apex.y}
                stroke="rgba(255,255,255,0.38)"
                strokeWidth={major ? 0.22 : 0.14}
              />
            );
          })}
          {/* horizontal */}
          {Array.from({ length: Math.floor(heightMm / gridMinor) + 1 }, (_, k) => k * gridMinor).map((mm) => {
            const y = topY + mm;
            const major = mm % gridMajor === 0;
            return (
              <line
                key={`gh_${mm}`}
                x1={leftX}
                y1={y}
                x2={rightX}
                y2={y}
                stroke="rgba(255,255,255,0.38)"
                strokeWidth={major ? 0.22 : 0.14}
              />
            );
          })}
        </g>

        {/* Red V borders like photo */}
        <line
          x1={L.x + 2}
          y1={L.y + 2}
          x2={apex.x}
          y2={apex.y - 2}
          stroke="rgba(255,80,80,0.92)"
          strokeWidth={1.7}
          strokeLinecap="round"
        />
        <line
          x1={R.x - 2}
          y1={R.y + 2}
          x2={apex.x}
          y2={apex.y - 2}
          stroke="rgba(255,80,80,0.92)"
          strokeWidth={1.7}
          strokeLinecap="round"
        />

        {/* ===== Top scale ticks (mm) ===== */}
        <g>
          {topTicksMm.map((mm) => {
            const k = kindByMm(mm);
            const x = marginMm + mm;
            const y1 = topY + 8; // align with wing top
            const y2 = y1 + tickLen(k);

            return (
              <line
                key={`tt_${mm}`}
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={tickStroke(k)}
              />
            );
          })}

          {/* cm numbers: 0 at center, 1..11 to left and right */}
          {cmMarks.map((cm) => {
            const dx = cm * cmPerMm;

            const xRight = centerX + dx;
            const xLeft = centerX - dx;

            // keep inside canvas
            if (xRight > rightX) return null;

            return (
              <g key={`cm_${cm}`}>
                <text
                  x={xRight}
                  y={topY + 6}
                  fontSize={4}
                  fill="rgba(255,255,255,0.92)"
                  textAnchor="middle"
                >
                  {cm}
                </text>
                {cm !== 0 && (
                  <text
                    x={xLeft}
                    y={topY + 6}
                    fontSize={4}
                    fill="rgba(255,255,255,0.92)"
                    textAnchor="middle"
                  >
                    {cm}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ===== Left edge ticks + numbers (cm-like 0..11) ===== */}
        <g>
          {leftEdge.map((t) => {
            const k = kindByMm(t.mm);
            const { px, py } = perpOut(t.ux, t.uy, "left");
            const len = tickLen(k);

            const x1 = t.x;
            const y1 = t.y;
            const x2 = t.x + px * len;
            const y2 = t.y + py * len;

            // label only each 10mm -> cm
            const isMajor = k === "major";
            const cm = t.mm / 10;

            return (
              <g key={`le_${t.mm}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={tickStroke(k)}
                />
                {isMajor && cm <= topCmMax && (
                  <text
                    x={x2 + px * 2.5}
                    y={y2 + py * 2.5}
                    fontSize={4}
                    fill="rgba(255,255,255,0.92)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${Math.atan2(t.uy, t.ux) * 180 / Math.PI + 90}, ${x2}, ${y2})`}
                  >
                    {cm}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ===== Right edge ticks + numbers ===== */}
        <g>
          {rightEdge.map((t) => {
            const k = kindByMm(t.mm);
            const { px, py } = perpOut(t.ux, t.uy, "right");
            const len = tickLen(k);

            const x1 = t.x;
            const y1 = t.y;
            const x2 = t.x + px * len;
            const y2 = t.y + py * len;

            const isMajor = k === "major";
            const cm = t.mm / 10;

            return (
              <g key={`re_${t.mm}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={tickStroke(k)}
                />
                {isMajor && cm <= topCmMax && (
                  <text
                    x={x2 + px * 2.5}
                    y={y2 + py * 2.5}
                    fontSize={4}
                    fill="rgba(255,255,255,0.92)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${Math.atan2(t.uy, t.ux) * 180 / Math.PI - 90}, ${x2}, ${y2})`}
                  >
                    {cm}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ===== Protractor (semi-circle) ===== */}
        <g clipPath={`url(#${clipId})`}>
          {/* arc */}
          <path
            d={`
              M ${proCx - proR} ${proCy}
              A ${proR} ${proR} 0 0 1 ${proCx + proR} ${proCy}
            `}
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth={0.7}
          />

          {/* baseline */}
          <line
            x1={proCx - proR}
            y1={proCy}
            x2={proCx + proR}
            y2={proCy}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={0.45}
          />

          {Array.from({ length: 181 }, (_, d) => d).map((deg) => {
            const major = deg % 10 === 0;
            const superMajor = deg % 30 === 0;

            const rad = (deg * Math.PI) / 180;
            const x = proCx - Math.cos(rad) * proR;
            const y = proCy - Math.sin(rad) * proR;

            const innerR = proR - (superMajor ? 7 : major ? 5 : 3.5);
            const xi = proCx - Math.cos(rad) * innerR;
            const yi = proCy - Math.sin(rad) * innerR;

            const labelR = proR - 16;
            const xl = proCx - Math.cos(rad) * labelR;
            const yl = proCy - Math.sin(rad) * labelR;

            if (!major) {
              return (
                <line
                  key={`pd_${deg}`}
                  x1={x}
                  y1={y}
                  x2={xi}
                  y2={yi}
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth={0.16}
                />
              );
            }

            return (
              <g key={`pd_${deg}`}>
                <line
                  x1={x}
                  y1={y}
                  x2={xi}
                  y2={yi}
                  stroke="rgba(255,255,255,0.82)"
                  strokeWidth={superMajor ? 0.42 : 0.28}
                />
                {superMajor && (
                  <text
                    x={xl}
                    y={yl}
                    fontSize={4}
                    fill="rgba(255,255,255,0.9)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {deg}
                  </text>
                )}
              </g>
            );
          })}

          <circle cx={proCx} cy={proCy} r={1.2} fill="rgba(255,255,255,0.95)" />
        </g>

        {/* no brand/logo — just neutral label */}
        <text
          x={centerX}
          y={proCy + 18}
          fontSize={5}
          fill="rgba(255,255,255,0.55)"
          textAnchor="middle"
        >
          Butterfly-style ruler (print template)
        </text>
      </svg>
    </div>
  );
}
