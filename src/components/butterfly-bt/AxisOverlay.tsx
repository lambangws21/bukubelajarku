"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { AxisKey, Axes, Point } from "./types";
import { angleOfAxis, clamp, dist, midPoint, radToDeg } from "./geometry";
import { useDragPoint } from "./useDragPoint";

type Props = {
  width: number;
  height: number;
  axes: Axes;
  onChange: (key: AxisKey, axis: { a: Point; b: Point }) => void;
  activeKey: AxisKey;
  setActiveKey: (k: AxisKey) => void;
};

function Handle({
  p,
  color,
  onDrag,
  width,
  height,
  label,
}: {
  p: Point;
  color: string;
  onDrag: (next: Point) => void;
  width: number;
  height: number;
  label: string;
}) {
  const drag = useDragPoint((next) => {
    onDrag({
      x: clamp(next.x, 0, width),
      y: clamp(next.y, 0, height),
    });
  });

  return (
    <g>
      <circle
        cx={p.x}
        cy={p.y}
        r={10}
        fill={color}
        opacity={0.95}
        onPointerDown={(e) => {
          drag.onPointerDown(e);
          drag.bindStartValue(p);
        }}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        style={{ cursor: "grab", touchAction: "none" }}
      />
      <text
        x={p.x + 14}
        y={p.y - 12}
        fontSize={12}
        fill="white"
        opacity={0.9}
      >
        {label}
      </text>
    </g>
  );
}

export default function AxisOverlay({
  width,
  height,
  axes,
  onChange,
  activeKey,
  setActiveKey,
}: Props) {
  const femurAngle = angleOfAxis(axes.femur);
  const tibiaAngle = angleOfAxis(axes.tibia);

  const femurLen = useMemo(() => dist(axes.femur.a, axes.femur.b), [axes.femur]);
  const tibiaLen = useMemo(() => dist(axes.tibia.a, axes.tibia.b), [axes.tibia]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0"
      style={{ touchAction: "none" }}
    >
      {/* clickable area */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="transparent"
        onPointerDown={() => {
          // click background toggles active axis
          setActiveKey(activeKey === "femur" ? "tibia" : "femur");
        }}
      />

      {/* Femur line */}
      <motion.line
        x1={axes.femur.a.x}
        y1={axes.femur.a.y}
        x2={axes.femur.b.x}
        y2={axes.femur.b.y}
        stroke={activeKey === "femur" ? "rgb(34 197 94)" : "rgb(16 185 129)"}
        strokeWidth={4}
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: activeKey === "femur" ? 1 : 0.75 }}
      />
      {/* Tibia line */}
      <motion.line
        x1={axes.tibia.a.x}
        y1={axes.tibia.a.y}
        x2={axes.tibia.b.x}
        y2={axes.tibia.b.y}
        stroke={activeKey === "tibia" ? "rgb(59 130 246)" : "rgb(99 102 241)"}
        strokeWidth={4}
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: activeKey === "tibia" ? 1 : 0.75 }}
      />

      {/* Handles */}
      <Handle
        p={axes.femur.a}
        color={activeKey === "femur" ? "rgb(34 197 94)" : "rgb(16 185 129)"}
        label="Femur A"
        width={width}
        height={height}
        onDrag={(next) => onChange("femur", { ...axes.femur, a: next })}
      />
      <Handle
        p={axes.femur.b}
        color={activeKey === "femur" ? "rgb(34 197 94)" : "rgb(16 185 129)"}
        label="Femur B"
        width={width}
        height={height}
        onDrag={(next) => onChange("femur", { ...axes.femur, b: next })}
      />

      <Handle
        p={axes.tibia.a}
        color={activeKey === "tibia" ? "rgb(59 130 246)" : "rgb(99 102 241)"}
        label="Tibia A"
        width={width}
        height={height}
        onDrag={(next) => onChange("tibia", { ...axes.tibia, a: next })}
      />
      <Handle
        p={axes.tibia.b}
        color={activeKey === "tibia" ? "rgb(59 130 246)" : "rgb(99 102 241)"}
        label="Tibia B"
        width={width}
        height={height}
        onDrag={(next) => onChange("tibia", { ...axes.tibia, b: next })}
      />

      {/* HUD */}
      {(() => {
        const fMid = midPoint(axes.femur.a, axes.femur.b);
        const tMid = midPoint(axes.tibia.a, axes.tibia.b);
        return (
          <>
            <text x={fMid.x + 10} y={fMid.y + 6} fontSize={12} fill="white">
              Femur: {radToDeg(femurAngle).toFixed(1)}°
              {femurLen < 50 ? " (pendek)" : ""}
            </text>
            <text x={tMid.x + 10} y={tMid.y + 6} fontSize={12} fill="white">
              Tibia: {radToDeg(tibiaAngle).toFixed(1)}°
              {tibiaLen < 50 ? " (pendek)" : ""}
            </text>
          </>
        );
      })()}
    </svg>
  );
}
