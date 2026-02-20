"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Rotate3d, Unlock, X } from "lucide-react";
import React, { useId, useLayoutEffect, useRef, useState } from "react";
import type { TemplatingCanvasObject } from "@/components/digitalTemplating/implantLibrary";
import {
  AHKA_COLOR,
  ANGLE_COLOR,
  ANGLE_FONT_SIZE,
  ANGLE_LABEL_STROKE_WIDTH,
  ANGLE_POINT_RADIUS,
  ANGLE_STROKE_WIDTH,
  DRAW_LINE_COLOR,
  LLD_COLOR,
  MEASURE_FONT_SIZE,
  MEASURE_LABEL_STROKE_WIDTH,
  MEASURE_STROKE_WIDTH,
  OFFSET_COLOR,
  RULER_COLOR,
  TIBIAL_CUT_COLOR,
  TIBIAL_SLOPE_COLOR,
  VALGUS_CUT_COLOR,
  XRAY_BASE_HEIGHT,
  XRAY_BASE_WIDTH,
} from "../constants";
import { getXrayTransform } from "../utils";
import type { CanvasMode, XrayTransform } from "../utils";
import type {
  Annotation,
  AngleMeasurement,
  AhkaMeasurement,
  CorMarker,
  CutoutRect,
  DrawLine,
  FreehandStroke,
  LldMeasurement,
  OffsetMeasurement,
  Point,
  PointFillMode,
  RulerMeasurement,
  Side,
  TibialCutLine,
  TibialSlopeLine,
  ValgusCutLine,
} from "../types";

type CutoutPreview = {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "rect" | "circle" | "polygon";
  points?: Point[];
  cursor?: { x: number; y: number } | null;
  closed?: boolean;
  opacity?: number;
};

type ScaleDir = "top" | "bottom" | "left" | "right";

const SCALE_HANDLES: {
  dir: ScaleDir;
  x: string;
  y: string;
}[] = [
  { dir: "top", x: "50%", y: "-4px" },
  { dir: "bottom", x: "50%", y: "100%" },
  { dir: "left", x: "-4px", y: "50%" },
  { dir: "right", x: "100%", y: "50%" },
];

