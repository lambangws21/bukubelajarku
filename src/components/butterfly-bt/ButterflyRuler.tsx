"use client";

import { motion } from "framer-motion";

type Props = {
  size: number; // px
  rotationDeg: number; // applied by parent
  opacity?: number;
};

function tickLen(deg: number): number {
  const a = Math.abs(deg);
  if (a === 0) return 120;
  if (a % 5 === 0) return 88;
  return 64;
}

function tickWidth(deg: number): number {
  const a = Math.abs(deg);
  if (a === 0) return 5;
  if (a % 5 === 0) return 4;
  return 2;
}

export default function ButterflyRuler({ size, rotationDeg, opacity = 0.9 }: Props) {
  const half = size / 2;

  const ticks = Array.from({ length: 31 }, (_, i) => i - 15); // -15..15

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
      style={{ opacity }}
      animate={{ rotate: rotationDeg }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
    >
      {/* center */}
      <circle cx={half} cy={half} r={10} fill="rgba(255,255,255,0.95)" />
      <circle cx={half} cy={half} r={4} fill="rgba(0,0,0,0.55)" />

      {/* “butterfly” outline (simple symmetric) */}
      <path
        d={`
          M ${half} ${half - 210}
          C ${half - 140} ${half - 140}, ${half - 180} ${half - 20}, ${half - 210} ${half + 60}
          C ${half - 150} ${half + 40}, ${half - 70} ${half + 20}, ${half} ${half + 10}
          C ${half + 70} ${half + 20}, ${half + 150} ${half + 40}, ${half + 210} ${half + 60}
          C ${half + 180} ${half - 20}, ${half + 140} ${half - 140}, ${half} ${half - 210}
          Z
        `}
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={2}
      />

      {/* 0° midline */}
      <line
        x1={half}
        y1={half - 220}
        x2={half}
        y2={half + 220}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* ticks */}
      {ticks.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const len = tickLen(deg);
        const w = tickWidth(deg);

        // start from center, go outward
        const x2 = half + Math.sin(rad) * len;
        const y2 = half - Math.cos(rad) * len;

        return (
          <g key={deg}>
            <line
              x1={half}
              y1={half}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={w}
              strokeLinecap="round"
            />
            {(Math.abs(deg) === 15 || Math.abs(deg) === 10 || Math.abs(deg) === 5 || deg === 0) && (
              <text
                x={half + Math.sin(rad) * (len + 18)}
                y={half - Math.cos(rad) * (len + 18)}
                fontSize={14}
                fill="rgba(255,255,255,0.9)"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {deg === 0 ? "0" : Math.abs(deg).toString()}
              </text>
            )}
          </g>
        );
      })}

      {/* labels */}
      <text
        x={half - 170}
        y={half + 190}
        fontSize={16}
        fill="rgba(255,255,255,0.9)"
        textAnchor="middle"
      >
        VARUS
      </text>
      <text
        x={half + 170}
        y={half + 190}
        fontSize={16}
        fill="rgba(255,255,255,0.9)"
        textAnchor="middle"
      >
        VALGUS
      </text>
    </motion.svg>
  );
}
