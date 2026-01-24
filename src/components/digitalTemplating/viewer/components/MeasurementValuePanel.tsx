"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeftRight,
  ArrowUpDown,
  Bone,
  Crosshair,
  ChevronDown,
  Eye,
  EyeOff,
  Grab,
  Lock,
  MessageSquareText,
  Pencil,
  PenLine,
  PenTool,
  Ruler,
  Scissors,
  Trash,
  TrendingUp,
  Triangle,
  Unlock,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type {
  CutoutRect,
  FreehandStroke,
  MeasurementRow,
  PointFillMode,
  Side,
  TibialCutLine,
  TibialSlopeLine,
  ValgusCutLine,
} from "../types";

export type MeasurementValuePanelProps = {
  mobileDocked: boolean;
  panelRef: React.RefObject<HTMLDivElement>;
  panelPos: { x: number; y: number };
  onPanelPointerMove: (e: React.PointerEvent) => void;
  onPanelPointerUp: (e: React.PointerEvent) => void;
  onPanelPointerDown: (e: React.PointerEvent) => void;
  onInteract: () => void;
  onClose: () => void;
  minimized: boolean;
  canMinimize: boolean;
  onToggleMinimized: () => void;

  rulerMode: boolean;
  toggleRulerMode: () => void;
  lldMode: boolean;
  toggleLldMode: () => void;
  offsetMode: boolean;
  toggleOffsetMode: () => void;
  angleMode: boolean;
  toggleAngleMode: () => void;
  ahkaMode: boolean;
  toggleAhkaMode: () => void;
  drawMode: boolean;
  onToggleDrawMode: () => void;
  traceMode: boolean;
  toggleTraceMode: () => void;
  pencilMode: boolean;
  togglePencilMode: () => void;
  corMode: boolean;
  toggleCorMode: () => void;
  annotationMode: boolean;
  toggleAnnotationMode: () => void;
  cutout: CutoutRect | null;
  cutoutMode: boolean;
  cutoutShape: "rect" | "circle" | "polygon";
  onToggleCutoutMode: () => void;
  onClearCutout: () => void;
  onSetCutoutOpacity: (opacity: number) => void;
  onSetCutoutShape: (shape: "rect" | "circle" | "polygon") => void;
  onCreateCutoutOverlay: () => void;
  onCopyCutoutFromCanvas: () => void;
  onCopyCutoutFromItem: () => void;
  onCutCutoutFromItem: () => void;
  canCopyCutoutFromItem: boolean;

  measurementRows: MeasurementRow[];
  measurementTotalLabel: string | null;
  removeMeasurement: (id: string) => void;
  toggleMeasurementLock: (id: string) => void;
  toggleMeasurementHidden: (id: string) => void;
  clearMeasurements: () => void;

  lldRows: MeasurementRow[];
  removeLldMeasurement: (id: string) => void;
  toggleLldLock: (id: string) => void;
  toggleLldHidden: (id: string) => void;
  clearLldMeasurements: () => void;

  offsetRows: MeasurementRow[];
  removeOffsetMeasurement: (id: string) => void;
  toggleOffsetLock: (id: string) => void;
  toggleOffsetHidden: (id: string) => void;
  clearOffsetMeasurements: () => void;

  angleRows: MeasurementRow[];
  removeAngleMeasurement: (id: string) => void;
  toggleAngleLock: (id: string) => void;
  toggleAngleHidden: (id: string) => void;
  clearAngles: () => void;

  ahkaRows: MeasurementRow[];
  removeAhkaMeasurement: (id: string) => void;
  toggleAhkaLock: (id: string) => void;
  toggleAhkaHidden: (id: string) => void;
  clearAhka: () => void;

  drawLinesRows: MeasurementRow[];
  drawLinesTotalLabel: string | null;
  removeDrawLine: (id: string) => void;
  toggleDrawLineLock: (id: string) => void;
  toggleDrawLineHidden: (id: string) => void;
  clearDrawLines: () => void;

  traceRows: MeasurementRow[];
  pencilRows: MeasurementRow[];
  corRows: MeasurementRow[];
  removeStroke: (id: string) => void;
  toggleStrokeLock: (id: string) => void;
  toggleStrokeHidden: (id: string) => void;
  clearStrokesByKind: (kind: FreehandStroke["kind"]) => void;
  removeCorMarker: (id: string) => void;
  toggleCorLock: (id: string) => void;
  toggleCorHidden: (id: string) => void;
  clearCorMarkers: () => void;
  traceFillColor: string;
  setTraceFillColor: React.Dispatch<React.SetStateAction<string>>;
  traceFillOpacity: number;
  setTraceFillOpacity: React.Dispatch<React.SetStateAction<number>>;

  annotations: {
    id: string;
    x: number;
    y: number;
    text: string;
    hidden?: boolean;
    locked?: boolean;
  }[];
  editAnnotation: (annotation: {
    id: string;
    x: number;
    y: number;
    text: string;
  }) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  toggleAnnotationHidden: (id: string) => void;

  drawLineStrokeWidth: number;
  setDrawLineStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  ahkaStrokeWidth: number;
  setAhkaStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  rulerStrokeWidth: number;
  setRulerStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  lldStrokeWidth: number;
  setLldStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  offsetStrokeWidth: number;
  setOffsetStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  angleStrokeWidth: number;
  setAngleStrokeWidth: React.Dispatch<React.SetStateAction<number>>;

  pointRadius: number;
  setPointRadius: React.Dispatch<React.SetStateAction<number>>;
  pointFillMode: PointFillMode;
  setPointFillMode: React.Dispatch<React.SetStateAction<PointFillMode>>;
  pointFillColor: string;
  setPointFillColor: React.Dispatch<React.SetStateAction<string>>;

  valgusCutMode: boolean;
  onToggleValgusCutMode: () => void;
  valgusCutAngleDeg: number;
  setValgusCutAngleDeg: React.Dispatch<React.SetStateAction<number>>;
  valgusCutSide: Side;
  setValgusCutSide: React.Dispatch<React.SetStateAction<Side>>;
  valgusCutOffsetPx: number;
  setValgusCutOffsetPx: React.Dispatch<React.SetStateAction<number>>;
  valgusCutStrokeWidth: number;
  setValgusCutStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  valgusCutLineLengthPx: number;
  setValgusCutLineLengthPx: React.Dispatch<React.SetStateAction<number>>;
  valgusCutLines: ValgusCutLine[];
  valgusCutAnchor: { x: number; y: number } | null;
  onRemoveValgusCutLine: (id: string) => void;
  onToggleValgusCutLineLock: (id: string) => void;
  onToggleValgusCutLineHidden: (id: string) => void;
  onResetValgusCut: () => void;

  tibialSlopeMode: boolean;
  onToggleTibialSlopeMode: () => void;
  tibialSlopeDeg: number;
  setTibialSlopeDeg: React.Dispatch<React.SetStateAction<number>>;
  tibialPosteriorSide: Side;
  setTibialPosteriorSide: React.Dispatch<React.SetStateAction<Side>>;
  tibialSlopeOffsetPx: number;
  setTibialSlopeOffsetPx: React.Dispatch<React.SetStateAction<number>>;
  tibialSlopeStrokeWidth: number;
  setTibialSlopeStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  tibialSlopeLineLengthPx: number;
  setTibialSlopeLineLengthPx: React.Dispatch<React.SetStateAction<number>>;
  tibialSlopeLines: TibialSlopeLine[];
  tibialSlopeAnchor: { x: number; y: number } | null;
  onRemoveTibialSlopeLine: (id: string) => void;
  onToggleTibialSlopeLineLock: (id: string) => void;
  onToggleTibialSlopeLineHidden: (id: string) => void;
  onResetTibialSlope: () => void;

  tibialCutMode: boolean;
  onToggleTibialCutMode: () => void;
  tibialCutAngleDeg: number;
  setTibialCutAngleDeg: React.Dispatch<React.SetStateAction<number>>;
  tibialCutDirection: "Varus" | "Valgus";
  setTibialCutDirection: React.Dispatch<
    React.SetStateAction<"Varus" | "Valgus">
  >;
  tibialCutOffsetPx: number;
  setTibialCutOffsetPx: React.Dispatch<React.SetStateAction<number>>;
  tibialCutStrokeWidth: number;
  setTibialCutStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  tibialCutLineLengthPx: number;
  setTibialCutLineLengthPx: React.Dispatch<React.SetStateAction<number>>;
  tibialCutLines: TibialCutLine[];
  tibialCutAnchor: { x: number; y: number } | null;
  onRemoveTibialCutLine: (id: string) => void;
  onToggleTibialCutLineLock: (id: string) => void;
  onToggleTibialCutLineHidden: (id: string) => void;
  onResetTibialCut: () => void;

  showRulerLabels: boolean;
  setShowRulerLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showLldLabels: boolean;
  setShowLldLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showOffsetLabels: boolean;
  setShowOffsetLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showAngleLabels: boolean;
  setShowAngleLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showAhkaLabels: boolean;
  setShowAhkaLabels: React.Dispatch<React.SetStateAction<boolean>>;
  ahkaEditLocked: boolean;
  setAhkaEditLocked: React.Dispatch<React.SetStateAction<boolean>>;
  showValgusCutLabels: boolean;
  setShowValgusCutLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showTibialSlopeLabels: boolean;
  setShowTibialSlopeLabels: React.Dispatch<React.SetStateAction<boolean>>;
  showTibialCutLabels: boolean;
  setShowTibialCutLabels: React.Dispatch<React.SetStateAction<boolean>>;
};

