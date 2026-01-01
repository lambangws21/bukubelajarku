"use client";

import { useState } from "react";
import { Point } from "./geometry";
import { STEM_LIBRARY } from "./implantData";

/* ================= TYPES ================= */

export type MeasurementKind =
  | "HEAD"
  | "OFFSET"
  | "CANAL_PROX"
  | "CANAL_DIST";

export type Measurement = {
  id: string;
  kind: MeasurementKind;
  p1: Point;
  p2: Point;
  locked: boolean;
};


export type LLDPlan = {
    pelvic: { p1: Point; p2: Point } | null;
    left?: Point;
    right?: Point;
  };



  
export type Calibration = {
  mmPerPixel: number;
};

export type CupPlan = {
  center: Point;
  sizeMm: number;          // diameter
  inclinationDeg: number;
  anteversionDeg: number;
};

export type StemPlan = {
  size: number;
  stemLengthMm: number;
};

export type HistoryState = {
  measurements: Measurement[];
  stemPlan: StemPlan | null;
  cupPlan: CupPlan | null;
};

type DragMode = "P1" | "P2" | null;

/* ================= HOOK ================= */

export function useSmartHip() {
  /* ===== VIEW ===== */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  /* ===== DATA ===== */
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [axis, setAxis] =
    useState<{ p1: Point; p2: Point } | null>(null);

  const [calibration, setCalibration] =
    useState<Calibration | null>(null);

  const [measurements, setMeasurements] =
    useState<Measurement[]>([]);

  const [cupPlan, setCupPlan] =
    useState<CupPlan | null>(null);

  const [stemPlan, setStemPlan] =
    useState<StemPlan | null>(null);

  /* ===== INTERACTION ===== */
  const [activeId, setActiveId] =
    useState<string | null>(null);

  const [dragMode, setDragMode] =
    useState<DragMode>(null);

  /* ===== HISTORY ===== */
  const [undoStack, setUndoStack] =
    useState<HistoryState[]>([]);

  const [redoStack, setRedoStack] =
    useState<HistoryState[]>([]);

    const [lld, setLLD] = useState<LLDPlan>({
        pelvic: null,
      });
      



  /* ===== LAYERS ===== */
  const [layers, setLayers] = useState({
    XRAY: true,
    REFERENCE: true,
    MEASUREMENT: true,
    LLD: true,
    IMPLANT_STEM: true,
    IMPLANT_CUP: true,
  });

  /* ================= INTERNAL ================= */

  function pushHistory() {
    setUndoStack(stack => [
      ...stack,
      {
        measurements: structuredClone(measurements),
        stemPlan: structuredClone(stemPlan),
        cupPlan: structuredClone(cupPlan),
      },
    ]);
    setRedoStack([]);
  }

  /* ================= ACTIONS ================= */

  function toggleLayer(id: keyof typeof layers) {
    setLayers(l => ({ ...l, [id]: !l[id] }));
  }

  function loadXray(file: File) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => setImage(img);
  }

  function setFemoralAxis(p1: Point, p2: Point) {
    pushHistory();
    setAxis({ p1, p2 });
  }

  function setCalibrationFromMarker(
    pixelLength: number,
    realMm = 100
  ) {
    if (pixelLength <= 0) return;
    setCalibration({
      mmPerPixel: realMm / pixelLength,
    });
  }

  function addMeasurement(
    kind: MeasurementKind,
    p1: Point,
    p2: Point
  ) {
    pushHistory();
    setMeasurements(m => [
      ...m,
      {
        id: crypto.randomUUID(),
        kind,
        p1,
        p2,
        locked: false,
      },
    ]);
  }

  function updateMeasurement(
    id: string,
    p1: Point,
    p2: Point
  ) {
    setMeasurements(m =>
      m.map(x => (x.id === id ? { ...x, p1, p2 } : x))
    );
  }

  function computeLLD(
    left: Point,
    right: Point,
    pelvicY: number,
    mmPerPixel: number
  ) {
    const dLeft = left.y - pelvicY;
    const dRight = right.y - pelvicY;
  
    return (dRight - dLeft) * mmPerPixel;
  }
  

  function lockMeasurement(id: string) {
    pushHistory();
    setMeasurements(m =>
      m.map(x =>
        x.id === id ? { ...x, locked: true } : x
      )
    );
  }

  /* ================= CUP ================= */

  function initCupPlan(center: Point) {
    pushHistory();
    setCupPlan({
      center,
      sizeMm: 52,
      inclinationDeg: 40,
      anteversionDeg: 15,
    });
  }

  /* ================= STEM AUTO SIZE ================= */

  function autoSizeStemFromCanal() {
    if (!calibration) return;

    const distal = measurements.find(
      m => m.kind === "CANAL_DIST"
    );
    if (!distal) return;

    const canalMm =
      Math.hypot(
        distal.p2.x - distal.p1.x,
        distal.p2.y - distal.p1.y
      ) * calibration.mmPerPixel;

    const best = STEM_LIBRARY.reduce((p, c) =>
      Math.abs(c.distalCanal - canalMm) <
      Math.abs(p.distalCanal - canalMm)
        ? c
        : p
    );

    pushHistory();
    setStemPlan({
      size: best.size,
      stemLengthMm: best.stemLength,
    });
  }

  /* ================= UNDO / REDO ================= */

  function undo() {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;

      const prev = stack[stack.length - 1];

      setRedoStack(r => [
        ...r,
        {
          measurements: structuredClone(measurements),
          stemPlan: structuredClone(stemPlan),
          cupPlan: structuredClone(cupPlan),
        },
      ]);

      setMeasurements(prev.measurements);
      setStemPlan(prev.stemPlan);
      setCupPlan(prev.cupPlan);

      return stack.slice(0, -1);
    });
  }

  function redo() {
    setRedoStack(stack => {
      if (stack.length === 0) return stack;

      const next = stack[stack.length - 1];

      setUndoStack(u => [
        ...u,
        {
          measurements: structuredClone(measurements),
          stemPlan: structuredClone(stemPlan),
          cupPlan: structuredClone(cupPlan),
        },
      ]);

      setMeasurements(next.measurements);
      setStemPlan(next.stemPlan);
      setCupPlan(next.cupPlan);

      return stack.slice(0, -1);
    });
  }

  /* ================= EXPORT ================= */

  return {
    /* view */
    zoom,
    setZoom,
    offset,
    setOffset,

    /* data */
    image,
    axis,
    calibration,
    measurements,
    cupPlan,
    stemPlan,
    layers,

    /* interaction */
    activeId,
    dragMode,
    setActiveId,
    setDragMode,

    /* actions */
    loadXray,
    setFemoralAxis,
    setCalibrationFromMarker,
    addMeasurement,
    updateMeasurement,
    lockMeasurement,
    initCupPlan,
    setCupPlan,
    autoSizeStemFromCanal,
    toggleLayer,

    /* history */
    undo,
    redo,

    lld,
setLLD,

  };
}
