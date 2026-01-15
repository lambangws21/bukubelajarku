"use client";

import { motion } from "framer-motion";
import { useId, useMemo, useState } from "react";

type Props = {
  size?: number;          // ukuran px komponen (default 520)
  initialRotateDeg?: number;
  showControls?: boolean;
};

type Pt = { x: number; y: number };

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(0);
}

export default function TriangleRulerBT({
  size = 520,
  initialRotateDeg = 0,
  showControls = true,
}: Props) {
  const [rotate, setRotate] = useState<number>(initialRotateDeg);

  // SVG coordinate system
  const W = 800;
  const H = 800;

  // Triangle points (right triangle like the photo)
  const A: Pt = { x: 80, y: 720 };  // bottom-left
  const B: Pt = { x: 720, y: 720 }; // bottom-right (right angle corner)
  const C: Pt = { x: 720, y: 80 };  // top-right

  // Grid spacing in SVG units (looks like mm grid)
  const gridStep = 40; // adjust for denser/sparser

  // Tick config (mm-like)
  const tickMinor = 10;
  const tickMajor = 50;

  // Protractor config
  const proCenter: Pt = { x: 350, y: 470 };
  const proR = 140;


  const uid = useId();
  const clipId = `clip_${uid.replace(/:/g, "")}`;

  const ticksBottom = useMemo(() => {
    const len = B.x - A.x;
    const count = Math.floor(len / tickMinor);
    return range(count + 1).map((i) => {
      const x = A.x + i * tickMinor;
      const major = (i * tickMinor) % tickMajor === 0;
      return { x, major, label: major ? i * tickMinor : null };
    });
  }, [A.x, B.x]);

  const ticksRight = useMemo(() => {
    const len = B.y - C.y;
    const count = Math.floor(len / tickMinor);
    return range(count + 1).map((i) => {
      const y = B.y - i * tickMinor;
      const major = (i * tickMinor) % tickMajor === 0;
      return { y, major, label: major ? i * tickMinor : null };
    });
  }, [B.y, C.y]);

  const proTicks = useMemo(() => {
    // semicircle 0..180
    const degs = range(19).map((i) => i * 10); // every 10°
    return degs.map((deg) => {
      const rad = (deg * Math.PI) / 180;
      // semicircle opens to the left like common triangle rulers
      const x = proCenter.x - Math.cos(rad) * proR;
      const y = proCenter.y - Math.sin(rad) * proR;
      const inner = {
        x: proCenter.x - Math.cos(rad) * (proR - 16),
        y: proCenter.y - Math.sin(rad) * (proR - 16),
      };
      const label = deg % 30 === 0 ? `${deg}` : null;
      return { deg, x, y, inner, label };
    });
  }, [proCenter.x, proCenter.y, proR]);

  return (
    <div className="w-full">
      {showControls && (
        <div className="mb-3 flex items-center gap-3">
          <div className="text-sm text-zinc-200">Rotate</div>
          <input
            type="range"
            min={-180}
            max={180}
            value={rotate}
            onChange={(e) => setRotate(Number(e.target.value))}
            className="w-full"
          />
          <div className="w-14 text-right text-sm text-zinc-200">
            {rotate}°
          </div>
        </div>
      )}

      <motion.div
        className="relative mx-auto"
        style={{ width: size, height: size }}
        drag
        dragMomentum={false}
        initial={{ rotate: 0, scale: 1 }}
        animate={{ rotate }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="select-none"
        >
          {/* ===== background ===== */}
          <defs>
            <clipPath id={clipId}>
              <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} />
            </clipPath>

            {/* subtle plastic look */}
            <linearGradient id="plastic" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
            </linearGradient>
          </defs>

          {/* triangle body */}
          <polygon
            points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
            fill="url(#plastic)"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={3}
          />

          {/* ===== grid inside (clipped) ===== */}
          <g clipPath={`url(#${clipId})`} opacity={0.55}>
            {/* vertical grid */}
            {range(Math.floor((B.x - A.x) / gridStep) + 1).map((i) => {
              const x = A.x + i * gridStep;
              return (
                <line
                  key={`gv_${i}`}
                  x1={x}
                  y1={C.y}
                  x2={x}
                  y2={A.y}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={1}
                />
              );
            })}
            {/* horizontal grid */}
            {range(Math.floor((A.y - C.y) / gridStep) + 1).map((i) => {
              const y = A.y - i * gridStep;
              return (
                <line
                  key={`gh_${i}`}
                  x1={A.x}
                  y1={y}
                  x2={B.x}
                  y2={y}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={1}
                />
              );
            })}
          </g>

          {/* ===== red L reference lines (like photo) ===== */}
          <line
            x1={A.x + 18}
            y1={A.y - 18}
            x2={B.x - 18}
            y2={B.y - 18}
            stroke="rgba(255,80,80,0.9)"
            strokeWidth={6}
            strokeLinecap="round"
          />
          <line
            x1={B.x - 18}
            y1={B.y - 18}
            x2={C.x - 18}
            y2={C.y + 18}
            stroke="rgba(255,80,80,0.9)"
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* ===== bottom scale (mm ticks) ===== */}
          <g>
            {ticksBottom.map((t, idx) => {
              const y1 = A.y;
              const y2 = A.y - (t.major ? 22 : 12);
              return (
                <g key={`bt_${idx}`}>
                  <line
                    x1={t.x}
                    y1={y1}
                    x2={t.x}
                    y2={y2}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={t.major ? 2.2 : 1.2}
                  />
                  {t.label !== null && (
                    <text
                      x={t.x}
                      y={A.y + 26}
                      fontSize={14}
                      fill="rgba(255,255,255,0.85)"
                      textAnchor="middle"
                    >
                      {fmt(t.label)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ===== right scale (mm ticks) ===== */}
          <g>
            {ticksRight.map((t, idx) => {
              const x1 = B.x;
              const x2 = B.x - (t.major ? 22 : 12);
              return (
                <g key={`rt_${idx}`}>
                  <line
                    x1={x1}
                    y1={t.y}
                    x2={x2}
                    y2={t.y}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={t.major ? 2.2 : 1.2}
                  />
                  {t.label !== null && (
                    <text
                      x={B.x + 26}
                      y={t.y + 5}
                      fontSize={14}
                      fill="rgba(255,255,255,0.85)"
                      textAnchor="start"
                    >
                      {fmt(t.label)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ===== protractor (like the photo center arc) ===== */}
          <g clipPath={`url(#${clipId})`}>
            {/* arc */}
            <path
              d={`
                M ${proCenter.x - proR} ${proCenter.y}
                A ${proR} ${proR} 0 0 1 ${proCenter.x + proR} ${proCenter.y}
              `}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={3}
            />

            {/* baseline */}
            <line
              x1={proCenter.x - proR}
              y1={proCenter.y}
              x2={proCenter.x + proR}
              y2={proCenter.y}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={2}
            />

            {/* ticks */}
            {proTicks.map((t) => (
              <g key={`p_${t.deg}`}>
                <line
                  x1={t.x}
                  y1={t.y}
                  x2={t.inner.x}
                  y2={t.inner.y}
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth={t.deg % 30 === 0 ? 2.2 : 1.2}
                />
                {t.label && (
                  <text
                    x={lerp(t.x, proCenter.x, 0.14)}
                    y={lerp(t.y, proCenter.y, 0.14)}
                    fontSize={12}
                    fill="rgba(255,255,255,0.85)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {t.label}
                  </text>
                )}
              </g>
            ))}

            {/* center mark */}
            <circle
              cx={proCenter.x}
              cy={proCenter.y}
              r={6}
              fill="rgba(255,255,255,0.9)"
            />
          </g>

          {/* brand-ish tiny text */}
          <text
            x={540}
            y={560}
            fontSize={16}
            fill="rgba(255,255,255,0.55)"
          >
            Scala BT
          </text>
        </svg>
      </motion.div>

      <div className="mt-3 text-xs text-zinc-400">
        Drag untuk pindah posisi • Geser slider untuk rotate
      </div>
    </div>
  );
}