export function MeasurementValuePanel({
  mobileDocked,
  panelRef,
  panelPos,
  onPanelPointerMove,
  onPanelPointerUp,
  onPanelPointerDown,
  onInteract,
  onClose,
  minimized,
  canMinimize,
  onToggleMinimized,
  rulerMode,
  toggleRulerMode,
  lldMode,
  toggleLldMode,
  offsetMode,
  toggleOffsetMode,
  angleMode,
  toggleAngleMode,
  ahkaMode,
  toggleAhkaMode,
  drawMode,
  onToggleDrawMode,
  traceMode,
  toggleTraceMode,
  pencilMode,
  togglePencilMode,
  corMode,
  toggleCorMode,
  annotationMode,
  toggleAnnotationMode,
  cutout,
  cutoutMode,
  cutoutShape,
  onToggleCutoutMode,
  onClearCutout,
  onSetCutoutOpacity,
  onSetCutoutShape,
  onCreateCutoutOverlay,
  onCopyCutoutFromCanvas,
  onCopyCutoutFromItem,
  onCutCutoutFromItem,
  canCopyCutoutFromItem,
  measurementRows,
  measurementTotalLabel,
  removeMeasurement,
  toggleMeasurementLock,
  toggleMeasurementHidden,
  clearMeasurements,
  lldRows,
  removeLldMeasurement,
  toggleLldLock,
  toggleLldHidden,
  clearLldMeasurements,
  offsetRows,
  removeOffsetMeasurement,
  toggleOffsetLock,
  toggleOffsetHidden,
  clearOffsetMeasurements,
  angleRows,
  removeAngleMeasurement,
  toggleAngleLock,
  toggleAngleHidden,
  clearAngles,
  ahkaRows,
  removeAhkaMeasurement,
  toggleAhkaLock,
  toggleAhkaHidden,
  clearAhka,
  drawLinesRows,
  drawLinesTotalLabel,
  removeDrawLine,
  toggleDrawLineLock,
  toggleDrawLineHidden,
  clearDrawLines,
  traceRows,
  pencilRows,
  corRows,
  removeStroke,
  toggleStrokeLock,
  toggleStrokeHidden,
  clearStrokesByKind,
  removeCorMarker,
  toggleCorLock,
  toggleCorHidden,
  clearCorMarkers,
  traceFillColor,
  setTraceFillColor,
  traceFillOpacity,
  setTraceFillOpacity,
  annotations,
  editAnnotation,
  removeAnnotation,
  clearAnnotations,
  toggleAnnotationHidden,
  drawLineStrokeWidth,
  setDrawLineStrokeWidth,
  ahkaStrokeWidth,
  setAhkaStrokeWidth,
  rulerStrokeWidth,
  setRulerStrokeWidth,
  lldStrokeWidth,
  setLldStrokeWidth,
  offsetStrokeWidth,
  setOffsetStrokeWidth,
  angleStrokeWidth,
  setAngleStrokeWidth,
  pointRadius,
  setPointRadius,
  pointFillMode,
  setPointFillMode,
  pointFillColor,
  setPointFillColor,
  valgusCutMode,
  onToggleValgusCutMode,
  valgusCutAngleDeg,
  setValgusCutAngleDeg,
  valgusCutSide,
  setValgusCutSide,
  valgusCutOffsetPx,
  setValgusCutOffsetPx,
  valgusCutStrokeWidth,
  setValgusCutStrokeWidth,
  valgusCutLineLengthPx,
  setValgusCutLineLengthPx,
  valgusCutLines,
  valgusCutAnchor,
  onRemoveValgusCutLine,
  onToggleValgusCutLineLock,
  onToggleValgusCutLineHidden,
  onResetValgusCut,
  tibialSlopeMode,
  onToggleTibialSlopeMode,
  tibialSlopeDeg,
  setTibialSlopeDeg,
  tibialPosteriorSide,
  setTibialPosteriorSide,
  tibialSlopeOffsetPx,
  setTibialSlopeOffsetPx,
  tibialSlopeStrokeWidth,
  setTibialSlopeStrokeWidth,
  tibialSlopeLineLengthPx,
  setTibialSlopeLineLengthPx,
  tibialSlopeLines,
  tibialSlopeAnchor,
  onRemoveTibialSlopeLine,
  onToggleTibialSlopeLineLock,
  onToggleTibialSlopeLineHidden,
  onResetTibialSlope,
  tibialCutMode,
  onToggleTibialCutMode,
  tibialCutAngleDeg,
  setTibialCutAngleDeg,
  tibialCutDirection,
  setTibialCutDirection,
  tibialCutOffsetPx,
  setTibialCutOffsetPx,
  tibialCutStrokeWidth,
  setTibialCutStrokeWidth,
  tibialCutLineLengthPx,
  setTibialCutLineLengthPx,
  tibialCutLines,
  tibialCutAnchor,
  onRemoveTibialCutLine,
  onToggleTibialCutLineLock,
  onToggleTibialCutLineHidden,
  onResetTibialCut,
  showRulerLabels,
  setShowRulerLabels,
  showLldLabels,
  setShowLldLabels,
  showOffsetLabels,
  setShowOffsetLabels,
  showAngleLabels,
  setShowAngleLabels,
  showAhkaLabels,
  setShowAhkaLabels,
  ahkaEditLocked,
  setAhkaEditLocked,
  showValgusCutLabels,
  setShowValgusCutLabels,
  showTibialSlopeLabels,
  setShowTibialSlopeLabels,
  showTibialCutLabels,
  setShowTibialCutLabels,
}: MeasurementValuePanelProps) {
  const shellClass =
    `bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/70 dark:border-neutral-700/70 w-[228px] max-w-[72vw] md:w-[350px] md:max-w-[92vw] ${
      minimized ? "max-md:w-[290px]" : ""
    }`;
  const headerClass =
    "cursor-move max-md:cursor-default px-3 py-2 border-b border-gray-200/70 dark:border-neutral-700/70 text-[9px] md:text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200 flex items-center justify-between";
  const labelClass =
    "text-[9px] md:text-[11px] font-semibold text-gray-700 dark:text-gray-200";
  const sectionClass =
    "rounded-xl border border-gray-200/60 dark:border-neutral-700/60 bg-white/70 dark:bg-blue-800/40 p-1.5 md:p-2 space-y-2";
  const miniButton =
    "rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const mutedText = "text-[9px] md:text-[10px] text-gray-400";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2 py-1 text-[9px] md:text-[11px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const toggleOn =
    "rounded-lg px-2 py-1 text-[9px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition";
  const toggleOff =
    "rounded-lg px-2 py-1 text-[10px] font-medium bg-gray-200/80 dark:bg-emerald-800 text-gray-800 dark:text-gray-50 hover:bg-gray-300/80 dark:hover:bg-slate-800 transition";
  const pill =
    "inline-flex items-center justify-between gap-2 rounded-lg border border-gray-200/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/70 px-2 py-1 text-[10px] text-gray-700 dark:text-gray-200";
  const chipBase =
    "rounded-lg px-2 py-1 text-[9px] font-medium border border-gray-200/70 dark:border-neutral-700/70 transition";
  const chipInactive =
    "bg-white/80 dark:bg-neutral-900/60 hover:bg-gray-100 dark:hover:bg-neutral-800";

  const [valgusCutAdvanced, setValgusCutAdvanced] = useState(false);
  const [tibialSlopeAdvanced, setTibialSlopeAdvanced] = useState(false);
  const [tibialCutAdvanced, setTibialCutAdvanced] = useState(false);
  type MeasurementsTab = "measurements" | "style" | "knee";
  const [tab, setTab] = useState<MeasurementsTab>("measurements");

  const blocks = [
    {
      key: "ruler",
      label: "Ruler",
      rows: measurementRows,
      valueClass: "text-emerald-600 dark:text-emerald-400",
      hoverClass: "hover:text-emerald-600 dark:hover:text-emerald-400",
      totalLabel: measurementTotalLabel,
      onClear: clearMeasurements,
      onRemove: removeMeasurement,
      onToggleLock: toggleMeasurementLock,
      onToggleHidden: toggleMeasurementHidden,
    },
    {
      key: "lld",
      label: "LLD",
      rows: lldRows,
      valueClass: "text-sky-600 dark:text-sky-400",
      hoverClass: "hover:text-sky-600 dark:hover:text-sky-400",
      totalLabel: null,
      onClear: clearLldMeasurements,
      onRemove: removeLldMeasurement,
      onToggleLock: toggleLldLock,
      onToggleHidden: toggleLldHidden,
    },
    {
      key: "offset",
      label: "Offset",
      rows: offsetRows,
      valueClass: "text-amber-600 dark:text-amber-400",
      hoverClass: "hover:text-amber-600 dark:hover:text-amber-400",
      totalLabel: null,
      onClear: clearOffsetMeasurements,
      onRemove: removeOffsetMeasurement,
      onToggleLock: toggleOffsetLock,
      onToggleHidden: toggleOffsetHidden,
    },
    {
      key: "angle",
      label: "Angle",
      rows: angleRows,
      valueClass: "text-red-600 dark:text-red-700",
      hoverClass: "hover:text-red-600 dark:hover:text-red-400",
      totalLabel: null,
      onClear: clearAngles,
      onRemove: removeAngleMeasurement,
      onToggleLock: toggleAngleLock,
      onToggleHidden: toggleAngleHidden,
    },
    {
      key: "ahka",
      label: "aHKA",
      rows: ahkaRows,
      valueClass: "text-red-600 dark:text-red-400",
      hoverClass: "hover:text-red-600 dark:hover:text-red-400",
      totalLabel: null,
      onClear: clearAhka,
      onRemove: removeAhkaMeasurement,
      onToggleLock: toggleAhkaLock,
      onToggleHidden: toggleAhkaHidden,
    },
    {
      key: "draw",
      label: "Draw Line",
      rows: drawLinesRows,
      valueClass: "text-purple-600 dark:text-purple-400",
      hoverClass: "hover:text-purple-600 dark:hover:text-purple-400",
      totalLabel: drawLinesTotalLabel,
      onClear: clearDrawLines,
      onRemove: removeDrawLine,
      onToggleLock: toggleDrawLineLock,
      onToggleHidden: toggleDrawLineHidden,
    },
    {
      key: "trace",
      label: "Trace",
      rows: traceRows,
      valueClass: "text-emerald-600 dark:text-emerald-400",
      hoverClass: "hover:text-emerald-600 dark:hover:text-emerald-400",
      totalLabel: null,
      onClear: () => clearStrokesByKind("trace"),
      onRemove: removeStroke,
      onToggleLock: toggleStrokeLock,
      onToggleHidden: toggleStrokeHidden,
    },
    {
      key: "pencil",
      label: "Pencil",
      rows: pencilRows,
      valueClass: "text-amber-600 dark:text-amber-400",
      hoverClass: "hover:text-amber-600 dark:hover:text-amber-400",
      totalLabel: null,
      onClear: () => clearStrokesByKind("pencil"),
      onRemove: removeStroke,
      onToggleLock: toggleStrokeLock,
      onToggleHidden: toggleStrokeHidden,
    },
    {
      key: "cor",
      label: "COR",
      rows: corRows,
      valueClass: "text-fuchsia-600 dark:text-fuchsia-400",
      hoverClass: "hover:text-fuchsia-600 dark:hover:text-fuchsia-400",
      totalLabel: null,
      onClear: clearCorMarkers,
      onRemove: removeCorMarker,
      onToggleLock: toggleCorLock,
      onToggleHidden: toggleCorHidden,
    },
  ];

  const hasRows = blocks.some((b) => b.rows.length > 0);
  const visibleValgusCutLines = valgusCutLines.filter(
    (line) => line.side === valgusCutSide
  );
  const visibleTibialSlopeLines = tibialSlopeLines.filter(
    (line) => line.posteriorSide === tibialPosteriorSide
  );
  const visibleTibialCutLines = tibialCutLines.filter(
    (line) => line.direction === tibialCutDirection
  );

  return (
    <motion.div
      ref={panelRef}
      className={`fixed z-40 select-none touch-auto md:touch-none max-md:!left-1/2 max-md:!-translate-x-1/2 max-md:!translate-y-0 ${
        mobileDocked
          ? "max-md:!top-[calc(env(safe-area-inset-top)+60px)] max-md:!bottom-auto"
          : "max-md:!top-auto max-md:!bottom-20"
      }`}
      style={{ left: panelPos.x, top: panelPos.y }}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerUp}
      onPointerDownCapture={onInteract}
      onWheelCapture={onInteract}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className={shellClass}>
        <div className={headerClass} onPointerDown={onPanelPointerDown}>
          <span className="flex items-center gap-2">
            <span>Measurements</span>
            {minimized ? (
              <span className="text-[10px] text-gray-400">
                {blocks.reduce((sum, b) => sum + b.rows.length, 0)}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              <Grab className="w-4 h-4"/>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimized();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
              disabled={!canMinimize}
              aria-label={minimized ? "Expand measurements" : "Minimize measurements"}
              title={minimized ? "Expand" : "Minimize"}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${minimized ? "-rotate-90" : "rotate-0"}`}
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
              aria-label="Close measurements panel"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <div
            className="p-2 md:p-3 space-y-3 text-[10px] md:text-xs max-h-[56svh] md:max-h-[60svh] overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTab("measurements")}
                className={`${chipBase} ${
                  tab === "measurements"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : chipInactive
                }`}
              >
                Measure
              </button>
              <button
                type="button"
                onClick={() => setTab("style")}
                className={`${chipBase} ${
                  tab === "style"
                    ? "bg-slate-700 text-white hover:bg-slate-800"
                    : chipInactive
                }`}
              >
                Style
              </button>
              <button
                type="button"
                onClick={() => setTab("knee")}
                className={`${chipBase} ${
                  tab === "knee"
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : chipInactive
                }`}
              >
                Knee
              </button>
            </div>

            {tab === "measurements" && (
              <>
                <div className={sectionClass} data-tour="measure-tools">
                  <div className="flex items-center justify-between">
                    <div className={labelClass}>Tools</div>
                    <div className={mutedText}>Tap to activate</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleRulerMode();
                      }}
                      className={rulerMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Ruler className="h-3.5 w-3.5" />
                        <span>Ruler</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleLldMode();
                      }}
                      className={lldMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span>LLD</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleOffsetMode();
                      }}
                      className={offsetMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        <span>Offset</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleAngleMode();
                      }}
                      className={angleMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Triangle className="h-3.5 w-3.5" />
                        <span>Angle</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleAhkaMode();
                      }}
                      className={ahkaMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Activity className="h-3.5 w-3.5" />
                        <span>aHKA</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        onToggleDrawMode();
                      }}
                      className={drawMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <PenLine className="h-3.5 w-3.5" />
                        <span>Draw</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        onToggleCutoutMode();
                      }}
                      className={cutoutMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Scissors className="h-3.5 w-3.5" />
                        <span>Cutout</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleTraceMode();
                      }}
                      className={traceMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <PenTool className="h-3.5 w-3.5" />
                        <span>Trace</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        togglePencilMode();
                      }}
                      className={pencilMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Pencil</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleCorMode();
                      }}
                      className={corMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Crosshair className="h-3.5 w-3.5" />
                        <span>COR</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        toggleAnnotationMode();
                      }}
                      className={annotationMode ? toggleOn : toggleOff}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        <span>Note</span>
                      </span>
                    </button>
                  </div>
                  {(cutout || cutoutMode) && (
                    <div className="mt-2 space-y-2 rounded-lg border border-gray-200/60 bg-white/70 p-2 text-[10px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Cutout</span>
                        <button
                          type="button"
                          onClick={() => {
                            onInteract();
                            onClearCutout();
                          }}
                          disabled={!cutout}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:hover:text-gray-400"
                          title="Clear cutout"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-[9px] text-gray-400">
                        Aktifkan Cutout, lalu:
                        <div className="mt-1 space-y-0.5">
                          <div>- Circle: titik awal = center, drag untuk radius.</div>
                          <div>- Rect: drag untuk area.</div>
                          <div>- Free: tap/klik titik-titik, lalu tap dekat titik awal untuk menutup.</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-400">Shape</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onInteract();
                              onSetCutoutShape("circle");
                            }}
                            className={
                              cutoutShape === "circle" ? toggleOn : toggleOff
                            }
                          >
                            Round
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onInteract();
                              onSetCutoutShape("rect");
                            }}
                            className={cutoutShape === "rect" ? toggleOn : toggleOff}
                          >
                            Rect
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onInteract();
                              onSetCutoutShape("polygon");
                            }}
                            className={
                              cutoutShape === "polygon" ? toggleOn : toggleOff
                            }
                            title="Freehand polygon"
                          >
                            Free
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-400">Opacity</span>
                        <input
                          type="range"
                          min={0.2}
                          max={0.9}
                          step={0.05}
                          value={cutout?.opacity ?? 0.65}
                          onChange={(e) => onSetCutoutOpacity(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onInteract();
                          onCreateCutoutOverlay();
                        }}
                        disabled={!cutout}
                        className={`w-full rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                          cutout
                            ? "bg-gray-900 text-white hover:bg-black"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Copy from X-ray
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onInteract();
                            onCopyCutoutFromCanvas();
                          }}
                          disabled={!cutout}
                          className={`w-full rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                            cutout
                              ? "bg-slate-700 text-white hover:bg-slate-800"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Copy Canvas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onInteract();
                            onCopyCutoutFromItem();
                          }}
                          disabled={!cutout || !canCopyCutoutFromItem}
                          className={`w-full rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                            cutout && canCopyCutoutFromItem
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                          title={
                            canCopyCutoutFromItem
                              ? "Copy dari item aktif"
                              : "Pilih item (template/overlay) dulu"
                          }
                        >
                          Copy Item
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onInteract();
                          onCutCutoutFromItem();
                        }}
                        disabled={!cutout || !canCopyCutoutFromItem}
                        className={`w-full rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                          cutout && canCopyCutoutFromItem
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        title="Potong dari item aktif (buat overlay baru, hapus item lama)"
                      >
                        Cut Item
                      </button>
                    </div>
                  )}

                  {(traceMode || traceRows.length > 0) && (
                    <div className="mt-2 space-y-2 rounded-lg border border-gray-200/60 bg-white/70 p-2 text-[10px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Trace Fill</span>
                        <span className="text-[9px] text-gray-400">
                          Closed only
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-400">Color</span>
                        <input
                          type="color"
                          value={traceFillColor}
                          onChange={(e) => {
                            onInteract();
                            setTraceFillColor(e.target.value);
                          }}
                          className="h-7 w-10 rounded-md border border-gray-200/70 bg-white p-0 dark:border-neutral-700 dark:bg-neutral-900"
                          aria-label="Trace fill color"
                        />
                        <div className="flex-1 truncate text-[9px] text-gray-400">
                          {traceFillColor.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-400">Alpha</span>
                        <input
                          type="range"
                          min={0}
                          max={0.8}
                          step={0.05}
                          value={traceFillOpacity}
                          onChange={(e) => {
                            onInteract();
                            setTraceFillOpacity(Number(e.target.value));
                          }}
                          className="w-full accent-emerald-500"
                          aria-label="Trace fill opacity"
                        />
                        <span className="w-10 text-right text-[9px] text-gray-400">
                          {Math.round(
                            Math.min(1, Math.max(0, traceFillOpacity)) * 100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {!hasRows && <div className={mutedText}>No measurements yet.</div>}
                {blocks.map((block) =>
                  block.rows.length ? (
                    <div key={block.key} className={sectionClass}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`text-[11px] font-semibold ${block.valueClass}`}>
                            {block.label}
                          </div>
                          <div className="text-[9px] md:text-[11px] text-gray-400">
                            {block.rows.length}
                          </div>
                          {block.totalLabel ? (
                            <div className={`text-[10px] font-semibold ${block.valueClass}`}>
                              {block.totalLabel}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={block.onClear}
                          className={miniButton}
                          aria-label={`Clear ${block.label}`}
                          title="Clear"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <AnimatePresence initial={false}>
                          {block.rows.map((row) => (
                            <motion.div
                              key={row.id}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/70 px-2 py-1 text-[10px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                            >
                              <span className="w-9 text-[10px] md:text-[11px] text-gray-400">
                                {row.label}
                              </span>
                              <span className={`flex-1 ${block.valueClass}`}>
                                {row.value}
                              </span>
                              <button
                                type="button"
                                onClick={() => block.onToggleHidden(row.id)}
                                className={`text-gray-400 ${block.hoverClass}`}
                                aria-label={`Toggle ${block.label} visibility`}
                                title={row.hidden ? "Show" : "Hide"}
                              >
                                {row.hidden ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => block.onToggleLock(row.id)}
                                className={`text-gray-400 ${block.hoverClass}`}
                                aria-label={`Toggle ${block.label} lock`}
                                title={row.locked ? "Unlock" : "Lock"}
                              >
                                {row.locked ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  <Unlock className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => block.onRemove(row.id)}
                                className="text-gray-400 hover:text-red-500"
                                aria-label={`Remove ${block.label} measurement`}
                                title="Remove"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : null
                )}

                <div className={sectionClass}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                        Notes
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {annotations.length}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onInteract();
                        clearAnnotations();
                      }}
                      disabled={!annotations.length}
                      className={miniButton}
                      aria-label="Clear notes"
                      title="Clear"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <AnimatePresence initial={false}>
                      {annotations.map((annotation, index) => (
                        <motion.div
                          key={annotation.id}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/70 px-2 py-1 text-[10px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                        >
                          <span className="w-9 text-[10px] text-gray-400">
                            N{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              editAnnotation({
                                id: annotation.id,
                                x: annotation.x,
                                y: annotation.y,
                                text: annotation.text,
                              })
                            }
                            className="flex-1 truncate text-left text-gray-700 hover:text-emerald-600 dark:text-gray-200 dark:hover:text-emerald-400"
                            title={annotation.text}
                          >
                            {annotation.text}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAnnotationHidden(annotation.id)}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            aria-label="Toggle note visibility"
                            title={annotation.hidden ? "Show" : "Hide"}
                          >
                            {annotation.hidden ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAnnotation(annotation.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove note"
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {!annotations.length && (
                      <div className={mutedText}>No notes yet.</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {tab === "style" && (
              <>
                <div className={sectionClass}>
                  <label className={labelClass}>Display (Label)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={pill}>
                      <span>Ruler</span>
                      <button
                        type="button"
                        onClick={() => setShowRulerLabels((prev) => !prev)}
                        className={showRulerLabels ? toggleOn : toggleOff}
                        aria-label={showRulerLabels ? "Hide ruler" : "Show ruler"}
                        title={showRulerLabels ? "Hide ruler" : "Show ruler"}
                      >
                        {showRulerLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className={pill}>
                      <span>LLD</span>
                      <button
                        type="button"
                        onClick={() => setShowLldLabels((prev) => !prev)}
                        className={showLldLabels ? toggleOn : toggleOff}
                        aria-label={showLldLabels ? "Hide" : "Show"}
                        title={showLldLabels ? "Hide" : "Show"}
                      >
                        {showLldLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className={pill}>
                      <span>Offset</span>
                      <button
                        type="button"
                        onClick={() => setShowOffsetLabels((prev) => !prev)}
                        className={showOffsetLabels ? toggleOn : toggleOff}
                        aria-label={showOffsetLabels ? "Hide" : "Show"}
                        title={showOffsetLabels ? "Hide" : "Show"}
                      >
                        {showOffsetLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className={pill}>
                      <span>Angle</span>
                      <button
                        type="button"
                        onClick={() => setShowAngleLabels((prev) => !prev)}
                        className={showAngleLabels ? toggleOn : toggleOff}
                        aria-label={showAngleLabels ? "Hide" : "Show"}
                        title={showAngleLabels ? "Hide" : "Show"}
                      >
                        {showAngleLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className={pill}>
                      <span>aHKA</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowAhkaLabels((prev) => !prev)}
                          className={showAhkaLabels ? toggleOn : toggleOff}
                          aria-label={
                            showAhkaLabels ? "Hide aHKA label" : "Show aHKA label"
                          }
                          title={showAhkaLabels ? "Hide aHKA label" : "Show aHKA label"}
                        >
                          {showAhkaLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAhkaEditLocked((prev) => !prev)}
                          className={ahkaEditLocked ? toggleOn : toggleOff}
                          aria-label={
                            ahkaEditLocked ? "Unlock aHKA points" : "Lock aHKA points"
                          }
                          title={ahkaEditLocked ? "Unlock aHKA points" : "Lock aHKA points"}
                        >
                          {ahkaEditLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className={pill}>
                      <span>Koreksi Valgus</span>
                      <button
                        type="button"
                        onClick={() => setShowValgusCutLabels((prev) => !prev)}
                        className={showValgusCutLabels ? toggleOn : toggleOff}
                        aria-label={showValgusCutLabels ? "Hide" : "Show"}
                        title={showValgusCutLabels ? "Hide" : "Show"}
                      >
                        {showValgusCutLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className={pill}>
                      <span>Tibial Slope</span>
                      <button
                        type="button"
                        onClick={() => setShowTibialSlopeLabels((prev) => !prev)}
                        className={showTibialSlopeLabels ? toggleOn : toggleOff}
                        aria-label={showTibialSlopeLabels ? "Hide" : "Show"}
                        title={showTibialSlopeLabels ? "Hide" : "Show"}
                      >
                        {showTibialSlopeLabels ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <div className={pill}>
                      <span>Tibial Cut</span>
                      <button
                        type="button"
                        onClick={() => setShowTibialCutLabels((prev) => !prev)}
                        className={showTibialCutLabels ? toggleOn : toggleOff}
                        aria-label={showTibialCutLabels ? "Hide" : "Show"}
                        title={showTibialCutLabels ? "Hide" : "Show"}
                      >
                        {showTibialCutLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={sectionClass}>
                  <label className={labelClass}>Fill</label>
                  <div className="grid grid-cols-5 gap-1">
                    {(
                      [
                        ["dark", "Dark"],
                        ["light", "Light"],
                        ["matchLine", "Line"],
                        ["transparent", "None"],
                        ["custom", "Custom"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPointFillMode(value)}
                        className={`${chipBase} ${
                          pointFillMode === value
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : chipInactive
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {pointFillMode === "custom" && (
                    <div className="mt-2">
                      <input
                        type="color"
                        value={pointFillColor}
                        onChange={(e) => setPointFillColor(e.target.value)}
                        className="h-8 w-full cursor-pointer rounded-lg border border-gray-200/70 bg-white p-1 dark:border-neutral-700/70 dark:bg-neutral-900"
                      />
                    </div>
                  )}
                </div>

                <div className={sectionClass}>
                  <label className={labelClass}>Endpoint Dots</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Size</div>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        value={pointRadius}
                        onChange={(e) => setPointRadius(Number(e.target.value))}
                        className={inputFull}
                      />
                    </div>
                    <div className="pt-5">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={0.5}
                        value={pointRadius}
                        onChange={(e) => setPointRadius(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className={sectionClass}>
                  <label className={labelClass}>Thickness</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Ruler</div>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={rulerStrokeWidth}
                        onChange={(e) => setRulerStrokeWidth(Number(e.target.value))}
                        className={inputFull}
                      />
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={rulerStrokeWidth}
                        onChange={(e) => setRulerStrokeWidth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className={mutedText}>LLD</div>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={lldStrokeWidth}
                        onChange={(e) => setLldStrokeWidth(Number(e.target.value))}
                        className={inputFull}
                      />
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={lldStrokeWidth}
                        onChange={(e) => setLldStrokeWidth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Offset</div>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={offsetStrokeWidth}
                        onChange={(e) => setOffsetStrokeWidth(Number(e.target.value))}
                        className={inputFull}
                      />
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={offsetStrokeWidth}
                        onChange={(e) => setOffsetStrokeWidth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Angle</div>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={angleStrokeWidth}
                        onChange={(e) => setAngleStrokeWidth(Number(e.target.value))}
                        className={inputFull}
                      />
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={angleStrokeWidth}
                        onChange={(e) => setAngleStrokeWidth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className={mutedText}>aHKA</div>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={ahkaStrokeWidth}
                        onChange={(e) => setAhkaStrokeWidth(Number(e.target.value))}
                        className={inputFull}
                      />
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={ahkaStrokeWidth}
                        onChange={(e) => setAhkaStrokeWidth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Draw Line</div>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={drawLineStrokeWidth}
                        onChange={(e) => setDrawLineStrokeWidth(Number(e.target.value))}
                        className={inputFull}
                      />
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={drawLineStrokeWidth}
                        onChange={(e) => setDrawLineStrokeWidth(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === "knee" && (
              <>
                <div className={sectionClass}>
                  <label className={labelClass}>Knee Planning Tools</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={onToggleValgusCutMode}
                      className={`${chipBase} ${
                        valgusCutMode
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : chipInactive
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Bone className="h-3.5 w-3.5" />
                        <span>Valgus</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleTibialSlopeMode}
                      className={`${chipBase} ${
                        tibialSlopeMode
                          ? "bg-cyan-500 text-white hover:bg-cyan-600"
                          : chipInactive
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Slope</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleTibialCutMode}
                      className={`${chipBase} ${
                        tibialCutMode
                          ? "bg-teal-500 text-white hover:bg-teal-600"
                          : chipInactive
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Scissors className="h-3.5 w-3.5" />
                        <span>Tibia</span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className={sectionClass}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Valgus (°)</div>
                      <input
                        type="number"
                        min={-20}
                        max={20}
                        step={1}
                        value={valgusCutAngleDeg}
                        onChange={(e) => setValgusCutAngleDeg(Number(e.target.value))}
                        className={inputFull}
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Side</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setValgusCutSide("Right")}
                          className={`${chipBase} ${
                            valgusCutSide === "Right"
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : chipInactive
                          }`}
                        >
                          Right
                        </button>
                        <button
                          type="button"
                          onClick={() => setValgusCutSide("Left")}
                          className={`${chipBase} ${
                            valgusCutSide === "Left"
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : chipInactive
                          }`}
                        >
                          Left
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={mutedText}>
                      {valgusCutMode ? "Tap 2 points" : ""}
                      {!valgusCutMode && valgusCutAnchor ? "Placing…" : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setValgusCutAdvanced((prev) => !prev)}
                        className={miniButton}
                        aria-label={valgusCutAdvanced ? "Hide advanced" : "Show advanced"}
                        title={valgusCutAdvanced ? "Hide advanced" : "Show advanced"}
                      >
                        {valgusCutAdvanced ? "Less" : "More"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-orange-200/60 bg-orange-50/60 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                        <span className="text-orange-500 ">Koreksi Valgus</span>
                        <span className="text-[10px] text-gray-400">
                          {visibleValgusCutLines.length}/{valgusCutLines.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onResetValgusCut}
                        className={miniButton}
                        aria-label="Clear valgus cut lines"
                        title="Clear"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>

                    {visibleValgusCutLines.length ? (
                      <div className="mt-2 space-y-1">
                        {visibleValgusCutLines.map((line, index) => (
                          <div
                            key={line.id}
                            className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/70 px-2 py-1 text-[10px] md:text-[11px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                          >
                            <span className="w-10 text-[10px] text-gray-400">
                              VC{index + 1}
                            </span>
                            <span className="flex-1 text-orange-500">
                              {line.side} {line.angleDeg}°
                            </span>
                            <button
                              type="button"
                              onClick={() => onToggleValgusCutLineHidden(line.id)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={line.hidden ? "Show" : "Hide"}
                              aria-label="Toggle visibility"
                            >
                              {line.hidden ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleValgusCutLineLock(line.id)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={line.locked ? "Unlock" : "Lock"}
                              aria-label="Toggle lock"
                            >
                              {line.locked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveValgusCutLine(line.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove"
                              aria-label="Remove line"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`mt-2 ${mutedText}`}>No lines yet.</div>
                    )}
                  </div>
                  {valgusCutAdvanced && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className={mutedText}>Offset (px)</div>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            step={1}
                            value={valgusCutOffsetPx}
                            onChange={(e) =>
                              setValgusCutOffsetPx(Number(e.target.value))
                            }
                            className={inputFull}
                          />
                        </div>
                        <div>
                          <div className={mutedText}>Thickness</div>
                          <input
                            type="number"
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={valgusCutStrokeWidth}
                            onChange={(e) =>
                              setValgusCutStrokeWidth(Number(e.target.value))
                            }
                            className={inputFull}
                          />
                        </div>
                      </div>
                      <div>
                        <div className={mutedText}>Length (px)</div>
                        <input
                          type="number"
                          min={50}
                          max={4000}
                          step={10}
                          value={valgusCutLineLengthPx}
                          onChange={(e) =>
                            setValgusCutLineLengthPx(Number(e.target.value))
                          }
                          className={inputFull}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={sectionClass}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Slope (°)</div>
                      <input
                        type="number"
                        min={-20}
                        max={20}
                        step={1}
                        value={tibialSlopeDeg}
                        onChange={(e) => setTibialSlopeDeg(Number(e.target.value))}
                        className={inputFull}
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Posterior</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setTibialPosteriorSide("Right")}
                          className={`${chipBase} ${
                            tibialPosteriorSide === "Right"
                              ? "bg-cyan-500 text-white hover:bg-cyan-600"
                              : chipInactive
                          }`}
                        >
                          Right
                        </button>
                        <button
                          type="button"
                          onClick={() => setTibialPosteriorSide("Left")}
                          className={`${chipBase} ${
                            tibialPosteriorSide === "Left"
                              ? "bg-cyan-500 text-white hover:bg-cyan-600"
                              : chipInactive
                          }`}
                        >
                          Left
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={mutedText}>
                      {tibialSlopeMode ? "Tap 2 points" : ""}
                      {!tibialSlopeMode && tibialSlopeAnchor ? "Placing…" : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTibialSlopeAdvanced((prev) => !prev)}
                        className={miniButton}
                        aria-label={
                          tibialSlopeAdvanced ? "Hide advanced" : "Show advanced"
                        }
                        title={tibialSlopeAdvanced ? "Hide advanced" : "Show advanced"}
                      >
                        {tibialSlopeAdvanced ? "Less" : "More"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-cyan-200/60 bg-cyan-50/60 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                        <span className="text-cyan-500">Slope Tibia</span>
                        <span className="text-[10px] text-gray-400">
                          {visibleTibialSlopeLines.length}/{tibialSlopeLines.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onResetTibialSlope}
                        className={miniButton}
                        aria-label="Clear tibial slope lines"
                        title="Clear"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>

                    {visibleTibialSlopeLines.length ? (
                      <div className="mt-2 space-y-1">
                        {visibleTibialSlopeLines.map((line, index) => (
                          <div
                            key={line.id}
                            className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-cyan-50/70 px-2 py-1 text-[10px] md:text-[11px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                          >
                            <span className="w-10 text-[10px] text-gray-400">
                              TS{index + 1}
                            </span>
                            <span className="flex-1 text-cyan-500">
                              {line.posteriorSide} {line.slopeDeg}°
                            </span>
                            <button
                              type="button"
                              onClick={() => onToggleTibialSlopeLineHidden(line.id)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={line.hidden ? "Show" : "Hide"}
                              aria-label="Toggle visibility"
                            >
                              {line.hidden ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleTibialSlopeLineLock(line.id)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={line.locked ? "Unlock" : "Lock"}
                              aria-label="Toggle lock"
                            >
                              {line.locked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveTibialSlopeLine(line.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove"
                              aria-label="Remove line"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`mt-2 ${mutedText}`}>No lines yet.</div>
                    )}
                  </div>
                  {tibialSlopeAdvanced && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className={mutedText}>Offset (px)</div>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            step={1}
                            value={tibialSlopeOffsetPx}
                            onChange={(e) =>
                              setTibialSlopeOffsetPx(Number(e.target.value))
                            }
                            className={inputFull}
                          />
                        </div>
                        <div>
                          <div className={mutedText}>Thickness</div>
                          <input
                            type="number"
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={tibialSlopeStrokeWidth}
                            onChange={(e) =>
                              setTibialSlopeStrokeWidth(Number(e.target.value))
                            }
                            className={inputFull}
                          />
                        </div>
                      </div>
                      <div>
                        <div className={mutedText}>Length (px)</div>
                        <input
                          type="number"
                          min={50}
                          max={4000}
                          step={10}
                          value={tibialSlopeLineLengthPx}
                          onChange={(e) =>
                            setTibialSlopeLineLengthPx(Number(e.target.value))
                          }
                          className={inputFull}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={sectionClass}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Angle (°)</div>
                      <input
                        type="number"
                        min={-20}
                        max={20}
                        step={1}
                        value={tibialCutAngleDeg}
                        onChange={(e) => setTibialCutAngleDeg(Number(e.target.value))}
                        className={inputFull}
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Direction</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setTibialCutDirection("Varus")}
                          className={`${chipBase} ${
                            tibialCutDirection === "Varus"
                              ? "bg-teal-500 text-white hover:bg-teal-600"
                              : chipInactive
                          }`}
                        >
                          Varus
                        </button>
                        <button
                          type="button"
                          onClick={() => setTibialCutDirection("Valgus")}
                          className={`${chipBase} ${
                            tibialCutDirection === "Valgus"
                              ? "bg-teal-500 text-white hover:bg-teal-600"
                              : chipInactive
                          }`}
                        >
                          Valgus
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={mutedText}>
                      {tibialCutMode ? "Tap 2 points" : ""}
                      {!tibialCutMode && tibialCutAnchor ? "Placing…" : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTibialCutAdvanced((prev) => !prev)}
                        className={miniButton}
                        aria-label={tibialCutAdvanced ? "Hide advanced" : "Show advanced"}
                        title={tibialCutAdvanced ? "Hide advanced" : "Show advanced"}
                      >
                        {tibialCutAdvanced ? "Less" : "More"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200/60 bg-teal-50/60 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                        <span className="text-teal-500">Tibial Cut</span>
                        <span className="text-[10px] text-gray-400">
                          {visibleTibialCutLines.length}/{tibialCutLines.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onResetTibialCut}
                        className={miniButton}
                        aria-label="Clear tibial cut lines"
                        title="Clear"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>

                    {visibleTibialCutLines.length ? (
                      <div className="mt-2 space-y-1">
                        {visibleTibialCutLines.map((line, index) => (
                          <div
                            key={line.id}
                            className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/70 px-2 py-1 text-[10px] md:text-[11px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                          >
                            <span className="w-10 text-[10px] text-gray-400">
                              TC{index + 1}
                            </span>
                            <span className="flex-1 text-teal-500">
                              {line.angleDeg}°
                            </span>
                            <button
                              type="button"
                              onClick={() => onToggleTibialCutLineHidden(line.id)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={line.hidden ? "Show" : "Hide"}
                              aria-label="Toggle visibility"
                            >
                              {line.hidden ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleTibialCutLineLock(line.id)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={line.locked ? "Unlock" : "Lock"}
                              aria-label="Toggle lock"
                            >
                              {line.locked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveTibialCutLine(line.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove"
                              aria-label="Remove line"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`mt-2 ${mutedText}`}>No lines yet.</div>
                    )}
                  </div>
                  {tibialCutAdvanced && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className={mutedText}>Offset (px)</div>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            step={1}
                            value={tibialCutOffsetPx}
                            onChange={(e) =>
                              setTibialCutOffsetPx(Number(e.target.value))
                            }
                            className={inputFull}
                          />
                        </div>
                        <div>
                          <div className={mutedText}>Thickness</div>
                          <input
                            type="number"
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={tibialCutStrokeWidth}
                            onChange={(e) =>
                              setTibialCutStrokeWidth(Number(e.target.value))
                            }
                            className={inputFull}
                          />
                        </div>
                      </div>
                      <div>
                        <div className={mutedText}>Length (px)</div>
                        <input
                          type="number"
                          min={50}
                          max={4000}
                          step={10}
                          value={tibialCutLineLengthPx}
                          onChange={(e) =>
                            setTibialCutLineLengthPx(Number(e.target.value))
                          }
                          className={inputFull}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