export type TemplatingStageProps = {
  stageRef: React.RefObject<HTMLDivElement>;
  onStagePointerDown: (e: React.PointerEvent) => void;
  onStagePointerMove: (e: React.PointerEvent) => void;
  onStagePointerUp: (e: React.PointerEvent) => void;
  onStageWheel?: (e: React.WheelEvent) => void;
  onDownObject: (e: React.PointerEvent, objectId?: string) => void;
  onDeleteActive: () => void;
  onToggleScaleLock: () => void;
  background: string | null;
  xrayContrast: number;
  cameraMode: boolean;
  cameraFit: "cover" | "contain";
  cameraDigitalZoom: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  objects: TemplatingCanvasObject[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  rulerMode: boolean;
  lldMode: boolean;
  offsetMode: boolean;
  angleMode: boolean;
  ahkaMode: boolean;
  panMode: boolean;
  zoom: number;
  canvasMode: CanvasMode;
  viewPan: { x: number; y: number };
  sourcePixelScale: number;
  annotationMode: boolean;
  onRotateHandleDown: (e: React.PointerEvent) => void;
  onScaleHandleDown: (e: React.PointerEvent, dir: ScaleDir) => void;
  measurements: RulerMeasurement[];
  lldMeasurements: LldMeasurement[];
  offsetMeasurements: OffsetMeasurement[];
  angleMeasurements: AngleMeasurement[];
  anglePoints: { x: number; y: number }[];
  angleDraft: { x: number; y: number } | null;
  ahkaMeasurements: AhkaMeasurement[];
  ahkaPoints: { x: number; y: number }[];
  ahkaDraft: { x: number; y: number } | null;
  draftStart: { x: number; y: number } | null;
  draftEnd: { x: number; y: number } | null;
  lldDraftStart: { x: number; y: number } | null;
  lldDraftEnd: { x: number; y: number } | null;
  offsetDraftStart: { x: number; y: number } | null;
  offsetDraftEnd: { x: number; y: number } | null;
  mmPerPixel: number | null;
  annotations: Annotation[];
  annotationDraft: {
    id?: string;
    x: number;
    y: number;
    text: string;
  } | null;
  onEditAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotationDraftText: (text: string) => void;
  onSaveAnnotationDraft: () => void;
  onCancelAnnotationDraft: () => void;
  onBeginMoveAnnotation: () => void;
  onTranslateAnnotation: (id: string, dx: number, dy: number) => void;
  drawLines: DrawLine[];
  drawLineStrokeWidth: number;
  drawMode: boolean;
  traceMode: boolean;
  pencilMode: boolean;
  corMode: boolean;
  drawAnchor: { x: number; y: number } | null;
  drawDraft: { x: number; y: number } | null;
  strokes: FreehandStroke[];
  strokeDraftPoints: Point[] | null;
  traceFillColor: string;
  traceFillOpacity: number; // 0..1
  corMarkers: CorMarker[];
  hoverMoveHint: boolean;
  ahkaStrokeWidth: number;
  rulerStrokeWidth: number;
  lldStrokeWidth: number;
  offsetStrokeWidth: number;
  angleStrokeWidth: number;
  pointRadius: number;
  pointFillMode: PointFillMode;
  pointFillColor: string;
  valgusCutMode: boolean;
  valgusCutLines: ValgusCutLine[];
  valgusCutAnchor: { x: number; y: number } | null;
  valgusCutDraft: { x: number; y: number } | null;
  valgusCutAngleDeg: number;
  valgusCutSide: Side;
  valgusCutOffsetPx: number;
  valgusCutStrokeWidth: number;
  valgusCutLineLengthPx: number;
  tibialSlopeMode: boolean;
  tibialSlopeLines: TibialSlopeLine[];
  tibialSlopeAnchor: { x: number; y: number } | null;
  tibialSlopeDraft: { x: number; y: number } | null;
  tibialSlopeDeg: number;
  tibialPosteriorSide: Side;
  tibialSlopeOffsetPx: number;
  tibialSlopeStrokeWidth: number;
  tibialSlopeLineLengthPx: number;
  tibialCutMode: boolean;
  tibialCutLines: TibialCutLine[];
  tibialCutAnchor: { x: number; y: number } | null;
  tibialCutDraft: { x: number; y: number } | null;
  tibialCutAngleDeg: number;
  tibialCutDirection: "Varus" | "Valgus";
  tibialCutOffsetPx: number;
  tibialCutStrokeWidth: number;
  tibialCutLineLengthPx: number;
  showRulerLabels: boolean;
  showLldLabels: boolean;
  showOffsetLabels: boolean;
  showAngleLabels: boolean;
  showAhkaLabels: boolean;
  showValgusCutLabels: boolean;
  showTibialSlopeLabels: boolean;
  showTibialCutLabels: boolean;
  cutout: CutoutRect | null;
  cutoutMode: boolean;
  cutoutPreview: CutoutPreview | null;
};

export function TemplatingStage({
  stageRef,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onStageWheel,
  onDownObject,
  onDeleteActive,
  onToggleScaleLock,
  background,
  xrayContrast,
  cameraMode,
  cameraFit,
  cameraDigitalZoom,
  videoRef,
  objects,
  activeId,
  setActiveId,
  rulerMode,
  lldMode,
  offsetMode,
  angleMode,
  ahkaMode,
  panMode,
  zoom,
  canvasMode,
  viewPan,
  sourcePixelScale,
  annotationMode,
  onRotateHandleDown,
  onScaleHandleDown,
  measurements,
  lldMeasurements,
  offsetMeasurements,
  angleMeasurements,
  anglePoints,
  angleDraft,
  ahkaMeasurements,
  ahkaPoints,
  ahkaDraft,
  draftStart,
  draftEnd,
  lldDraftStart,
  lldDraftEnd,
  offsetDraftStart,
  offsetDraftEnd,
  mmPerPixel,
  annotations,
  annotationDraft,
  onEditAnnotation,
  onUpdateAnnotationDraftText,
  onSaveAnnotationDraft,
  onCancelAnnotationDraft,
  onBeginMoveAnnotation,
  onTranslateAnnotation,
  drawLines,
  drawLineStrokeWidth,
  drawMode,
  traceMode,
  pencilMode,
  corMode,
  drawAnchor,
  drawDraft,
  strokes,
  strokeDraftPoints,
  traceFillColor,
  traceFillOpacity,
  corMarkers,
  hoverMoveHint,
  ahkaStrokeWidth,
  rulerStrokeWidth,
  lldStrokeWidth,
  offsetStrokeWidth,
  angleStrokeWidth,
  pointRadius,
  pointFillMode,
  pointFillColor,
  valgusCutMode,
  valgusCutLines,
  valgusCutAnchor,
  valgusCutDraft,
  valgusCutAngleDeg,
  valgusCutSide,
  valgusCutOffsetPx,
  valgusCutStrokeWidth,
  valgusCutLineLengthPx,
  tibialSlopeMode,
  tibialSlopeLines,
  tibialSlopeAnchor,
  tibialSlopeDraft,
  tibialSlopeDeg,
  tibialPosteriorSide,
  tibialSlopeOffsetPx,
  tibialSlopeStrokeWidth,
  tibialSlopeLineLengthPx,
  tibialCutMode,
  tibialCutLines,
  tibialCutAnchor,
  tibialCutDraft,
  tibialCutAngleDeg,
  tibialCutDirection,
  tibialCutOffsetPx,
  tibialCutStrokeWidth,
  tibialCutLineLengthPx,
  showRulerLabels,
  showLldLabels,
  showOffsetLabels,
  showAngleLabels,
  showAhkaLabels,
  showValgusCutLabels,
  showTibialSlopeLabels,
  showTibialCutLabels,
  cutout,
  cutoutMode,
  cutoutPreview,
}: TemplatingStageProps) {
  const cutoutMaskId = useId();
  const annotationDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    id: string | null;
    last: Point | null;
    moved: boolean;
    suppressClickUntil: number;
  }>({
    active: false,
    pointerId: null,
    id: null,
    last: null,
    moved: false,
    suppressClickUntil: 0,
  });
  const degToRad = (deg: number) => (deg * Math.PI) / 180;
  const resolvePointFill = (lineColor: string) => {
    if (pointFillMode === "transparent") return "transparent";
    if (pointFillMode === "matchLine") return lineColor;
    if (pointFillMode === "light") return "#ffffff";
    if (pointFillMode === "custom") return pointFillColor;
    return "#0b0f0d";
  };
  const resolvePointStrokeWidth = (lineWidth: number) =>
    Math.min(3, Math.max(1, lineWidth));
  const calibrated = typeof mmPerPixel === "number" && mmPerPixel > 0;
  const toMm = (px: number) => px * (mmPerPixel ?? 0);
  const formatDistancePx = (px: number) =>
    calibrated ? `${toMm(px).toFixed(1)} mm` : "Set mm/px";
  const formatRulerDistancePx = (px: number) =>
    calibrated ? `${toMm(px).toFixed(1)} mm` : "Set mm/px";

  const formatDistance = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => formatRulerDistancePx(Math.hypot(end.x - start.x, end.y - start.y));
  const formatAxisDistance = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    axis: "x" | "y"
  ) => formatDistancePx(Math.abs(end[axis] - start[axis]));
  const formatLld = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => `LLD ${formatAxisDistance(start, end, "y")}`;
  const formatOffset = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => `Head Offset ${formatAxisDistance(start, end, "x")}`;

  const formatAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const abLen = Math.hypot(ab.x, ab.y);
    const cbLen = Math.hypot(cb.x, cb.y);
    if (abLen === 0 || cbLen === 0) return "0.0°";
    const dot = ab.x * cb.x + ab.y * cb.y;
    const cos = Math.max(-1, Math.min(1, dot / (abLen * cbLen)));
    const angle = (Math.acos(cos) * 180) / Math.PI;
    return `${angle.toFixed(1)}°`;
  };

  const formatAhka = (
    hip: { x: number; y: number },
    knee: { x: number; y: number },
    ankle: { x: number; y: number },
    side?: Side
  ) => {
    const v1 = { x: hip.x - knee.x, y: hip.y - knee.y };
    const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };
    const v1Len = Math.hypot(v1.x, v1.y);
    const v2Len = Math.hypot(v2.x, v2.y);
    if (!v1Len || !v2Len) return "0.0°";
    const dot = v1.x * v2.x + v1.y * v2.y;
    const cos = Math.max(-1, Math.min(1, dot / (v1Len * v2Len)));
    const angle = (Math.acos(cos) * 180) / Math.PI;
    const deviation = 180 - angle;
    const rawCross = v1.x * v2.y - v1.y * v2.x;
    const resolvedSide = side ?? (knee.x < XRAY_BASE_WIDTH / 2 ? "Left" : "Right");
    const sideSign = resolvedSide === "Right" ? 1 : -1;
    const cross = rawCross * sideSign;
    const sideLabel = resolvedSide === "Right" ? "R" : "L";
    if (Math.abs(deviation) < 0.05) return `${sideLabel} Neutral 0.0°`;
    const label = cross >= 0 ? "Valgus" : "Varus";
    return `${sideLabel} ${label} ${Math.abs(deviation).toFixed(1)}°`;
  };

  const buildValgusCutGeometry = (
    hip: { x: number; y: number },
    knee: { x: number; y: number },
    params: { side: Side; angleDeg: number }
  ) => {
    const axis = { x: knee.x - hip.x, y: knee.y - hip.y };
    const axisLen = Math.hypot(axis.x, axis.y);
    if (!axisLen) return null;
    const axisUnit = { x: axis.x / axisLen, y: axis.y / axisLen };
    const baseline = { x: -axisUnit.y, y: axisUnit.x };
    const sign = params.side === "Right" ? 1 : -1;
    const theta = degToRad(params.angleDeg * sign);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const cutDir = {
      x: baseline.x * cos - baseline.y * sin,
      y: baseline.x * sin + baseline.y * cos,
    };
    const cutCenter = {
      x: knee.x + axisUnit.x * valgusCutOffsetPx,
      y: knee.y + axisUnit.y * valgusCutOffsetPx,
    };
    const half = Math.max(10, valgusCutLineLengthPx / 2);
    const cutA = {
      x: cutCenter.x - cutDir.x * half,
      y: cutCenter.y - cutDir.y * half,
    };
    const cutB = {
      x: cutCenter.x + cutDir.x * half,
      y: cutCenter.y + cutDir.y * half,
    };
    const baseA = {
      x: cutCenter.x - baseline.x * 60,
      y: cutCenter.y - baseline.y * 60,
    };
    const baseB = {
      x: cutCenter.x + baseline.x * 60,
      y: cutCenter.y + baseline.y * 60,
    };
    return { axisUnit, cutCenter, cutA, cutB, baseA, baseB };
  };

  const buildTibialSlopeGeometry = (
    prox: { x: number; y: number },
    dist: { x: number; y: number },
    params: { posteriorSide: Side; slopeDeg: number }
  ) => {
    const axis = { x: dist.x - prox.x, y: dist.y - prox.y };
    const axisLen = Math.hypot(axis.x, axis.y);
    if (!axisLen) return null;
    const axisUnit = { x: axis.x / axisLen, y: axis.y / axisLen };
    const baseline = { x: -axisUnit.y, y: axisUnit.x };
    const sign = params.posteriorSide === "Right" ? 1 : -1;
    const theta = degToRad(params.slopeDeg * sign);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const slopeDir = {
      x: baseline.x * cos - baseline.y * sin,
      y: baseline.x * sin + baseline.y * cos,
    };
    const cutCenter = {
      x: prox.x + axisUnit.x * tibialSlopeOffsetPx,
      y: prox.y + axisUnit.y * tibialSlopeOffsetPx,
    };
    const half = Math.max(10, tibialSlopeLineLengthPx / 2);
    const cutA = {
      x: cutCenter.x - slopeDir.x * half,
      y: cutCenter.y - slopeDir.y * half,
    };
    const cutB = {
      x: cutCenter.x + slopeDir.x * half,
      y: cutCenter.y + slopeDir.y * half,
    };
    const baseA = {
      x: cutCenter.x - baseline.x * 60,
      y: cutCenter.y - baseline.y * 60,
    };
    const baseB = {
      x: cutCenter.x + baseline.x * 60,
      y: cutCenter.y + baseline.y * 60,
    };
    return { axisUnit, cutCenter, cutA, cutB, baseA, baseB };
  };

  const buildTibialCutGeometry = (
    prox: { x: number; y: number },
    dist: { x: number; y: number },
    params: { direction: "Varus" | "Valgus"; angleDeg: number }
  ) => {
    const axis = { x: dist.x - prox.x, y: dist.y - prox.y };
    const axisLen = Math.hypot(axis.x, axis.y);
    if (!axisLen) return null;
    const axisUnit = { x: axis.x / axisLen, y: axis.y / axisLen };
    const baseline = { x: -axisUnit.y, y: axisUnit.x };
    const sign = params.direction === "Valgus" ? 1 : -1;
    const theta = degToRad(params.angleDeg * sign);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const cutDir = {
      x: baseline.x * cos - baseline.y * sin,
      y: baseline.x * sin + baseline.y * cos,
    };
    const cutCenter = {
      x: prox.x + axisUnit.x * tibialCutOffsetPx,
      y: prox.y + axisUnit.y * tibialCutOffsetPx,
    };
    const half = Math.max(10, tibialCutLineLengthPx / 2);
    const cutA = {
      x: cutCenter.x - cutDir.x * half,
      y: cutCenter.y - cutDir.y * half,
    };
    const cutB = {
      x: cutCenter.x + cutDir.x * half,
      y: cutCenter.y + cutDir.y * half,
    };
    const baseA = {
      x: cutCenter.x - baseline.x * 60,
      y: cutCenter.y - baseline.y * 60,
    };
    const baseB = {
      x: cutCenter.x + baseline.x * 60,
      y: cutCenter.y + baseline.y * 60,
    };
    return { axisUnit, cutCenter, cutA, cutB, baseA, baseB };
  };

  const getAngleLabel = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ) => {
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const v1Len = Math.hypot(v1.x, v1.y);
    const v2Len = Math.hypot(v2.x, v2.y);
    if (!v1Len || !v2Len) return { x: b.x + 12, y: b.y + 12 };
    const u1 = { x: v1.x / v1Len, y: v1.y / v1Len };
    const u2 = { x: v2.x / v2Len, y: v2.y / v2Len };
    const bis = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bisLen = Math.hypot(bis.x, bis.y);
    let dir = bis;
    if (!bisLen) {
      dir = { x: -u1.y, y: u1.x };
    } else {
      dir = { x: bis.x / bisLen, y: bis.y / bisLen };
    }
    const offset = 22;
    return { x: b.x + dir.x * offset, y: b.y + dir.y * offset };
  };

  const [xrayTransform, setXrayTransform] = useState<XrayTransform | null>(
    null
  );

  const viewPanX = viewPan.x;
  const viewPanY = viewPan.y;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const coverMode = cameraMode && cameraFit === "cover";
      const next = getXrayTransform(stageRef, zoom, canvasMode, coverMode, {
        x: viewPanX,
        y: viewPanY,
      });
      if (!next) return;
      setXrayTransform(next);
    };
    update();
    const node = stageRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [cameraFit, cameraMode, canvasMode, stageRef, viewPanX, viewPanY, zoom]);

  const xrayScale = xrayTransform?.scale ?? zoom;
  const xrayOffsetX = xrayTransform?.offsetX ?? 0;
  const xrayOffsetY = xrayTransform?.offsetY ?? 0;
  const xrayStyle = {
    width: XRAY_BASE_WIDTH,
    height: XRAY_BASE_HEIGHT,
    transform: `translate(${xrayOffsetX}px, ${xrayOffsetY}px) scale(${xrayScale})`,
    transformOrigin: "top left",
  };

  const clientToStagePoint = (clientX: number, clientY: number): Point | null => {
    const t = xrayTransform;
    if (!t) return null;
    const x = (clientX - t.rect.left - t.offsetX) / t.scale;
    const y = (clientY - t.rect.top - t.offsetY) / t.scale;
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    return {
      x: Math.min(XRAY_BASE_WIDTH, Math.max(0, x)),
      y: Math.min(XRAY_BASE_HEIGHT, Math.max(0, y)),
    };
  };

  const activeCutout = cutoutPreview ?? (cutout?.hidden ? null : cutout);
  const activeCutoutShape = (activeCutout?.shape ?? cutout?.shape ?? "rect") as
    | "rect"
    | "circle"
    | "polygon";
  const activeCutoutOpacity = cutoutPreview?.opacity ?? cutout?.opacity ?? 0.65;
  const activeCutoutPoints =
    activeCutoutShape === "polygon" ? (activeCutout?.points ?? []) : [];
  const activeCutoutCursor =
    cutoutPreview && activeCutoutShape === "polygon" ? cutoutPreview.cursor ?? null : null;
  const activeCutoutClosed =
    activeCutoutShape !== "polygon" ? true : Boolean(cutoutPreview ? cutoutPreview.closed : true);
  const activeCutoutCx = activeCutout ? activeCutout.x + activeCutout.width / 2 : 0;
  const activeCutoutCy = activeCutout ? activeCutout.y + activeCutout.height / 2 : 0;
  const activeCutoutR = activeCutout
    ? Math.min(activeCutout.width, activeCutout.height) / 2
    : 0;

  const measurementCursor =
    rulerMode ||
    angleMode ||
    lldMode ||
    offsetMode ||
    annotationMode ||
    ahkaMode ||
    valgusCutMode ||
    tibialSlopeMode ||
    tibialCutMode ||
    cutoutMode ||
    traceMode ||
    pencilMode ||
    corMode ||
    drawMode;

  const visibleAnnotations = annotations.filter((a) => !a.hidden);
  const visibleAngleMeasurements = angleMeasurements.filter((m) => !m.hidden);
  const visibleAhkaMeasurements = ahkaMeasurements.filter((m) => !m.hidden);
  const visibleRulerMeasurements = measurements.filter((m) => !m.hidden);
  const visibleLldMeasurements = lldMeasurements.filter((m) => !m.hidden);
  const visibleOffsetMeasurements = offsetMeasurements.filter((m) => !m.hidden);
  const visibleDrawLines = drawLines.filter((line) => !line.hidden);
  const visibleStrokes = strokes.filter((s) => !s.hidden);
  const visibleCorMarkers = corMarkers.filter((m) => !m.hidden);
  const visibleValgusCutLines = valgusCutLines.filter((line) => !line.hidden);
  const visibleTibialSlopeLines = tibialSlopeLines.filter((line) => !line.hidden);
  const visibleTibialCutLines = tibialCutLines.filter((line) => !line.hidden);

  const totalDistancePx = visibleRulerMeasurements.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const currentLabel =
    draftStart && draftEnd ? formatDistance(draftStart, draftEnd) : null;
  const totalLabel = visibleRulerMeasurements.length
    ? formatRulerDistancePx(totalDistancePx)
    : null;
  const lastMeasurement =
    visibleRulerMeasurements[visibleRulerMeasurements.length - 1] ?? null;
  const lastLabel = lastMeasurement
    ? formatDistance(lastMeasurement.start, lastMeasurement.end)
    : null;

  const getStrokeColor = (stroke: FreehandStroke) =>
    stroke.color ??
    (stroke.kind === "trace" ? "#c084fc" : "#60a5fa");

  const isClosedTrace = (points: Point[]) => {
    if (points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    return Math.hypot(first.x - last.x, first.y - last.y) <= 14;
  };

  const toPath = (points: Point[]) => {
    if (!points.length) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  const toClosedPath = (points: Point[]) => `${toPath(points)} Z`;

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 isolate touch-none ${
        hoverMoveHint
          ? "cursor-move"
          : measurementCursor
            ? "cursor-crosshair"
            : panMode
              ? "cursor-grab active:cursor-grabbing"
              : ""
      }`}
      data-tour="stage"
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}
      onWheel={onStageWheel}
    >
      <div className="absolute left-0 top-0" style={xrayStyle}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AnimatePresence initial={false}>
            {cameraMode ? (
              <motion.div
                key="camera"
                className="h-full w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`block h-full w-full ${
                    cameraFit === "contain" ? "object-contain" : "object-cover"
                  }`}
                  style={
                    cameraDigitalZoom !== 1
                      ? {
                          transform: `scale(${cameraDigitalZoom})`,
                          transformOrigin: "center",
                        }
                      : undefined
                  }
                />
              </motion.div>
            ) : (
              background && (
                <motion.div
                  key={background}
                  className="h-full w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Image
                    src={background}
                    alt="X-ray"
                    width={XRAY_BASE_WIDTH}
                    height={XRAY_BASE_HEIGHT}
                    unoptimized
                    className="block h-full w-full object-contain"
                    style={{ filter: `contrast(${xrayContrast})` }}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {activeCutout && activeCutoutShape !== "polygon" && (
          <svg
            className="absolute inset-0 z-[5] pointer-events-none"
            viewBox={`0 0 ${XRAY_BASE_WIDTH} ${XRAY_BASE_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <defs>
              <mask id={cutoutMaskId}>
                <rect
                  x={0}
                  y={0}
                  width={XRAY_BASE_WIDTH}
                  height={XRAY_BASE_HEIGHT}
                  fill="white"
                />
                {activeCutoutShape === "circle" ? (
                  <circle
                    cx={activeCutoutCx}
                    cy={activeCutoutCy}
                    r={activeCutoutR}
                    fill="black"
                  />
                ) : (
                  <rect
                    x={activeCutout.x}
                    y={activeCutout.y}
                    width={activeCutout.width}
                    height={activeCutout.height}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x={0}
              y={0}
              width={XRAY_BASE_WIDTH}
              height={XRAY_BASE_HEIGHT}
              fill={`rgba(0,0,0,${activeCutoutOpacity})`}
              mask={`url(#${cutoutMaskId})`}
            />
          </svg>
        )}

        {activeCutoutShape === "polygon" &&
          activeCutoutClosed &&
          activeCutoutPoints.length >= 3 && (
            <svg
              className="absolute inset-0 z-[5] pointer-events-none"
              viewBox={`0 0 ${XRAY_BASE_WIDTH} ${XRAY_BASE_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <defs>
                <mask id={cutoutMaskId}>
                  <rect
                    x={0}
                    y={0}
                    width={XRAY_BASE_WIDTH}
                    height={XRAY_BASE_HEIGHT}
                    fill="white"
                  />
                  <polygon
                    points={activeCutoutPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x={0}
                y={0}
                width={XRAY_BASE_WIDTH}
                height={XRAY_BASE_HEIGHT}
                fill={`rgba(0,0,0,${activeCutoutOpacity})`}
                mask={`url(#${cutoutMaskId})`}
              />
            </svg>
          )}

        <div className="absolute inset-0 z-10">
          {objects.map((o) => (
            <div
              key={o.id}
              style={{
                transform: `
                  translate(${o.position.x}px, ${o.position.y}px)
                  scale(
                    ${o.scaleX * (o.flipX ?? 1)},
                    ${o.scaleY * (o.flipY ?? 1)}
                  )
                  rotate(${o.rotation}deg)
                `,
                transformOrigin: "center",
                opacity: o.opacity,
              }}
              className={`absolute ${
                !measurementCursor && o.id === activeId ? "ring-2 ring-blue-500" : ""
              } ${!measurementCursor ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
            >
              <div
                onPointerDown={(e) => {
                  if (measurementCursor || panMode || e.shiftKey) return;
                  setActiveId(o.id);
                  e.stopPropagation();
                  onDownObject(e, o.id);
                }}
              >
                {activeId === o.id && !measurementCursor && !panMode && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      onPointerDown={onRotateHandleDown}
                      className="
pointer-events-auto absolute z-20
-top-10 left-1/2 -translate-x-1/2
w-8 h-8 rounded-full
bg-blue-600 text-white
flex items-center justify-center
shadow-lg
cursor-ew-resize
"
                      title="Rotate handle"
                    >
                      <Rotate3d />
                    </div>

                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleScaleLock();
                      }}
                      className={`
pointer-events-auto absolute z-20
-top-10 left-2
w-8 h-8 rounded-full
flex items-center justify-center
shadow-lg
transition
${o.scaleLocked ? "bg-gray-900 text-white" : "bg-gray-500/80 text-white hover:bg-gray-600"}
`}
                      aria-label={o.scaleLocked ? "Unlock scale" : "Lock scale"}
                      title={o.scaleLocked ? "Unlock scale" : "Lock scale"}
                    >
                      {o.scaleLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteActive();
                      }}
                      className="
pointer-events-auto absolute z-20
-top-10 right-2
w-8 h-8 rounded-full
bg-red-600 text-white
flex items-center justify-center
shadow-lg
hover:bg-red-700
"
                      aria-label="Remove overlay"
                      title="Remove overlay"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {SCALE_HANDLES.map(({ dir, x, y }) => (
                      <div
                        key={dir}
                        onPointerDown={(e) => {
                          if (o.scaleLocked) {
                            e.stopPropagation();
                            return;
                          }
                          onScaleHandleDown(e, dir);
                        }}
                        className={`
pointer-events-auto absolute z-20
w-3 h-3 rounded-full
bg-white border border-blue-700
${o.scaleLocked ? "cursor-not-allowed opacity-40" : "cursor-ns-resize"}
`}
                        title={o.scaleLocked ? "Scale locked" : "Drag to scale"}
                        style={{
                          left: x,
                          top: y,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    ))}
                  </div>
                )}

                {o.type === "shape" ? (
                  <div className="pointer-events-none p-8">
                    <svg
                      width={300}
                      height={300}
                      viewBox="0 0 300 300"
                      className="block"
                    >
                      {o.shape === "circle" ? (
                        <circle
                          cx={150}
                          cy={150}
                          r={128}
                          fill={o.fill}
                          stroke={o.stroke}
                          strokeWidth={o.strokeWidth}
                        />
                      ) : o.shape === "square" ? (
                        <rect
                          x={28}
                          y={28}
                          width={244}
                          height={244}
                          fill={o.fill}
                          stroke={o.stroke}
                          strokeWidth={o.strokeWidth}
                        />
                      ) : (
                        <path
                          d="M150 26 L274 274 L26 274 Z"
                          fill={o.fill}
                          stroke={o.stroke}
                          strokeWidth={o.strokeWidth}
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  </div>
                ) : (
                  <Image
                    src={o.imageSrc}
                    alt={o.name}
                    width={o.type === "image" ? o.baseWidth ?? 300 : 300}
                    height={o.type === "image" ? o.baseHeight ?? 300 : 300}
                    unoptimized
                    className="pointer-events-none"
                    style={{
                      padding:
                        o.type === "implant"
                          ? 32
                          : o.type === "image"
                            ? o.paddingPx ?? 32
                            : 32,
                      mixBlendMode: o.type === "implant" ? "screen" : undefined,
                      width: "auto",
                      height: "auto",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {visibleAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute z-50"
            style={{ left: annotation.x, top: annotation.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2 -translate-x-1/2 -translate-y-full">
              <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shadow" />
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (annotation.locked) return;
                  const point = clientToStagePoint(e.clientX, e.clientY);
                  if (!point) return;
                  onBeginMoveAnnotation();
                  annotationDragRef.current.active = true;
                  annotationDragRef.current.pointerId = e.pointerId;
                  annotationDragRef.current.id = annotation.id;
                  annotationDragRef.current.last = point;
                  annotationDragRef.current.moved = false;
                  try {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                }}
                onPointerMove={(e) => {
                  const drag = annotationDragRef.current;
                  if (!drag.active || drag.pointerId !== e.pointerId || !drag.id) return;
                  const point = clientToStagePoint(e.clientX, e.clientY);
                  if (!point || !drag.last) return;
                  const dx = point.x - drag.last.x;
                  const dy = point.y - drag.last.y;
                  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                    drag.moved = true;
                    onTranslateAnnotation(drag.id, dx, dy);
                    drag.last = point;
                  }
                }}
                onPointerUp={(e) => {
                  const drag = annotationDragRef.current;
                  if (drag.pointerId === e.pointerId) {
                    if (drag.moved) {
                      annotationDragRef.current.suppressClickUntil = Date.now() + 250;
                    }
                    annotationDragRef.current.active = false;
                    annotationDragRef.current.pointerId = null;
                    annotationDragRef.current.id = null;
                    annotationDragRef.current.last = null;
                    annotationDragRef.current.moved = false;
                  }
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                }}
                onPointerCancel={() => {
                  annotationDragRef.current.active = false;
                  annotationDragRef.current.pointerId = null;
                  annotationDragRef.current.id = null;
                  annotationDragRef.current.last = null;
                  annotationDragRef.current.moved = false;
                }}
                onClick={() => {
                  if (Date.now() < annotationDragRef.current.suppressClickUntil) return;
                  onEditAnnotation(annotation);
                }}
                className={`max-w-[180px] rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-900 shadow hover:bg-amber-100 ${
                  annotation.locked
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-grab active:cursor-grabbing"
                }`}
                title={annotation.text}
              >
                {annotation.text}
              </button>
            </div>
          </div>
        ))}

        {annotationDraft && (
          <div
            className="absolute z-50"
            style={{ left: annotationDraft.x, top: annotationDraft.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="w-48 -translate-x-1/2 -translate-y-full rounded-lg border border-amber-200 bg-white/95 p-2 text-[11px] shadow-lg">
              <input
                autoFocus
                value={annotationDraft.text}
                onChange={(e) => onUpdateAnnotationDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSaveAnnotationDraft();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    onCancelAnnotationDraft();
                  }
                }}
                placeholder="Add note..."
                className="w-full rounded border border-amber-200 px-2 py-1 text-[11px]"
              />
              <div className="mt-1 flex gap-1">
                <button
                  onClick={onSaveAnnotationDraft}
                  className="flex-1 rounded bg-amber-500 px-2 py-1 text-white hover:bg-amber-600"
                >
                  Save
                </button>
                <button
                  onClick={onCancelAnnotationDraft}
                  className="flex-1 rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 9999, mixBlendMode: "normal" }}
          data-tour="measure-overlay"
        >
          {rulerMode && (currentLabel || lastLabel || totalLabel) && (
            <div className="absolute left-3 top-3 rounded-lg bg-red-800/70 px-3 py-2 text-[16px] text-green-400 shadow-sm">
              {currentLabel && <div>Current: {currentLabel}</div>}
              {!currentLabel && lastLabel && <div>Last: {lastLabel}</div>}
              {totalLabel && <div>Total: {totalLabel}</div>}
            </div>
          )}
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            {activeCutout &&
              (() => {
                const rect = activeCutout;
                const isPreview = Boolean(cutoutPreview);
                const stroke = isPreview
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.9)";
                const dash = isPreview ? "6 4" : undefined;
                const handleR = 6;

                if (activeCutoutShape === "circle") {
                  const x1 = rect.x;
                  const y1 = rect.y;
                  const x2 = rect.x + rect.width;
                  const y2 = rect.y + rect.height;
                  const cx = activeCutoutCx;
                  const cy = activeCutoutCy;
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={activeCutoutR}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={2}
                        strokeDasharray={dash}
                      />
                      {cutoutMode && !isPreview && (
                        <g>
                          <circle
                            cx={cx}
                            cy={y1}
                            r={handleR}
                            fill="#0b0f0d"
                            stroke={stroke}
                            strokeWidth={2}
                          />
                          <circle
                            cx={x2}
                            cy={cy}
                            r={handleR}
                            fill="#0b0f0d"
                            stroke={stroke}
                            strokeWidth={2}
                          />
                          <circle
                            cx={cx}
                            cy={y2}
                            r={handleR}
                            fill="#0b0f0d"
                            stroke={stroke}
                            strokeWidth={2}
                          />
                          <circle
                            cx={x1}
                            cy={cy}
                            r={handleR}
                            fill="#0b0f0d"
                            stroke={stroke}
                            strokeWidth={2}
                          />
                        </g>
                      )}
                    </g>
                  );
                }

                if (activeCutoutShape === "polygon") {
                  const points = activeCutoutPoints;
                  const cursor = activeCutoutCursor;
                  const polylinePoints = cursor
                    ? [...points, cursor]
                    : points;
                  const showVertices = cutoutMode && !isPreview;

                  return (
                    <g>
                      {activeCutoutClosed && points.length >= 3 ? (
                        <polygon
                          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke={stroke}
                          strokeWidth={2}
                          strokeDasharray={dash}
                        />
                      ) : (
                        polylinePoints.length >= 2 && (
                          <polyline
                            points={polylinePoints
                              .map((p) => `${p.x},${p.y}`)
                              .join(" ")}
                            fill="none"
                            stroke={stroke}
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )
                      )}

                      {(showVertices || isPreview) &&
                        points.map((p, idx) => (
                          <circle
                            key={`${idx}-${p.x}-${p.y}`}
                            cx={p.x}
                            cy={p.y}
                            r={handleR}
                            fill="#0b0f0d"
                            stroke={stroke}
                            strokeWidth={2}
                          />
                        ))}

                      {!activeCutoutClosed && points.length ? (
                        <circle
                          cx={points[0].x}
                          cy={points[0].y}
                          r={handleR + 2}
                          fill="transparent"
                          stroke={stroke}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                        />
                      ) : null}
                    </g>
                  );
                }

                const x1 = rect.x;
                const y1 = rect.y;
                const x2 = rect.x + rect.width;
                const y2 = rect.y + rect.height;
                return (
                  <g>
                    <rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={2}
                      strokeDasharray={dash}
                    />
                    {cutoutMode && !isPreview && (
                      <g>
                        <circle
                          cx={x1}
                          cy={y1}
                          r={handleR}
                          fill="#0b0f0d"
                          stroke={stroke}
                          strokeWidth={2}
                        />
                        <circle
                          cx={x2}
                          cy={y1}
                          r={handleR}
                          fill="#0b0f0d"
                          stroke={stroke}
                          strokeWidth={2}
                        />
                        <circle
                          cx={x1}
                          cy={y2}
                          r={handleR}
                          fill="#0b0f0d"
                          stroke={stroke}
                          strokeWidth={2}
                        />
                        <circle
                          cx={x2}
                          cy={y2}
                          r={handleR}
                          fill="#0b0f0d"
                          stroke={stroke}
                          strokeWidth={2}
                        />
                      </g>
                    )}
                  </g>
                );
              })()}
            {(visibleValgusCutLines.length ||
              (valgusCutMode && valgusCutAnchor && valgusCutDraft)) && (
              <g>
                {visibleValgusCutLines.map((line, index) => {
                  const geom = buildValgusCutGeometry(line.hip, line.knee, {
                    side: line.side,
                    angleDeg: line.angleDeg,
                  });
                  if (!geom) return null;
                  const label = `VC${index + 1} ${line.side} Valgus ${line.angleDeg}°`;
                  return (
                    <g key={line.id}>
                      <circle
                        cx={line.hip.x}
                        cy={line.hip.y}
                        r={pointRadius}
                        fill={resolvePointFill(VALGUS_CUT_COLOR)}
                        stroke={VALGUS_CUT_COLOR}
                        strokeWidth={resolvePointStrokeWidth(valgusCutStrokeWidth)}
                      />
                      <circle
                        cx={line.knee.x}
                        cy={line.knee.y}
                        r={pointRadius}
                        fill={resolvePointFill(VALGUS_CUT_COLOR)}
                        stroke={VALGUS_CUT_COLOR}
                        strokeWidth={resolvePointStrokeWidth(valgusCutStrokeWidth)}
                      />
                      <line
                        x1={line.hip.x}
                        y1={line.hip.y}
                        x2={line.knee.x}
                        y2={line.knee.y}
                        stroke={VALGUS_CUT_COLOR}
                        strokeWidth={Math.max(1, valgusCutStrokeWidth - 0.5)}
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        opacity={0.8}
                      />
                      <line
                        x1={geom.baseA.x}
                        y1={geom.baseA.y}
                        x2={geom.baseB.x}
                        y2={geom.baseB.y}
                        stroke={VALGUS_CUT_COLOR}
                        strokeWidth={Math.max(1, valgusCutStrokeWidth - 0.8)}
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        opacity={0.75}
                      />
                      <line
                        x1={geom.cutA.x}
                        y1={geom.cutA.y}
                        x2={geom.cutB.x}
                        y2={geom.cutB.y}
                        stroke={VALGUS_CUT_COLOR}
                        strokeWidth={valgusCutStrokeWidth}
                        strokeLinecap="round"
                      />
                      {showValgusCutLabels && (
                        <text
                          x={geom.cutCenter.x}
                          y={geom.cutCenter.y - 10}
                          fill={VALGUS_CUT_COLOR}
                          fontSize={ANGLE_FONT_SIZE}
                          fontWeight={700}
                          stroke="#0b0f0d"
                          strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                          strokeLinejoin="round"
                          paintOrder="stroke"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {valgusCutAnchor && valgusCutDraft && (
                  <g>
                    <circle
                      cx={valgusCutAnchor.x}
                      cy={valgusCutAnchor.y}
                      r={pointRadius}
                      fill={resolvePointFill(VALGUS_CUT_COLOR)}
                      stroke={VALGUS_CUT_COLOR}
                      strokeWidth={resolvePointStrokeWidth(valgusCutStrokeWidth)}
                    />
                    <line
                      x1={valgusCutAnchor.x}
                      y1={valgusCutAnchor.y}
                      x2={valgusCutDraft.x}
                      y2={valgusCutDraft.y}
                      stroke={VALGUS_CUT_COLOR}
                      strokeWidth={valgusCutStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )}

            {(visibleTibialSlopeLines.length ||
              (tibialSlopeMode && tibialSlopeAnchor && tibialSlopeDraft)) && (
              <g>
                {visibleTibialSlopeLines.map((line, index) => {
                  const geom = buildTibialSlopeGeometry(line.prox, line.dist, {
                    posteriorSide: line.posteriorSide,
                    slopeDeg: line.slopeDeg,
                  });
                  if (!geom) return null;
                  const label = `TS${index + 1} ${line.posteriorSide} Posterior ${line.slopeDeg}°`;
                  return (
                    <g key={line.id}>
                      <circle
                        cx={line.prox.x}
                        cy={line.prox.y}
                        r={pointRadius}
                        fill={resolvePointFill(TIBIAL_SLOPE_COLOR)}
                        stroke={TIBIAL_SLOPE_COLOR}
                        strokeWidth={resolvePointStrokeWidth(tibialSlopeStrokeWidth)}
                      />
                      <circle
                        cx={line.dist.x}
                        cy={line.dist.y}
                        r={pointRadius}
                        fill={resolvePointFill(TIBIAL_SLOPE_COLOR)}
                        stroke={TIBIAL_SLOPE_COLOR}
                        strokeWidth={resolvePointStrokeWidth(tibialSlopeStrokeWidth)}
                      />
                      <line
                        x1={line.prox.x}
                        y1={line.prox.y}
                        x2={line.dist.x}
                        y2={line.dist.y}
                        stroke={TIBIAL_SLOPE_COLOR}
                        strokeWidth={Math.max(1, tibialSlopeStrokeWidth - 0.5)}
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        opacity={0.8}
                      />
                      <line
                        x1={geom.baseA.x}
                        y1={geom.baseA.y}
                        x2={geom.baseB.x}
                        y2={geom.baseB.y}
                        stroke={TIBIAL_SLOPE_COLOR}
                        strokeWidth={Math.max(1, tibialSlopeStrokeWidth - 0.8)}
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        opacity={0.75}
                      />
                      <line
                        x1={geom.cutA.x}
                        y1={geom.cutA.y}
                        x2={geom.cutB.x}
                        y2={geom.cutB.y}
                        stroke={TIBIAL_SLOPE_COLOR}
                        strokeWidth={tibialSlopeStrokeWidth}
                        strokeLinecap="round"
                      />
                      {showTibialSlopeLabels && (
                        <text
                          x={geom.cutCenter.x}
                          y={geom.cutCenter.y - 10}
                          fill={TIBIAL_SLOPE_COLOR}
                          fontSize={ANGLE_FONT_SIZE}
                          fontWeight={700}
                          stroke="#0b0f0d"
                          strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                          strokeLinejoin="round"
                          paintOrder="stroke"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {tibialSlopeAnchor && tibialSlopeDraft && (
                  <g>
                    <circle
                      cx={tibialSlopeAnchor.x}
                      cy={tibialSlopeAnchor.y}
                      r={pointRadius}
                      fill={resolvePointFill(TIBIAL_SLOPE_COLOR)}
                      stroke={TIBIAL_SLOPE_COLOR}
                      strokeWidth={resolvePointStrokeWidth(tibialSlopeStrokeWidth)}
                    />
                    <line
                      x1={tibialSlopeAnchor.x}
                      y1={tibialSlopeAnchor.y}
                      x2={tibialSlopeDraft.x}
                      y2={tibialSlopeDraft.y}
                      stroke={TIBIAL_SLOPE_COLOR}
                      strokeWidth={tibialSlopeStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )}

            {(visibleTibialCutLines.length ||
              (tibialCutMode && tibialCutAnchor && tibialCutDraft)) && (
              <g>
                {visibleTibialCutLines.map((line, index) => {
                  const geom = buildTibialCutGeometry(line.prox, line.dist, {
                    direction: line.direction,
                    angleDeg: line.angleDeg,
                  });
                  if (!geom) return null;
                  const label = `TC${index + 1} ${line.angleDeg}°`;
                  return (
                    <g key={line.id}>
                      <circle
                        cx={line.prox.x}
                        cy={line.prox.y}
                        r={pointRadius}
                        fill={resolvePointFill(TIBIAL_CUT_COLOR)}
                        stroke={TIBIAL_CUT_COLOR}
                        strokeWidth={resolvePointStrokeWidth(tibialCutStrokeWidth)}
                      />
                      <circle
                        cx={line.dist.x}
                        cy={line.dist.y}
                        r={pointRadius}
                        fill={resolvePointFill(TIBIAL_CUT_COLOR)}
                        stroke={TIBIAL_CUT_COLOR}
                        strokeWidth={resolvePointStrokeWidth(tibialCutStrokeWidth)}
                      />
                      <line
                        x1={line.prox.x}
                        y1={line.prox.y}
                        x2={line.dist.x}
                        y2={line.dist.y}
                        stroke={TIBIAL_CUT_COLOR}
                        strokeWidth={Math.max(1, tibialCutStrokeWidth - 0.5)}
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        opacity={0.8}
                      />
                      <line
                        x1={geom.baseA.x}
                        y1={geom.baseA.y}
                        x2={geom.baseB.x}
                        y2={geom.baseB.y}
                        stroke={TIBIAL_CUT_COLOR}
                        strokeWidth={Math.max(1, tibialCutStrokeWidth - 0.8)}
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        opacity={0.75}
                      />
                      <line
                        x1={geom.cutA.x}
                        y1={geom.cutA.y}
                        x2={geom.cutB.x}
                        y2={geom.cutB.y}
                        stroke={TIBIAL_CUT_COLOR}
                        strokeWidth={tibialCutStrokeWidth}
                        strokeLinecap="round"
                      />
                      {showTibialCutLabels && (
                        <text
                          x={geom.cutCenter.x}
                          y={geom.cutCenter.y - 10}
                          fill={TIBIAL_CUT_COLOR}
                          fontSize={ANGLE_FONT_SIZE}
                          fontWeight={700}
                          stroke="#0b0f0d"
                          strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                          strokeLinejoin="round"
                          paintOrder="stroke"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {tibialCutAnchor && tibialCutDraft && (
                  <g>
                    <circle
                      cx={tibialCutAnchor.x}
                      cy={tibialCutAnchor.y}
                      r={pointRadius}
                      fill={resolvePointFill(TIBIAL_CUT_COLOR)}
                      stroke={TIBIAL_CUT_COLOR}
                      strokeWidth={resolvePointStrokeWidth(tibialCutStrokeWidth)}
                    />
                    <line
                      x1={tibialCutAnchor.x}
                      y1={tibialCutAnchor.y}
                      x2={tibialCutDraft.x}
                      y2={tibialCutDraft.y}
                      stroke={TIBIAL_CUT_COLOR}
                      strokeWidth={tibialCutStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )}

            {drawMode && drawAnchor && (
              <g>
                <circle
                  cx={drawAnchor.x}
                  cy={drawAnchor.y}
                  r={pointRadius}
                  fill={resolvePointFill(DRAW_LINE_COLOR)}
                  stroke={DRAW_LINE_COLOR}
                  strokeWidth={resolvePointStrokeWidth(drawLineStrokeWidth)}
                />
                {drawDraft && (
                  <line
                    x1={drawAnchor.x}
                    y1={drawAnchor.y}
                    x2={drawDraft.x}
                    y2={drawDraft.y}
                    stroke={DRAW_LINE_COLOR}
                    strokeWidth={drawLineStrokeWidth}
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                )}
              </g>
            )}
            {visibleAngleMeasurements.map((angle) => {
              const labelPos = getAngleLabel(angle.a, angle.b, angle.c);
              return (
                <g key={angle.id}>
                  <line
                    x1={angle.b.x}
                    y1={angle.b.y}
                    x2={angle.a.x}
                    y2={angle.a.y}
                    stroke={ANGLE_COLOR}
                    strokeWidth={angleStrokeWidth}
                    strokeLinecap="round"
                  />
                  <line
                    x1={angle.b.x}
                    y1={angle.b.y}
                    x2={angle.c.x}
                    y2={angle.c.y}
                    stroke={ANGLE_COLOR}
                    strokeWidth={angleStrokeWidth}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={angle.b.x}
                    cy={angle.b.y}
                    r={pointRadius}
                    fill={resolvePointFill(ANGLE_COLOR)}
                    stroke={ANGLE_COLOR}
                    strokeWidth={resolvePointStrokeWidth(angleStrokeWidth)}
                  />
                  {showAngleLabels && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill={ANGLE_COLOR}
                      fontSize={ANGLE_FONT_SIZE}
                      fontWeight={700}
                      stroke="#0b0f0d"
                      strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      dominantBaseline="middle"
                      textAnchor="middle"
                    >
                      {formatAngle(angle.a, angle.b, angle.c)}
                    </text>
                  )}
                </g>
              );
            })}

            {anglePoints.length === 1 && angleDraft && (
              <g>
                <line
                  x1={anglePoints[0].x}
                  y1={anglePoints[0].y}
                  x2={angleDraft.x}
                  y2={angleDraft.y}
                  stroke={ANGLE_COLOR}
                  strokeWidth={angleStrokeWidth}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </g>
            )}

            {anglePoints.length === 2 &&
              angleDraft &&
              (() => {
                const labelPos = getAngleLabel(
                  anglePoints[0],
                  anglePoints[1],
                  angleDraft
                );
                return (
                  <g>
                    <line
                      x1={anglePoints[1].x}
                      y1={anglePoints[1].y}
                      x2={anglePoints[0].x}
                      y2={anglePoints[0].y}
                      stroke={ANGLE_COLOR}
                      strokeWidth={angleStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={anglePoints[1].x}
                      y1={anglePoints[1].y}
                      x2={angleDraft.x}
                      y2={angleDraft.y}
                      stroke={ANGLE_COLOR}
                      strokeWidth={angleStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    {showAngleLabels && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        fill={ANGLE_COLOR}
                        fontSize={ANGLE_FONT_SIZE}
                        fontWeight={700}
                        stroke="#0b0f0d"
                        strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        dominantBaseline="middle"
                        textAnchor="middle"
                      >
                        {formatAngle(anglePoints[0], anglePoints[1], angleDraft)}
                      </text>
                    )}
                  </g>
                );
              })()}

            {visibleAhkaMeasurements.map((m) => {
              const labelPos = getAngleLabel(m.hip, m.knee, m.ankle);
              return (
                <g key={m.id}>
                  <line
                    x1={m.knee.x}
                    y1={m.knee.y}
                    x2={m.hip.x}
                    y2={m.hip.y}
                    stroke={AHKA_COLOR}
                    strokeWidth={ahkaStrokeWidth}
                    strokeLinecap="round"
                  />
                  <line
                    x1={m.knee.x}
                    y1={m.knee.y}
                    x2={m.ankle.x}
                    y2={m.ankle.y}
                    stroke={AHKA_COLOR}
                    strokeWidth={ahkaStrokeWidth}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={m.knee.x}
                    cy={m.knee.y}
                    r={pointRadius}
                    fill={resolvePointFill(AHKA_COLOR)}
                    stroke={AHKA_COLOR}
                    strokeWidth={resolvePointStrokeWidth(ahkaStrokeWidth)}
                  />
                  {showAhkaLabels && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill={AHKA_COLOR}
                      fontSize={ANGLE_FONT_SIZE}
                      fontWeight={700}
                      stroke="#0b0f0d"
                      strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      dominantBaseline="middle"
                      textAnchor="middle"
                    >
                      {formatAhka(m.hip, m.knee, m.ankle, m.side)}
                    </text>
                  )}
                </g>
              );
            })}
            {ahkaPoints.length === 1 && ahkaDraft && (
              <g>
                <line
                  x1={ahkaPoints[0].x}
                  y1={ahkaPoints[0].y}
                  x2={ahkaDraft.x}
                  y2={ahkaDraft.y}
                  stroke={AHKA_COLOR}
                  strokeWidth={ahkaStrokeWidth}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </g>
            )}
            {ahkaPoints.length === 2 &&
              ahkaDraft &&
              (() => {
                const labelPos = getAngleLabel(
                  ahkaPoints[0],
                  ahkaPoints[1],
                  ahkaDraft
                );
                return (
                  <g>
                    <line
                      x1={ahkaPoints[1].x}
                      y1={ahkaPoints[1].y}
                      x2={ahkaPoints[0].x}
                      y2={ahkaPoints[0].y}
                      stroke={AHKA_COLOR}
                      strokeWidth={ahkaStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={ahkaPoints[1].x}
                      y1={ahkaPoints[1].y}
                      x2={ahkaDraft.x}
                      y2={ahkaDraft.y}
                      stroke={AHKA_COLOR}
                      strokeWidth={ahkaStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    {showAhkaLabels && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        fill={AHKA_COLOR}
                        fontSize={ANGLE_FONT_SIZE}
                        fontWeight={700}
                        stroke="#0b0f0d"
                        strokeWidth={ANGLE_LABEL_STROKE_WIDTH}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        dominantBaseline="middle"
                        textAnchor="middle"
                      >
                        {formatAhka(ahkaPoints[0], ahkaPoints[1], ahkaDraft)}
                      </text>
                    )}
                  </g>
                );
              })()}

            {visibleRulerMeasurements.map((m) => {
              const dx = m.end.x - m.start.x;
              const dy = m.end.y - m.start.y;
              const length = Math.hypot(dx, dy) || 1;
              const ux = dx / length;
              const uy = dy / length;
              const px = -uy;
              const py = ux;
              const midX = (m.start.x + m.end.x) / 2;
              const midY = (m.start.y + m.end.y) / 2;
              const labelOffset = 14;
              const labelX = midX + px * labelOffset;
              const labelY = midY + py * labelOffset;
              const labelPad = 6;
              const textX = labelX + (px >= 0 ? labelPad : -labelPad);
              const textAnchor = px >= 0 ? "start" : "end";

              return (
                <g key={m.id}>
                  <line
                    x1={m.start.x}
                    y1={m.start.y}
                    x2={m.end.x}
                    y2={m.end.y}
                    stroke={RULER_COLOR}
                    strokeWidth={rulerStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {showRulerLabels && (
                    <line
                      x1={midX}
                      y1={midY}
                      x2={labelX}
                      y2={labelY}
                      stroke={RULER_COLOR}
                      strokeWidth={rulerStrokeWidth}
                      strokeLinecap="round"
                    />
                  )}
                  <circle
                    cx={m.start.x}
                    cy={m.start.y}
                    r={pointRadius}
                    fill={resolvePointFill(RULER_COLOR)}
                    stroke={RULER_COLOR}
                    strokeWidth={resolvePointStrokeWidth(rulerStrokeWidth)}
                  />
                  <circle
                    cx={m.end.x}
                    cy={m.end.y}
                    r={pointRadius}
                    fill={resolvePointFill(RULER_COLOR)}
                    stroke={RULER_COLOR}
                    strokeWidth={resolvePointStrokeWidth(rulerStrokeWidth)}
                  />
                  {showRulerLabels && (
                    <text
                      x={textX}
                      y={labelY}
                      fill={RULER_COLOR}
                      fontSize={MEASURE_FONT_SIZE}
                      fontWeight={700}
                      stroke="#0b0f0d"
                      strokeWidth={MEASURE_LABEL_STROKE_WIDTH}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                    >
                      {formatDistance(m.start, m.end)}
                    </text>
                  )}
                </g>
              );
            })}

            {draftStart &&
              draftEnd &&
              (() => {
                const dx = draftEnd.x - draftStart.x;
                const dy = draftEnd.y - draftStart.y;
                const length = Math.hypot(dx, dy) || 1;
                const ux = dx / length;
                const uy = dy / length;
                const px = -uy;
                const py = ux;
                const midX = (draftStart.x + draftEnd.x) / 2;
                const midY = (draftStart.y + draftEnd.y) / 2;
                const labelOffset = 14;
                const labelX = midX + px * labelOffset;
                const labelY = midY + py * labelOffset;
                const labelPad = 6;
                const textX = labelX + (px >= 0 ? labelPad : -labelPad);
                const textAnchor = px >= 0 ? "start" : "end";

                return (
                  <g>
                    <line
                      x1={draftStart.x}
                      y1={draftStart.y}
                      x2={draftEnd.x}
                      y2={draftEnd.y}
                      stroke={RULER_COLOR}
                      strokeWidth={rulerStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {showRulerLabels && (
                      <line
                        x1={midX}
                        y1={midY}
                        x2={labelX}
                        y2={labelY}
                        stroke={RULER_COLOR}
                        strokeWidth={rulerStrokeWidth}
                        strokeLinecap="round"
                      />
                    )}
                    <circle
                      cx={draftStart.x}
                      cy={draftStart.y}
                      r={pointRadius}
                      fill={resolvePointFill(RULER_COLOR)}
                      stroke={RULER_COLOR}
                      strokeWidth={resolvePointStrokeWidth(rulerStrokeWidth)}
                    />
                    <circle
                      cx={draftEnd.x}
                      cy={draftEnd.y}
                      r={pointRadius}
                      fill={resolvePointFill(RULER_COLOR)}
                      stroke={RULER_COLOR}
                      strokeWidth={resolvePointStrokeWidth(rulerStrokeWidth)}
                    />
                    {showRulerLabels && (
                      <text
                        x={textX}
                        y={labelY}
                        fill={RULER_COLOR}
                        fontSize={MEASURE_FONT_SIZE}
                        fontWeight={700}
                        stroke="#0b0f0d"
                        strokeWidth={MEASURE_LABEL_STROKE_WIDTH}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                      >
                        {formatDistance(draftStart, draftEnd)}
                      </text>
                    )}
                  </g>
                );
              })()}

            {visibleLldMeasurements.map((m) => {
              const dx = m.end.x - m.start.x;
              const dy = m.end.y - m.start.y;
              const length = Math.hypot(dx, dy) || 1;
              const ux = dx / length;
              const uy = dy / length;
              const px = -uy;
              const py = ux;
              const midX = (m.start.x + m.end.x) / 2;
              const midY = (m.start.y + m.end.y) / 2;
              const labelOffset = 14;
              const labelX = midX + px * labelOffset;
              const labelY = midY + py * labelOffset;
              const labelPad = 6;
              const textX = labelX + (px >= 0 ? labelPad : -labelPad);
              const textAnchor = px >= 0 ? "start" : "end";

              return (
                <g key={m.id}>
                  <line
                    x1={m.start.x}
                    y1={m.start.y}
                    x2={m.end.x}
                    y2={m.end.y}
                    stroke={LLD_COLOR}
                    strokeWidth={lldStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {showLldLabels && (
                    <line
                      x1={midX}
                      y1={midY}
                      x2={labelX}
                      y2={labelY}
                      stroke={LLD_COLOR}
                      strokeWidth={lldStrokeWidth}
                      strokeLinecap="round"
                    />
                  )}
                  <circle
                    cx={m.start.x}
                    cy={m.start.y}
                    r={pointRadius}
                    fill={resolvePointFill(LLD_COLOR)}
                    stroke={LLD_COLOR}
                    strokeWidth={resolvePointStrokeWidth(lldStrokeWidth)}
                  />
                  <circle
                    cx={m.end.x}
                    cy={m.end.y}
                    r={pointRadius}
                    fill={resolvePointFill(LLD_COLOR)}
                    stroke={LLD_COLOR}
                    strokeWidth={resolvePointStrokeWidth(lldStrokeWidth)}
                  />
                  {showLldLabels && (
                    <text
                      x={textX}
                      y={labelY}
                      fill={LLD_COLOR}
                      fontSize={MEASURE_FONT_SIZE}
                      fontWeight={600}
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                    >
                      {formatLld(m.start, m.end)}
                    </text>
                  )}
                </g>
              );
            })}

            {lldDraftStart &&
              lldDraftEnd &&
              (() => {
                const dx = lldDraftEnd.x - lldDraftStart.x;
                const dy = lldDraftEnd.y - lldDraftStart.y;
                const length = Math.hypot(dx, dy) || 1;
                const ux = dx / length;
                const uy = dy / length;
                const px = -uy;
                const py = ux;
                const midX = (lldDraftStart.x + lldDraftEnd.x) / 2;
                const midY = (lldDraftStart.y + lldDraftEnd.y) / 2;
                const labelOffset = 14;
                const labelX = midX + px * labelOffset;
                const labelY = midY + py * labelOffset;
                const labelPad = 6;
                const textX = labelX + (px >= 0 ? labelPad : -labelPad);
                const textAnchor = px >= 0 ? "start" : "end";

                return (
                  <g>
                    <line
                      x1={lldDraftStart.x}
                      y1={lldDraftStart.y}
                      x2={lldDraftEnd.x}
                      y2={lldDraftEnd.y}
                      stroke={LLD_COLOR}
                      strokeWidth={lldStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {showLldLabels && (
                      <line
                        x1={midX}
                        y1={midY}
                        x2={labelX}
                        y2={labelY}
                        stroke={LLD_COLOR}
                        strokeWidth={lldStrokeWidth}
                        strokeLinecap="round"
                      />
                    )}
                    <circle
                      cx={lldDraftStart.x}
                      cy={lldDraftStart.y}
                      r={pointRadius}
                      fill={resolvePointFill(LLD_COLOR)}
                      stroke={LLD_COLOR}
                      strokeWidth={resolvePointStrokeWidth(lldStrokeWidth)}
                    />
                    <circle
                      cx={lldDraftEnd.x}
                      cy={lldDraftEnd.y}
                      r={pointRadius}
                      fill={resolvePointFill(LLD_COLOR)}
                      stroke={LLD_COLOR}
                      strokeWidth={resolvePointStrokeWidth(lldStrokeWidth)}
                    />
                    {showLldLabels && (
                      <text
                        x={textX}
                        y={labelY}
                        fill={LLD_COLOR}
                        fontSize={MEASURE_FONT_SIZE}
                        fontWeight={600}
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                      >
                        {formatLld(lldDraftStart, lldDraftEnd)}
                      </text>
                    )}
                  </g>
                );
              })()}

            {visibleOffsetMeasurements.map((m) => {
              const dx = m.end.x - m.start.x;
              const dy = m.end.y - m.start.y;
              const length = Math.hypot(dx, dy) || 1;
              const ux = dx / length;
              const uy = dy / length;
              const px = -uy;
              const py = ux;
              const midX = (m.start.x + m.end.x) / 2;
              const midY = (m.start.y + m.end.y) / 2;
              const labelOffset = 14;
              const labelX = midX + px * labelOffset;
              const labelY = midY + py * labelOffset;
              const labelPad = 6;
              const textX = labelX + (px >= 0 ? labelPad : -labelPad);
              const textAnchor = px >= 0 ? "start" : "end";

              return (
                <g key={m.id}>
                  <line
                    x1={m.start.x}
                    y1={m.start.y}
                    x2={m.end.x}
                    y2={m.end.y}
                    stroke={OFFSET_COLOR}
                    strokeWidth={offsetStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {showOffsetLabels && (
                    <line
                      x1={midX}
                      y1={midY}
                      x2={labelX}
                      y2={labelY}
                      stroke={OFFSET_COLOR}
                      strokeWidth={offsetStrokeWidth}
                      strokeLinecap="round"
                    />
                  )}
                  <circle
                    cx={m.start.x}
                    cy={m.start.y}
                    r={pointRadius}
                    fill={resolvePointFill(OFFSET_COLOR)}
                    stroke={OFFSET_COLOR}
                    strokeWidth={resolvePointStrokeWidth(offsetStrokeWidth)}
                  />
                  <circle
                    cx={m.end.x}
                    cy={m.end.y}
                    r={pointRadius}
                    fill={resolvePointFill(OFFSET_COLOR)}
                    stroke={OFFSET_COLOR}
                    strokeWidth={resolvePointStrokeWidth(offsetStrokeWidth)}
                  />
                  {showOffsetLabels && (
                    <text
                      x={textX}
                      y={labelY}
                      fill={OFFSET_COLOR}
                      fontSize={MEASURE_FONT_SIZE}
                      fontWeight={600}
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                    >
                      {formatOffset(m.start, m.end)}
                    </text>
                  )}
                </g>
              );
            })}

            {offsetDraftStart &&
              offsetDraftEnd &&
              (() => {
                const dx = offsetDraftEnd.x - offsetDraftStart.x;
                const dy = offsetDraftEnd.y - offsetDraftStart.y;
                const length = Math.hypot(dx, dy) || 1;
                const ux = dx / length;
                const uy = dy / length;
                const px = -uy;
                const py = ux;
                const midX = (offsetDraftStart.x + offsetDraftEnd.x) / 2;
                const midY = (offsetDraftStart.y + offsetDraftEnd.y) / 2;
                const labelOffset = 14;
                const labelX = midX + px * labelOffset;
                const labelY = midY + py * labelOffset;
                const labelPad = 6;
                const textX = labelX + (px >= 0 ? labelPad : -labelPad);
                const textAnchor = px >= 0 ? "start" : "end";

                return (
                  <g>
                    <line
                      x1={offsetDraftStart.x}
                      y1={offsetDraftStart.y}
                      x2={offsetDraftEnd.x}
                      y2={offsetDraftEnd.y}
                      stroke={OFFSET_COLOR}
                      strokeWidth={offsetStrokeWidth}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {showOffsetLabels && (
                      <line
                        x1={midX}
                        y1={midY}
                        x2={labelX}
                        y2={labelY}
                        stroke={OFFSET_COLOR}
                        strokeWidth={offsetStrokeWidth}
                        strokeLinecap="round"
                      />
                    )}
                    <circle
                      cx={offsetDraftStart.x}
                      cy={offsetDraftStart.y}
                      r={pointRadius}
                      fill={resolvePointFill(OFFSET_COLOR)}
                      stroke={OFFSET_COLOR}
                      strokeWidth={resolvePointStrokeWidth(offsetStrokeWidth)}
                    />
                    <circle
                      cx={offsetDraftEnd.x}
                      cy={offsetDraftEnd.y}
                      r={pointRadius}
                      fill={resolvePointFill(OFFSET_COLOR)}
                      stroke={OFFSET_COLOR}
                      strokeWidth={resolvePointStrokeWidth(offsetStrokeWidth)}
                    />
                    {showOffsetLabels && (
                      <text
                        x={textX}
                        y={labelY}
                        fill={OFFSET_COLOR}
                        fontSize={MEASURE_FONT_SIZE}
                        fontWeight={600}
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                      >
                        {formatOffset(offsetDraftStart, offsetDraftEnd)}
                      </text>
                    )}
                  </g>
                );
              })()}

            {strokeDraftPoints && strokeDraftPoints.length >= 2 && (
              <>
                {traceMode &&
                  traceFillOpacity > 0 &&
                  isClosedTrace(strokeDraftPoints) && (
                    <path
                      d={toClosedPath(strokeDraftPoints)}
                      fill={traceFillColor}
                      fillOpacity={Math.min(1, Math.max(0, traceFillOpacity))}
                      stroke="none"
                    />
                  )}
                <path
                  d={toPath(strokeDraftPoints)}
                  fill="none"
                  stroke={
                    traceMode ? "#c084fc" : pencilMode ? "#60a5fa" : "#93c5fd"
                  }
                  strokeWidth={traceMode ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 4"
                  opacity={0.9}
                />
              </>
            )}

            {visibleStrokes.map((stroke) => {
              const points = stroke.points ?? [];
              const isTrace = stroke.kind === "trace";
              const closed = isTrace && isClosedTrace(points);
              return (
                <g key={stroke.id}>
                  {isTrace && traceFillOpacity > 0 && closed && (
                    <path
                      d={toClosedPath(points)}
                      fill={traceFillColor}
                      fillOpacity={Math.min(1, Math.max(0, traceFillOpacity))}
                      stroke="none"
                    />
                  )}
                  <path
                    d={toPath(points)}
                    fill="none"
                    stroke={getStrokeColor(stroke)}
                    strokeWidth={Math.max(1, stroke.strokeWidth ?? 2)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={stroke.locked ? 0.85 : 1}
                  />
                </g>
              );
            })}

            {visibleCorMarkers.map((m, index) => (
              <g key={m.id}>
                <circle
                  cx={m.point.x}
                  cy={m.point.y}
                  r={Math.max(5, pointRadius + 1)}
                  fill={resolvePointFill("#f97316")}
                  stroke="#f97316"
                  strokeWidth={2}
                />
                <text
                  x={m.point.x + 10}
                  y={m.point.y - 10}
                  fill="#f97316"
                  fontSize={MEASURE_FONT_SIZE}
                  fontWeight={700}
                  stroke="#0b0f0d"
                  strokeWidth={MEASURE_LABEL_STROKE_WIDTH}
                  paintOrder="stroke"
                  dominantBaseline="middle"
                  textAnchor="start"
                >
                  {m.label ?? `COR${index + 1}`}
                </text>
              </g>
            ))}

            {visibleDrawLines.map((line) => (
              <g key={line.id}>
                <line
                  x1={line.start.x}
                  y1={line.start.y}
                  x2={line.end.x}
                  y2={line.end.y}
                  stroke={DRAW_LINE_COLOR}
                  strokeWidth={drawLineStrokeWidth}
                  strokeLinecap="round"
                />
                <circle
                  cx={line.start.x}
                  cy={line.start.y}
                  r={pointRadius}
                  fill={resolvePointFill(DRAW_LINE_COLOR)}
                  stroke={DRAW_LINE_COLOR}
                  strokeWidth={resolvePointStrokeWidth(drawLineStrokeWidth)}
                />
                <circle
                  cx={line.end.x}
                  cy={line.end.y}
                  r={pointRadius}
                  fill={resolvePointFill(DRAW_LINE_COLOR)}
                  stroke={DRAW_LINE_COLOR}
                  strokeWidth={resolvePointStrokeWidth(drawLineStrokeWidth)}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
