"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  STEM_LIBRARY,
  ImplantLibraryItem,
  ImplantCanvasObject,
  TemplatingCanvasObject,
} from "@/components/digitalTemplating/implantLibrary";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Grab,
  Image as ImageIcon,
  Keyboard,
  List,
  Lock,
  Minus,
  Plus,
  Ruler as RulerIcon,
  Rotate3d,
  RotateCcwIcon,
  RotateCw,
  Redo2,
  Settings2,
  Trash,
  Undo2,
  Unlock,
  X,
  Eye,
  EyeOff,
  EyeOffIcon,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { driver } from "driver.js";
import type { DriveStep, Driver } from "driver.js";
import { TemplatingStage } from "@/components/digitalTemplating/viewer/components/TemplatingStage";
import { MeasurementValuePanel } from "@/components/digitalTemplating/viewer/components/MeasurementValuePanel";
import { DraggablePanel } from "@/components/digitalTemplating/viewer/components/DraggablePanel";
import {
  ToolbarDesktop,
  ToolbarMobile,
  ToolbarMobilePanel,
} from "@/components/digitalTemplating/viewer/components/ImplantToolbars";
import { ShortcutsOverlay } from "@/components/digitalTemplating/viewer/components/ShortcutsOverlay";
import { ImplantModal } from "@/components/digitalTemplating/viewer/components/ImplantModal";
import { MobileControlDock } from "@/components/digitalTemplating/viewer/components/MobileControlDock";
import {
  AHKA_COLOR,
  ANGLE_COLOR,
  ANGLE_FONT_SIZE,
  ANGLE_LABEL_STROKE_WIDTH,
  ANGLE_POINT_RADIUS,
  ANGLE_STROKE_WIDTH,
  CALIBRATION_STORAGE_KEY,
  DRAW_LINE_COLOR,
  LLD_COLOR,
  MEASURE_FONT_SIZE,
  MEASURE_HANDLE_RADIUS,
  MEASURE_LABEL_STROKE_WIDTH,
  MEASURE_STROKE_WIDTH,
  OFFSET_COLOR,
  RULER_COLOR,
  SESSION_STORAGE_KEY,
  TIBIAL_CUT_COLOR,
  TIBIAL_SLOPE_COLOR,
  TOUR_STORAGE_KEY,
  VALGUS_CUT_COLOR,
  XRAY_BASE_HEIGHT,
  XRAY_BASE_WIDTH,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  collapseVariants,
} from "@/components/digitalTemplating/viewer/constants";
import {
  CanvasMode,
  XrayTransform,
  adjustRulerMm,
  clampStagePoint,
  createId,
  distancePointToSegmentSq,
  getXrayTransform,
} from "@/components/digitalTemplating/viewer/utils";
import type {
  AhkaMeasurement,
  AngleMeasurement,
  Annotation,
  CalibrationPreset,
  CorMarker,
  CutoutRect,
  DrawLine,
  FreehandStroke,
  HistoryState,
  LldMeasurement,
  MeasurementHandle,
  MeasurementRow,
  OffsetMeasurement,
  PointFillMode,
  PersistedTemplatingSession,
  RulerMeasurement,
  Side,
  TibialCutLine,
  TibialSlopeLine,
  ValgusCutLine,
} from "@/components/digitalTemplating/viewer/types";
import { useTemplatingHistory } from "@/components/digitalTemplating/viewer/hooks/useTemplatingHistory";
import { useImageCache } from "@/components/digitalTemplating/viewer/hooks/useImageCache";
import { useCalibrationPresets } from "@/components/digitalTemplating/viewer/hooks/useCalibrationPresets";
import { MB, TB } from "@/components/digitalTemplating/viewer/components/ui/Buttons";
import {
  useKneePlanningActions,
  useKneePlanningState,
} from "@/components/digitalTemplating/viewer/hooks/useKneePlanningTools";

type ScaleDir = "top" | "bottom" | "left" | "right";
type GroupedLibrary = Record<
  "stem" | "cup" | "knee",
  Record<string, ImplantLibraryItem[]>
>;
type CameraFit = "cover" | "contain";
type CameraZoomMode = "hardware" | "digital";
type CutoutShape = "rect" | "circle" | "polygon";

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

// (constants + helpers moved to `viewer/constants.ts` and `viewer/utils.ts`)

type PanelSectionKey = "imaging" | "calibration" | "tools" | "overview";

type PinchGesture = {
  active: boolean;
  targetId: string | null;
  pointers: Map<number, { x: number; y: number }>;
  startDistance: number;
  startAngle: number;
  startScaleX: number;
  startScaleY: number;
  startRotation: number;
  startCenter: { x: number; y: number };
  startPosition: { x: number; y: number };
  lockAspect: boolean;
};

/* =====================================================
   IMPLANT TEMPLATING CANVAS – UI/UX REFACTOR
   LOGIC: UNCHANGED
   ===================================================== */

export default function ImplantTemplatingCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });
  const captureRef = useRef<HTMLElement | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const tourAutoStarted = useRef(false);
  const panHoldRef = useRef<{ active: boolean; prev: boolean }>({
    active: false,
    prev: false,
  });

  const SNAP_ANGLES = [0, 90, -90, 180, -180];
  const SNAP_THRESHOLD = 5;

  function snapAngle(angle: number) {
    for (const a of SNAP_ANGLES) {
      if (Math.abs(angle - a) <= SNAP_THRESHOLD) return a;
    }
    return angle;
  }

  const inferLegSide = useCallback((knee: { x: number; y: number } | null | undefined): Side => {
    if (!knee) return "Right";
    return knee.x < XRAY_BASE_WIDTH / 2 ? "Left" : "Right";
  }, []);

  const [initialSession] = useState<PersistedTemplatingSession | null>(() => {
    if (typeof window === "undefined") return null;
    let raw: string | null = null;
    try {
      raw =
        localStorage.getItem(SESSION_STORAGE_KEY) ??
        sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      raw = null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedTemplatingSession> & {
        v?: number;
      };
      if (!parsed || parsed.v !== 1) return null;
      const parsedCutout = (parsed as any).cutout ?? null;
      const parsedAhka = (parsed as any).ahkaMeasurements;
      const parsedStrokes = (parsed as any).strokes;
      const normalizedStrokes: FreehandStroke[] = Array.isArray(parsedStrokes)
        ? parsedStrokes
            .filter((s: any) => s && Array.isArray(s.points))
            .map((s: any) => ({
              ...s,
              kind: s.kind === "trace" ? "trace" : "pencil",
              points: s.points.map((p: any) => ({
                x: Number(p?.x ?? 0),
                y: Number(p?.y ?? 0),
              })),
              strokeWidth: Number(s.strokeWidth ?? 2),
            }))
        : [];
      const parsedCorMarkers = (parsed as any).corMarkers;
      const normalizedCorMarkers: CorMarker[] = Array.isArray(parsedCorMarkers)
        ? parsedCorMarkers
            .filter((m: any) => m && m.point)
            .map((m: any) => ({
              ...m,
              point: {
                x: Number(m.point?.x ?? 0),
                y: Number(m.point?.y ?? 0),
              },
            }))
        : [];
      const normalizedAhka: AhkaMeasurement[] = Array.isArray(parsedAhka)
        ? parsedAhka.map((m: any) => ({
            ...m,
            side:
              m?.side ??
              (typeof m?.knee?.x === "number" && m.knee.x < XRAY_BASE_WIDTH / 2
                ? "Left"
                : "Right"),
          }))
        : [];
      return {
        ...(parsed as PersistedTemplatingSession),
        ahkaMeasurements: normalizedAhka.length
          ? normalizedAhka
          : ((parsed as PersistedTemplatingSession).ahkaMeasurements ?? []),
        strokes: normalizedStrokes.length
          ? normalizedStrokes
          : ((parsed as PersistedTemplatingSession).strokes ?? []),
        corMarkers: normalizedCorMarkers.length
          ? normalizedCorMarkers
          : ((parsed as PersistedTemplatingSession).corMarkers ?? []),
        cutout: parsedCutout
          ? { ...parsedCutout, shape: parsedCutout.shape ?? "circle" }
          : null,
      };
    } catch {
      return null;
    }
  });

  /* ================= BACKGROUND ================= */
  const [background, setBackground] = useState<string | null>(
    initialSession?.background ?? null
  );
  const [xrayContrast, setXrayContrast] = useState(
    initialSession?.xrayContrast ?? 1
  );
  const [zoom, setZoom] = useState(initialSession?.zoom ?? 1);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>(
    initialSession?.canvasMode ?? "fit"
  );
  const [viewPan, setViewPan] = useState(
    initialSession?.viewPan ?? { x: 0, y: 0 }
  );
  const [panMode, setPanMode] = useState(false);
  const [cutout, setCutout] = useState<CutoutRect | null>(
    initialSession?.cutout ?? null
  );
  const [cutoutShape, setCutoutShape] = useState<CutoutShape>(
    (initialSession?.cutout?.shape as CutoutShape) ?? "circle"
  );
  const [cutoutMode, setCutoutMode] = useState(false);
  const [cutoutAnchor, setCutoutAnchor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [cutoutDraft, setCutoutDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [cutoutPolyPoints, setCutoutPolyPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [cutoutPolyCursor, setCutoutPolyCursor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const cutoutDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    kind: "move" | "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w" | null;
    startPoint: { x: number; y: number } | null;
    startRect: CutoutRect | null;
  }>({ active: false, pointerId: null, kind: null, startPoint: null, startRect: null });

  /* ================= OBJECTS ================= */
  const [objects, setObjects] = useState<TemplatingCanvasObject[]>(
    initialSession?.objects ?? []
  );
  const [activeId, setActiveId] = useState<string | null>(
    initialSession?.activeId ?? null
  );
  const active = objects.find((o) => o.id === activeId);
  const scaleScrubRef = useRef(false);

  /* ================= UI ================= */
  const [dragging, setDragging] = useState(false);
  const [openImplantModal, setOpenImplantModal] = useState(false);
  const [mobileToolOpen, setMobileToolOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const autoStartTour = true;
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraFit, setCameraFit] = useState<CameraFit>("cover");
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraZoomMode, setCameraZoomMode] =
    useState<CameraZoomMode>("digital");
  const [cameraZoomRange, setCameraZoomRange] = useState(() => ({
    min: 1,
    max: 3,
    step: 0.1,
  }));
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordRafRef = useRef<number | null>(null);
  const coverMode = cameraMode && cameraFit === "cover";
  const toggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);
  const { ensureImageLoaded, getCachedImage } = useImageCache();

  /* ================= CALIBRATION ================= */
  const [calStart, setCalStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [calEnd, setCalEnd] = useState<{ x: number; y: number } | null>(null);
  const [realMm, setRealMm] = useState(initialSession?.realMm ?? 100);
  const [mmPerPixel, setMmPerPixel] = useState<number | null>(
    initialSession?.mmPerPixel ?? null
  );
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [syncScaleMode, setSyncScaleMode] = useState(false);
  const [useRealScale, setUseRealScale] = useState(
    initialSession?.useRealScale ?? false
  );
  const {
    presetName,
    setPresetName,
    calibrationPresets,
    loadCalibrationPresets,
    saveCalibrationPreset,
    applyCalibrationPreset,
    removeCalibrationPreset,
  } = useCalibrationPresets({
    realMm,
    setRealMm,
    mmPerPixel,
    setMmPerPixel,
    useRealScale,
    setUseRealScale,
    toast,
  });

  /* ================= MEASURE ================= */
  const [rulerMode, setRulerMode] = useState(false);
  const [measurements, setMeasurements] = useState<RulerMeasurement[]>(
    initialSession?.measurements ?? []
  );
  const [rulerAnchor, setRulerAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [rulerDraft, setRulerDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lldMode, setLldMode] = useState(false);
  const [lldMeasurements, setLldMeasurements] = useState<LldMeasurement[]>(
    initialSession?.lldMeasurements ?? []
  );
  const [lldAnchor, setLldAnchor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lldDraft, setLldDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [offsetMode, setOffsetMode] = useState(false);
  const [offsetMeasurements, setOffsetMeasurements] = useState<
    OffsetMeasurement[]
  >(initialSession?.offsetMeasurements ?? []);
  const [offsetAnchor, setOffsetAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [offsetDraft, setOffsetDraft] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [angleMode, setAngleMode] = useState(false);
  const [angleMeasurements, setAngleMeasurements] = useState<
    AngleMeasurement[]
  >(initialSession?.angleMeasurements ?? []);
  const [anglePoints, setAnglePoints] = useState<{ x: number; y: number }[]>(
    []
  );
  const [angleDraft, setAngleDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [ahkaMode, setAhkaMode] = useState(false);
  const [ahkaMeasurements, setAhkaMeasurements] = useState<AhkaMeasurement[]>(
    initialSession?.ahkaMeasurements ?? []
  );
  const [ahkaPoints, setAhkaPoints] = useState<{ x: number; y: number }[]>([]);
  const [ahkaDraft, setAhkaDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>(
    initialSession?.annotations ?? []
  );
  const [annotationDraft, setAnnotationDraft] = useState<{
    id?: string;
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawLines, setDrawLines] = useState<DrawLine[]>(
    initialSession?.drawLines ?? []
  );
  const [traceMode, setTraceMode] = useState(false);
  const [pencilMode, setPencilMode] = useState(false);
  const [corMode, setCorMode] = useState(false);
  const [strokes, setStrokes] = useState<FreehandStroke[]>(
    initialSession?.strokes ?? []
  );
  const [corMarkers, setCorMarkers] = useState<CorMarker[]>(
    initialSession?.corMarkers ?? []
  );
  const [drawAnchor, setDrawAnchor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawDraft, setDrawDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [strokeDraftPoints, setStrokeDraftPoints] = useState<
    { x: number; y: number }[] | null
  >(null);
  const [hoverMoveHint, setHoverMoveHint] = useState(false);
  const [drawLineStrokeWidth, setDrawLineStrokeWidth] = useState(
    initialSession?.ui?.drawLineStrokeWidth ?? 2
  );
  const [ahkaStrokeWidth, setAhkaStrokeWidth] = useState(
    initialSession?.ui?.ahkaStrokeWidth ?? 1.5
  );
  const [rulerStrokeWidth, setRulerStrokeWidth] =
    useState(initialSession?.ui?.rulerStrokeWidth ?? MEASURE_STROKE_WIDTH);
  const [lldStrokeWidth, setLldStrokeWidth] = useState(
    initialSession?.ui?.lldStrokeWidth ?? MEASURE_STROKE_WIDTH
  );
  const [offsetStrokeWidth, setOffsetStrokeWidth] =
    useState(initialSession?.ui?.offsetStrokeWidth ?? MEASURE_STROKE_WIDTH);
  const [angleStrokeWidth, setAngleStrokeWidth] = useState(
    initialSession?.ui?.angleStrokeWidth ?? ANGLE_STROKE_WIDTH
  );
  const [pointRadius, setPointRadius] = useState(
    initialSession?.ui?.pointRadius ?? ANGLE_POINT_RADIUS
  );
  const [pointFillMode, setPointFillMode] = useState<PointFillMode>(
    initialSession?.ui?.pointFillMode ?? "dark"
  );
  const [pointFillColor, setPointFillColor] = useState(
    initialSession?.ui?.pointFillColor ?? "#0b0f0d"
  );
  const [traceFillColor, setTraceFillColor] = useState(
    initialSession?.ui?.traceFillColor ?? "#c084fc"
  );
  const [traceFillOpacity, setTraceFillOpacity] = useState(() => {
    const raw = initialSession?.ui?.traceFillOpacity;
    if (typeof raw !== "number" || Number.isNaN(raw)) return 0.2;
    return Math.min(1, Math.max(0, raw));
  });
  const [showRulerLabels, setShowRulerLabels] = useState(
    initialSession?.ui?.showRulerLabels ?? true
  );
  const [showLldLabels, setShowLldLabels] = useState(
    initialSession?.ui?.showLldLabels ?? true
  );
  const [showOffsetLabels, setShowOffsetLabels] = useState(
    initialSession?.ui?.showOffsetLabels ?? true
  );
  const [showAngleLabels, setShowAngleLabels] = useState(
    initialSession?.ui?.showAngleLabels ?? true
  );
  const [showAhkaLabels, setShowAhkaLabels] = useState(
    initialSession?.ui?.showAhkaLabels ?? true
  );
  const [ahkaEditLocked, setAhkaEditLocked] = useState(
    initialSession?.ui?.ahkaEditLocked ?? false
  );
  const [showValgusCutLabels, setShowValgusCutLabels] = useState(
    initialSession?.ui?.showValgusCutLabels ?? true
  );
  const [showTibialSlopeLabels, setShowTibialSlopeLabels] = useState(
    initialSession?.ui?.showTibialSlopeLabels ?? true
  );
  const [showTibialCutLabels, setShowTibialCutLabels] = useState(
    initialSession?.ui?.showTibialCutLabels ?? true
  );
  const kneeState = useKneePlanningState({
    ...initialSession?.knee,
    valgusCutLines: initialSession?.valgusCutLines ?? [],
    tibialSlopeLines: initialSession?.tibialSlopeLines ?? [],
    tibialCutLines: initialSession?.tibialCutLines ?? [],
  });
  const {
    valgusCutMode,
    setValgusCutMode,
    valgusCutAngleDeg,
    setValgusCutAngleDeg,
    valgusCutSide,
    setValgusCutSide,
    valgusCutLines,
    setValgusCutLines,
    valgusCutAnchor,
    setValgusCutAnchor,
    valgusCutDraft,
    setValgusCutDraft,
    valgusCutOffsetPx,
    setValgusCutOffsetPx,
    valgusCutStrokeWidth,
    setValgusCutStrokeWidth,
    valgusCutLineLengthPx,
    setValgusCutLineLengthPx,
    tibialSlopeMode,
    setTibialSlopeMode,
    tibialSlopeDeg,
    setTibialSlopeDeg,
    tibialPosteriorSide,
    setTibialPosteriorSide,
    tibialSlopeLines,
    setTibialSlopeLines,
    tibialSlopeAnchor,
    setTibialSlopeAnchor,
    tibialSlopeDraft,
    setTibialSlopeDraft,
    tibialSlopeOffsetPx,
    setTibialSlopeOffsetPx,
    tibialSlopeLineLengthPx,
    setTibialSlopeLineLengthPx,
    tibialSlopeStrokeWidth,
    setTibialSlopeStrokeWidth,
    tibialCutMode,
    setTibialCutMode,
    tibialCutAngleDeg,
    setTibialCutAngleDeg,
    tibialCutDirection,
    setTibialCutDirection,
    tibialCutLines,
    setTibialCutLines,
    tibialCutAnchor,
    setTibialCutAnchor,
    tibialCutDraft,
    setTibialCutDraft,
    tibialCutOffsetPx,
    setTibialCutOffsetPx,
    tibialCutLineLengthPx,
    setTibialCutLineLengthPx,
    tibialCutStrokeWidth,
    setTibialCutStrokeWidth,
  } = kneeState;

  const [search, setSearch] = useState("");
  const [openType, setOpenType] = useState<
    Record<"stem" | "cup" | "knee", boolean>
  >({
    stem: true,
    cup: false,
    knee: false,
  });
  const [openSystem, setOpenSystem] = useState<Record<string, boolean>>({});

  /* ================= DRAGGABLE PANEL ================= */
  const [panelPos, setPanelPos] = useState({ x: 16, y: 16 });
  const panelRef = useRef<HTMLDivElement>(null);
  const panelAutoPlaced = useRef(false);
  const panelManualMove = useRef(false);
  const dragState = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  const rotateDrag = useRef<{ x: number; active: boolean }>({
    x: 0,
    active: false,
  });
  const measureDrag = useRef<{
    active: boolean;
    kind: MeasurementHandle["kind"] | null;
    id: string | null;
    point: MeasurementHandle["point"] | null;
  }>({
    active: false,
    kind: null,
    id: null,
    point: null,
  });
  const drawLineMoveDrag = useRef<{
    active: boolean;
    id: string | null;
    last: { x: number; y: number } | null;
  }>({
    active: false,
    id: null,
    last: null,
  });
  const strokeDrawRef = useRef<{
    active: boolean;
    pointerId: number | null;
    kind: FreehandStroke["kind"] | null;
    id: string | null;
    last: { x: number; y: number } | null;
  }>({
    active: false,
    pointerId: null,
    kind: null,
    id: null,
    last: null,
  });
  const strokeMoveDrag = useRef<{
    active: boolean;
    id: string | null;
    last: { x: number; y: number } | null;
  }>({
    active: false,
    id: null,
    last: null,
  });
  const corMoveDrag = useRef<{
    active: boolean;
    id: string | null;
    last: { x: number; y: number } | null;
  }>({
    active: false,
    id: null,
    last: null,
  });
  const kneeLineMoveDrag = useRef<{
    active: boolean;
    kind: "valgusCut" | "tibialSlope" | "tibialCut" | null;
    id: string | null;
    last: { x: number; y: number } | null;
  }>({
    active: false,
    kind: null,
    id: null,
    last: null,
  });

  const scaleDrag = useRef<{
    startY: number;
    startScaleX: number;
    startScaleY: number;
    dir: ScaleDir | null;
  }>({
    startY: 0,
    startScaleX: 1,
    startScaleY: 1,
    dir: null,
  });
  const pinchRef = useRef<PinchGesture>({
    active: false,
    targetId: null,
    pointers: new Map(),
    startDistance: 0,
    startAngle: 0,
    startScaleX: 1,
    startScaleY: 1,
    startRotation: 0,
    startCenter: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    lockAspect: true,
  });
  const panDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    last: { x: number; y: number } | null;
  }>({ active: false, pointerId: null, last: null });
  const canvasGestureRef = useRef<{
    active: boolean;
    pointers: Map<number, { x: number; y: number }>;
    startDistance: number;
    startZoom: number;
    startWorld: { x: number; y: number } | null;
  }>({
    active: false,
    pointers: new Map(),
    startDistance: 0,
    startZoom: 1,
    startWorld: null,
  });

  /* ================= DRAGGABLE TOOLBAR ================= */
  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 200 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toolbarDrag = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  /* ================= MEASUREMENT PANEL ================= */
  const [measurePanelOpen, setMeasurePanelOpen] = useState(
    initialSession?.ui?.measurementsPanelOpen ?? true
  );
  const [measurePanelMinimized, setMeasurePanelMinimized] = useState(false);
  const [mobileUiHidden, setMobileUiHidden] = useState(false);
  const [mobileXrayPanelOpen, setMobileXrayPanelOpen] = useState(true);
  const [measurePanelPos, setMeasurePanelPos] = useState({ x: 16, y: 420 });
  const measurePanelRef = useRef<HTMLDivElement>(null);
  const measurePanelDrag = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [measurePanelActivityTick, setMeasurePanelActivityTick] = useState(0);

  const noteMeasurePanelActivity = useCallback(() => {
    setMeasurePanelActivityTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const mobilePanelsBootstrapped = useRef(false);
  useEffect(() => {
    if (!isMobileViewport) return;
    if (mobilePanelsBootstrapped.current) return;
    mobilePanelsBootstrapped.current = true;
    if (background || objects.length) {
      const handle = window.setTimeout(() => {
        setMobileXrayPanelOpen(false);
        setMeasurePanelOpen(false);
      }, 0);
      return () => window.clearTimeout(handle);
    }
  }, [background, isMobileViewport, objects.length]);

  const hasActiveMeasurementMode =
    rulerMode ||
    lldMode ||
    offsetMode ||
    angleMode ||
    ahkaMode ||
    drawMode ||
    traceMode ||
    pencilMode ||
    corMode ||
    cutoutMode ||
    annotationMode ||
    syncScaleMode ||
    valgusCutMode ||
    tibialSlopeMode ||
    tibialCutMode;

  const hasMeasurementDraft =
    Boolean(rulerAnchor) ||
    Boolean(lldAnchor) ||
    Boolean(offsetAnchor) ||
    Boolean(angleDraft) ||
    Boolean(anglePoints.length) ||
    Boolean(ahkaDraft) ||
    Boolean(ahkaPoints.length) ||
    Boolean(drawDraft) ||
    Boolean(drawAnchor) ||
    Boolean(strokeDraftPoints?.length) ||
    Boolean(cutoutAnchor) ||
    Boolean(cutoutDraft) ||
    Boolean(cutoutPolyPoints.length) ||
    Boolean(cutoutPolyCursor) ||
    Boolean(valgusCutAnchor) ||
    Boolean(valgusCutDraft) ||
    Boolean(tibialSlopeAnchor) ||
    Boolean(tibialSlopeDraft) ||
    Boolean(tibialCutAnchor) ||
    Boolean(tibialCutDraft) ||
    Boolean(calStart) ||
    Boolean(calEnd);

  const canMinimizeMeasurements = !hasActiveMeasurementMode && !hasMeasurementDraft;
  const measurePanelMinimizedEffective =
    measurePanelMinimized && canMinimizeMeasurements;

  const cutoutPreview = (() => {
    if (!cutoutMode) return null;

    if (cutoutShape === "polygon") {
      if (!cutoutPolyPoints.length) return null;
      const cursor = cutoutPolyCursor;
      const all = cursor ? [...cutoutPolyPoints, cursor] : cutoutPolyPoints;
      const xs = all.map((p) => p.x);
      const ys = all.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const bounds = clampCutoutRect({
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      });
      return {
        ...bounds,
        shape: "polygon" as const,
        points: cutoutPolyPoints,
        cursor,
        closed: false,
        opacity: cutout?.opacity ?? 0.65,
      };
    }

    if (!cutoutAnchor || !cutoutDraft) return null;
    if (cutoutShape === "circle") {
      return {
        ...clampCutoutCircle(
          cutoutAnchor,
          Math.hypot(cutoutDraft.x - cutoutAnchor.x, cutoutDraft.y - cutoutAnchor.y)
        ),
        shape: "circle" as const,
        opacity: cutout?.opacity ?? 0.65,
      };
    }
    return {
      ...clampCutoutRect({
        x: Math.min(cutoutAnchor.x, cutoutDraft.x),
        y: Math.min(cutoutAnchor.y, cutoutDraft.y),
        width: Math.abs(cutoutAnchor.x - cutoutDraft.x),
        height: Math.abs(cutoutAnchor.y - cutoutDraft.y),
      }),
      shape: "rect" as const,
      opacity: cutout?.opacity ?? 0.65,
    };
  })();

  useEffect(() => {
    if (!measurePanelOpen) return;
    if (!isMobileViewport) return;
    if (measurePanelMinimized) return;
    if (!canMinimizeMeasurements) return;
    const timer = window.setTimeout(() => {
      setMeasurePanelMinimized(true);
    }, 6000);
    return () => window.clearTimeout(timer);
	  }, [
    canMinimizeMeasurements,
    isMobileViewport,
    measurePanelActivityTick,
    measurePanelMinimized,
    measurePanelOpen,
  ]);

  const toggleMobileUiHidden = useCallback(() => {
    setMobileUiHidden((prev) => {
      const next = !prev;
      if (next) setMobileToolOpen(false);
      return next;
    });
  }, [setMobileToolOpen]);

  /* ================= TOOL VALUES ================= */
  const [moveStep, setMoveStep] = useState(2); // px
  const [scaleStep, setScaleStep] = useState(0.01);
  const [rotateStep, setRotateStep] = useState(1); // deg

  /* =====================================================
     HELPERS
     ===================================================== */

  const createImplant = (item: ImplantLibraryItem): ImplantCanvasObject => ({
    id: createId(),
    type: "implant",
    name: item.label,
    imageSrc: item.imageSrc,
    position: { x: 300, y: 200 },
    scaleX: 1,
    scaleY: 1,
    flipX: 1,
    flipY: 1,
    rotation: 0,
    opacity: 0.6,
    locked: true,
    scaleLocked: false,
  });

  const createShape = useCallback(
    (shape: "circle" | "square" | "triangle"): TemplatingCanvasObject => ({
      id: createId(),
      type: "shape",
      shape,
      position: { x: 300, y: 200 },
      scaleX: 1,
      scaleY: 1,
      flipX: 1,
      flipY: 1,
      rotation: 0,
      opacity: 0.9,
      locked: true,
      scaleLocked: false,
      stroke: "#a855f7",
      strokeWidth: 4,
      fill: "rgba(168,85,247,0.08)",
    }),
    []
  );

  const createImageOverlay = useCallback(
    (
      name: string,
      imageSrc: string,
      options?: Partial<Pick<TemplatingCanvasObject, "position" | "opacity">> & {
        baseWidth?: number;
        baseHeight?: number;
        paddingPx?: number;
      }
    ): TemplatingCanvasObject => ({
      id: createId(),
      type: "image",
      name,
      imageSrc,
      position: options?.position ?? { x: 300, y: 200 },
      scaleX: 1,
      scaleY: 1,
      flipX: 1,
      flipY: 1,
      rotation: 0,
      opacity: options?.opacity ?? 0.6,
      locked: true,
      scaleLocked: false,
      baseWidth: options?.baseWidth,
      baseHeight: options?.baseHeight,
      paddingPx: options?.paddingPx,
    }),
    []
  );

  const getPinchPoints = (gesture: PinchGesture) => {
    const entries = Array.from(gesture.pointers.entries()).sort(
      ([a], [b]) => a - b
    );
    if (entries.length < 2) return null;
    return [entries[0][1], entries[1][1]] as const;
  };

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }, []);

  const getStagePoint = (clientX: number, clientY: number) => {
    const transform = getXrayTransform(stageRef, zoom, canvasMode, coverMode, viewPan);
    if (!transform) return null;
    const x =
      (clientX - transform.rect.left - transform.offsetX) / transform.scale;
    const y =
      (clientY - transform.rect.top - transform.offsetY) / transform.scale;
    if (x < 0 || y < 0 || x > XRAY_BASE_WIDTH || y > XRAY_BASE_HEIGHT)
      return null;
    return { x, y };
  };

  const distancePointToSegmentSq = (
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

  const clampStagePoint = (p: { x: number; y: number }) => ({
    x: Math.min(XRAY_BASE_WIDTH, Math.max(0, p.x)),
    y: Math.min(XRAY_BASE_HEIGHT, Math.max(0, p.y)),
  });

  function clampCutoutRect(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    const minSize = 40;
    const width = Math.max(minSize, Math.min(XRAY_BASE_WIDTH, rect.width));
    const height = Math.max(minSize, Math.min(XRAY_BASE_HEIGHT, rect.height));
    const x = Math.min(XRAY_BASE_WIDTH - width, Math.max(0, rect.x));
    const y = Math.min(XRAY_BASE_HEIGHT - height, Math.max(0, rect.y));
    return { x, y, width, height };
  }

  function clampCutoutCircle(center: { x: number; y: number }, radius: number) {
    const minRadius = 20;
    const cx0 = Math.min(XRAY_BASE_WIDTH, Math.max(0, center.x));
    const cy0 = Math.min(XRAY_BASE_HEIGHT, Math.max(0, center.y));
    const maxRadius = Math.max(
      minRadius,
      Math.min(cx0, XRAY_BASE_WIDTH - cx0, cy0, XRAY_BASE_HEIGHT - cy0)
    );
    const r = Math.min(Math.max(minRadius, radius), maxRadius);
    const cx = Math.min(XRAY_BASE_WIDTH - r, Math.max(r, cx0));
    const cy = Math.min(XRAY_BASE_HEIGHT - r, Math.max(r, cy0));
    return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  }

  function buildCutoutRectFromPoints(
    a: { x: number; y: number },
    b: { x: number; y: number },
    opacity?: number
  ): CutoutRect {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const width = Math.abs(a.x - b.x);
    const height = Math.abs(a.y - b.y);
    const clamped = clampCutoutRect({ x, y, width, height });
    return {
      id: createId(),
      ...clamped,
      shape: "rect",
      opacity: opacity ?? cutout?.opacity ?? 0.65,
    };
  }

  function buildCutoutCircleFromPoints(
    center: { x: number; y: number },
    edge: { x: number; y: number },
    opacity?: number
  ): CutoutRect {
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    const clamped = clampCutoutCircle(center, radius);
    return {
      id: createId(),
      ...clamped,
      shape: "circle",
      opacity: opacity ?? cutout?.opacity ?? 0.65,
    };
  }

  function buildCutoutPolygonFromPoints(
    points: { x: number; y: number }[],
    opacity?: number
  ): CutoutRect {
    const clampedPoints = points.map((p) => clampStagePoint(p));
    const xs = clampedPoints.map((p) => p.x);
    const ys = clampedPoints.map((p) => p.y);
    const rawMinX = Math.min(...xs);
    const rawMinY = Math.min(...ys);
    const rawMaxX = Math.max(...xs);
    const rawMaxY = Math.max(...ys);
    const minX = Math.floor(rawMinX);
    const minY = Math.floor(rawMinY);
    const maxX = Math.ceil(rawMaxX);
    const maxY = Math.ceil(rawMaxY);
    const x = Math.min(XRAY_BASE_WIDTH - 1, Math.max(0, minX));
    const y = Math.min(XRAY_BASE_HEIGHT - 1, Math.max(0, minY));
    const width = Math.max(1, Math.min(XRAY_BASE_WIDTH - x, maxX - x));
    const height = Math.max(1, Math.min(XRAY_BASE_HEIGHT - y, maxY - y));
    return {
      id: createId(),
      x,
      y,
      width,
      height,
      shape: "polygon",
      points: clampedPoints,
      opacity: opacity ?? cutout?.opacity ?? 0.65,
    };
  }

  function getCutoutHandleHit(
    point: { x: number; y: number },
    rect: CutoutRect,
    hitRadius: number
  ): "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w" | "move" | null {
    const x1 = rect.x;
    const y1 = rect.y;
    const x2 = rect.x + rect.width;
    const y2 = rect.y + rect.height;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const hitRadiusSq = hitRadius * hitRadius;
    const distSq = (x: number, y: number) => {
      const dx = point.x - x;
      const dy = point.y - y;
      return dx * dx + dy * dy;
    };

    if ((rect.shape ?? "rect") === "polygon") {
      const points = rect.points ?? [];
      if (points.length < 3) return null;
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        const intersect =
          yi > point.y !== yj > point.y &&
          point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi;
        if (intersect) inside = !inside;
      }
      return inside ? "move" : null;
    }

    if ((rect.shape ?? "rect") === "circle") {
      const r = Math.min(rect.width, rect.height) / 2;
      if (distSq(cx, y1) <= hitRadiusSq) return "n";
      if (distSq(x2, cy) <= hitRadiusSq) return "e";
      if (distSq(cx, y2) <= hitRadiusSq) return "s";
      if (distSq(x1, cy) <= hitRadiusSq) return "w";
      const dx = point.x - cx;
      const dy = point.y - cy;
      if (dx * dx + dy * dy <= r * r) return "move";
      return null;
    }

    if (distSq(x1, y1) <= hitRadiusSq) return "nw";
    if (distSq(x2, y1) <= hitRadiusSq) return "ne";
    if (distSq(x1, y2) <= hitRadiusSq) return "sw";
    if (distSq(x2, y2) <= hitRadiusSq) return "se";
    if (point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2) return "move";
    return null;
  }

  const findDrawLineSegmentHit = (point: { x: number; y: number }) => {
    const transform = getXrayTransform(stageRef, zoom, canvasMode, coverMode, viewPan);
    const scale = transform?.scale ?? zoom;
    const hitRadius = Math.max(10, drawLineStrokeWidth * scale + 10) / scale;
    const hitRadiusSq = hitRadius * hitRadius;
    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    drawLines.forEach((line) => {
      if (line.locked || line.hidden) return;
      const distSq = distancePointToSegmentSq(point, line.start, line.end);
      if (distSq > hitRadiusSq) return;
      if (distSq < bestDist) {
        bestDist = distSq;
        bestId = line.id;
      }
    });
    return bestId;
  };

  const findStrokeSegmentHit = (point: { x: number; y: number }) => {
    const transform = getXrayTransform(stageRef, zoom, canvasMode, coverMode, viewPan);
    const scale = transform?.scale ?? zoom;
    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    const isClosedTrace = (points: { x: number; y: number }[]) => {
      if (points.length < 3) return false;
      const first = points[0];
      const last = points[points.length - 1];
      return Math.hypot(first.x - last.x, first.y - last.y) <= 14;
    };

    const isPointInPolygon = (
      p: { x: number; y: number },
      poly: { x: number; y: number }[]
    ) => {
      if (poly.length < 3) return false;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x;
        const yi = poly[i].y;
        const xj = poly[j].x;
        const yj = poly[j].y;
        const intersect =
          yi > p.y !== yj > p.y &&
          p.x < ((xj - xi) * (p.y - yi)) / (yj - yi || 1e-9) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    strokes.forEach((stroke) => {
      if (stroke.locked || stroke.hidden) return;
      const points = stroke.points;
      if (points.length < 2) return;
      const hitRadius =
        Math.max(10, (stroke.strokeWidth ?? 2) * scale + 10) / scale;
      const hitRadiusSq = hitRadius * hitRadius;
      for (let i = 1; i < points.length; i += 1) {
        const distSq = distancePointToSegmentSq(point, points[i - 1], points[i]);
        if (distSq > hitRadiusSq) continue;
        if (distSq < bestDist) {
          bestDist = distSq;
          bestId = stroke.id;
        }
      }

      if (
        stroke.kind === "trace" &&
        bestDist !== 0 &&
        isClosedTrace(points) &&
        isPointInPolygon(point, points.slice(0, -1))
      ) {
        bestDist = 0;
        bestId = stroke.id;
      }
    });

    return bestId;
  };

  const findMeasurementHandle = (point: {
    x: number;
    y: number;
  }): MeasurementHandle | null => {
    const transform = getXrayTransform(stageRef, zoom, canvasMode, coverMode, viewPan);
    const scale = transform?.scale ?? zoom;
    const hitRadius = Math.max(10, pointRadius * scale + 8) / scale;
    const hitRadiusSq = hitRadius * hitRadius;
    let best: MeasurementHandle | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    const testPoint = (
      kind: MeasurementHandle["kind"],
      id: string,
      pointKey: MeasurementHandle["point"],
      target: { x: number; y: number }
    ) => {
      const dx = target.x - point.x;
      const dy = target.y - point.y;
      const dist = dx * dx + dy * dy;
      if (dist > hitRadiusSq) return;
      if (dist < bestDist) {
        best = { kind, id, point: pointKey };
        bestDist = dist;
      }
    };

    measurements.forEach((m) => {
      if (m.locked || m.hidden) return;
      testPoint("ruler", m.id, "start", m.start);
      testPoint("ruler", m.id, "end", m.end);
    });
    lldMeasurements.forEach((m) => {
      if (m.locked || m.hidden) return;
      testPoint("lld", m.id, "start", m.start);
      testPoint("lld", m.id, "end", m.end);
    });
    offsetMeasurements.forEach((m) => {
      if (m.locked || m.hidden) return;
      testPoint("offset", m.id, "start", m.start);
      testPoint("offset", m.id, "end", m.end);
    });
    angleMeasurements.forEach((m) => {
      if (m.locked || m.hidden) return;
      testPoint("angle", m.id, "a", m.a);
      testPoint("angle", m.id, "b", m.b);
      testPoint("angle", m.id, "c", m.c);
    });

    if (!ahkaEditLocked) {
      ahkaMeasurements.forEach((m) => {
        if (m.locked || m.hidden) return;
        testPoint("ahka", m.id, "hip", m.hip);
        testPoint("ahka", m.id, "knee", m.knee);
        testPoint("ahka", m.id, "ankle", m.ankle);
      });
    }

    valgusCutLines.forEach((line) => {
      if (line.locked || line.hidden) return;
      testPoint("valgusCut", line.id, "hip", line.hip);
      testPoint("valgusCut", line.id, "knee", line.knee);
    });

    tibialSlopeLines.forEach((line) => {
      if (line.locked || line.hidden) return;
      testPoint("tibialSlope", line.id, "prox", line.prox);
      testPoint("tibialSlope", line.id, "dist", line.dist);
    });

    tibialCutLines.forEach((line) => {
      if (line.locked || line.hidden) return;
      testPoint("tibialCut", line.id, "prox", line.prox);
      testPoint("tibialCut", line.id, "dist", line.dist);
    });

    drawLines.forEach((line) => {
      if (line.locked || line.hidden) return;
      testPoint("drawLine", line.id, "start", line.start);
      testPoint("drawLine", line.id, "end", line.end);
    });

    corMarkers.forEach((m) => {
      if (m.locked || m.hidden) return;
      testPoint("cor", m.id, "point", m.point);
    });

    return best;
  };

  const resetInteractionDrafts = useCallback(() => {
    setDragging(false);
    rotateDrag.current.active = false;
    scaleDrag.current.dir = null;
    measureDrag.current.active = false;
    drawLineMoveDrag.current = { active: false, id: null, last: null };
    strokeDrawRef.current = {
      active: false,
      pointerId: null,
      kind: null,
      id: null,
      last: null,
    };
    strokeMoveDrag.current = { active: false, id: null, last: null };
    corMoveDrag.current = { active: false, id: null, last: null };
    kneeLineMoveDrag.current = { active: false, kind: null, id: null, last: null };
    setIsCalibrating(false);
    setRulerAnchor(null);
    setRulerDraft(null);
    setLldAnchor(null);
    setLldDraft(null);
    setOffsetAnchor(null);
    setOffsetDraft(null);
    setAnglePoints([]);
    setAngleDraft(null);
    setAhkaPoints([]);
    setAhkaDraft(null);
    setValgusCutAnchor(null);
    setValgusCutDraft(null);
    setTibialSlopeAnchor(null);
    setTibialSlopeDraft(null);
    setTibialCutAnchor(null);
    setTibialCutDraft(null);
    setDrawAnchor(null);
    setDrawDraft(null);
    setStrokeDraftPoints(null);
    setAnnotationDraft(null);
    captureRef.current = null;
  }, [
    setAhkaDraft,
    setAhkaPoints,
    setAngleDraft,
    setAnglePoints,
    setAnnotationDraft,
    setDragging,
    setDrawAnchor,
    setDrawDraft,
    setIsCalibrating,
    setLldAnchor,
    setLldDraft,
    setOffsetAnchor,
    setOffsetDraft,
    setRulerAnchor,
    setRulerDraft,
    setTibialCutAnchor,
    setTibialCutDraft,
    setTibialSlopeAnchor,
    setTibialSlopeDraft,
    setValgusCutAnchor,
    setValgusCutDraft,
    setStrokeDraftPoints,
  ]);

  const { objectsRef, pushHistorySnapshot, resetHistory, undo, redo, canUndo, canRedo } =
    useTemplatingHistory({
      objects,
      setObjects,
      activeId,
      setActiveId,
      measurements,
      setMeasurements,
      lldMeasurements,
      setLldMeasurements,
      offsetMeasurements,
      setOffsetMeasurements,
      angleMeasurements,
      setAngleMeasurements,
      ahkaMeasurements,
      setAhkaMeasurements,
      drawLines,
      setDrawLines,
      strokes,
      setStrokes,
      corMarkers,
      setCorMarkers,
      annotations,
      setAnnotations,
      valgusCutLines,
      setValgusCutLines,
      tibialSlopeLines,
      setTibialSlopeLines,
      tibialCutLines,
      setTibialCutLines,
      resetInteractionDrafts,
    });

  const disableMeasurementModes = useCallback(() => {
    setRulerMode(false);
    setLldMode(false);
    setOffsetMode(false);
    setAngleMode(false);
    setAhkaMode(false);
    setCutoutMode(false);
    setValgusCutMode(false);
    setTibialSlopeMode(false);
    setTibialCutMode(false);
    setDrawMode(false);
    setTraceMode(false);
    setPencilMode(false);
    setCorMode(false);
    setAnnotationMode(false);
    setAnnotationDraft(null);
    setRulerAnchor(null);
    setRulerDraft(null);
    setLldAnchor(null);
    setLldDraft(null);
    setOffsetAnchor(null);
    setOffsetDraft(null);
    setAnglePoints([]);
    setAngleDraft(null);
    setAhkaPoints([]);
    setAhkaDraft(null);
    setValgusCutAnchor(null);
    setValgusCutDraft(null);
    setTibialSlopeAnchor(null);
    setTibialSlopeDraft(null);
    setTibialCutAnchor(null);
    setTibialCutDraft(null);
    setDrawAnchor(null);
    setDrawDraft(null);
    setStrokeDraftPoints(null);
    setCutoutAnchor(null);
    setCutoutDraft(null);
    setCutoutPolyPoints([]);
    setCutoutPolyCursor(null);
    cutoutDragRef.current = {
      active: false,
      pointerId: null,
      kind: null,
      startPoint: null,
      startRect: null,
    };
    setSyncScaleMode(false);
    setIsCalibrating(false);
    setCalStart(null);
    setCalEnd(null);
    strokeDrawRef.current = {
      active: false,
      pointerId: null,
      kind: null,
      id: null,
      last: null,
    };
    strokeMoveDrag.current = { active: false, id: null, last: null };
    corMoveDrag.current = { active: false, id: null, last: null };
  }, [
    setAhkaDraft,
    setAhkaMode,
    setAhkaPoints,
    setAngleDraft,
    setAngleMode,
    setAnglePoints,
    setAnnotationDraft,
    setAnnotationMode,
    setCalEnd,
    setCalStart,
    setDrawAnchor,
    setDrawDraft,
    setDrawMode,
    setTraceMode,
    setPencilMode,
    setCorMode,
    setStrokeDraftPoints,
    setCutoutAnchor,
    setCutoutDraft,
    setCutoutPolyPoints,
    setCutoutPolyCursor,
    setCutoutMode,
    setIsCalibrating,
    setLldAnchor,
    setLldDraft,
    setLldMode,
    setOffsetAnchor,
    setOffsetDraft,
    setOffsetMode,
    setRulerAnchor,
    setRulerDraft,
    setRulerMode,
    setSyncScaleMode,
    setTibialCutAnchor,
    setTibialCutDraft,
    setTibialCutMode,
    setTibialSlopeAnchor,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutAnchor,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const clampZoomValue = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)),
    []
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setViewPan({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    setCanvasMode("fit");
    setZoom(1);
    setViewPan({ x: 0, y: 0 });
  }, []);

  const setOneToOne = useCallback(() => {
    setCanvasMode("oneToOne");
    setZoom(1);
    setViewPan({ x: 0, y: 0 });
  }, []);

  const togglePanMode = useCallback(() => {
    setPanMode((prev) => {
      const next = !prev;
      if (next) disableMeasurementModes();
      return next;
    });
  }, [disableMeasurementModes]);

  const startCutoutMode = useCallback(() => {
    disableMeasurementModes();
    setPanMode(false);
    setCutoutMode(true);
  }, [disableMeasurementModes]);

  const stopCutoutMode = useCallback(() => {
    setCutoutMode(false);
    setCutoutAnchor(null);
    setCutoutDraft(null);
    setCutoutPolyPoints([]);
    setCutoutPolyCursor(null);
    cutoutDragRef.current = {
      active: false,
      pointerId: null,
      kind: null,
      startPoint: null,
      startRect: null,
    };
  }, []);

  const toggleCutoutMode = useCallback(() => {
    if (cutoutMode) stopCutoutMode();
    else startCutoutMode();
  }, [cutoutMode, startCutoutMode, stopCutoutMode]);

  const clearCutout = useCallback(() => {
    setCutout(null);
    setCutoutAnchor(null);
    setCutoutDraft(null);
    setCutoutPolyPoints([]);
    setCutoutPolyCursor(null);
    setCutoutMode(false);
    cutoutDragRef.current = {
      active: false,
      pointerId: null,
      kind: null,
      startPoint: null,
      startRect: null,
    };
  }, []);

  const setCutoutOpacity = useCallback((opacity: number) => {
    setCutout((prev) => (prev ? { ...prev, opacity } : prev));
  }, []);

  const setCutoutShapeWithUpdate = useCallback(
    (shape: CutoutShape) => {
      setCutoutShape(shape);
      if (shape === "polygon") {
        setCutout(null);
        setCutoutAnchor(null);
        setCutoutDraft(null);
        setCutoutPolyPoints([]);
        setCutoutPolyCursor(null);
        return;
      }

      setCutoutPolyPoints([]);
      setCutoutPolyCursor(null);
      setCutout((prev) => {
        if (!prev) return prev;
        if (prev.shape === "polygon") return null;
        if (shape === "rect") return { ...prev, shape: "rect" };

        const cx = prev.x + prev.width / 2;
        const cy = prev.y + prev.height / 2;
        const radius = Math.min(prev.width, prev.height) / 2;
        const minRadius = 20;
        const cx0 = Math.min(XRAY_BASE_WIDTH, Math.max(0, cx));
        const cy0 = Math.min(XRAY_BASE_HEIGHT, Math.max(0, cy));
        const maxRadius = Math.max(
          minRadius,
          Math.min(cx0, XRAY_BASE_WIDTH - cx0, cy0, XRAY_BASE_HEIGHT - cy0)
        );
        const r = Math.min(Math.max(minRadius, radius), maxRadius);
        const cxClamped = Math.min(XRAY_BASE_WIDTH - r, Math.max(r, cx0));
        const cyClamped = Math.min(XRAY_BASE_HEIGHT - r, Math.max(r, cy0));
        const next = {
          x: cxClamped - r,
          y: cyClamped - r,
          width: r * 2,
          height: r * 2,
        };
        return { ...prev, ...next, shape: "circle" };
      });
    },
    []
  );

  const createOverlayFromCutout = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!background) {
      toast({
        title: "Tidak ada X-ray",
        description: "Upload gambar X-ray dulu sebelum membuat overlay cutout.",
      });
      return;
    }
    if (cameraMode) {
      toast({
        title: "Cutout overlay hanya untuk gambar upload",
        description: "Matikan kamera untuk membuat overlay dari gambar X-ray.",
      });
      return;
    }
    if (!cutout) {
      toast({
        title: "Cutout belum dibuat",
        description: "Aktifkan Cutout lalu drag area yang ingin di-crop.",
      });
      return;
    }

    const img = await ensureImageLoaded(background);
    if (!img) {
      toast({
        title: "Gagal memuat gambar",
        description: "Coba upload ulang X-ray.",
      });
      return;
    }

    const w = Math.max(1, Math.round(cutout.width));
    const h = Math.max(1, Math.round(cutout.height));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.clearRect(0, 0, w, h);
    ctx.filter = `contrast(${xrayContrast})`;

    const shape = cutout.shape ?? cutoutShape;
    const sx = cutout.x;
    const sy = cutout.y;
    const sw = cutout.width;
    const sh = cutout.height;
    if (shape === "polygon") {
      const points = cutout.points ?? [];
      if (points.length < 3) {
        toast({
          title: "Cutout polygon belum lengkap",
          description: "Buat minimal 3 titik lalu tutup shape.",
        });
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x - cutout.x, points[0].y - cutout.y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x - cutout.x, points[i].y - cutout.y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        w,
        h
      );
      ctx.restore();
    } else if (shape === "circle") {
      ctx.save();
      const r = Math.min(w, h) / 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        w,
        h
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        w,
        h
      );
    }

    const dataUrl = canvas.toDataURL("image/png");

    disableMeasurementModes();
    pushHistorySnapshot();

    const overlay = createImageOverlay("Cutout Overlay", dataUrl, {
      position: { x: cutout.x, y: cutout.y },
      opacity: 1,
      baseWidth: w,
      baseHeight: h,
      paddingPx: 0,
    });
    setObjects((prev) => [...prev, overlay]);
    setActiveId(overlay.id);
    setCutout(null);
    setCutoutAnchor(null);
    setCutoutDraft(null);
    setCutoutPolyPoints([]);
    setCutoutPolyCursor(null);
    setCutoutMode(false);

    toast({
      title: "Overlay dibuat",
      description: "Overlay bisa di-move/rotate/scale seperti template.",
    });
  }, [
    background,
    cameraMode,
    createImageOverlay,
    cutout,
    cutoutShape,
    disableMeasurementModes,
    ensureImageLoaded,
    pushHistorySnapshot,
    xrayContrast,
  ]);

  const zoomAboutClientPoint = useCallback(
    (clientX: number, clientY: number, nextZoom: number) => {
      const current = getXrayTransform(
        stageRef,
        zoom,
        canvasMode,
        coverMode,
        viewPan
      );
      if (!current) return;
      const world = {
        x: Math.min(
          XRAY_BASE_WIDTH,
          Math.max(
            0,
            (clientX - current.rect.left - current.offsetX) / current.scale
          )
        ),
        y: Math.min(
          XRAY_BASE_HEIGHT,
          Math.max(
            0,
            (clientY - current.rect.top - current.offsetY) / current.scale
          )
        ),
      };

      const base = getXrayTransform(
        stageRef,
        nextZoom,
        canvasMode,
        coverMode,
        { x: 0, y: 0 }
      );
      if (!base) return;
      const pan = {
        x:
          clientX -
          base.rect.left -
          base.offsetX -
          world.x * base.scale,
        y:
          clientY -
          base.rect.top -
          base.offsetY -
          world.y * base.scale,
      };
      setZoom(nextZoom);
      setViewPan(pan);
    },
    [canvasMode, coverMode, viewPan, zoom]
  );

  const onStageWheel = useCallback(
    (e: React.WheelEvent) => {
      if (typeof window === "undefined") return;
      if (measurePanelDrag.current.dragging || dragState.current.dragging) return;
      e.preventDefault();
      e.stopPropagation();

      const speed = e.ctrlKey ? 0.0025 : 0.0015;
      const factor = Math.exp(-e.deltaY * speed);
      const nextZoom = clampZoomValue(zoom * factor);
      if (nextZoom === zoom) return;
      zoomAboutClientPoint(e.clientX, e.clientY, nextZoom);
    },
    [clampZoomValue, zoom, zoomAboutClientPoint]
  );

  const scaleImplantByMm = (targetMm: number) => {
    if (!active || active.type === "shape" || !mmPerPixel || active.scaleLocked)
      return;
    disableMeasurementModes();
    pushHistorySnapshot();

    // estimasi panjang pixel image
    const IMAGE_BASE_PX = 300; // sesuai <Image width={300} />

    const currentRealMm = IMAGE_BASE_PX * active.scaleX * mmPerPixel;
    const factor = targetMm / currentRealMm;

    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? {
              ...o,
              scaleX: o.scaleX * factor,
              scaleY: o.scaleY * factor,
              realLengthMm: targetMm,
            }
          : o
      )
    );
  };

  const addImplant = (item: ImplantLibraryItem) => {
    disableMeasurementModes();
    if (
      !objects.length &&
      !panelManualMove.current &&
      !panelAutoPlaced.current &&
      typeof window !== "undefined"
    ) {
      const margin = 16;
      const panelWidth = panelRef.current?.offsetWidth ?? 224;
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const x = Math.max(margin, window.innerWidth - panelWidth - margin);

      setPanelPos((prev) => {
        const y = Math.min(prev.y, window.innerHeight - panelHeight - margin);
        return { x, y: Math.max(margin, y) };
      });

      panelAutoPlaced.current = true;
    }

    pushHistorySnapshot();
    const implant = createImplant(item);
    setObjects((p) => [...p, implant]);
    setActiveId(implant.id);
  };

  const addShapeOverlay = useCallback(
    (shape: "circle" | "square" | "triangle") => {
      disableMeasurementModes();
      pushHistorySnapshot();
      const overlay = createShape(shape);
      setObjects((p) => [...p, overlay]);
      setActiveId(overlay.id);
    },
    [createShape, disableMeasurementModes, pushHistorySnapshot]
  );

  const addImageOverlay = useCallback(
    (file: File) => {
      disableMeasurementModes();

      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        if (!src) return;
        pushHistorySnapshot();
        const overlay = createImageOverlay(file.name, src);
        setObjects((p) => [...p, overlay]);
        setActiveId(overlay.id);
      };
      reader.readAsDataURL(file);
    },
    [createImageOverlay, disableMeasurementModes, pushHistorySnapshot]
  );

  const moveActive = useCallback(
    (dx: number, dy: number) => {
      if (!active) return;
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id
            ? { ...o, position: { x: o.position.x + dx, y: o.position.y + dy } }
            : o
        )
      );
    },
    [active]
  );

  const moveActiveWithHistory = useCallback(
    (dx: number, dy: number) => {
      if (!active) return;
      pushHistorySnapshot();
      moveActive(dx, dy);
    },
    [active, moveActive, pushHistorySnapshot]
  );

  const scaleActive = useCallback(
    (delta: number) => {
      if (!active || active.scaleLocked) return;
      disableMeasurementModes();
      pushHistorySnapshot();
      setObjects((p) =>
        p.map((o) => {
          if (o.id !== active.id) return o;
          const v = Math.max(0.1, o.scaleX + delta);
          return o.locked
            ? { ...o, scaleX: v, scaleY: v }
            : { ...o, scaleX: v };
        })
      );
    },
    [active, disableMeasurementModes, pushHistorySnapshot]
  );

  const rotateActive = useCallback(
    (delta: number) => {
      if (!active) return;
      pushHistorySnapshot();
      const flipDirection = (active.flipX ?? 1) * (active.flipY ?? 1);
      const adjusted = flipDirection < 0 ? -delta : delta;
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, rotation: o.rotation + adjusted } : o
        )
      );
    },
    [active, pushHistorySnapshot]
  );

  const deleteActive = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) => p.filter((o) => o.id !== active.id));
    setActiveId(null);
  }, [active, pushHistorySnapshot]);

  /* ================= FLIP ================= */

  const flipActiveX = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? { ...o, flipX: ((o.flipX ?? 1) * -1) as 1 | -1 }
          : o
      )
    );
  }, [active, pushHistorySnapshot]);

  const flipActiveY = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? { ...o, flipY: ((o.flipY ?? 1) * -1) as 1 | -1 }
          : o
      )
    );
  }, [active, pushHistorySnapshot]);

  const startScaleScrub = useCallback(() => {
    if (!active || active.scaleLocked) return;
    if (scaleScrubRef.current) return;
    scaleScrubRef.current = true;
    pushHistorySnapshot();
  }, [active, pushHistorySnapshot]);

  const endScaleScrub = useCallback(() => {
    scaleScrubRef.current = false;
  }, []);

  const updateActiveScale = useCallback(
    (value: number) => {
      if (!active || active.scaleLocked || value === active.scaleX) return;
      disableMeasurementModes();
      if (!scaleScrubRef.current) {
        pushHistorySnapshot();
      }
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, scaleX: value, scaleY: value } : o
        )
      );
      if (!scaleScrubRef.current) {
        const nextStep = Number(Math.abs(value - active.scaleX).toFixed(3));
        if (nextStep) setScaleStep(nextStep);
      }
    },
    [active, disableMeasurementModes, pushHistorySnapshot, setScaleStep]
  );

  const updateActiveRotation = useCallback(
    (value: number) => {
      if (!active) return;
      const flipDirection = (active.flipX ?? 1) * (active.flipY ?? 1);
      const displayRotation = flipDirection < 0 ? -active.rotation : active.rotation;
      const internalValue = flipDirection < 0 ? -value : value;
      if (internalValue === active.rotation) return;
      pushHistorySnapshot();
      setObjects((p) =>
        p.map((o) => (o.id === active.id ? { ...o, rotation: internalValue } : o))
      );
      const nextStep = Math.abs(value - displayRotation);
      if (nextStep) setRotateStep(nextStep);
    },
    [active, pushHistorySnapshot, setRotateStep]
  );

  const toggleActiveLock = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) => (o.id === active.id ? { ...o, locked: !o.locked } : o))
    );
  }, [active, pushHistorySnapshot]);

  const toggleActiveScaleLock = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id ? { ...o, scaleLocked: !o.scaleLocked } : o
      )
    );
  }, [active, pushHistorySnapshot]);

  const updateActiveOpacity = useCallback(
    (value: number) => {
      if (!active) return;
      const clamped = Math.min(1, Math.max(0.1, value));
      pushHistorySnapshot();
      setObjects((p) =>
        p.map((o) => (o.id === active.id ? { ...o, opacity: clamped } : o))
      );
    },
    [active, pushHistorySnapshot]
  );

  const bringActiveToFront = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.id === active.id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  }, [active, pushHistorySnapshot]);

  const sendActiveToBack = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.id === active.id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }, [active, pushHistorySnapshot]);

  const addRulerPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!rulerAnchor) {
        setRulerAnchor(point);
        setRulerDraft(point);
        return;
      }

      pushHistorySnapshot();
      setMeasurements((prev) => [
        ...prev,
        {
          id: createId(),
          start: rulerAnchor,
          end: point,
          locked: false,
        },
      ]);
      setRulerAnchor(null);
      setRulerDraft(null);
    },
    [pushHistorySnapshot, rulerAnchor]
  );

  const finishRuler = useCallback(() => {
    setRulerAnchor(null);
    setRulerDraft(null);
  }, []);

  const addLldPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!lldAnchor) {
        setLldAnchor(point);
        setLldDraft(point);
        return;
      }

      pushHistorySnapshot();
      setLldMeasurements((prev) => [
        ...prev,
        {
          id: createId(),
          start: lldAnchor,
          end: point,
          locked: false,
        },
      ]);
      setLldAnchor(null);
      setLldDraft(null);
    },
    [lldAnchor, pushHistorySnapshot]
  );

  const finishLld = useCallback(() => {
    setLldAnchor(null);
    setLldDraft(null);
  }, []);

  const addOffsetPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!offsetAnchor) {
        setOffsetAnchor(point);
        setOffsetDraft(point);
        return;
      }

      pushHistorySnapshot();
      setOffsetMeasurements((prev) => [
        ...prev,
        {
          id: createId(),
          start: offsetAnchor,
          end: point,
          locked: false,
        },
      ]);
      setOffsetAnchor(null);
      setOffsetDraft(null);
    },
    [offsetAnchor, pushHistorySnapshot]
  );

  const finishOffset = useCallback(() => {
    setOffsetAnchor(null);
    setOffsetDraft(null);
  }, []);

  const addAnglePoint = useCallback((point: { x: number; y: number }) => {
    setAnglePoints((prev) => {
      if (prev.length === 0) {
        setAngleDraft(point);
        return [point];
      }
      if (prev.length === 1) {
        setAngleDraft(point);
        return [prev[0], point];
      }

      pushHistorySnapshot();
      setAngleMeasurements((items) => [
        ...items,
        {
          id: createId(),
          a: prev[0],
          b: prev[1],
          c: point,
          locked: false,
        },
      ]);
      setAngleDraft(null);
      return [];
    });
  }, [pushHistorySnapshot]);

  const finishAngle = useCallback(() => {
    setAnglePoints([]);
    setAngleDraft(null);
  }, []);

  const addAhkaPoint = useCallback((point: { x: number; y: number }) => {
    setAhkaPoints((prev) => {
      if (prev.length === 0) {
        setAhkaDraft(point);
        return [point];
      }
      if (prev.length === 1) {
        setAhkaDraft(point);
        return [prev[0], point];
      }

      pushHistorySnapshot();
      setAhkaMeasurements((items) => [
        ...items,
        {
          id: createId(),
          hip: prev[0],
          knee: prev[1],
          ankle: point,
          side: inferLegSide(prev[1]),
          locked: false,
        },
      ]);
      setAhkaDraft(null);
      return [];
    });
  }, [inferLegSide, pushHistorySnapshot]);

  const finishAhka = useCallback(() => {
    setAhkaPoints([]);
    setAhkaDraft(null);
  }, []);
  const onKneeToolToggleAny = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    setDrawMode(false);
    setDrawAnchor(null);
    setDrawDraft(null);
  }, []);

  const onKneeToolEnable = useCallback(() => {
    setPanMode(false);
    setSyncScaleMode(false);
    setIsCalibrating(false);
    setCalStart(null);
    setCalEnd(null);
    setRulerMode(false);
    finishRuler();
    setAngleMode(false);
    finishAngle();
    setAhkaMode(false);
    finishAhka();
    setLldMode(false);
    finishLld();
    setOffsetMode(false);
    finishOffset();
    setAnnotationMode(false);
    setAnnotationDraft(null);
  }, [finishAhka, finishAngle, finishLld, finishOffset, finishRuler]);

  const {
    resetValgusCut,
    resetTibialSlope,
    resetTibialCut,
    removeValgusCutLine,
    toggleValgusCutLineLock,
    removeTibialSlopeLine,
    toggleTibialSlopeLineLock,
    removeTibialCutLine,
    toggleTibialCutLineLock,
    toggleValgusCutMode,
    toggleTibialSlopeMode,
    toggleTibialCutMode,
    findKneeLineSegmentHit,
    handleKneeDraftMove,
    handleKneeStageClick,
    handleKneeHandleDrag,
    moveKneeLine,
  } = useKneePlanningActions({
    state: kneeState,
    pushHistorySnapshot,
    onToggleAny: onKneeToolToggleAny,
    onEnableTool: onKneeToolEnable,
    stageRef,
    zoom,
    canvasMode,
    cameraMode,
  });

  const toggleValgusCutLineHidden = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setValgusCutLines((prev) =>
        prev.map((line) =>
          line.id === id ? { ...line, hidden: !line.hidden } : line
        )
      );
    },
    [pushHistorySnapshot]
  );

  const toggleTibialSlopeLineHidden = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setTibialSlopeLines((prev) =>
        prev.map((line) =>
          line.id === id ? { ...line, hidden: !line.hidden } : line
        )
      );
    },
    [pushHistorySnapshot]
  );

  const toggleTibialCutLineHidden = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setTibialCutLines((prev) =>
        prev.map((line) =>
          line.id === id ? { ...line, hidden: !line.hidden } : line
        )
      );
    },
    [pushHistorySnapshot]
  );

  const resetDraw = useCallback(() => {
    setDrawMode(false);
    setDrawAnchor(null);
    setDrawDraft(null);
  }, []);

  const toggleDrawMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    if (drawMode) {
      setDrawMode(false);
      setDrawAnchor(null);
      setDrawDraft(null);
      return;
    }
    disableMeasurementModes();
    setDrawAnchor(null);
    setDrawDraft(null);
    setDrawMode(true);
  }, [disableMeasurementModes, drawMode]);

  const toggleTraceMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    if (traceMode) {
      strokeDrawRef.current = {
        active: false,
        pointerId: null,
        kind: null,
        id: null,
        last: null,
      };
      setStrokeDraftPoints(null);
      setTraceMode(false);
      return;
    }
    disableMeasurementModes();
    setStrokeDraftPoints(null);
    setTraceMode(true);
  }, [disableMeasurementModes, traceMode]);

  const togglePencilMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    if (pencilMode) {
      strokeDrawRef.current = {
        active: false,
        pointerId: null,
        kind: null,
        id: null,
        last: null,
      };
      setStrokeDraftPoints(null);
      setPencilMode(false);
      return;
    }
    disableMeasurementModes();
    setStrokeDraftPoints(null);
    setPencilMode(true);
  }, [disableMeasurementModes, pencilMode]);

  const toggleCorMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    if (corMode) {
      setCorMode(false);
      return;
    }
    disableMeasurementModes();
    setCorMode(true);
  }, [corMode, disableMeasurementModes]);

  const addDrawLinePoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!drawAnchor) {
        setDrawAnchor(point);
        setDrawDraft(point);
        return;
      }

      pushHistorySnapshot();
      setDrawLines((prev) => [
        ...prev,
        {
          id: createId(),
          start: drawAnchor,
          end: point,
          locked: false,
        },
      ]);
      setDrawAnchor(null);
      setDrawDraft(null);
    },
    [drawAnchor, pushHistorySnapshot]
  );

  const clearDrawLines = useCallback(() => {
    if (!drawLines.length) return;
    pushHistorySnapshot();
    setDrawLines([]);
    setDrawAnchor(null);
    setDrawDraft(null);
  }, [drawLines.length, pushHistorySnapshot]);

  const removeDrawLine = useCallback((id: string) => {
    pushHistorySnapshot();
    setDrawLines((prev) => prev.filter((line) => line.id !== id));
  }, [pushHistorySnapshot]);

  const toggleDrawLineLock = useCallback((id: string) => {
    pushHistorySnapshot();
    setDrawLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, locked: !line.locked } : line
      )
    );
  }, [pushHistorySnapshot]);

  const toggleDrawLineHidden = useCallback((id: string) => {
    pushHistorySnapshot();
    setDrawLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, hidden: !line.hidden } : line
      )
    );
  }, [pushHistorySnapshot]);

  const clearStrokesByKind = useCallback(
    (kind: FreehandStroke["kind"]) => {
      const hasAny = strokes.some((s) => s.kind === kind);
      if (!hasAny) return;
      pushHistorySnapshot();
      setStrokes((prev) => prev.filter((s) => s.kind !== kind));
      setStrokeDraftPoints(null);
    },
    [pushHistorySnapshot, strokes]
  );

  const removeStroke = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setStrokes((prev) => prev.filter((s) => s.id !== id));
    },
    [pushHistorySnapshot]
  );

  const toggleStrokeLock = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setStrokes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s))
      );
    },
    [pushHistorySnapshot]
  );

  const toggleStrokeHidden = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setStrokes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s))
      );
    },
    [pushHistorySnapshot]
  );

  const clearCorMarkers = useCallback(() => {
    if (!corMarkers.length) return;
    pushHistorySnapshot();
    setCorMarkers([]);
  }, [corMarkers.length, pushHistorySnapshot]);

  const removeCorMarker = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setCorMarkers((prev) => prev.filter((m) => m.id !== id));
    },
    [pushHistorySnapshot]
  );

  const toggleCorLock = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setCorMarkers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
      );
    },
    [pushHistorySnapshot]
  );

  const toggleCorHidden = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setCorMarkers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))
      );
    },
    [pushHistorySnapshot]
  );

  const startSyncScale = useCallback(() => {
    setSyncScaleMode(true);
    setRulerMode(false);
    setAngleMode(false);
    setAhkaMode(false);
    setLldMode(false);
    setOffsetMode(false);
    setAnnotationMode(false);
    finishRuler();
    finishAngle();
    finishAhka();
    finishLld();
    finishOffset();
    setAnnotationDraft(null);
    resetDraw();
  }, [
    finishRuler,
    finishAngle,
    finishAhka,
    finishLld,
    finishOffset,
    resetDraw,
  ]);

  const stopSyncScale = useCallback(() => {
    setSyncScaleMode(false);
    setIsCalibrating(false);
    setCalStart(null);
    setCalEnd(null);
  }, []);

  const clearMeasurements = useCallback(() => {
    if (!measurements.length) return;
    pushHistorySnapshot();
    setMeasurements([]);
    finishRuler();
  }, [finishRuler, measurements.length, pushHistorySnapshot]);

  const clearLldMeasurements = useCallback(() => {
    if (!lldMeasurements.length) return;
    pushHistorySnapshot();
    setLldMeasurements([]);
    finishLld();
  }, [finishLld, lldMeasurements.length, pushHistorySnapshot]);

  const clearOffsetMeasurements = useCallback(() => {
    if (!offsetMeasurements.length) return;
    pushHistorySnapshot();
    setOffsetMeasurements([]);
    finishOffset();
  }, [finishOffset, offsetMeasurements.length, pushHistorySnapshot]);

  const toggleRulerMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    resetDraw();
    setRulerMode((prev) => {
      if (prev) finishRuler();
      if (!prev) {
        stopSyncScale();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setAngleMode(false);
        finishAngle();
        setAhkaMode(false);
        finishAhka();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [
    finishRuler,
    finishAngle,
    finishAhka,
    finishLld,
    finishOffset,
    stopSyncScale,
    resetDraw,
    setActiveId,
    setAhkaMode,
    setAngleMode,
    setAnnotationDraft,
    setAnnotationMode,
    setLldMode,
    setOffsetMode,
    setRulerMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleLldMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    resetDraw();
    setLldMode((prev) => {
      if (prev) finishLld();
      if (!prev) {
        stopSyncScale();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setAhkaMode(false);
        finishAhka();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [
    finishLld,
    finishRuler,
    finishAngle,
    finishAhka,
    finishOffset,
    stopSyncScale,
    resetDraw,
    setActiveId,
    setAhkaMode,
    setAngleMode,
    setAnnotationDraft,
    setAnnotationMode,
    setLldMode,
    setOffsetMode,
    setRulerMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleOffsetMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    resetDraw();
    setOffsetMode((prev) => {
      if (prev) finishOffset();
      if (!prev) {
        stopSyncScale();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setAhkaMode(false);
        finishAhka();
        setLldMode(false);
        finishLld();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [
    finishOffset,
    finishRuler,
    finishAngle,
    finishAhka,
    finishLld,
    stopSyncScale,
    resetDraw,
    setActiveId,
    setAhkaMode,
    setAngleMode,
    setAnnotationDraft,
    setAnnotationMode,
    setLldMode,
    setOffsetMode,
    setRulerMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleAngleMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    resetDraw();
    setAngleMode((prev) => {
      if (prev) finishAngle();
      if (!prev) {
        stopSyncScale();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setRulerMode(false);
        finishRuler();
        setAhkaMode(false);
        finishAhka();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [
    finishRuler,
    finishAngle,
    finishAhka,
    finishLld,
    finishOffset,
    stopSyncScale,
    resetDraw,
    setActiveId,
    setAhkaMode,
    setAngleMode,
    setAnnotationDraft,
    setAnnotationMode,
    setLldMode,
    setOffsetMode,
    setRulerMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleAhkaMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    resetDraw();
    setAhkaMode((prev) => {
      if (prev) finishAhka();
      if (!prev) {
        stopSyncScale();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [
    finishAhka,
    finishRuler,
    finishAngle,
    finishLld,
    finishOffset,
    stopSyncScale,
    resetDraw,
    setActiveId,
    setAhkaMode,
    setAngleMode,
    setAnnotationDraft,
    setAnnotationMode,
    setLldMode,
    setOffsetMode,
    setRulerMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleAnnotationMode = useCallback(() => {
    setPanMode(false);
    setActiveId(null);
    resetDraw();
    setAnnotationMode((prev) => {
      if (!prev) {
        stopSyncScale();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setAhkaMode(false);
        finishAhka();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
      } else {
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [
    finishRuler,
    finishAngle,
    finishAhka,
    finishLld,
    finishOffset,
    stopSyncScale,
    resetDraw,
    setActiveId,
    setAhkaMode,
    setAngleMode,
    setAnnotationDraft,
    setAnnotationMode,
    setLldMode,
    setOffsetMode,
    setRulerMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const removeMeasurement = useCallback((id: string) => {
    pushHistorySnapshot();
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, [pushHistorySnapshot]);

  const toggleMeasurementLock = useCallback((id: string) => {
    pushHistorySnapshot();
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
    );
  }, [pushHistorySnapshot]);

  const toggleMeasurementHidden = useCallback((id: string) => {
    pushHistorySnapshot();
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))
    );
  }, [pushHistorySnapshot]);

  const removeLldMeasurement = useCallback((id: string) => {
    pushHistorySnapshot();
    setLldMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, [pushHistorySnapshot]);

  const toggleLldLock = useCallback((id: string) => {
    pushHistorySnapshot();
    setLldMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
    );
  }, [pushHistorySnapshot]);

  const toggleLldHidden = useCallback((id: string) => {
    pushHistorySnapshot();
    setLldMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))
    );
  }, [pushHistorySnapshot]);

  const removeOffsetMeasurement = useCallback((id: string) => {
    pushHistorySnapshot();
    setOffsetMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, [pushHistorySnapshot]);

  const toggleOffsetLock = useCallback((id: string) => {
    pushHistorySnapshot();
    setOffsetMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
    );
  }, [pushHistorySnapshot]);

  const toggleOffsetHidden = useCallback((id: string) => {
    pushHistorySnapshot();
    setOffsetMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))
    );
  }, [pushHistorySnapshot]);

  const removeAngleMeasurement = useCallback((id: string) => {
    pushHistorySnapshot();
    setAngleMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, [pushHistorySnapshot]);

  const toggleAngleLock = useCallback((id: string) => {
    pushHistorySnapshot();
    setAngleMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
    );
  }, [pushHistorySnapshot]);

  const toggleAngleHidden = useCallback((id: string) => {
    pushHistorySnapshot();
    setAngleMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))
    );
  }, [pushHistorySnapshot]);

  const clearAhka = useCallback(() => {
    if (!ahkaMeasurements.length) return;
    pushHistorySnapshot();
    setAhkaMeasurements([]);
    finishAhka();
  }, [ahkaMeasurements.length, finishAhka, pushHistorySnapshot]);

  const removeAhkaMeasurement = useCallback((id: string) => {
    pushHistorySnapshot();
    setAhkaMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, [pushHistorySnapshot]);

  const toggleAhkaLock = useCallback((id: string) => {
    pushHistorySnapshot();
    setAhkaMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, locked: !m.locked } : m))
    );
  }, [pushHistorySnapshot]);

  const toggleAhkaHidden = useCallback((id: string) => {
    pushHistorySnapshot();
    setAhkaMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))
    );
  }, [pushHistorySnapshot]);

  const clearAnnotations = useCallback(() => {
    if (!annotations.length) return;
    pushHistorySnapshot();
    setAnnotations([]);
    setAnnotationDraft(null);
  }, [annotations.length, pushHistorySnapshot]);

  const clearAngles = useCallback(() => {
    if (!angleMeasurements.length) return;
    pushHistorySnapshot();
    setAngleMeasurements([]);
    finishAngle();
  }, [angleMeasurements.length, finishAngle, pushHistorySnapshot]);

  const removeAnnotation = useCallback((id: string) => {
    pushHistorySnapshot();
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setAnnotationDraft((prev) => (prev?.id === id ? null : prev));
  }, [pushHistorySnapshot]);

  const toggleAnnotationHidden = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setAnnotations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, hidden: !a.hidden } : a))
      );
    },
    [pushHistorySnapshot]
  );

  const beginMoveAnnotation = useCallback(() => {
    pushHistorySnapshot();
  }, [pushHistorySnapshot]);

  const translateAnnotation = useCallback((id: string, dx: number, dy: number) => {
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.locked) return a;
        const nextX = Math.min(XRAY_BASE_WIDTH, Math.max(0, a.x + dx));
        const nextY = Math.min(XRAY_BASE_HEIGHT, Math.max(0, a.y + dy));
        return { ...a, x: nextX, y: nextY };
      })
    );
  }, []);

  const startAnnotationDraft = useCallback(
    (point: { x: number; y: number }) => {
      if (annotationDraft) return;
      setAnnotationDraft({ x: point.x, y: point.y, text: "" });
    },
    [annotationDraft]
  );

  const updateAnnotationDraftText = useCallback((text: string) => {
    setAnnotationDraft((prev) => (prev ? { ...prev, text } : prev));
  }, []);

  const cancelAnnotationDraft = useCallback(() => {
    setAnnotationDraft(null);
  }, []);

  const saveAnnotationDraft = useCallback(() => {
    if (!annotationDraft) return;
    const text = annotationDraft.text.trim();
    if (!text) {
      setAnnotationDraft(null);
      return;
    }

    pushHistorySnapshot();
    if (annotationDraft.id) {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === annotationDraft.id ? { ...a, text } : a))
      );
    } else {
      setAnnotations((prev) => [
        ...prev,
        {
          id: createId(),
          x: annotationDraft.x,
          y: annotationDraft.y,
          text,
        },
      ]);
    }

    setAnnotationDraft(null);
  }, [annotationDraft, pushHistorySnapshot]);

  const editAnnotation = useCallback(
    (annotation: Annotation) => {
      setAnnotationMode(true);
      stopSyncScale();
      setRulerMode(false);
      finishRuler();
      setAngleMode(false);
      finishAngle();
      setLldMode(false);
      finishLld();
      setOffsetMode(false);
      finishOffset();
      setAnnotationDraft({
        id: annotation.id,
        x: annotation.x,
        y: annotation.y,
        text: annotation.text,
      });
    },
    [finishRuler, finishAngle, finishLld, finishOffset, stopSyncScale]
  );

  /* =====================================================
     EVENTS
     ===================================================== */

  const onGlobalPointerMove = (e: React.PointerEvent) => {
    const transform = getXrayTransform(stageRef, zoom, canvasMode, coverMode, viewPan);
    const dragScale = transform?.scale ?? zoom;

    const panDrag = panDragRef.current;
    if (panDrag.active && panDrag.pointerId === e.pointerId && panDrag.last) {
      const dx = e.clientX - panDrag.last.x;
      const dy = e.clientY - panDrag.last.y;
      setViewPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panDrag.last = { x: e.clientX, y: e.clientY };
      return;
    }

    const canvasGesture = canvasGestureRef.current;
    if (canvasGesture.pointers.has(e.pointerId)) {
      canvasGesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (canvasGesture.active && canvasGesture.startWorld) {
      const points = Array.from(canvasGesture.pointers.values());
      if (points.length < 2) {
        canvasGesture.active = false;
      } else {
        const [p1, p2] = points;
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
        const nextZoom = clampZoomValue(
          canvasGesture.startZoom * (distance / (canvasGesture.startDistance || 1))
        );
        const base = getXrayTransform(
          stageRef,
          nextZoom,
          canvasMode,
          coverMode,
          { x: 0, y: 0 }
        );
        if (base) {
          setZoom(nextZoom);
          setViewPan({
            x:
              center.x -
              base.rect.left -
              base.offsetX -
              canvasGesture.startWorld.x * base.scale,
            y:
              center.y -
              base.rect.top -
              base.offsetY -
              canvasGesture.startWorld.y * base.scale,
          });
        }
      }
      return;
    }

    const gesture = pinchRef.current;
    if (gesture.pointers.has(e.pointerId)) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) gesture.pointers.set(e.pointerId, point);
    }
    if (gesture.active && gesture.targetId) {
      const points = getPinchPoints(gesture);
      if (!points) {
        gesture.active = false;
      } else {
        const [p1, p2] = points;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.hypot(dx, dy) || 1;
        const scaleFactor = distance / (gesture.startDistance || 1);
        const nextScaleX = Math.max(0.05, gesture.startScaleX * scaleFactor);
        const nextScaleY = Math.max(
          0.05,
          (gesture.lockAspect ? gesture.startScaleX : gesture.startScaleY) *
            scaleFactor
        );
        const angle = Math.atan2(dy, dx);
        const deltaDeg = ((angle - gesture.startAngle) * 180) / Math.PI;
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const position = {
          x: gesture.startPosition.x + (center.x - gesture.startCenter.x),
          y: gesture.startPosition.y + (center.y - gesture.startCenter.y),
        };

        setObjects((prev) =>
          prev.map((o) => {
            if (o.id !== gesture.targetId) return o;
            const flipDirection = (o.flipX ?? 1) * (o.flipY ?? 1);
            const rotation =
              gesture.startRotation +
              (flipDirection < 0 ? -deltaDeg : deltaDeg);
            const scaleLocked = o.scaleLocked;
            return {
              ...o,
              position,
              scaleX: scaleLocked ? gesture.startScaleX : nextScaleX,
              scaleY: scaleLocked
                ? gesture.startScaleY
                : gesture.lockAspect
                ? nextScaleX
                : nextScaleY,
              rotation,
            };
          })
        );
        return;
      }
    }

    const isBusyDragging =
      dragging ||
      rotateDrag.current.active ||
      Boolean(scaleDrag.current.dir) ||
      measureDrag.current.active ||
      strokeMoveDrag.current.active ||
      Boolean(strokeDrawRef.current.active) ||
      Boolean(cutoutDragRef.current.active) ||
      kneeLineMoveDrag.current.active;
    if (!isBusyDragging) {
      const point = getStagePoint(e.clientX, e.clientY);
      const hitStrokeId = point ? findStrokeSegmentHit(point) : null;
      const handle = point ? findMeasurementHandle(point) : null;
      const hoveringMove = Boolean(hitStrokeId) || handle?.kind === "cor";
      setHoverMoveHint((prev) => (prev === hoveringMove ? prev : hoveringMove));
    }

    if (cutoutMode) {
      const stagePoint = getStagePoint(e.clientX, e.clientY);
      const cutoutDrag = cutoutDragRef.current;
      if (
        cutoutDrag.active &&
        cutoutDrag.pointerId === e.pointerId &&
        stagePoint &&
        cutoutDrag.startRect &&
        cutoutDrag.startPoint &&
        cutoutDrag.kind
      ) {
        const startRect = cutoutDrag.startRect;
        const startPoint = cutoutDrag.startPoint;
        if ((startRect.shape ?? cutoutShape) === "polygon") {
          if (cutoutDrag.kind !== "move") return;
          const startPoints = startRect.points ?? [];
          if (startPoints.length < 3) return;
          const dx = stagePoint.x - startPoint.x;
          const dy = stagePoint.y - startPoint.y;
          const movedPoints = startPoints.map((p) =>
            clampStagePoint({ x: p.x + dx, y: p.y + dy })
          );
          const xs = movedPoints.map((p) => p.x);
          const ys = movedPoints.map((p) => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);
          setCutout((prev) =>
            prev
              ? {
                  ...prev,
                  shape: "polygon",
                  points: movedPoints,
                  x: minX,
                  y: minY,
                  width: Math.max(1, maxX - minX),
                  height: Math.max(1, maxY - minY),
                }
              : {
                  ...startRect,
                  shape: "polygon",
                  points: movedPoints,
                  x: minX,
                  y: minY,
                  width: Math.max(1, maxX - minX),
                  height: Math.max(1, maxY - minY),
                }
          );
          return;
        }
        if (cutoutDrag.kind === "move") {
          const next = clampCutoutRect({
            x: startRect.x + (stagePoint.x - startPoint.x),
            y: startRect.y + (stagePoint.y - startPoint.y),
            width: startRect.width,
            height: startRect.height,
          });
          setCutout((prev) =>
            prev ? { ...prev, ...next } : { ...startRect, ...next }
          );
          return;
        }

        if ((startRect.shape ?? cutoutShape) === "circle") {
          const cx = startRect.x + startRect.width / 2;
          const cy = startRect.y + startRect.height / 2;
          let radius = Math.min(startRect.width, startRect.height) / 2;
          if (cutoutDrag.kind === "n") radius = cy - stagePoint.y;
          if (cutoutDrag.kind === "s") radius = stagePoint.y - cy;
          if (cutoutDrag.kind === "e") radius = stagePoint.x - cx;
          if (cutoutDrag.kind === "w") radius = cx - stagePoint.x;
          const next = clampCutoutCircle({ x: cx, y: cy }, Math.abs(radius));
          setCutout((prev) =>
            prev
              ? { ...prev, ...next, shape: "circle" }
              : { ...startRect, ...next, shape: "circle" }
          );
          return;
        }

        const fixed =
          cutoutDrag.kind === "nw"
            ? { x: startRect.x + startRect.width, y: startRect.y + startRect.height }
            : cutoutDrag.kind === "ne"
              ? { x: startRect.x, y: startRect.y + startRect.height }
              : cutoutDrag.kind === "sw"
                ? { x: startRect.x + startRect.width, y: startRect.y }
                : { x: startRect.x, y: startRect.y };
        const nextRect = buildCutoutRectFromPoints(
          fixed,
          stagePoint,
          startRect.opacity
        );
        setCutout((prev) =>
          prev ? { ...prev, ...nextRect } : nextRect
        );
        return;
      }

      if (cutoutShape === "polygon") {
        if (stagePoint) setCutoutPolyCursor(stagePoint);
        return;
      }

      if (cutoutAnchor && stagePoint) {
        setCutoutDraft(stagePoint);
        return;
      }
    }

    const strokeDraw = strokeDrawRef.current;
    if (strokeDraw.active && strokeDraw.pointerId === e.pointerId) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point) return;
      const lastPoint = strokeDraw.last;
      const minDist = 0.75; // in stage coords
      if (
        lastPoint &&
        Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < minDist
      ) {
        return;
      }
      setStrokeDraftPoints((prev) => (prev ? [...prev, point] : [point]));
      strokeDraw.last = point;
      return;
    }

    if (strokeMoveDrag.current.active && strokeMoveDrag.current.id) {
      const point = getStagePoint(e.clientX, e.clientY);
      const lastPoint = strokeMoveDrag.current.last;
      if (!point || !lastPoint) return;
      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      if (!dx && !dy) return;
      setStrokes((prev) =>
        prev.map((stroke) => {
          if (stroke.id !== strokeMoveDrag.current.id) return stroke;
          return {
            ...stroke,
            points: stroke.points.map((p) =>
              clampStagePoint({ x: p.x + dx, y: p.y + dy })
            ),
          };
        })
      );
      strokeMoveDrag.current.last = point;
      return;
    }

    if (corMoveDrag.current.active && corMoveDrag.current.id) {
      const point = getStagePoint(e.clientX, e.clientY);
      const lastPoint = corMoveDrag.current.last;
      if (!point || !lastPoint) return;
      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      if (!dx && !dy) return;
      setCorMarkers((prev) =>
        prev.map((m) =>
          m.id === corMoveDrag.current.id
            ? { ...m, point: clampStagePoint({ x: m.point.x + dx, y: m.point.y + dy }) }
            : m
        )
      );
      corMoveDrag.current.last = point;
      return;
    }

    if (drawLineMoveDrag.current.active && drawLineMoveDrag.current.id) {
      const point = getStagePoint(e.clientX, e.clientY);
      const lastPoint = drawLineMoveDrag.current.last;
      if (!point || !lastPoint) return;
      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      if (!dx && !dy) return;
      setDrawLines((prev) =>
        prev.map((line) => {
          if (line.id !== drawLineMoveDrag.current.id) return line;
          return {
            ...line,
            start: clampStagePoint({ x: line.start.x + dx, y: line.start.y + dy }),
            end: clampStagePoint({ x: line.end.x + dx, y: line.end.y + dy }),
          };
        })
      );
      drawLineMoveDrag.current.last = point;
      return;
    }

    if (measureDrag.current.active) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point || !measureDrag.current.kind || !measureDrag.current.id)
        return;
      const { kind, id, point: pointKey } = measureDrag.current;

      if (kind === "ruler" && (pointKey === "start" || pointKey === "end")) {
        setMeasurements((prev) =>
          prev.map((m) => (m.id === id ? { ...m, [pointKey]: point } : m))
        );
        return;
      }

      if (kind === "lld" && (pointKey === "start" || pointKey === "end")) {
        setLldMeasurements((prev) =>
          prev.map((m) => (m.id === id ? { ...m, [pointKey]: point } : m))
        );
        return;
      }

      if (kind === "offset" && (pointKey === "start" || pointKey === "end")) {
        setOffsetMeasurements((prev) =>
          prev.map((m) => (m.id === id ? { ...m, [pointKey]: point } : m))
        );
        return;
      }

      if (kind === "angle") {
        if (!pointKey) return;
        setAngleMeasurements((prev) =>
          prev.map((m) =>
            m.id === id && pointKey ? { ...m, [pointKey]: point } : m
          )
        );
        return;
      }

      if (
        kind === "ahka" &&
        (pointKey === "hip" || pointKey === "knee" || pointKey === "ankle")
      ) {
        if (ahkaEditLocked) return;
        setAhkaMeasurements((prev) =>
          prev.map((m) => (m.id === id ? { ...m, [pointKey]: point } : m))
        );
        return;
      }

      if (!pointKey) return;
      if (handleKneeHandleDrag(kind, id, pointKey, point)) return;

      if (kind === "drawLine" && (pointKey === "start" || pointKey === "end")) {
        setDrawLines((prev) =>
          prev.map((line) =>
            line.id === id ? { ...line, [pointKey]: point } : line
          )
        );
        return;
      }

      if (kind === "cor" && pointKey === "point") {
        setCorMarkers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, point } : m))
        );
        return;
      }
    }

    if (kneeLineMoveDrag.current.active) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point) return;
      const drag = kneeLineMoveDrag.current;
      if (!drag.kind || !drag.id) return;
      if (!drag.last) {
        drag.last = point;
        return;
      }

      const dx = point.x - drag.last.x;
      const dy = point.y - drag.last.y;
      moveKneeLine(drag.kind, drag.id, dx, dy);

      kneeLineMoveDrag.current.last = point;
      return;
    }

    if (rotateDrag.current.active) {
      const rawDx = e.clientX - rotateDrag.current.x;
      rotateDrag.current.x = e.clientX;

      // More stable & less aggressive rotation:
      // - use raw screen pixels (not divided by zoom scale)
      // - smaller sensitivity
      // - small deadzone to avoid jitter
      const DEADZONE_PX = 0.5;
      if (Math.abs(rawDx) < DEADZONE_PX) return;

      const ROTATE_DEG_PER_PX = 0.1; // 100px ≈ 10°
      const maxStep = 6; // prevent big jumps on low-FPS pointer events
      const step = Math.max(-maxStep, Math.min(maxStep, rawDx * ROTATE_DEG_PER_PX));

      setObjects((prev) =>
        prev.map((o) => {
          if (o.id !== activeId) return o;
          const flipDirection = (o.flipX ?? 1) * (o.flipY ?? 1);
          const adjusted = flipDirection < 0 ? -step : step;
          return { ...o, rotation: o.rotation + adjusted };
        })
      );
      return;
    }

    if (scaleDrag.current.dir) {
      const dy = (e.clientY - scaleDrag.current.startY) / dragScale;
      applyScaleFromDrag(dy);
      return;
    }

    if (isCalibrating && calStart) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setCalEnd(point);
      return;
    }

    if (annotationMode && annotationDraft) return;

    if (drawMode && drawAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setDrawDraft(point);
      return;
    }

    if (angleMode && anglePoints.length) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setAngleDraft(point);
      return;
    }

    if (ahkaMode && ahkaPoints.length) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setAhkaDraft(point);
      return;
    }

    if (valgusCutMode || tibialSlopeMode || tibialCutMode) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point && handleKneeDraftMove(point)) return;
    }

    if (rulerMode && rulerAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setRulerDraft(point);
      return;
    }

    if (lldMode && lldAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setLldDraft(point);
      return;
    }

    if (offsetMode && offsetAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setOffsetDraft(point);
      return;
    }

    if (dragging && active) {
      const dx = (e.clientX - last.current.x) / dragScale;
      const dy = (e.clientY - last.current.y) / dragScale;
      moveActive(dx, dy);
      last.current = { x: e.clientX, y: e.clientY };
    }
  };

  const resizeToBaseXray = useCallback(
    async (src: string) => {
      if (typeof window === "undefined") return src;
      const img = await ensureImageLoaded(src);
      if (!img) return src;

      const canvas = document.createElement("canvas");
      canvas.width = XRAY_BASE_WIDTH;
      canvas.height = XRAY_BASE_HEIGHT;

      const ctx = canvas.getContext("2d");
      if (!ctx) return src;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const dx = (canvas.width - drawWidth) / 2;
      const dy = (canvas.height - drawHeight) / 2;

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

      try {
        return canvas.toDataURL("image/jpeg", 0.92);
      } catch {
        return src;
      }
    },
    [ensureImageLoaded]
  );

  const uploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const raw = String(r.result || "");
      if (!raw) return;
      void (async () => {
        const resized = await resizeToBaseXray(raw);
        setBackground(resized);
        setCanvasMode("fit");
        setZoom(1);
        setViewPan({ x: 0, y: 0 });
      })();
    };
    r.readAsDataURL(f);
  };

  const onDownObject = (e: React.PointerEvent, objectId?: string) => {
    const isObjectInteraction = Boolean(objectId);
    if (e.shiftKey) return;
    if (
      !isObjectInteraction &&
      (rulerMode ||
        angleMode ||
        ahkaMode ||
        valgusCutMode ||
        tibialSlopeMode ||
        tibialCutMode ||
        lldMode ||
        offsetMode ||
        annotationMode ||
        drawMode)
    )
      return;

    const targetId = objectId ?? activeId;
    if (!targetId) return;
    if (targetId !== activeId) setActiveId(targetId);
    const gesture = pinchRef.current;
    let startedPinch = false;

    if (objectId) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) {
        if (!gesture.targetId) gesture.targetId = targetId;
        if (gesture.targetId === targetId) {
          gesture.pointers.set(e.pointerId, point);
          if (gesture.pointers.size === 2) {
            const points = getPinchPoints(gesture);
            const target = objectsRef.current.find((o) => o.id === targetId);
            if (points && target) {
              const [p1, p2] = points;
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              gesture.active = true;
              gesture.startDistance = Math.hypot(dx, dy) || 1;
              gesture.startAngle = Math.atan2(dy, dx);
              gesture.startScaleX = target.scaleX;
              gesture.startScaleY = target.scaleY;
              gesture.startRotation = target.rotation;
              gesture.startCenter = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
              };
              gesture.startPosition = { ...target.position };
              gesture.lockAspect = target.locked;
              setDragging(false);
              rotateDrag.current.active = false;
              scaleDrag.current.dir = null;
              pushHistorySnapshot();
              startedPinch = true;
            }
          }
        }
      }
    }

    captureRef.current = e.currentTarget as HTMLElement;
    captureRef.current.setPointerCapture(e.pointerId);

    if (startedPinch) return;

    pushHistorySnapshot();
    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };
  };

  // const onUp = (e: React.PointerEvent) => {
  //   setDragging(false);
  //   (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  // };

  const onUp = (e: React.PointerEvent) => {
    rotateDrag.current.active = false;
    scaleDrag.current.dir = null;
    measureDrag.current.active = false;
    kneeLineMoveDrag.current = { active: false, kind: null, id: null, last: null };
    drawLineMoveDrag.current = { active: false, id: null, last: null };
    strokeMoveDrag.current = { active: false, id: null, last: null };
    corMoveDrag.current = { active: false, id: null, last: null };
    setDragging(false);
    setIsCalibrating(false);

    const strokeDraw = strokeDrawRef.current;
    if (strokeDraw.active && strokeDraw.pointerId === e.pointerId) {
      const kind = strokeDraw.kind;
      const points = strokeDraftPoints ?? [];
      strokeDrawRef.current = {
        active: false,
        pointerId: null,
        kind: null,
        id: null,
        last: null,
      };
      setStrokeDraftPoints(null);

      if (kind && points.length >= 2) {
        pushHistorySnapshot();
        const strokeWidth = kind === "trace" ? 3 : 2;
        const color = kind === "trace" ? "#c084fc" : "#60a5fa";
        setStrokes((prev) => [
          ...prev,
          {
            id: strokeDraw.id ?? createId(),
            kind,
            points,
            strokeWidth,
            color,
            locked: false,
            hidden: false,
          },
        ]);
      }
    }

    const cutoutDrag = cutoutDragRef.current;
    if (cutoutDrag.active && cutoutDrag.pointerId === e.pointerId) {
      cutoutDragRef.current = {
        active: false,
        pointerId: null,
        kind: null,
        startPoint: null,
        startRect: null,
      };
    }

    if (cutoutMode && cutoutAnchor) {
      const endPoint = getStagePoint(e.clientX, e.clientY) ?? cutoutDraft;
      if (endPoint) {
        const nextRect =
          cutoutShape === "circle"
            ? buildCutoutCircleFromPoints(cutoutAnchor, endPoint)
            : buildCutoutRectFromPoints(cutoutAnchor, endPoint);
        setCutout(nextRect);
      }
      setCutoutAnchor(null);
      setCutoutDraft(null);
    }

    const panDrag = panDragRef.current;
    if (panDrag.active && panDrag.pointerId === e.pointerId) {
      panDragRef.current = { active: false, pointerId: null, last: null };
    }

    const canvasGesture = canvasGestureRef.current;
    if (canvasGesture.pointers.has(e.pointerId)) {
      canvasGesture.pointers.delete(e.pointerId);
      if (canvasGesture.pointers.size < 2) {
        canvasGesture.active = false;
      }
      if (canvasGesture.pointers.size === 0) {
        canvasGesture.startWorld = null;
        canvasGesture.startDistance = 0;
      }
    }

    const gesture = pinchRef.current;
    if (gesture.pointers.has(e.pointerId)) {
      gesture.pointers.delete(e.pointerId);
      if (gesture.pointers.size < 2) {
        gesture.active = false;
      }
      if (gesture.pointers.size === 0) {
        gesture.targetId = null;
      }
    }

    if (syncScaleMode && calStart) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) {
        const px = Math.hypot(point.x - calStart.x, point.y - calStart.y);
        if (px !== 0) {
          setMmPerPixel(realMm / px);
          setUseRealScale(true);
        }
      }
      stopSyncScale();
    }

    captureRef.current?.releasePointerCapture(e.pointerId);
    captureRef.current = null;
  };

  const startCalibration = (e: React.PointerEvent) => {
    const point = getStagePoint(e.clientX, e.clientY);
    if (!point) return;
    setCalStart(point);
    setCalEnd(point);
    setIsCalibrating(true);
  };

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (panMode) {
      panDragRef.current = {
        active: true,
        pointerId: e.pointerId,
        last: { x: e.clientX, y: e.clientY },
      };
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (syncScaleMode) {
      startCalibration(e);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (e.shiftKey) {
      startCalibration(e);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (annotationDraft) return;

    if (!hasActiveMeasurementMode && e.pointerType === "touch") {
      const gesture = canvasGestureRef.current;
      gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture.pointers.size === 2) {
        const points = Array.from(gesture.pointers.values());
        const [p1, p2] = points;
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const world = getStagePoint(center.x, center.y);
        if (world) {
          gesture.active = true;
          gesture.startDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
          gesture.startZoom = zoom;
          gesture.startWorld = world;
        }
      }
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    const point = getStagePoint(e.clientX, e.clientY);
    if (!point) return;

    if (cutoutMode) {
      const transform = getXrayTransform(
        stageRef,
        zoom,
        canvasMode,
        coverMode,
        viewPan
      );
      const scale = transform?.scale ?? zoom;
      const hitRadius = 14 / scale;

      if (cutoutShape === "polygon") {
        if (cutout && (cutout.shape ?? "polygon") === "polygon" && !cutout.locked) {
          const hit = getCutoutHandleHit(point, cutout, hitRadius);
          if (hit) {
            cutoutDragRef.current = {
              active: true,
              pointerId: e.pointerId,
              kind: hit,
              startPoint: point,
              startRect: cutout,
            };
            captureRef.current = e.currentTarget as HTMLElement;
            captureRef.current.setPointerCapture(e.pointerId);
            return;
          }
        }

        if (cutout && !cutoutPolyPoints.length) {
          setCutout(null);
        }

        const closeRadius = 18 / scale;
        setCutoutAnchor(null);
        setCutoutDraft(null);
        setCutoutPolyCursor(point);
        cutoutDragRef.current = {
          active: false,
          pointerId: null,
          kind: null,
          startPoint: null,
          startRect: null,
        };

        setCutoutPolyPoints((prev) => {
          if (!prev.length) return [point];
          const first = prev[0];
          const dx = point.x - first.x;
          const dy = point.y - first.y;
          if (prev.length >= 3 && dx * dx + dy * dy <= closeRadius * closeRadius) {
            const nextPoly = buildCutoutPolygonFromPoints(prev);
            setCutout(nextPoly);
            setCutoutPolyCursor(null);
            return [];
          }
          return [...prev, point];
        });

        return;
      }

      if (cutout && !cutout.locked) {
        const hit = getCutoutHandleHit(point, cutout, hitRadius);
        if (hit) {
          cutoutDragRef.current = {
            active: true,
            pointerId: e.pointerId,
            kind: hit,
            startPoint: point,
            startRect: cutout,
          };
          captureRef.current = e.currentTarget as HTMLElement;
          captureRef.current.setPointerCapture(e.pointerId);
          return;
        }
      }

      setCutoutAnchor(point);
      setCutoutDraft(point);
      cutoutDragRef.current = {
        active: false,
        pointerId: null,
        kind: null,
        startPoint: null,
        startRect: null,
      };
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (drawMode) {
      // Bonesetter-like: allow adjusting existing draw lines while tool is active.
      const handle = findMeasurementHandle(point);
      if (handle && handle.kind === "drawLine") {
        pushHistorySnapshot();
        measureDrag.current = {
          active: true,
          kind: handle.kind,
          id: handle.id,
          point: handle.point,
        };
        captureRef.current = e.currentTarget as HTMLElement;
        captureRef.current.setPointerCapture(e.pointerId);
        return;
      }
      const hitId = findDrawLineSegmentHit(point);
      if (hitId) {
        pushHistorySnapshot();
        drawLineMoveDrag.current = { active: true, id: hitId, last: point };
        captureRef.current = e.currentTarget as HTMLElement;
        captureRef.current.setPointerCapture(e.pointerId);
        return;
      }

      addDrawLinePoint(point);
      return;
    }

    if (traceMode || pencilMode) {
      // Bonesetter-like: allow moving an existing stroke even while tool is active.
      const hitStrokeId = findStrokeSegmentHit(point);
      if (hitStrokeId) {
        pushHistorySnapshot();
        strokeMoveDrag.current = { active: true, id: hitStrokeId, last: point };
        captureRef.current = e.currentTarget as HTMLElement;
        captureRef.current.setPointerCapture(e.pointerId);
        return;
      }

      const kind: FreehandStroke["kind"] = traceMode ? "trace" : "pencil";
      strokeDrawRef.current = {
        active: true,
        pointerId: e.pointerId,
        kind,
        id: createId(),
        last: point,
      };
      setStrokeDraftPoints([point]);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (corMode) {
      // Bonesetter-like: drag existing COR first, else place new.
      const transform = getXrayTransform(
        stageRef,
        zoom,
        canvasMode,
        coverMode,
        viewPan
      );
      const scale = transform?.scale ?? zoom;
      const hitRadius = 14 / scale;
      const hitRadiusSq = hitRadius * hitRadius;
      const hit = corMarkers.find(
        (m) =>
          !m.hidden &&
          !m.locked &&
          (m.point.x - point.x) * (m.point.x - point.x) +
            (m.point.y - point.y) * (m.point.y - point.y) <=
            hitRadiusSq
      );
      if (hit) {
        pushHistorySnapshot();
        corMoveDrag.current = { active: true, id: hit.id, last: point };
        captureRef.current = e.currentTarget as HTMLElement;
        captureRef.current.setPointerCapture(e.pointerId);
        return;
      }

      pushHistorySnapshot();
      setCorMarkers((prev) => [
        ...prev,
        { id: createId(), point, locked: false, hidden: false },
      ]);
      return;
    }

    const handle = findMeasurementHandle(point);
    if (handle) {
      pushHistorySnapshot();
      measureDrag.current = {
        active: true,
        kind: handle.kind,
        id: handle.id,
        point: handle.point,
      };
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    const kneeHit = findKneeLineSegmentHit(point);
    if (kneeHit) {
      pushHistorySnapshot();
      kneeLineMoveDrag.current = {
        active: true,
        kind: kneeHit.kind,
        id: kneeHit.id,
        last: point,
      };
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    const canMoveDrawLines =
      !rulerMode &&
      !lldMode &&
      !offsetMode &&
      !angleMode &&
      !annotationMode &&
      !ahkaMode &&
      !valgusCutMode &&
      !tibialSlopeMode &&
      !tibialCutMode;
    if (canMoveDrawLines) {
      const hitId = findDrawLineSegmentHit(point);
      if (hitId) {
        pushHistorySnapshot();
        drawLineMoveDrag.current = { active: true, id: hitId, last: point };
        captureRef.current = e.currentTarget as HTMLElement;
        captureRef.current.setPointerCapture(e.pointerId);
        return;
      }
    }

    if (canMoveDrawLines) {
      const hitStrokeId = findStrokeSegmentHit(point);
      if (hitStrokeId) {
        pushHistorySnapshot();
        strokeMoveDrag.current = { active: true, id: hitStrokeId, last: point };
        captureRef.current = e.currentTarget as HTMLElement;
        captureRef.current.setPointerCapture(e.pointerId);
        return;
      }
    }

    if (annotationMode) {
      startAnnotationDraft(point);
      return;
    }

    if (angleMode) {
      addAnglePoint(point);
      return;
    }

    if (ahkaMode) {
      addAhkaPoint(point);
      return;
    }

    if (handleKneeStageClick(point, createId)) return;

    if (rulerMode) {
      addRulerPoint(point);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (lldMode) {
      addLldPoint(point);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (offsetMode) {
      addOffsetPoint(point);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    // Background click: don't move overlay; allow deselect on desktop.
    if (e.target === e.currentTarget && e.pointerType !== "touch") {
      setActiveId(null);
    }
  };

  const onStagePointerUp = (e: React.PointerEvent) => {
    onUp(e);
  };

  const applyCalibration = () => {
    if (!calStart || !calEnd) return;
    const px = Math.hypot(calEnd.x - calStart.x, calEnd.y - calStart.y);
    if (px === 0) return;
    setMmPerPixel(realMm / px);
    setCalStart(null);
    setCalEnd(null);
  };

  /* =====================================================
     KEYBOARD SHORTCUT
     ===================================================== */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTypingTarget) {
        if (e.key === "Escape") return;
        if (isMod && (key === "z" || key === "y")) return;
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        toggleShortcuts();
        return;
      }

      if (e.key === "Escape") {
        if (annotationMode) cancelAnnotationDraft();
        else if (syncScaleMode) stopSyncScale();
        else if (angleMode) finishAngle();
        else if (ahkaMode) finishAhka();
        else if (valgusCutMode) {
          setValgusCutMode(false);
          setValgusCutDraft(null);
        } else if (tibialSlopeMode) {
          setTibialSlopeMode(false);
          setTibialSlopeDraft(null);
        } else if (tibialCutMode) {
          setTibialCutMode(false);
          setTibialCutDraft(null);
        } else if (cutoutMode) {
          if (cutoutShape === "polygon" && cutoutPolyPoints.length) {
            setCutoutPolyPoints([]);
            setCutoutPolyCursor(null);
          } else {
            stopCutoutMode();
          }
        } else if (rulerMode) finishRuler();
        else if (lldMode) finishLld();
        else if (offsetMode) finishOffset();
        else setActiveId(null);
        return;
      }

      if (!isMod && !e.altKey && !e.shiftKey) {
        if (key === "r") {
          e.preventDefault();
          toggleRulerMode();
          return;
        }
        if (key === "l") {
          e.preventDefault();
          toggleLldMode();
          return;
        }
        if (key === "o") {
          e.preventDefault();
          toggleOffsetMode();
          return;
        }
        if (key === "a") {
          e.preventDefault();
          toggleAngleMode();
          return;
        }
        if (key === "t") {
          e.preventDefault();
          toggleTibialSlopeMode();
          return;
        }
        if (key === "c") {
          e.preventDefault();
          toggleTibialCutMode();
          return;
        }
        if (key === "h") {
          e.preventDefault();
          toggleAhkaMode();
          return;
        }
        if (key === "v") {
          e.preventDefault();
          toggleValgusCutMode();
          return;
        }
        if (key === "n") {
          e.preventDefault();
          toggleAnnotationMode();
          return;
        }
      }

      if (isMod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (isMod && key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (!e.shiftKey && !isMod) {
        if (e.key === "ArrowUp") moveActiveWithHistory(0, -2);
        if (e.key === "ArrowDown") moveActiveWithHistory(0, 2);
        if (e.key === "ArrowLeft") moveActiveWithHistory(-2, 0);
        if (e.key === "ArrowRight") moveActiveWithHistory(2, 0);
      }

      if (e.shiftKey && !isMod) {
        if (e.key === "ArrowUp") scaleActive(0.01);
        if (e.key === "ArrowDown") scaleActive(-0.01);
      }

      if (isMod) {
        if (e.key === "ArrowLeft") rotateActive(-1);
        if (e.key === "ArrowRight") rotateActive(1);
      }

      if (e.key === "Delete" || e.key === "Backspace") deleteActive();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    moveActiveWithHistory,
    scaleActive,
    rotateActive,
    deleteActive,
    redo,
    undo,
    setActiveId,
    setTibialCutDraft,
    setTibialCutMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
    toggleShortcuts,
    toggleRulerMode,
    toggleLldMode,
    toggleOffsetMode,
    toggleAngleMode,
    toggleTibialSlopeMode,
    toggleTibialCutMode,
    toggleAhkaMode,
    toggleValgusCutMode,
    toggleAnnotationMode,
    cancelAnnotationDraft,
    finishRuler,
    finishAngle,
	    finishAhka,
	    finishLld,
	    finishOffset,
	    stopCutoutMode,
	    stopSyncScale,
	    cutoutMode,
	    cutoutShape,
	    cutoutPolyPoints.length,
	    annotationMode,
	    syncScaleMode,
	    angleMode,
	    ahkaMode,
	    valgusCutMode,
	    tibialSlopeMode,
	    tibialCutMode,
	    rulerMode,
	    lldMode,
	    offsetMode,
	  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTypingTarget) return;

      e.preventDefault();
      const hold = panHoldRef.current;
      if (hold.active) return;
      hold.active = true;
      hold.prev = panMode;
      setPanMode(true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const hold = panHoldRef.current;
      if (!hold.active) return;
      e.preventDefault();
      hold.active = false;
      setPanMode(hold.prev);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [panMode]);

  /* =====================================================
     RENDER
     ===================================================== */

  const filteredLibrary = STEM_LIBRARY.filter((item) =>
    `${item.label} ${item.system} ${item.size}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const groupedLibrary = filteredLibrary.reduce<GroupedLibrary>(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = {};
      if (!acc[item.type][item.system]) acc[item.type][item.system] = [];
      acc[item.type][item.system].push(item);
      return acc;
    },
    { stem: {}, cup: {}, knee: {} }
  );

  const applyScaleFromDrag = (dy: number) => {
    if (!scaleDrag.current.dir || !active || active.scaleLocked) return;

    const sensitivity = 0.005;

    const dirMultiplier = scaleDrag.current.dir === "top" ? -1 : 1;

    const factor = 1 + dy * sensitivity * dirMultiplier;
    const clamped = Math.max(0.05, factor);

    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== activeId) return o;

        if (
          scaleDrag.current.dir === "left" ||
          scaleDrag.current.dir === "right"
        ) {
          return {
            ...o,
            scaleX: scaleDrag.current.startScaleX * clamped,
            scaleY: o.locked
              ? scaleDrag.current.startScaleX * clamped
              : o.scaleY,
          };
        }

        // TOP / BOTTOM
        return {
          ...o,
          scaleY: scaleDrag.current.startScaleY * clamped,
          scaleX: o.locked ? scaleDrag.current.startScaleY * clamped : o.scaleX,
        };
      })
    );
  };

  const rulerDisplayDivisor = useRealScale ? 1 : 3;
  const toMm = (px: number) => {
    const mmScale = mmPerPixel ?? 1;
    return (px * mmScale) / rulerDisplayDivisor;
  };
  const formatDistancePx = (px: number) => `${toMm(px).toFixed(1)} mm`;
  const formatRulerDistancePx = (px: number) =>
    `${adjustRulerMm(toMm(px)).toFixed(1)} mm`;
  const formatAngleValue = (
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

  const formatAhkaValue = useCallback(
    (
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
      const angle = (Math.acos(cos) * 180) / Math.PI; // 0..180
      const deviation = 180 - angle; // 0 = neutral, >0 = deviation
      const rawCross = v1.x * v2.y - v1.y * v2.x;
      const resolvedSide = side ?? (knee.x < XRAY_BASE_WIDTH / 2 ? "Left" : "Right");
      const sideSign = resolvedSide === "Right" ? 1 : -1;
      const cross = rawCross * sideSign;
      const sideLabel = resolvedSide === "Right" ? "R" : "L";
      if (Math.abs(deviation) < 0.05) return `${sideLabel} Neutral 0.0°`;
      const label = cross >= 0 ? "Valgus" : "Varus";
      return `${sideLabel} ${label} ${Math.abs(deviation).toFixed(1)}°`;
    },
    []
  );
  const visibleMeasurementsForTotal = measurements.filter((m) => !m.hidden);
  const measurementTotalsPx = visibleMeasurementsForTotal.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const measurementRows: MeasurementRow[] = measurements.map((m, index) => ({
    id: m.id,
    label: `M${index + 1}`,
    value: formatRulerDistancePx(
      Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y)
    ),
    locked: m.locked,
    hidden: m.hidden,
  }));
  const lldRows: MeasurementRow[] = lldMeasurements.map((m, index) => ({
    id: m.id,
    label: `LLD${index + 1}`,
    value: `LLD ${formatDistancePx(Math.abs(m.end.y - m.start.y))}`,
    locked: m.locked,
    hidden: m.hidden,
  }));
  const offsetRows: MeasurementRow[] = offsetMeasurements.map((m, index) => ({
    id: m.id,
    label: `HO${index + 1}`,
    value: `Head Offset ${formatDistancePx(Math.abs(m.end.x - m.start.x))}`,
    locked: m.locked,
    hidden: m.hidden,
  }));
  const angleRows: MeasurementRow[] = angleMeasurements.map((m, index) => ({
    id: m.id,
    label: `A${index + 1}`,
    value: formatAngleValue(m.a, m.b, m.c),
    locked: m.locked,
    hidden: m.hidden,
  }));
  const ahkaRows: MeasurementRow[] = ahkaMeasurements.map((m, index) => ({
    id: m.id,
    label: `HKA${index + 1}`,
    value: `aHKA ${formatAhkaValue(m.hip, m.knee, m.ankle, m.side)}`,
    locked: m.locked,
    hidden: m.hidden,
  }));
  const drawLinesRows: MeasurementRow[] = drawLines.map((line, index) => ({
    id: line.id,
    label: `Line ${index + 1}`,
    value: formatDistancePx(
      Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y)
    ),
    locked: line.locked,
    hidden: line.hidden,
  }));
  const computeStrokeLengthPx = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      sum += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return sum;
  }, []);

  const traceRows: MeasurementRow[] = strokes
    .filter((s) => s.kind === "trace")
    .map((s, index) => ({
      id: s.id,
      label: `TR${index + 1}`,
      value: `Trace ${formatDistancePx(computeStrokeLengthPx(s.points))}`,
      locked: s.locked,
      hidden: s.hidden,
    }));

  const pencilRows: MeasurementRow[] = strokes
    .filter((s) => s.kind === "pencil")
    .map((s, index) => ({
      id: s.id,
      label: `P${index + 1}`,
      value: `Pencil ${formatDistancePx(computeStrokeLengthPx(s.points))}`,
      locked: s.locked,
      hidden: s.hidden,
    }));

  const corRows: MeasurementRow[] = corMarkers.map((m, index) => ({
    id: m.id,
    label: `COR${index + 1}`,
    value: `COR (${m.point.x.toFixed(0)}, ${m.point.y.toFixed(0)})`,
    locked: m.locked,
    hidden: m.hidden,
  }));
  const measurementTotalLabel = visibleMeasurementsForTotal.length
    ? formatRulerDistancePx(measurementTotalsPx)
    : null;
  const visibleDrawLinesForTotal = drawLines.filter((line) => !line.hidden);
  const drawLinesTotalLabel = visibleDrawLinesForTotal.length
    ? formatDistancePx(
        visibleDrawLinesForTotal.reduce(
          (sum, line) =>
            sum +
            Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y),
          0
        )
      )
    : null;

  const buildReportLines = useCallback(() => {
    const lines: string[] = [];
    const visibleMeasurementRows = measurementRows.filter((r) => !r.hidden);
    const visibleLldRows = lldRows.filter((r) => !r.hidden);
    const visibleOffsetRows = offsetRows.filter((r) => !r.hidden);
    const visibleAngleRows = angleRows.filter((r) => !r.hidden);
    const visibleAhkaRows = ahkaRows.filter((r) => !r.hidden);
    const visibleDrawLinesRows = drawLinesRows.filter((r) => !r.hidden);
    const visibleAnnotations = annotations.filter((a) => !a.hidden);

    if (visibleMeasurementRows.length) {
      lines.push("Ruler:");
      visibleMeasurementRows.forEach((row) => {
        lines.push(`  ${row.label} ${row.value}`);
      });
      if (measurementTotalLabel) {
        lines.push(`  Total ${measurementTotalLabel}`);
      }
    }
    if (visibleLldRows.length) {
      lines.push("LLD:");
      visibleLldRows.forEach((row) => {
        lines.push(`  ${row.label} ${row.value}`);
      });
    }
    if (visibleOffsetRows.length) {
      lines.push("Offset:");
      visibleOffsetRows.forEach((row) => {
        lines.push(`  ${row.label} ${row.value}`);
      });
    }
    if (visibleAngleRows.length) {
      lines.push("Angle:");
      visibleAngleRows.forEach((row) => {
        lines.push(`  ${row.label} ${row.value}`);
      });
    }
    if (visibleAhkaRows.length) {
      lines.push("aHKA:");
      visibleAhkaRows.forEach((row) => {
        lines.push(`  ${row.label} ${row.value}`);
      });
    }
    const visibleValgusCutLines = valgusCutLines.filter((l) => !l.hidden);
    if (visibleValgusCutLines.length) {
      lines.push("Valgus Cut:");
      visibleValgusCutLines.forEach((line, index) => {
        lines.push(`  VC${index + 1} ${line.side} Valgus ${line.angleDeg}°`);
      });
    }
    const visibleTibialSlopeLines = tibialSlopeLines.filter((l) => !l.hidden);
    if (visibleTibialSlopeLines.length) {
      lines.push("Tibial Slope:");
      visibleTibialSlopeLines.forEach((line, index) => {
        lines.push(
          `  TS${index + 1} ${line.posteriorSide} Posterior ${line.slopeDeg}°`
        );
      });
    }
    const visibleTibialCutLines = tibialCutLines.filter((l) => !l.hidden);
    if (visibleTibialCutLines.length) {
      lines.push("Tibial Cut:");
      visibleTibialCutLines.forEach((line, index) => {
        lines.push(`  TC${index + 1} ${line.angleDeg}°`);
      });
    }
    if (visibleDrawLinesRows.length) {
      lines.push("Draw Lines:");
      visibleDrawLinesRows.forEach((row) => {
        lines.push(`  ${row.label} ${row.value}`);
      });
      if (drawLinesTotalLabel) {
        lines.push(`  Total ${drawLinesTotalLabel}`);
      }
    }
    if (visibleAnnotations.length) {
      lines.push("Notes:");
      visibleAnnotations.forEach((annotation, index) => {
        lines.push(`  ${index + 1}. ${annotation.text}`);
      });
    }
    if (!lines.length) {
      lines.push("No measurements recorded.");
    }
    return lines;
  }, [
    angleRows,
    ahkaRows,
    annotations,
    lldRows,
    measurementRows,
    measurementTotalLabel,
    offsetRows,
    drawLinesRows,
    drawLinesTotalLabel,
    valgusCutLines,
    tibialSlopeLines,
    tibialCutLines,
  ]);

  const drawCompositeFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      options?: {
        base?: "camera" | "xray" | "none";
        backgroundImage?: HTMLImageElement | null;
      }
    ) => {
      const mmScale = mmPerPixel ?? 1;
      const divisor = rulerDisplayDivisor || 1;
      const toMm = (px: number) => (px * mmScale) / divisor;
      const formatDistancePx = (px: number) => `${toMm(px).toFixed(1)} mm`;
      const formatRulerDistancePx = (px: number) =>
        `${adjustRulerMm(toMm(px)).toFixed(1)} mm`;
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
      const formatAngleValue = (
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
      const formatAhkaInFrame = (
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
        const resolvedSide =
          side ?? (knee.x < XRAY_BASE_WIDTH / 2 ? "Left" : "Right");
        const sideSign = resolvedSide === "Right" ? 1 : -1;
        const cross = rawCross * sideSign;
        const sideLabel = resolvedSide === "Right" ? "R" : "L";
        if (Math.abs(deviation) < 0.05) return `${sideLabel} Neutral 0.0°`;
        const label = cross >= 0 ? "Valgus" : "Varus";
        return `${sideLabel} ${label} ${Math.abs(deviation).toFixed(1)}°`;
      };
      const getAngleLabelPosition = (
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
        const dir = bisLen
          ? { x: bis.x / bisLen, y: bis.y / bisLen }
          : { x: -u1.y, y: u1.x };
        const offset = 22;
        return { x: b.x + dir.x * offset, y: b.y + dir.y * offset };
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
        const theta = ((params.angleDeg * Math.PI) / 180) * sign;
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
        return { cutCenter, cutA, cutB, baseA, baseB };
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
        const theta = ((params.slopeDeg * Math.PI) / 180) * sign;
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
        const theta = ((params.angleDeg * Math.PI) / 180) * sign;
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

      ctx.clearRect(0, 0, XRAY_BASE_WIDTH, XRAY_BASE_HEIGHT);
      const baseMode = options?.base ?? (cameraMode ? "camera" : "none");
      if (baseMode === "camera") {
        const video = videoRef.current;
        if (video && video.videoWidth && video.videoHeight) {
          const baseScale =
            cameraFit === "contain"
              ? Math.min(
                  XRAY_BASE_WIDTH / video.videoWidth,
                  XRAY_BASE_HEIGHT / video.videoHeight
                )
              : Math.max(
                  XRAY_BASE_WIDTH / video.videoWidth,
                  XRAY_BASE_HEIGHT / video.videoHeight
                );
          const scale = baseScale * (cameraZoomMode === "digital" ? cameraZoom : 1);
          const drawWidth = video.videoWidth * scale;
          const drawHeight = video.videoHeight * scale;
          const offsetX = (XRAY_BASE_WIDTH - drawWidth) / 2;
          const offsetY = (XRAY_BASE_HEIGHT - drawHeight) / 2;
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        }
      } else if (baseMode === "xray") {
        const image = options?.backgroundImage ?? null;
        if (image) {
          const scale = Math.min(
            XRAY_BASE_WIDTH / image.width,
            XRAY_BASE_HEIGHT / image.height
          );
          const drawWidth = image.width * scale;
          const drawHeight = image.height * scale;
          const offsetX = (XRAY_BASE_WIDTH - drawWidth) / 2;
          const offsetY = (XRAY_BASE_HEIGHT - drawHeight) / 2;
          ctx.save();
          ctx.filter = `contrast(${xrayContrast})`;
          ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();
        } else {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, XRAY_BASE_WIDTH, XRAY_BASE_HEIGHT);
        }
      }

      if (cutout && !cutout.hidden) {
        const opacity = Math.min(0.9, Math.max(0.2, cutout.opacity ?? 0.65));
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
        ctx.fillRect(0, 0, XRAY_BASE_WIDTH, XRAY_BASE_HEIGHT);
        ctx.globalCompositeOperation = "destination-out";
        const shape = cutout.shape ?? "rect";
        if (shape === "circle") {
          const cx = cutout.x + cutout.width / 2;
          const cy = cutout.y + cutout.height / 2;
          const r = Math.min(cutout.width, cutout.height) / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "polygon") {
          const points = cutout.points ?? [];
          if (points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i += 1) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
          }
        } else {
          ctx.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
        }
        ctx.restore();
      }

      const DEFAULT_BASE = 300;
      const DEFAULT_PAD = 32;
      objects.forEach((o) => {
        const baseW =
          o.type === "image" ? (o.baseWidth ?? DEFAULT_BASE) : DEFAULT_BASE;
        const baseH =
          o.type === "image" ? (o.baseHeight ?? DEFAULT_BASE) : DEFAULT_BASE;
        const pad =
          o.type === "image" ? (o.paddingPx ?? DEFAULT_PAD) : DEFAULT_PAD;
        const totalW = baseW + pad * 2;
        const totalH = baseH + pad * 2;

        ctx.save();
        ctx.globalAlpha = o.opacity ?? 1;
        ctx.translate(
          o.position.x + totalW / 2,
          o.position.y + totalH / 2
        );
        ctx.rotate((o.rotation * Math.PI) / 180);
        ctx.scale(o.scaleX * (o.flipX ?? 1), o.scaleY * (o.flipY ?? 1));
        if (o.type === "shape") {
          ctx.fillStyle = o.fill;
          ctx.strokeStyle = o.stroke;
          ctx.lineWidth = o.strokeWidth;
          if (o.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, 128, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (o.shape === "square") {
            const size = 244;
            ctx.beginPath();
            ctx.rect(-size / 2, -size / 2, size, size);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(0, -124);
            ctx.lineTo(124, 124);
            ctx.lineTo(-124, 124);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else {
          const img = getCachedImage(o.imageSrc);
          if (img) {
            ctx.globalCompositeOperation = o.type === "implant" ? "screen" : "source-over";
            ctx.drawImage(
              img,
              -totalW / 2 + pad,
              -totalH / 2 + pad,
              baseW,
              baseH
            );
          }
        }
        ctx.restore();
      });

      const resolvePointFill = (lineColor: string) => {
        if (pointFillMode === "transparent") return null;
        if (pointFillMode === "matchLine") return lineColor;
        if (pointFillMode === "light") return "#ffffff";
        if (pointFillMode === "custom") return pointFillColor;
        return "#0b0f0d";
      };

      const drawPoint = (
        point: { x: number; y: number },
        lineColor: string,
        lineWidth: number
      ) => {
        const fill = resolvePointFill(lineColor);
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.lineWidth = Math.max(1, Math.min(3, lineWidth));
        ctx.strokeStyle = lineColor;
        ctx.stroke();
      };

      const drawLine = (
        start: { x: number; y: number },
        end: { x: number; y: number },
        color: string,
        label?: string,
        strokeWidth = MEASURE_STROKE_WIDTH
      ) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const px = -uy;
        const py = ux;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const labelOffset = 14;
        const labelX = midX + px * labelOffset;
        const labelY = midY + py * labelOffset;
        const labelPad = 6;
        const textX = labelX + (px >= 0 ? labelPad : -labelPad);
        const textAlign: CanvasTextAlign = px >= 0 ? "left" : "right";

        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(labelX, labelY);
        ctx.stroke();

        drawPoint(start, color, strokeWidth);
        drawPoint(end, color, strokeWidth);

        if (label) {
          ctx.font = `700 ${MEASURE_FONT_SIZE}px sans-serif`;
          ctx.textAlign = textAlign;
          ctx.textBaseline = "middle";
          ctx.lineWidth = MEASURE_LABEL_STROKE_WIDTH;
          ctx.strokeStyle = "#0b0f0d";
          ctx.strokeText(label, textX, labelY);
          ctx.fillStyle = color;
          ctx.fillText(label, textX, labelY);
        }
      };

      measurements.forEach((m) => {
        if (m.hidden) return;
        drawLine(
          m.start,
          m.end,
          RULER_COLOR,
          showRulerLabels ? formatDistance(m.start, m.end) : undefined,
          rulerStrokeWidth
        );
      });
      lldMeasurements.forEach((m) => {
        if (m.hidden) return;
        drawLine(
          m.start,
          m.end,
          LLD_COLOR,
          showLldLabels ? formatLld(m.start, m.end) : undefined,
          lldStrokeWidth
        );
      });
      offsetMeasurements.forEach((m) => {
        if (m.hidden) return;
        drawLine(
          m.start,
          m.end,
          OFFSET_COLOR,
          showOffsetLabels ? formatOffset(m.start, m.end) : undefined,
          offsetStrokeWidth
        );
      });
      drawLines.forEach((line) => {
        if (line.hidden) return;
        drawLine(
          line.start,
          line.end,
          DRAW_LINE_COLOR,
          undefined,
          drawLineStrokeWidth
        );
      });

      const isClosedTrace = (points: { x: number; y: number }[]) => {
        if (points.length < 3) return false;
        const first = points[0];
        const last = points[points.length - 1];
        return Math.hypot(first.x - last.x, first.y - last.y) <= 14;
      };

      strokes.forEach((stroke) => {
        if (stroke.hidden) return;
        const pts = stroke.points ?? [];
        if (pts.length < 2) return;
        if (
          stroke.kind === "trace" &&
          traceFillOpacity > 0 &&
          isClosedTrace(pts)
        ) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, Math.max(0, traceFillOpacity));
          ctx.fillStyle = traceFillColor;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i += 1) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        const color =
          stroke.color ?? (stroke.kind === "trace" ? "#c084fc" : "#60a5fa");
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, stroke.strokeWidth ?? 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      });

      corMarkers.forEach((m, index) => {
        if (m.hidden) return;
        const p = m.point;
        const label = m.label ?? `COR${index + 1}`;
        const color = "#f97316";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(5, pointRadius + 1), 0, Math.PI * 2);
        const fill = resolvePointFill(color);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();

        ctx.font = `700 ${MEASURE_FONT_SIZE}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.lineWidth = MEASURE_LABEL_STROKE_WIDTH;
        ctx.strokeStyle = "#0b0f0d";
        ctx.strokeText(label, p.x + 10, p.y - 10);
        ctx.fillStyle = color;
        ctx.fillText(label, p.x + 10, p.y - 10);
      });

      angleMeasurements.forEach((m) => {
        if (m.hidden) return;
        const labelPos = getAngleLabelPosition(m.a, m.b, m.c);
        ctx.strokeStyle = ANGLE_COLOR;
        ctx.lineWidth = angleStrokeWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.b.x, m.b.y);
        ctx.lineTo(m.a.x, m.a.y);
        ctx.moveTo(m.b.x, m.b.y);
        ctx.lineTo(m.c.x, m.c.y);
        ctx.stroke();
        drawPoint(m.b, ANGLE_COLOR, angleStrokeWidth);
        if (showAngleLabels) {
          const label = formatAngleValue(m.a, m.b, m.c);
          ctx.font = `700 ${ANGLE_FONT_SIZE}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = ANGLE_LABEL_STROKE_WIDTH;
          ctx.strokeStyle = "#0b0f0d";
          ctx.strokeText(label, labelPos.x, labelPos.y);
          ctx.fillStyle = ANGLE_COLOR;
          ctx.fillText(label, labelPos.x, labelPos.y);
        }
      });

      ahkaMeasurements.forEach((m) => {
        if (m.hidden) return;
        const labelPos = getAngleLabelPosition(m.hip, m.knee, m.ankle);
        ctx.strokeStyle = AHKA_COLOR;
        ctx.lineWidth = ahkaStrokeWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.knee.x, m.knee.y);
        ctx.lineTo(m.hip.x, m.hip.y);
        ctx.moveTo(m.knee.x, m.knee.y);
        ctx.lineTo(m.ankle.x, m.ankle.y);
        ctx.stroke();
        drawPoint(m.knee, AHKA_COLOR, ahkaStrokeWidth);
        if (showAhkaLabels) {
          const label = formatAhkaInFrame(m.hip, m.knee, m.ankle, m.side);
          ctx.font = `700 ${ANGLE_FONT_SIZE}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = ANGLE_LABEL_STROKE_WIDTH;
          ctx.strokeStyle = "#0b0f0d";
          ctx.strokeText(label, labelPos.x, labelPos.y);
          ctx.fillStyle = AHKA_COLOR;
          ctx.fillText(label, labelPos.x, labelPos.y);
        }
      });

      valgusCutLines.forEach((line, index) => {
        if (line.hidden) return;
        const geom = buildValgusCutGeometry(line.hip, line.knee, {
          side: line.side,
          angleDeg: line.angleDeg,
        });
        if (!geom) return;
        ctx.strokeStyle = VALGUS_CUT_COLOR;
        ctx.lineWidth = Math.max(1, valgusCutStrokeWidth - 0.5);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(line.hip.x, line.hip.y);
        ctx.lineTo(line.knee.x, line.knee.y);
        ctx.stroke();

        ctx.setLineDash([4, 4]);
        ctx.lineWidth = Math.max(1, valgusCutStrokeWidth - 0.8);
        ctx.beginPath();
        ctx.moveTo(geom.baseA.x, geom.baseA.y);
        ctx.lineTo(geom.baseB.x, geom.baseB.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineWidth = valgusCutStrokeWidth;
        ctx.beginPath();
        ctx.moveTo(geom.cutA.x, geom.cutA.y);
        ctx.lineTo(geom.cutB.x, geom.cutB.y);
        ctx.stroke();

        drawPoint(line.hip, VALGUS_CUT_COLOR, valgusCutStrokeWidth);
        drawPoint(line.knee, VALGUS_CUT_COLOR, valgusCutStrokeWidth);

        if (showValgusCutLabels) {
          const label = `VC${index + 1} ${line.side} Valgus ${line.angleDeg}°`;
          ctx.font = `700 ${ANGLE_FONT_SIZE}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = ANGLE_LABEL_STROKE_WIDTH;
          ctx.strokeStyle = "#0b0f0d";
          ctx.strokeText(label, geom.cutCenter.x, geom.cutCenter.y - 12);
          ctx.fillStyle = VALGUS_CUT_COLOR;
          ctx.fillText(label, geom.cutCenter.x, geom.cutCenter.y - 12);
        }
      });

      tibialSlopeLines.forEach((line, index) => {
        if (line.hidden) return;
        const geom = buildTibialSlopeGeometry(line.prox, line.dist, {
          posteriorSide: line.posteriorSide,
          slopeDeg: line.slopeDeg,
        });
        if (!geom) return;
        ctx.strokeStyle = TIBIAL_SLOPE_COLOR;

        ctx.lineWidth = Math.max(1, tibialSlopeStrokeWidth - 0.5);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(line.prox.x, line.prox.y);
        ctx.lineTo(line.dist.x, line.dist.y);
        ctx.stroke();

        ctx.setLineDash([4, 4]);
        ctx.lineWidth = Math.max(1, tibialSlopeStrokeWidth - 0.8);
        ctx.beginPath();
        ctx.moveTo(geom.baseA.x, geom.baseA.y);
        ctx.lineTo(geom.baseB.x, geom.baseB.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineWidth = tibialSlopeStrokeWidth;
        ctx.beginPath();
        ctx.moveTo(geom.cutA.x, geom.cutA.y);
        ctx.lineTo(geom.cutB.x, geom.cutB.y);
        ctx.stroke();

        drawPoint(line.prox, TIBIAL_SLOPE_COLOR, tibialSlopeStrokeWidth);
        drawPoint(line.dist, TIBIAL_SLOPE_COLOR, tibialSlopeStrokeWidth);

        if (showTibialSlopeLabels) {
          const label = `TS${index + 1} ${line.posteriorSide} Posterior ${line.slopeDeg}°`;
          ctx.font = `700 ${ANGLE_FONT_SIZE}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = ANGLE_LABEL_STROKE_WIDTH;
          ctx.strokeStyle = "#0b0f0d";
          ctx.strokeText(label, geom.cutCenter.x, geom.cutCenter.y - 12);
          ctx.fillStyle = TIBIAL_SLOPE_COLOR;
          ctx.fillText(label, geom.cutCenter.x, geom.cutCenter.y - 12);
        }
      });

      tibialCutLines.forEach((line, index) => {
        if (line.hidden) return;
        const geom = buildTibialCutGeometry(line.prox, line.dist, {
          direction: line.direction,
          angleDeg: line.angleDeg,
        });
        if (!geom) return;
        ctx.strokeStyle = TIBIAL_CUT_COLOR;

        ctx.lineWidth = Math.max(1, tibialCutStrokeWidth - 0.5);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(line.prox.x, line.prox.y);
        ctx.lineTo(line.dist.x, line.dist.y);
        ctx.stroke();

        ctx.setLineDash([4, 4]);
        ctx.lineWidth = Math.max(1, tibialCutStrokeWidth - 0.8);
        ctx.beginPath();
        ctx.moveTo(geom.baseA.x, geom.baseA.y);
        ctx.lineTo(geom.baseB.x, geom.baseB.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineWidth = tibialCutStrokeWidth;
        ctx.beginPath();
        ctx.moveTo(geom.cutA.x, geom.cutA.y);
        ctx.lineTo(geom.cutB.x, geom.cutB.y);
        ctx.stroke();

        drawPoint(line.prox, TIBIAL_CUT_COLOR, tibialCutStrokeWidth);
        drawPoint(line.dist, TIBIAL_CUT_COLOR, tibialCutStrokeWidth);

        if (showTibialCutLabels) {
          const label = `TC${index + 1} ${line.angleDeg}°`;
          ctx.font = `700 ${ANGLE_FONT_SIZE}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = ANGLE_LABEL_STROKE_WIDTH;
          ctx.strokeStyle = "#0b0f0d";
          ctx.strokeText(label, geom.cutCenter.x, geom.cutCenter.y - 12);
          ctx.fillStyle = TIBIAL_CUT_COLOR;
          ctx.fillText(label, geom.cutCenter.x, geom.cutCenter.y - 12);
        }
      });

      annotations.forEach((a) => {
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(a.x, a.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "600 11px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#0b0f0d";
        ctx.strokeText(a.text, a.x + 6, a.y + 6);
        ctx.fillStyle = "#fcd34d";
        ctx.fillText(a.text, a.x + 6, a.y + 6);
      });
    },
    [
      annotations,
      ahkaMeasurements,
      cameraMode,
      drawLines,
      getCachedImage,
      lldMeasurements,
      measurements,
      strokes,
      corMarkers,
      mmPerPixel,
      offsetMeasurements,
      angleMeasurements,
      cutout,
      objects,
      pointRadius,
      pointFillMode,
      pointFillColor,
      traceFillColor,
      traceFillOpacity,
      rulerDisplayDivisor,
      drawLineStrokeWidth,
      ahkaStrokeWidth,
      rulerStrokeWidth,
      lldStrokeWidth,
      offsetStrokeWidth,
      angleStrokeWidth,
      cameraFit,
      cameraZoom,
      cameraZoomMode,
      valgusCutOffsetPx,
      valgusCutStrokeWidth,
      valgusCutLineLengthPx,
      valgusCutLines,
      tibialSlopeOffsetPx,
      tibialSlopeLineLengthPx,
      tibialSlopeStrokeWidth,
      tibialSlopeLines,
      tibialCutOffsetPx,
      tibialCutLineLengthPx,
      tibialCutStrokeWidth,
      tibialCutLines,
      showRulerLabels,
      showLldLabels,
      showOffsetLabels,
      showAngleLabels,
      showAhkaLabels,
      showValgusCutLabels,
      showTibialSlopeLabels,
      showTibialCutLabels,
    ]
  );

  const copyCutoutFromCanvas = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!cutout) {
      toast({
        title: "Cutout belum dibuat",
        description: "Aktifkan Cutout lalu buat area yang ingin di-crop.",
      });
      return;
    }

    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = XRAY_BASE_WIDTH;
    fullCanvas.height = XRAY_BASE_HEIGHT;
    const fullCtx = fullCanvas.getContext("2d");
    if (!fullCtx) return;
    fullCtx.imageSmoothingEnabled = true;
    fullCtx.imageSmoothingQuality = "high";

    let backgroundImage: HTMLImageElement | null = null;
    if (!cameraMode && background) {
      backgroundImage = await ensureImageLoaded(background);
    }

    drawCompositeFrame(fullCtx, {
      base: cameraMode ? "camera" : "xray",
      backgroundImage,
    });

    const w = Math.max(1, Math.round(cutout.width));
    const h = Math.max(1, Math.round(cutout.height));
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = w;
    cropCanvas.height = h;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const shape = cutout.shape ?? cutoutShape;
    const sx = cutout.x;
    const sy = cutout.y;
    const sw = cutout.width;
    const sh = cutout.height;
    if (shape === "polygon") {
      const points = cutout.points ?? [];
      if (points.length < 3) {
        toast({
          title: "Cutout polygon belum lengkap",
          description: "Buat minimal 3 titik lalu tutup shape.",
        });
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x - cutout.x, points[0].y - cutout.y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x - cutout.x, points[i].y - cutout.y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        fullCanvas,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        w,
        h
      );
      ctx.restore();
    } else if (shape === "circle") {
      ctx.save();
      const r = Math.min(w, h) / 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        fullCanvas,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        w,
        h
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        fullCanvas,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        w,
        h
      );
    }

    let dataUrl: string;
    try {
      dataUrl = cropCanvas.toDataURL("image/png");
    } catch {
      toast({
        title: "Gagal membuat overlay",
        description: "Browser tidak mengizinkan export canvas.",
      });
      return;
    }

    disableMeasurementModes();
    pushHistorySnapshot();
    const overlay = createImageOverlay("Canvas Slice", dataUrl, {
      position: { x: cutout.x, y: cutout.y },
      opacity: 1,
      baseWidth: w,
      baseHeight: h,
      paddingPx: 0,
    });
    setObjects((prev) => [...prev, overlay]);
    setActiveId(overlay.id);

    toast({
      title: "Canvas copied",
      description: "Overlay baru dibuat dari hasil canvas.",
    });
  }, [
    background,
    cameraMode,
    createImageOverlay,
    cutout,
    cutoutShape,
    disableMeasurementModes,
    drawCompositeFrame,
    ensureImageLoaded,
    pushHistorySnapshot,
  ]);

  const copyCutoutFromActiveItem = useCallback(
    async (cut: boolean) => {
      if (typeof window === "undefined") return;
      if (!cutout) {
        toast({
          title: "Cutout belum dibuat",
          description: "Aktifkan Cutout lalu buat area yang ingin di-crop.",
        });
        return;
      }
      const item = objects.find((o) => o.id === activeId) ?? null;
      if (!item) {
        toast({
          title: "Tidak ada item aktif",
          description: "Pilih template/overlay dulu sebelum copy/cut.",
        });
        return;
      }

      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = XRAY_BASE_WIDTH;
      fullCanvas.height = XRAY_BASE_HEIGHT;
      const ctxFull = fullCanvas.getContext("2d");
      if (!ctxFull) return;

      ctxFull.imageSmoothingEnabled = true;
      ctxFull.imageSmoothingQuality = "high";
      ctxFull.clearRect(0, 0, XRAY_BASE_WIDTH, XRAY_BASE_HEIGHT);

      const DEFAULT_BASE = 300;
      const DEFAULT_PAD = 32;
      const baseW =
        item.type === "image" ? (item.baseWidth ?? DEFAULT_BASE) : DEFAULT_BASE;
      const baseH =
        item.type === "image" ? (item.baseHeight ?? DEFAULT_BASE) : DEFAULT_BASE;
      const pad =
        item.type === "image" ? (item.paddingPx ?? DEFAULT_PAD) : DEFAULT_PAD;
      const totalW = baseW + pad * 2;
      const totalH = baseH + pad * 2;

      ctxFull.save();
      ctxFull.globalAlpha = item.opacity ?? 1;
      ctxFull.translate(
        item.position.x + totalW / 2,
        item.position.y + totalH / 2
      );
      ctxFull.rotate((item.rotation * Math.PI) / 180);
      ctxFull.scale(
        item.scaleX * (item.flipX ?? 1),
        item.scaleY * (item.flipY ?? 1)
      );

      if (item.type === "shape") {
        ctxFull.fillStyle = item.fill;
        ctxFull.strokeStyle = item.stroke;
        ctxFull.lineWidth = item.strokeWidth;
        if (item.shape === "circle") {
          ctxFull.beginPath();
          ctxFull.arc(0, 0, 128, 0, Math.PI * 2);
          ctxFull.fill();
          ctxFull.stroke();
        } else if (item.shape === "square") {
          const size = 244;
          ctxFull.beginPath();
          ctxFull.rect(-size / 2, -size / 2, size, size);
          ctxFull.fill();
          ctxFull.stroke();
        } else {
          ctxFull.beginPath();
          ctxFull.moveTo(0, -124);
          ctxFull.lineTo(124, 124);
          ctxFull.lineTo(-124, 124);
          ctxFull.closePath();
          ctxFull.fill();
          ctxFull.stroke();
        }
      } else {
        const img =
          getCachedImage(item.imageSrc) ??
          (await ensureImageLoaded(item.imageSrc));
        if (!img) {
          toast({
            title: "Gagal memuat item",
            description: "Coba pilih ulang template/overlay.",
          });
          ctxFull.restore();
          return;
        }
        ctxFull.globalCompositeOperation = "source-over";
        ctxFull.drawImage(
          img,
          -totalW / 2 + pad,
          -totalH / 2 + pad,
          baseW,
          baseH
        );
      }
      ctxFull.restore();

      const w = Math.max(1, Math.round(cutout.width));
      const h = Math.max(1, Math.round(cutout.height));
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = w;
      cropCanvas.height = h;
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const shape = cutout.shape ?? cutoutShape;
      const sx = cutout.x;
      const sy = cutout.y;
      const sw = cutout.width;
      const sh = cutout.height;
      if (shape === "polygon") {
        const points = cutout.points ?? [];
        if (points.length < 3) {
          toast({
            title: "Cutout polygon belum lengkap",
            description: "Buat minimal 3 titik lalu tutup shape.",
          });
          return;
        }
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x - cutout.x, points[0].y - cutout.y);
        for (let i = 1; i < points.length; i += 1) {
          ctx.lineTo(points[i].x - cutout.x, points[i].y - cutout.y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          fullCanvas,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          w,
          h
        );
        ctx.restore();
      } else if (shape === "circle") {
        ctx.save();
        const r = Math.min(w, h) / 2;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          fullCanvas,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          w,
          h
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          fullCanvas,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          w,
          h
        );
      }

      let dataUrl: string;
      try {
        dataUrl = cropCanvas.toDataURL("image/png");
      } catch {
        toast({
          title: "Gagal membuat overlay",
          description: "Browser tidak mengizinkan export canvas.",
        });
        return;
      }

      disableMeasurementModes();
      pushHistorySnapshot();
      const overlay = createImageOverlay(
        cut ? "Item Cut" : "Item Copy",
        dataUrl,
        {
          position: { x: cutout.x, y: cutout.y },
          opacity: 1,
          baseWidth: w,
          baseHeight: h,
          paddingPx: 0,
        }
      );
      setObjects((prev) => {
        const next = [...prev, overlay];
        return cut ? next.filter((o) => o.id !== item.id) : next;
      });
      setActiveId(overlay.id);

      toast({
        title: cut ? "Item cut" : "Item copied",
        description: cut
          ? "Overlay baru dibuat dan item lama dihapus."
          : "Overlay baru dibuat dari item aktif.",
      });
    },
    [
      activeId,
      createImageOverlay,
      cutout,
      cutoutShape,
      disableMeasurementModes,
      ensureImageLoaded,
      getCachedImage,
      objects,
      pushHistorySnapshot,
    ]
  );

  const renderReportCanvas = useCallback(async () => {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = XRAY_BASE_WIDTH;
    frameCanvas.height = XRAY_BASE_HEIGHT;
    const frameCtx = frameCanvas.getContext("2d");
    if (!frameCtx) return null;

    let backgroundImage: HTMLImageElement | null = null;
    if (!cameraMode && background) {
      backgroundImage = await ensureImageLoaded(background);
    }

    drawCompositeFrame(frameCtx, {
      base: cameraMode ? "camera" : "xray",
      backgroundImage,
    });

    const lines = buildReportLines();
    const lineHeight = 16;
    const summaryPadding = 16;
    const titleHeight = 22;
    const infoHeight = 18;
    const summaryHeight = Math.max(
      140,
      summaryPadding * 2 + titleHeight + infoHeight + lines.length * lineHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = XRAY_BASE_WIDTH;
    canvas.height = XRAY_BASE_HEIGHT + summaryHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(frameCanvas, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, XRAY_BASE_HEIGHT, XRAY_BASE_WIDTH, summaryHeight);

    ctx.fillStyle = "#111827";
    ctx.textBaseline = "top";
    ctx.font = "700 16px sans-serif";
    ctx.fillText("Templating Report", 20, XRAY_BASE_HEIGHT + summaryPadding);

    ctx.font = "500 12px sans-serif";
    const info = mmPerPixel
      ? `Calibration: ${mmPerPixel.toFixed(3)} mm/px (marker ${realMm} mm)`
      : "Calibration: not set";
    ctx.fillText(info, 20, XRAY_BASE_HEIGHT + summaryPadding + titleHeight);

    let y = XRAY_BASE_HEIGHT + summaryPadding + titleHeight + infoHeight;
    lines.forEach((line) => {
      ctx.fillText(line, 20, y);
      y += lineHeight;
    });

    return canvas;
  }, [
    background,
    buildReportLines,
    cameraMode,
    drawCompositeFrame,
    ensureImageLoaded,
    mmPerPixel,
    realMm,
  ]);

  const exportReport = useCallback(
    async (format: "png" | "pdf") => {
      if (typeof window === "undefined") return;
      if (cameraMode && !cameraReady) {
        toast({
          title: "Kamera belum siap",
          description: "Aktifkan Camera Mode terlebih dulu.",
        });
        return;
      }
      const canvas = await renderReportCanvas();
      if (!canvas) {
        toast({
          title: "Report gagal",
          description: "Tidak bisa membuat report sekarang.",
        });
        return;
      }
      if (format === "png") {
        canvas.toBlob((blob) => {
          if (!blob) return;
          downloadBlob(blob, `templating-report-${Date.now()}.png`);
        }, "image/png");
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) {
        toast({
          title: "Popup diblok",
          description: "Izinkan pop-up untuk export PDF.",
        });
        return;
      }
      win.document.write(`
        <html>
          <head>
            <title>Templating Report</title>
            <style>
              body { margin: 0; padding: 24px; font-family: Arial, sans-serif; }
              img { max-width: 100%; height: auto; display: block; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Templating Report" />
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    },
    [cameraMode, cameraReady, downloadBlob, renderReportCanvas]
  );

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API tidak tersedia.");
      toast({
        title: "Camera tidak tersedia",
        description: "Browser ini tidak mendukung akses kamera.",
      });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      const track = stream.getVideoTracks?.()[0] ?? null;
      cameraTrackRef.current = track;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => undefined);
      }
      if (track) {
        const capabilities = (track.getCapabilities?.() ?? {}) as Partial<
          MediaTrackCapabilities & {
            zoom?: { min: number; max: number; step?: number };
            focusMode?: string[];
            exposureMode?: string[];
            whiteBalanceMode?: string[];
          }
        >;

        const zoomCaps = capabilities.zoom;
        if (
          zoomCaps &&
          typeof zoomCaps.min === "number" &&
          typeof zoomCaps.max === "number"
        ) {
          const min = zoomCaps.min;
          const max = zoomCaps.max;
          const step = zoomCaps.step && zoomCaps.step > 0 ? zoomCaps.step : 0.1;
          setCameraZoomRange({ min, max, step });
          setCameraZoomMode("hardware");
          const zoomValue = Math.min(max, Math.max(min, cameraZoom));
          setCameraZoom(zoomValue);
          track
            .applyConstraints({
              advanced: [
                ({ zoom: zoomValue } as unknown as MediaTrackConstraintSet),
              ],
            })
            .catch(() => undefined);
        } else {
          setCameraZoomMode("digital");
          setCameraZoomRange({ min: 1, max: 3, step: 0.1 });
        }

        const advanced: MediaTrackConstraintSet[] = [];
        if (
          Array.isArray(capabilities.focusMode) &&
          capabilities.focusMode.includes("continuous")
        ) {
          advanced.push({ focusMode: "continuous" } as MediaTrackConstraintSet);
        }
        if (
          Array.isArray(capabilities.exposureMode) &&
          capabilities.exposureMode.includes("continuous")
        ) {
          advanced.push({ exposureMode: "continuous" } as MediaTrackConstraintSet);
        }
        if (
          Array.isArray(capabilities.whiteBalanceMode) &&
          capabilities.whiteBalanceMode.includes("continuous")
        ) {
          advanced.push({
            whiteBalanceMode: "continuous",
          } as MediaTrackConstraintSet);
        }
        if (advanced.length) {
          track.applyConstraints({ advanced }).catch(() => undefined);
        }
      }
      setCameraReady(true);
      setCameraError(null);
      return true;
    } catch (err) {
      setCameraError("Izin kamera ditolak atau tidak tersedia.");
      toast({
        title: "Tidak bisa membuka kamera",
        description: "Pastikan izin kamera sudah diberikan.",
      });
      return false;
    }
  }, [cameraZoom]);

  useEffect(() => {
    if (!cameraMode || !cameraReady) return;
    if (cameraZoomMode !== "hardware") return;
    const track = cameraTrackRef.current;
    if (!track) return;
    track
      .applyConstraints({
        advanced: [({ zoom: cameraZoom } as unknown as MediaTrackConstraintSet)],
      })
      .catch(() => undefined);
  }, [cameraMode, cameraReady, cameraZoom, cameraZoomMode]);

  const stopCameraStream = useCallback(() => {
    if (recordRafRef.current) {
      window.cancelAnimationFrame(recordRafRef.current);
      recordRafRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    cameraTrackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopCameraStream();
    setIsRecording(false);
    setCameraReady(false);
  }, [stopCameraStream]);

  const resetSession = useCallback(() => {
    disableMeasurementModes();
    resetInteractionDrafts();
    resetHistory();

    setPanMode(false);
    setViewPan({ x: 0, y: 0 });
    setCanvasMode("fit");
    setZoom(1);

    setBackground(null);
    setXrayContrast(1);
    setCutout(null);
    setCutoutMode(false);
    setCutoutAnchor(null);
    setCutoutDraft(null);
    setCutoutPolyPoints([]);
    setCutoutPolyCursor(null);
    cutoutDragRef.current = {
      active: false,
      pointerId: null,
      kind: null,
      startPoint: null,
      startRect: null,
    };

    setRealMm(100);
    setMmPerPixel(null);
    setUseRealScale(false);

    setObjects([]);
    setActiveId(null);
    setMeasurements([]);
    setLldMeasurements([]);
    setOffsetMeasurements([]);
    setAngleMeasurements([]);
    setAhkaMeasurements([]);
    setDrawLines([]);
    setStrokes([]);
    setCorMarkers([]);
    setAnnotations([]);
    setValgusCutLines([]);
    setTibialSlopeLines([]);
    setTibialCutLines([]);

    setTraceFillColor("#c084fc");
    setTraceFillOpacity(0.2);

    setOpenImplantModal(false);
    setMobileToolOpen(false);
    setMobileUiHidden(false);
    setMobileXrayPanelOpen(true);
    setMeasurePanelOpen(true);
    setMeasurePanelMinimized(false);

    if (cameraMode) {
      stopCamera();
      setCameraMode(false);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    toast({
      title: "Session direset",
      description: "Mulai templating baru dari awal.",
    });
  }, [
    cameraMode,
    disableMeasurementModes,
    resetHistory,
    resetInteractionDrafts,
    setTibialCutLines,
    setTibialSlopeLines,
    setValgusCutLines,
    stopCamera,
  ]);

  const requestCameraAccess = useCallback(() => {
    toast({
      title: "Izin kamera dibutuhkan",
      description: "Silakan pilih Allow agar kamera bisa dipakai.",
    });
    return startCamera();
  }, [startCamera]);

  const toggleCameraMode = useCallback(() => {
    const mobileView = typeof window !== "undefined" && window.innerWidth < 768;
    if (!mobileView) {
      toast({
        title: "Camera hanya di mobile",
        description: "Buka halaman ini di HP untuk memakai kamera.",
      });
      return;
    }
    const next = !cameraMode;
    if (next) {
      setCameraZoom(1);
      setCameraFit("cover");
      requestCameraAccess().then((ok) => {
        if (!ok) setCameraMode(false);
      });
    } else {
      stopCamera();
    }
    setCameraMode(next);
  }, [cameraMode, requestCameraAccess, stopCamera]);

  const cameraDigitalZoom = cameraMode && cameraZoomMode === "digital" ? cameraZoom : 1;

  const takeSnapshot = useCallback(async () => {
    if (!cameraMode || !cameraReady) {
      toast({
        title: "Kamera belum siap",
        description: "Aktifkan Camera Mode terlebih dulu.",
      });
      return;
    }
    await Promise.all(
      objects
        .filter((o) => o.type !== "shape")
        .map((o) => ensureImageLoaded(o.imageSrc))
    );
    const canvas = document.createElement("canvas");
    canvas.width = XRAY_BASE_WIDTH;
    canvas.height = XRAY_BASE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCompositeFrame(ctx);
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `xray-camera-${Date.now()}.png`);
    }, "image/png");
  }, [
    cameraMode,
    cameraReady,
    drawCompositeFrame,
    downloadBlob,
    ensureImageLoaded,
    objects,
  ]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    if (!cameraMode || !cameraReady) {
      toast({
        title: "Kamera belum siap",
        description: "Aktifkan Camera Mode terlebih dulu.",
      });
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      toast({
        title: "Record tidak tersedia",
        description: "Browser ini belum mendukung perekaman.",
      });
      return;
    }
    await Promise.all(
      objects
        .filter((o) => o.type !== "shape")
        .map((o) => ensureImageLoaded(o.imageSrc))
    );
    const canvas = document.createElement("canvas");
    canvas.width = XRAY_BASE_WIDTH;
    canvas.height = XRAY_BASE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stream = canvas.captureStream(30);
    recordChunksRef.current = [];
    const preferredTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const options = preferredTypes.find(
      (type) =>
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
    );
    const recorder = new MediaRecorder(
      stream,
      options ? { mimeType: options } : undefined
    );
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) {
        recordChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(recordChunksRef.current, {
        type: recorder.mimeType || "video/webm",
      });
      recordChunksRef.current = [];
      downloadBlob(blob, `xray-camera-${Date.now()}.webm`);
      setIsRecording(false);
    };
    recorderRef.current = recorder;
    const drawLoop = () => {
      drawCompositeFrame(ctx);
      recordRafRef.current = window.requestAnimationFrame(drawLoop);
    };
    drawLoop();
    recorder.start();
    setIsRecording(true);
  }, [
    cameraMode,
    cameraReady,
    drawCompositeFrame,
    downloadBlob,
    ensureImageLoaded,
    isRecording,
    objects,
  ]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    if (recordRafRef.current) {
      window.cancelAnimationFrame(recordRafRef.current);
      recordRafRef.current = null;
    }
  }, []);

  const buildTourSteps = useCallback((): DriveStep[] => {
    const steps: DriveStep[] = [
      {
        element: '[data-tour="panel"]',
        popover: {
          title: "X-ray Control",
          description: "Panel utama untuk upload X-ray, template, dan tools.",
          side: "right",
          align: "center",
        },
      },
      {
        element: '[data-tour="xray-upload"]',
        popover: {
          title: "Upload & Template",
          description: "Upload X-ray dan buka modal template implant.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="xray-zoom"]',
        popover: {
          title: "Imaging",
          description: "Atur contrast dan zoom untuk melihat detail.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="measure-tools"]',
        popover: {
          title: "Measurement Tools",
          description: "Ruler, LLD, Offset, dan Angle untuk pengukuran.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="calibration"]',
        popover: {
          title: "Calibration",
          description: "Kalibrasi agar hasil mm sesuai skala X-ray.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="stage"]',
        popover: {
          title: "Canvas",
          description: "Klik di canvas untuk ukur dan drag template.",
          side: "over",
          align: "center",
        },
      },
      {
        element: '[data-tour="measure-overlay"]',
        popover: {
          title: "Overlay",
          description: "Garis dan label ukuran muncul di atas X-ray.",
          side: "over",
          align: "center",
        },
      },
      {
        element: '[data-tour="annotations"]',
        popover: {
          title: "Annotations",
          description: "Tambah catatan dan lihat overview di sini.",
          side: "right",
          align: "start",
        },
      },
    ];

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const toolbarSelector = isMobile
      ? '[data-tour="toolbar-mobile"]'
      : '[data-tour="toolbar-desktop"]';
    if (
      typeof document !== "undefined" &&
      document.querySelector(toolbarSelector)
    ) {
      steps.push({
        element: toolbarSelector,
        popover: {
          title: "Implant Tool",
          description: "Kontrol implant: move, scale, rotate, flip, undo/redo.",
          side: isMobile ? "top" : "left",
          align: "center",
        },
      });
    }

    return steps.filter((step) => {
      if (!step.element) return false;
      if (typeof step.element === "string") {
        return typeof document !== "undefined"
          ? Boolean(document.querySelector(step.element))
          : false;
      }
      return true;
    });
  }, []);
  const startTour = useCallback(() => {
    if (typeof window === "undefined") return false;
    const steps = buildTourSteps();
    if (!steps.length) return false;
    toast({
      title: "Panduan UI dimulai",
      description:
        "Ikuti langkahnya, klik tombol ? untuk mengulang kapan saja.",
    });
    driverRef.current?.destroy();
    const instance = driver({
      steps,
      showProgress: true,
      showButtons: ["previous", "next", "close"],
      allowClose: true,
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 10,
      onDestroyed: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, "1");
      },
    });
    driverRef.current = instance;
    instance.drive();
    return true;
  }, [buildTourSteps]);

  const startTourWithToast = useCallback(() => {
    const started = startTour();
    if (!started) {
      toast({
        title: "Tour belum siap",
        description: "Coba lagi sebentar atau refresh halaman.",
      });
    }
  }, [startTour]);

  useEffect(() => {
    if (!autoStartTour) return;
    if (tourAutoStarted.current) return;
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(TOUR_STORAGE_KEY) === "1";
    if (seen) return;
    let attempts = 0;
    let timer: number | undefined;
    const tryStart = () => {
      const started = startTour();
      if (started) {
        tourAutoStarted.current = true;
        return;
      }
      attempts += 1;
      if (attempts < 8) {
        timer = window.setTimeout(tryStart, 200);
      }
    };
    timer = window.setTimeout(tryStart, 250);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [autoStartTour, startTour]);

  useEffect(() => {
    return () => stopCameraStream();
  }, [stopCameraStream]);

  useEffect(() => {
    return () => driverRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("toast-center");
    return () => {
      document.body.classList.remove("toast-center");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session: PersistedTemplatingSession = {
      v: 1,
      savedAt: Date.now(),
      background,
      xrayContrast,
      zoom,
      canvasMode,
      viewPan,
      cutout,
      realMm,
      mmPerPixel,
      useRealScale,
      objects,
      activeId,
      measurements,
      lldMeasurements,
      offsetMeasurements,
      angleMeasurements,
      ahkaMeasurements,
      drawLines,
      strokes,
      corMarkers,
      annotations,
      valgusCutLines,
      tibialSlopeLines,
      tibialCutLines,
      ui: {
        drawLineStrokeWidth,
        ahkaStrokeWidth,
        rulerStrokeWidth,
        lldStrokeWidth,
        offsetStrokeWidth,
        angleStrokeWidth,
        pointRadius,
        pointFillMode,
        pointFillColor,
        traceFillColor,
        traceFillOpacity,
        showRulerLabels,
        showLldLabels,
        showOffsetLabels,
        showAngleLabels,
        showAhkaLabels,
        ahkaEditLocked,
        showValgusCutLabels,
        showTibialSlopeLabels,
        showTibialCutLabels,
        measurementsPanelOpen: measurePanelOpen,
      },
      knee: {
        valgusCutAngleDeg,
        valgusCutSide,
        valgusCutOffsetPx,
        valgusCutStrokeWidth,
        valgusCutLineLengthPx,
        tibialSlopeDeg,
        tibialPosteriorSide,
        tibialSlopeOffsetPx,
        tibialSlopeStrokeWidth,
        tibialSlopeLineLengthPx,
        tibialCutAngleDeg,
        tibialCutDirection,
        tibialCutOffsetPx,
        tibialCutStrokeWidth,
        tibialCutLineLengthPx,
      },
    };

    let next: string;
    try {
      next = JSON.stringify(session);
    } catch {
      return;
    }

    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, next);
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, next);
        } catch {
          // ignore
        }
      } catch {
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, next);
        } catch {
          // ignore storage quota / unavailable
        }
      }
    }, 600);

    return () => window.clearTimeout(handle);
  }, [
    activeId,
    ahkaEditLocked,
    ahkaMeasurements,
    ahkaStrokeWidth,
    angleMeasurements,
    angleStrokeWidth,
    annotations,
    background,
    cutout,
    canvasMode,
    drawLineStrokeWidth,
    drawLines,
    lldMeasurements,
    lldStrokeWidth,
    measurePanelOpen,
    measurements,
    mmPerPixel,
    objects,
    offsetMeasurements,
    offsetStrokeWidth,
    pointFillColor,
    pointFillMode,
    pointRadius,
    traceFillColor,
    traceFillOpacity,
    realMm,
    rulerStrokeWidth,
    showAhkaLabels,
    showAngleLabels,
    showLldLabels,
    showOffsetLabels,
    showRulerLabels,
    showTibialCutLabels,
    showTibialSlopeLabels,
    showValgusCutLabels,
    tibialCutAngleDeg,
    tibialCutDirection,
    tibialCutLineLengthPx,
    tibialCutLines,
    tibialCutOffsetPx,
    tibialCutStrokeWidth,
    tibialPosteriorSide,
    tibialSlopeDeg,
    tibialSlopeLineLengthPx,
    tibialSlopeLines,
    tibialSlopeOffsetPx,
    tibialSlopeStrokeWidth,
    useRealScale,
    valgusCutAngleDeg,
    valgusCutLineLengthPx,
    valgusCutLines,
    valgusCutOffsetPx,
    valgusCutSide,
    valgusCutStrokeWidth,
    viewPan,
    xrayContrast,
    zoom,
  ]);

  const onPanelPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;

    setPanelPos({
      x: e.clientX - dragState.current.x,
      y: e.clientY - dragState.current.y,
    });
  };

  const onPanelPointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    panelRef.current?.releasePointerCapture(e.pointerId);
  };

  const onPanelPointerDown = (e: React.PointerEvent) => {
    dragState.current.dragging = true;
    panelManualMove.current = true;
    dragState.current.x = e.clientX - panelPos.x;
    dragState.current.y = e.clientY - panelPos.y;

    panelRef.current?.setPointerCapture(e.pointerId);
  };

  const onToolbarPointerMove = (e: React.PointerEvent) => {
    if (!toolbarDrag.current.dragging) return;
    setToolbarPos({
      x: e.clientX - toolbarDrag.current.x,
      y: e.clientY - toolbarDrag.current.y,
    });
  };

  const onToolbarPointerUp = (e: React.PointerEvent) => {
    toolbarDrag.current.dragging = false;
    toolbarRef.current?.releasePointerCapture(e.pointerId);
  };

  const onToolbarPointerDown = (e: React.PointerEvent) => {
    toolbarDrag.current.dragging = true;
    toolbarDrag.current.x = e.clientX - toolbarPos.x;
    toolbarDrag.current.y = e.clientY - toolbarPos.y;
    toolbarRef.current?.setPointerCapture(e.pointerId);
  };

  const onMeasurePanelPointerMove = (e: React.PointerEvent) => {
    if (!measurePanelDrag.current.dragging) return;
    setMeasurePanelPos({
      x: e.clientX - measurePanelDrag.current.x,
      y: e.clientY - measurePanelDrag.current.y,
    });
  };

  const onMeasurePanelPointerUp = (e: React.PointerEvent) => {
    measurePanelDrag.current.dragging = false;
    measurePanelRef.current?.releasePointerCapture(e.pointerId);
  };

  const onMeasurePanelPointerDown = (e: React.PointerEvent) => {
    noteMeasurePanelActivity();
    if (isMobileViewport) return;
    measurePanelDrag.current.dragging = true;
    measurePanelDrag.current.x = e.clientX - measurePanelPos.x;
    measurePanelDrag.current.y = e.clientY - measurePanelPos.y;
    measurePanelRef.current?.setPointerCapture(e.pointerId);
  };

  const onRotateHandleDown = (e: React.PointerEvent) => {
    if (!active) return;

    pushHistorySnapshot();
    rotateDrag.current = {
      x: e.clientX,
      active: true,
    };

    captureRef.current = e.currentTarget as HTMLElement;
    captureRef.current.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const onScaleHandleDown = (e: React.PointerEvent, dir: ScaleDir) => {
    if (!active || active.scaleLocked) {
      e.stopPropagation();
      return;
    }

    disableMeasurementModes();
    pushHistorySnapshot();
    scaleDrag.current = {
      startY: e.clientY,
      startScaleX: active.scaleX,
      startScaleY: active.scaleY,
      dir,
    };

    captureRef.current = e.currentTarget as HTMLElement;
    captureRef.current.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  return (
    <div
      className="
      relative w-full h-svh overflow-hidden
      bg-gray-100 text-gray-900
      dark:bg-neutral-950 dark:text-gray-100
      transition-colors -ml
    "
    >
      <DraggablePanel
        mobileHidden={mobileUiHidden || !mobileXrayPanelOpen}
        onRequestCloseMobile={() => setMobileXrayPanelOpen(false)}
        panelRef={panelRef}
        panelPos={panelPos}
        onPanelPointerMove={onPanelPointerMove}
        onPanelPointerUp={onPanelPointerUp}
        onPanelPointerDown={onPanelPointerDown}
        measurementsPanelOpen={measurePanelOpen}
        onToggleMeasurementsPanel={() => {
          noteMeasurePanelActivity();
          setMeasurePanelOpen((prev) => {
            const next = !prev;
            if (next) setMeasurePanelMinimized(false);
            return next;
          });
        }}
        uploadBackground={uploadBackground}
        setOpenImplantModal={setOpenImplantModal}
        onAddShapeOverlay={addShapeOverlay}
        onAddImageOverlay={addImageOverlay}
        xrayContrast={xrayContrast}
        setXrayContrast={setXrayContrast}
        realMm={realMm}
        setRealMm={setRealMm}
        applyCalibration={applyCalibration}
        presetName={presetName}
        setPresetName={setPresetName}
        calibrationPresets={calibrationPresets}
        onSavePreset={saveCalibrationPreset}
        onLoadPresets={loadCalibrationPresets}
        onApplyPreset={applyCalibrationPreset}
        onRemovePreset={removeCalibrationPreset}
        onExportReport={exportReport}
        zoom={zoom}
        setZoom={setZoom}
        canvasMode={canvasMode}
        panMode={panMode}
        onTogglePanMode={togglePanMode}
        onFitToScreen={fitToScreen}
        onSetOneToOne={setOneToOne}
        onResetView={resetView}
        onResetSession={resetSession}
        cameraMode={cameraMode}
        cameraReady={cameraReady}
        cameraError={cameraError}
        isRecording={isRecording}
        cameraFit={cameraFit}
        setCameraFit={setCameraFit}
        cameraZoom={cameraZoom}
        setCameraZoom={setCameraZoom}
        cameraZoomMode={cameraZoomMode}
        cameraZoomRange={cameraZoomRange}
        onToggleCamera={toggleCameraMode}
        onRequestCamera={requestCameraAccess}
        onSnapshot={takeSnapshot}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        syncScaleMode={syncScaleMode}
        startSyncScale={startSyncScale}
        stopSyncScale={stopSyncScale}
        autoStartTour={autoStartTour}
        onStartTour={startTourWithToast}
        shortcutsOpen={showShortcuts}
        onToggleShortcuts={toggleShortcuts}
      />

      <AnimatePresence initial={false}>
        {measurePanelOpen && !mobileUiHidden && (
          <MeasurementValuePanel
            mobileDocked={isMobileViewport}
            panelRef={measurePanelRef}
            panelPos={measurePanelPos}
            onPanelPointerMove={onMeasurePanelPointerMove}
            onPanelPointerUp={onMeasurePanelPointerUp}
            onPanelPointerDown={onMeasurePanelPointerDown}
            onInteract={noteMeasurePanelActivity}
            onClose={() => setMeasurePanelOpen(false)}
            minimized={measurePanelMinimizedEffective}
            canMinimize={canMinimizeMeasurements}
            onToggleMinimized={() => {
              noteMeasurePanelActivity();
              setMeasurePanelMinimized((prev) => !prev);
            }}
            rulerMode={rulerMode}
            toggleRulerMode={toggleRulerMode}
            lldMode={lldMode}
            toggleLldMode={toggleLldMode}
            offsetMode={offsetMode}
            toggleOffsetMode={toggleOffsetMode}
            angleMode={angleMode}
            toggleAngleMode={toggleAngleMode}
            ahkaMode={ahkaMode}
            toggleAhkaMode={toggleAhkaMode}
            drawMode={drawMode}
            onToggleDrawMode={toggleDrawMode}
            traceMode={traceMode}
            toggleTraceMode={toggleTraceMode}
            pencilMode={pencilMode}
            togglePencilMode={togglePencilMode}
            corMode={corMode}
            toggleCorMode={toggleCorMode}
            annotationMode={annotationMode}
            toggleAnnotationMode={toggleAnnotationMode}
            cutout={cutout}
            cutoutMode={cutoutMode}
            cutoutShape={cutoutShape}
            onToggleCutoutMode={toggleCutoutMode}
            onClearCutout={clearCutout}
            onSetCutoutOpacity={setCutoutOpacity}
            onSetCutoutShape={setCutoutShapeWithUpdate}
            onCreateCutoutOverlay={createOverlayFromCutout}
            onCopyCutoutFromCanvas={copyCutoutFromCanvas}
            onCopyCutoutFromItem={() => void copyCutoutFromActiveItem(false)}
            onCutCutoutFromItem={() => void copyCutoutFromActiveItem(true)}
            canCopyCutoutFromItem={Boolean(activeId)}
            measurementRows={measurementRows}
            measurementTotalLabel={measurementTotalLabel}
            removeMeasurement={removeMeasurement}
            toggleMeasurementLock={toggleMeasurementLock}
            toggleMeasurementHidden={toggleMeasurementHidden}
            clearMeasurements={clearMeasurements}
            lldRows={lldRows}
            removeLldMeasurement={removeLldMeasurement}
            toggleLldLock={toggleLldLock}
            toggleLldHidden={toggleLldHidden}
            clearLldMeasurements={clearLldMeasurements}
            offsetRows={offsetRows}
            removeOffsetMeasurement={removeOffsetMeasurement}
            toggleOffsetLock={toggleOffsetLock}
            toggleOffsetHidden={toggleOffsetHidden}
            clearOffsetMeasurements={clearOffsetMeasurements}
            angleRows={angleRows}
            removeAngleMeasurement={removeAngleMeasurement}
            toggleAngleLock={toggleAngleLock}
            toggleAngleHidden={toggleAngleHidden}
            clearAngles={clearAngles}
            ahkaRows={ahkaRows}
            removeAhkaMeasurement={removeAhkaMeasurement}
            toggleAhkaLock={toggleAhkaLock}
            toggleAhkaHidden={toggleAhkaHidden}
            clearAhka={clearAhka}
            drawLinesRows={drawLinesRows}
            drawLinesTotalLabel={drawLinesTotalLabel}
            removeDrawLine={removeDrawLine}
            toggleDrawLineLock={toggleDrawLineLock}
            toggleDrawLineHidden={toggleDrawLineHidden}
            clearDrawLines={clearDrawLines}
            traceRows={traceRows}
            pencilRows={pencilRows}
            corRows={corRows}
            removeStroke={removeStroke}
            toggleStrokeLock={toggleStrokeLock}
            toggleStrokeHidden={toggleStrokeHidden}
            clearStrokesByKind={clearStrokesByKind}
            removeCorMarker={removeCorMarker}
            toggleCorLock={toggleCorLock}
            toggleCorHidden={toggleCorHidden}
            clearCorMarkers={clearCorMarkers}
            traceFillColor={traceFillColor}
            setTraceFillColor={setTraceFillColor}
            traceFillOpacity={traceFillOpacity}
            setTraceFillOpacity={setTraceFillOpacity}
            annotations={annotations}
            editAnnotation={editAnnotation}
            removeAnnotation={removeAnnotation}
            clearAnnotations={clearAnnotations}
            toggleAnnotationHidden={toggleAnnotationHidden}
            drawLineStrokeWidth={drawLineStrokeWidth}
            setDrawLineStrokeWidth={setDrawLineStrokeWidth}
            ahkaStrokeWidth={ahkaStrokeWidth}
            setAhkaStrokeWidth={setAhkaStrokeWidth}
            rulerStrokeWidth={rulerStrokeWidth}
            setRulerStrokeWidth={setRulerStrokeWidth}
            lldStrokeWidth={lldStrokeWidth}
            setLldStrokeWidth={setLldStrokeWidth}
            offsetStrokeWidth={offsetStrokeWidth}
            setOffsetStrokeWidth={setOffsetStrokeWidth}
	            angleStrokeWidth={angleStrokeWidth}
	            setAngleStrokeWidth={setAngleStrokeWidth}
	            pointRadius={pointRadius}
	            setPointRadius={setPointRadius}
	            pointFillMode={pointFillMode}
	            setPointFillMode={setPointFillMode}
	            pointFillColor={pointFillColor}
	            setPointFillColor={setPointFillColor}
	            valgusCutMode={valgusCutMode}
	            onToggleValgusCutMode={toggleValgusCutMode}
            valgusCutAngleDeg={valgusCutAngleDeg}
            setValgusCutAngleDeg={setValgusCutAngleDeg}
            valgusCutSide={valgusCutSide}
            setValgusCutSide={setValgusCutSide}
            valgusCutOffsetPx={valgusCutOffsetPx}
            setValgusCutOffsetPx={setValgusCutOffsetPx}
            valgusCutStrokeWidth={valgusCutStrokeWidth}
            setValgusCutStrokeWidth={setValgusCutStrokeWidth}
            valgusCutLineLengthPx={valgusCutLineLengthPx}
            setValgusCutLineLengthPx={setValgusCutLineLengthPx}
            valgusCutLines={valgusCutLines}
            valgusCutAnchor={valgusCutAnchor}
            onRemoveValgusCutLine={removeValgusCutLine}
            onToggleValgusCutLineLock={toggleValgusCutLineLock}
            onToggleValgusCutLineHidden={toggleValgusCutLineHidden}
            onResetValgusCut={resetValgusCut}
            tibialSlopeMode={tibialSlopeMode}
            onToggleTibialSlopeMode={toggleTibialSlopeMode}
            tibialSlopeDeg={tibialSlopeDeg}
            setTibialSlopeDeg={setTibialSlopeDeg}
            tibialPosteriorSide={tibialPosteriorSide}
            setTibialPosteriorSide={setTibialPosteriorSide}
            tibialSlopeOffsetPx={tibialSlopeOffsetPx}
            setTibialSlopeOffsetPx={setTibialSlopeOffsetPx}
            tibialSlopeStrokeWidth={tibialSlopeStrokeWidth}
            setTibialSlopeStrokeWidth={setTibialSlopeStrokeWidth}
            tibialSlopeLineLengthPx={tibialSlopeLineLengthPx}
            setTibialSlopeLineLengthPx={setTibialSlopeLineLengthPx}
            tibialSlopeLines={tibialSlopeLines}
            tibialSlopeAnchor={tibialSlopeAnchor}
            onRemoveTibialSlopeLine={removeTibialSlopeLine}
            onToggleTibialSlopeLineLock={toggleTibialSlopeLineLock}
            onToggleTibialSlopeLineHidden={toggleTibialSlopeLineHidden}
            onResetTibialSlope={resetTibialSlope}
            tibialCutMode={tibialCutMode}
            onToggleTibialCutMode={toggleTibialCutMode}
            tibialCutAngleDeg={tibialCutAngleDeg}
            setTibialCutAngleDeg={setTibialCutAngleDeg}
            tibialCutDirection={tibialCutDirection}
            setTibialCutDirection={setTibialCutDirection}
            tibialCutOffsetPx={tibialCutOffsetPx}
            setTibialCutOffsetPx={setTibialCutOffsetPx}
            tibialCutStrokeWidth={tibialCutStrokeWidth}
            setTibialCutStrokeWidth={setTibialCutStrokeWidth}
            tibialCutLineLengthPx={tibialCutLineLengthPx}
            setTibialCutLineLengthPx={setTibialCutLineLengthPx}
            tibialCutLines={tibialCutLines}
            tibialCutAnchor={tibialCutAnchor}
            onRemoveTibialCutLine={removeTibialCutLine}
            onToggleTibialCutLineLock={toggleTibialCutLineLock}
            onToggleTibialCutLineHidden={toggleTibialCutLineHidden}
            onResetTibialCut={resetTibialCut}
            showRulerLabels={showRulerLabels}
            setShowRulerLabels={setShowRulerLabels}
            showLldLabels={showLldLabels}
            setShowLldLabels={setShowLldLabels}
            showOffsetLabels={showOffsetLabels}
            setShowOffsetLabels={setShowOffsetLabels}
            showAngleLabels={showAngleLabels}
            setShowAngleLabels={setShowAngleLabels}
            showAhkaLabels={showAhkaLabels}
            setShowAhkaLabels={setShowAhkaLabels}
            ahkaEditLocked={ahkaEditLocked}
            setAhkaEditLocked={setAhkaEditLocked}
            showValgusCutLabels={showValgusCutLabels}
            setShowValgusCutLabels={setShowValgusCutLabels}
            showTibialSlopeLabels={showTibialSlopeLabels}
            setShowTibialSlopeLabels={setShowTibialSlopeLabels}
            showTibialCutLabels={showTibialCutLabels}
            setShowTibialCutLabels={setShowTibialCutLabels}
          />
        )}
      </AnimatePresence>

      <MobileControlDock
        panelsHidden={mobileUiHidden}
        onTogglePanelsHidden={toggleMobileUiHidden}
        xrayPanelOpen={mobileXrayPanelOpen}
        onToggleXrayPanel={() => {
          setMobileUiHidden(false);
          setMobileXrayPanelOpen((prev) => !prev);
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        measurementsOpen={measurePanelOpen}
        onToggleMeasurements={() => {
          setMobileUiHidden(false);
          noteMeasurePanelActivity();
          setMeasurePanelOpen((prev) => {
            const next = !prev;
            if (next) setMeasurePanelMinimized(false);
            return next;
          });
        }}
        implantToolOpen={mobileToolOpen}
        onToggleImplantTool={() => {
          setMobileUiHidden(false);
          setMobileToolOpen((prev) => !prev);
        }}
        panMode={panMode}
        onTogglePanMode={togglePanMode}
        canvasMode={canvasMode}
        onFitToScreen={fitToScreen}
        onSetOneToOne={setOneToOne}
        onResetView={resetView}
      />

      <ShortcutsOverlay
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <AnimatePresence initial={false}>
        {active && (
          <>
            <ToolbarDesktop
              key="toolbar-desktop"
              active={active}
              toolbarRef={toolbarRef}
              toolbarPos={toolbarPos}
              onToolbarPointerMove={onToolbarPointerMove}
              onToolbarPointerUp={onToolbarPointerUp}
              onToolbarPointerDown={onToolbarPointerDown}
              moveStep={moveStep}
              setMoveStep={setMoveStep}
              scaleStep={scaleStep}
              rotateStep={rotateStep}
              moveActive={moveActiveWithHistory}
              scaleActive={scaleActive}
              rotateActive={rotateActive}
              flipActiveX={flipActiveX}
              flipActiveY={flipActiveY}
              deleteActive={deleteActive}
              updateActiveScale={updateActiveScale}
              updateActiveRotation={updateActiveRotation}
              updateActiveOpacity={updateActiveOpacity}
              toggleActiveLock={toggleActiveLock}
              toggleActiveScaleLock={toggleActiveScaleLock}
              startScaleScrub={startScaleScrub}
              endScaleScrub={endScaleScrub}
              bringActiveToFront={bringActiveToFront}
              sendActiveToBack={sendActiveToBack}
              mmPerPixel={mmPerPixel}
              scaleImplantByMm={scaleImplantByMm}
              canUndo={canUndo}
              canRedo={canRedo}
              undo={undo}
              redo={redo}
            />
            <ToolbarMobile
              key="toolbar-mobile"
              panelOpen={mobileToolOpen}
              onTogglePanel={() => setMobileToolOpen((prev) => !prev)}
            />
            <ToolbarMobilePanel
              open={mobileToolOpen}
              onClose={() => setMobileToolOpen(false)}
              active={active}
              moveStep={moveStep}
              setMoveStep={setMoveStep}
              scaleStep={scaleStep}
              rotateStep={rotateStep}
              moveActive={moveActiveWithHistory}
              scaleActive={scaleActive}
              rotateActive={rotateActive}
              flipActiveX={flipActiveX}
              flipActiveY={flipActiveY}
              deleteActive={deleteActive}
              updateActiveScale={updateActiveScale}
              updateActiveRotation={updateActiveRotation}
              updateActiveOpacity={updateActiveOpacity}
              toggleActiveLock={toggleActiveLock}
              toggleActiveScaleLock={toggleActiveScaleLock}
              startScaleScrub={startScaleScrub}
              endScaleScrub={endScaleScrub}
              bringActiveToFront={bringActiveToFront}
              sendActiveToBack={sendActiveToBack}
              mmPerPixel={mmPerPixel}
              scaleImplantByMm={scaleImplantByMm}
              canUndo={canUndo}
              canRedo={canRedo}
              undo={undo}
              redo={redo}
            />
          </>
        )}
      </AnimatePresence>

      <TemplatingStage
        stageRef={stageRef}
        onStagePointerDown={onStagePointerDown}
        onStagePointerMove={onGlobalPointerMove}
        onStagePointerUp={onStagePointerUp}
        onStageWheel={onStageWheel}
        onDownObject={onDownObject}
        onDeleteActive={deleteActive}
        onToggleScaleLock={toggleActiveScaleLock}
        background={background}
        xrayContrast={xrayContrast}
        cameraMode={cameraMode}
        cameraFit={cameraFit}
        cameraDigitalZoom={cameraDigitalZoom}
        videoRef={videoRef}
        objects={objects}
        activeId={activeId}
        setActiveId={setActiveId}
        rulerMode={rulerMode}
        lldMode={lldMode}
        offsetMode={offsetMode}
        angleMode={angleMode}
        ahkaMode={ahkaMode}
        panMode={panMode}
        zoom={zoom}
        canvasMode={canvasMode}
        viewPan={viewPan}
        rulerDisplayDivisor={rulerDisplayDivisor}
        onRotateHandleDown={onRotateHandleDown}
        onScaleHandleDown={onScaleHandleDown}
        measurements={measurements}
        lldMeasurements={lldMeasurements}
        offsetMeasurements={offsetMeasurements}
        angleMeasurements={angleMeasurements}
        anglePoints={anglePoints}
        angleDraft={angleDraft}
        ahkaMeasurements={ahkaMeasurements}
        ahkaPoints={ahkaPoints}
        ahkaDraft={ahkaDraft}
        draftStart={rulerAnchor}
        draftEnd={rulerDraft}
        lldDraftStart={lldAnchor}
        lldDraftEnd={lldDraft}
        offsetDraftStart={offsetAnchor}
        offsetDraftEnd={offsetDraft}
        mmPerPixel={mmPerPixel}
        annotationMode={annotationMode}
        annotations={annotations}
        annotationDraft={annotationDraft}
        onEditAnnotation={editAnnotation}
        onUpdateAnnotationDraftText={updateAnnotationDraftText}
        onSaveAnnotationDraft={saveAnnotationDraft}
        onCancelAnnotationDraft={cancelAnnotationDraft}
        onBeginMoveAnnotation={beginMoveAnnotation}
        onTranslateAnnotation={translateAnnotation}
        drawLines={drawLines}
        drawLineStrokeWidth={drawLineStrokeWidth}
        drawMode={drawMode}
        traceMode={traceMode}
        pencilMode={pencilMode}
        corMode={corMode}
        drawAnchor={drawAnchor}
        drawDraft={drawDraft}
        strokes={strokes}
        strokeDraftPoints={strokeDraftPoints}
        traceFillColor={traceFillColor}
        traceFillOpacity={traceFillOpacity}
        corMarkers={corMarkers}
        hoverMoveHint={hoverMoveHint}
        ahkaStrokeWidth={ahkaStrokeWidth}
	        rulerStrokeWidth={rulerStrokeWidth}
	        lldStrokeWidth={lldStrokeWidth}
	        offsetStrokeWidth={offsetStrokeWidth}
	        angleStrokeWidth={angleStrokeWidth}
	        pointRadius={pointRadius}
	        pointFillMode={pointFillMode}
	        pointFillColor={pointFillColor}
	        valgusCutMode={valgusCutMode}
	        valgusCutLines={valgusCutLines}
	        valgusCutAnchor={valgusCutAnchor}
	        valgusCutDraft={valgusCutDraft}
        valgusCutAngleDeg={valgusCutAngleDeg}
        valgusCutSide={valgusCutSide}
        valgusCutOffsetPx={valgusCutOffsetPx}
        valgusCutStrokeWidth={valgusCutStrokeWidth}
        valgusCutLineLengthPx={valgusCutLineLengthPx}
        tibialSlopeMode={tibialSlopeMode}
        tibialSlopeLines={tibialSlopeLines}
        tibialSlopeAnchor={tibialSlopeAnchor}
        tibialSlopeDraft={tibialSlopeDraft}
        tibialSlopeDeg={tibialSlopeDeg}
        tibialPosteriorSide={tibialPosteriorSide}
        tibialSlopeOffsetPx={tibialSlopeOffsetPx}
        tibialSlopeStrokeWidth={tibialSlopeStrokeWidth}
        tibialSlopeLineLengthPx={tibialSlopeLineLengthPx}
        tibialCutMode={tibialCutMode}
        tibialCutLines={tibialCutLines}
        tibialCutAnchor={tibialCutAnchor}
        tibialCutDraft={tibialCutDraft}
        tibialCutAngleDeg={tibialCutAngleDeg}
        tibialCutDirection={tibialCutDirection}
        tibialCutOffsetPx={tibialCutOffsetPx}
        tibialCutStrokeWidth={tibialCutStrokeWidth}
        tibialCutLineLengthPx={tibialCutLineLengthPx}
        showRulerLabels={showRulerLabels}
        showLldLabels={showLldLabels}
        showOffsetLabels={showOffsetLabels}
        showAngleLabels={showAngleLabels}
        showAhkaLabels={showAhkaLabels}
        showValgusCutLabels={showValgusCutLabels}
        showTibialSlopeLabels={showTibialSlopeLabels}
        showTibialCutLabels={showTibialCutLabels}
        cutout={cutout}
        cutoutMode={cutoutMode}
        cutoutPreview={cutoutPreview}
      />

      <ImplantModal
        open={openImplantModal}
        setOpenImplantModal={setOpenImplantModal}
        search={search}
        setSearch={setSearch}
        openType={openType}
        setOpenType={setOpenType}
        openSystem={openSystem}
        setOpenSystem={setOpenSystem}
        groupedLibrary={groupedLibrary}
        addImplant={addImplant}
      />
    </div>
  );
}

/* =====================================================
   UI COMPONENTS
   ===================================================== */

function MobileControlDockLegacy({
  panelsHidden,
  onTogglePanelsHidden,
  xrayPanelOpen,
  onToggleXrayPanel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  measurementsOpen,
  onToggleMeasurements,
  implantToolOpen,
  onToggleImplantTool,
}: {
  panelsHidden: boolean;
  onTogglePanelsHidden: () => void;
  xrayPanelOpen: boolean;
  onToggleXrayPanel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  measurementsOpen: boolean;
  onToggleMeasurements: () => void;
  implantToolOpen: boolean;
  onToggleImplantTool: () => void;
}) {
  const baseButton =
    "h-7 w-7 rounded-lg ring-1 ring-gray-200/70 bg-white/95 text-gray-700 shadow-sm backdrop-blur transition hover:bg-white dark:ring-neutral-700/70 dark:bg-neutral-900/95 dark:text-gray-200";
  const activeButton = "ring-emerald-300/70 text-emerald-700 dark:text-emerald-300";
  const inactiveButton =
    "text-gray-600 dark:text-gray-200";

  return (
    <div
      className="md:hidden fixed left-1/2 top-[calc(env(safe-area-inset-top)+10px)] z-50 -translate-x-1/2 rounded-lg border border-gray-200/70 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur dark:border-neutral-700/70 dark:bg-neutral-900/95"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePanelsHidden}
          aria-pressed={panelsHidden}
          className={`${baseButton} ${panelsHidden ? activeButton : inactiveButton}`}
          aria-label={panelsHidden ? "Show panels" : "Hide panels"}
          title={panelsHidden ? "Show panels" : "Hide panels"}
        >
          {panelsHidden ? (
            <Eye className="mx-auto h-4 w-4" />
          ) : (
            <EyeOff className="mx-auto h-4 w-4" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-200/70 dark:bg-neutral-700/70" />

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`${baseButton} ${inactiveButton} disabled:opacity-50`}
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 className="mx-auto h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`${baseButton} ${inactiveButton} disabled:opacity-50`}
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 className="mx-auto h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-200/70 dark:bg-neutral-700/70" />

        <button
          type="button"
          onClick={onToggleXrayPanel}
          aria-pressed={xrayPanelOpen && !panelsHidden}
          className={`${baseButton} ${xrayPanelOpen && !panelsHidden ? activeButton : inactiveButton}`}
          aria-label={xrayPanelOpen ? "Hide X-ray panel" : "Show X-ray panel"}
          title="X-ray Panel"
        >
          <ImageIcon className="mx-auto h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleMeasurements}
          aria-pressed={measurementsOpen && !panelsHidden}
          className={`${baseButton} ${measurementsOpen && !panelsHidden ? activeButton : inactiveButton}`}
          aria-label={measurementsOpen ? "Hide measurements panel" : "Show measurements panel"}
          title="Measurements"
        >
          <RulerIcon className="mx-auto h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleImplantTool}
          aria-pressed={implantToolOpen && !panelsHidden}
          className={`${baseButton} ${implantToolOpen && !panelsHidden ? activeButton : inactiveButton}`}
          aria-label={implantToolOpen ? "Hide implant tool" : "Show implant tool"}
          title="Implant Tool"
        >
          <Settings2 className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DraggablePanelLegacy({
  mobileHidden,
  panelRef,
  panelPos,
  onPanelPointerMove,
  onPanelPointerUp,
  onPanelPointerDown,
  measurementsPanelOpen,
  onToggleMeasurementsPanel,
  uploadBackground,
  setOpenImplantModal,
  onAddShapeOverlay,
  onAddImageOverlay,
  xrayContrast,
  setXrayContrast,
  realMm,
  setRealMm,
  applyCalibration,
  presetName,
  setPresetName,
  calibrationPresets,
  onSavePreset,
  onLoadPresets,
  onApplyPreset,
  onRemovePreset,
  onExportReport,
  zoom,
  setZoom,
  canvasMode,
  setCanvasMode,
  cameraMode,
  cameraReady,
  cameraError,
  isRecording,
  onToggleCamera,
  onRequestCamera,
  onSnapshot,
  onStartRecording,
  onStopRecording,
  syncScaleMode,
  startSyncScale,
  stopSyncScale,
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
  annotationMode,
  toggleAnnotationMode,
  annotations,
  editAnnotation,
  removeAnnotation,
  clearAnnotations,
  autoStartTour,
  onStartTour,
  shortcutsOpen,
  onToggleShortcuts,
}: {
  mobileHidden: boolean;
  panelRef: React.RefObject<HTMLDivElement>;
  panelPos: { x: number; y: number };
  onPanelPointerMove: (e: React.PointerEvent) => void;
  onPanelPointerUp: (e: React.PointerEvent) => void;
  onPanelPointerDown: (e: React.PointerEvent) => void;
  measurementsPanelOpen: boolean;
  onToggleMeasurementsPanel: () => void;
  uploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setOpenImplantModal: React.Dispatch<React.SetStateAction<boolean>>;
  onAddShapeOverlay: (shape: "circle" | "square" | "triangle") => void;
  onAddImageOverlay: (file: File) => void;
  xrayContrast: number;
  setXrayContrast: React.Dispatch<React.SetStateAction<number>>;
  realMm: number;
  setRealMm: React.Dispatch<React.SetStateAction<number>>;
  applyCalibration: () => void;
  presetName: string;
  setPresetName: React.Dispatch<React.SetStateAction<string>>;
  calibrationPresets: CalibrationPreset[];
  onSavePreset: () => void;
  onLoadPresets: () => void;
  onApplyPreset: (preset: CalibrationPreset) => void;
  onRemovePreset: (id: string) => void;
  onExportReport: (format: "png" | "pdf") => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  canvasMode: CanvasMode;
  setCanvasMode: React.Dispatch<React.SetStateAction<CanvasMode>>;
  cameraMode: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  isRecording: boolean;
  onToggleCamera: () => void;
  onRequestCamera: () => void;
  onSnapshot: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  syncScaleMode: boolean;
  startSyncScale: () => void;
  stopSyncScale: () => void;
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
  annotationMode: boolean;
  toggleAnnotationMode: () => void;
  annotations: Annotation[];
  editAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  autoStartTour: boolean;
  onStartTour: () => void;
  shortcutsOpen: boolean;
  onToggleShortcuts: () => void;
}) {
  const clampZoomValue = (value: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  const headerClass =
    "cursor-move max-md:cursor-default px-3 py-2 border-b border-gray-200/60 dark:border-neutral-800/70 flex items-center justify-between text-[11px] font-semibold text-gray-800 dark:text-gray-100";
  const contentClass =
    "p-2.5 space-y-2 text-[11px] max-h-[58svh] overflow-y-auto overscroll-contain touch-pan-y md:max-h-[calc(80svh-52px)] md:overflow-y-auto md:overscroll-contain md:space-y-3 md:text-xs max-md:h-[calc(70svh-52px)] max-md:max-h-[calc(70svh-52px)] max-md:overflow-y-auto max-md:overscroll-contain max-md:touch-pan-y max-md:pb-3";
  const groupClass =
    "rounded-lg border border-gray-200/50 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50 overflow-hidden";
  const groupHeaderClass =
    "w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-gray-800 dark:text-gray-100 bg-white/40 dark:bg-neutral-900/40 hover:bg-gray-50/70 dark:hover:bg-neutral-800/60 transition";
  const groupContentClass = "px-2.5 pb-2.5 pt-2 space-y-2 md:space-y-3";
  const sectionClass =
    "rounded-lg border border-transparent bg-transparent p-2 space-y-2 md:border-gray-200/50 md:bg-white/70 md:dark:border-neutral-700/60 md:dark:bg-neutral-900/60";
  const labelClass =
    "text-[10px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/70 dark:border-neutral-700/70 bg-white/90 dark:bg-neutral-900/70 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const inputCompact = `w-16 ${inputBase} px-1.5 py-1`;
  const rangeClass = "w-full accent-emerald-500";
  const primaryButton =
    "w-full rounded-lg bg-gray-900 text-white py-1 text-[10px] font-semibold hover:bg-black transition";
  const secondaryButton =
    "w-full rounded-lg border border-gray-200/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/60 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition";
  const toggleOn =
    "rounded-lg px-2 py-1 text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition";
  const toggleOff =
    "rounded-lg px-2 py-1 text-[10px] font-medium bg-gray-200/80 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300/80 dark:hover:bg-neutral-700 transition";
  const miniButton =
    "rounded-lg px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const chipBase = "rounded-md px-1 py-1 text-[9px] font-medium transition";
  const chipActive = "bg-emerald-600 text-white";
  const chipInactive = "bg-gray-100 text-gray-700 hover:bg-gray-200";
  const mutedText = "text-[9px] text-gray-400";
  const buildAccordionState = (openKey?: PanelSectionKey) => ({
    imaging: openKey === "imaging",
    calibration: openKey === "calibration",
    tools: openKey === "tools",
    overview: openKey === "overview",
  });
  const [panelCollapsed, setPanelCollapsed] = useState(() => !autoStartTour);
  const panelShellClass = `relative bg-white/92 dark:bg-neutral-900/92 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/60 dark:border-neutral-700/70 w-[82vw] max-w-[82vw] md:max-w-[90vw] max-h-[80svh] md:max-h-[80svh] overflow-hidden max-md:rounded-2xl max-md:shadow-xl max-md:border-gray-200/60 max-md:overflow-hidden max-md:touch-pan-y ${
    panelCollapsed
      ? "max-md:w-50 max-md:h-auto md:w-52 md:h-auto"
      : "max-md:h-[82svh] md:w-64"
  }`;
  const [openSections, setOpenSections] = useState<
    Record<PanelSectionKey, boolean>
  >(() => buildAccordionState("imaging"));
  const toggleSection = (key: PanelSectionKey) => {
    setOpenSections((prev) => {
      const nextOpen = !prev[key];
      if (!nextOpen) {
        return buildAccordionState();
      }
      return buildAccordionState(key);
    });
  };
  useEffect(() => {
    if (!openSections.calibration) return;
    onLoadPresets();
  }, [openSections.calibration, onLoadPresets]);
  const handleStartTour = () => {
    setPanelCollapsed(false);
    setOpenSections({
      imaging: true,
      calibration: true,
      tools: true,
      overview: true,
    });
    onStartTour();
  };

  return (
    <motion.div
      ref={panelRef}
      className={`fixed z-30 select-none touch-auto md:touch-none max-md:touch-pan-y max-md:!left-1/2 max-md:!top-auto max-md:!bottom-4 max-md:!-translate-x-1/2 max-md:!translate-y-0 ${
        mobileHidden ? "max-md:hidden" : ""
      }`}
      data-tour="panel"
      style={{ left: panelPos.x, top: panelPos.y }}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerUp}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className={panelShellClass}>
        {/* HEADER (DRAG HANDLE) */}
        <div
          className={`${headerClass} touch-none`}
          onPointerDown={onPanelPointerDown}
        >
          <div className="flex items-center gap-2">
            <span>X-ray Control</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartTour();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-7 w-7 rounded-lg border border-emerald-300/70 bg-emerald-50 text-[14px] font-semibold text-emerald-600 hover:bg-emerald-100"
              aria-label="Start guide"
              title="Start guide"
            >
              ?
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleShortcuts();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-pressed={shortcutsOpen}
              className={`h-7 w-7 rounded-lg border text-gray-600 transition ${
                shortcutsOpen
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-600"
                  : "border-gray-200/70 bg-white/80 hover:bg-gray-100"
              }`}
              aria-label="Toggle shortcuts"
              title="Shortcuts (Shift+/)"
            >
              <Keyboard className="h-3 w-3 ml-[7px] md:ml-[7px]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMeasurementsPanel();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-pressed={measurementsPanelOpen}
              className={`h-7 w-7 rounded-lg border text-gray-600 transition ${
                measurementsPanelOpen
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-600"
                  : "border-gray-200/70 bg-white/80 hover:bg-gray-100"
              }`}
              aria-label="Toggle measurements panel"
              title="Measurements"
            >
              <List className="h-3 w-3 ml-1.5 md:ml-1.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPanelCollapsed((prev) => !prev);
              }}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={panelCollapsed ? "Expand panel" : "Collapse panel"}
              title={panelCollapsed ? "Expand" : "Collapse"}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${
                  panelCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>
            <span className="text-gray-400">
              <Grab />
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={`${contentClass} ${panelCollapsed ? "hidden" : ""}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("imaging")}
              aria-expanded={openSections.imaging}
            >
              <span className="inline-flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Imaging
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.imaging ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.imaging && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass} data-tour="xray-upload">
                    <label className={labelClass}>X-ray Background</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadBackground}
                      className={`${inputFull} file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-gray-600 dark:file:bg-neutral-800 dark:file:text-gray-300`}
                    />
                    <button
                      onClick={() => setOpenImplantModal(true)}
                      className={primaryButton}
                    >
                      + Add Template
                    </button>
                  </div>

                  <div className={sectionClass} data-tour="xray-zoom">
                    <label className={labelClass}>X-ray Contrast</label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={xrayContrast}
                      onChange={(e) => setXrayContrast(Number(e.target.value))}
                      className={rangeClass}
                    />

                    <div className="pt-1">
                      <label className={labelClass}>Zoom</label>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoom(clampZoomValue(zoom - 0.1))}
                          className={miniButton}
                          aria-label="Zoom out"
                          title="Zoom out"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="range"
                          min={ZOOM_MIN}
                          max={ZOOM_MAX}
                          step={ZOOM_STEP}
                          value={zoom}
                          onChange={(e) =>
                            setZoom(clampZoomValue(Number(e.target.value)))
                          }
                          className={rangeClass}
                        />
                        <div className="min-w-12 text-right text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                          {Math.round(zoom * 100)}%
                        </div>
                        <button
                          type="button"
                          onClick={() => setZoom(clampZoomValue(zoom + 0.1))}
                          className={miniButton}
                          aria-label="Zoom in"
                          title="Zoom in"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className={labelClass}>Canvas Mode</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setCanvasMode("fit")}
                          className={`${chipBase} ${
                            canvasMode === "fit" ? chipActive : chipInactive
                          }`}
                        >
                          Fit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanvasMode("oneToOne")}
                          className={`${chipBase} ${
                            canvasMode === "oneToOne"
                              ? chipActive
                              : chipInactive
                          }`}
                        >
                          1:1
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 md:hidden">
                      <label className={labelClass}>Camera Mode</label>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={onToggleCamera}
                          className={`${
                            cameraMode ? toggleOn : toggleOff
                          } flex-1`}
                        >
                          {cameraMode ? "Camera: ON" : "Camera: OFF"}
                        </button>
                        <button
                          type="button"
                          onClick={onSnapshot}
                          disabled={!cameraMode || !cameraReady}
                          className={miniButton}
                        >
                          Snapshot
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={
                            isRecording ? onStopRecording : onStartRecording
                          }
                          disabled={!cameraMode || !cameraReady}
                          className={`${
                            isRecording ? toggleOn : toggleOff
                          } flex-1`}
                        >
                          {isRecording ? "Stop Record" : "Record"}
                        </button>
                        {cameraError ? (
                          <span className={mutedText}>{cameraError}</span>
                        ) : null}
                      </div>
                      {cameraMode && !cameraReady && (
                        <div className="mt-2 rounded-lg border border-amber-200/60 bg-amber-50/70 px-2 py-2 text-[10px] text-amber-700">
                          Izinkan akses kamera di browser. Jika prompt tidak
                          muncul, klik tombol di bawah ini untuk mencoba lagi.
                          <button
                            type="button"
                            onClick={onRequestCamera}
                            className="mt-2 w-full rounded-md bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-600"
                          >
                            Minta Izin Kamera
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={groupClass} data-tour="measure-tools">
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("tools")}
              aria-expanded={openSections.tools}
            >
              <span className="inline-flex items-center gap-2">
                <RulerIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Measurement Tools
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.tools ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.tools && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass}>
                    <label className={labelClass}>Hip</label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={toggleRulerMode}
                        aria-pressed={rulerMode}
                        title="Ruler (R) - click 2 points"
                        className={`${chipBase} ${
                          rulerMode ? chipActive : chipInactive
                        } w-full`}
                      >
                        Ruler
                      </button>
                      <button
                        type="button"
                        onClick={toggleLldMode}
                        aria-pressed={lldMode}
                        title="LLD (L) - vertical 2 points"
                        className={`${chipBase} ${
                          lldMode ? chipActive : chipInactive
                        } w-full`}
                      >
                        LLD
                      </button>
                      <button
                        type="button"
                        onClick={toggleOffsetMode}
                        aria-pressed={offsetMode}
                        title="Offset (O) - horizontal 2 points"
                        className={`${chipBase} ${
                          offsetMode ? chipActive : chipInactive
                        } w-full`}
                      >
                        Offset
                      </button>
                    </div>

                    <label className={`${labelClass} mt-3`}>Knee</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={toggleAngleMode}
                        aria-pressed={angleMode}
                        title="Angle (A) - click 3 points"
                        className={`${chipBase} ${
                          angleMode ? chipActive : chipInactive
                        } w-full`}
                      >
                        Angle
                      </button>
                      <button
                        type="button"
                        onClick={toggleAhkaMode}
                        aria-pressed={ahkaMode}
                        title="aHKA (H) - hip-knee-ankle (3 points)"
                        className={`${chipBase} ${
                          ahkaMode
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : chipInactive
                        } w-full`}
                      >
                        aHKA
                      </button>
                    </div>

                    <label className={`${labelClass} mt-3`}>General</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={onToggleDrawMode}
                        aria-pressed={drawMode}
                        className={`${chipBase} ${
                          drawMode
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : chipInactive
                        } col-span-2`}
                      >
                        Draw Line
                      </button>
                    </div>
                    <div className={mutedText}>
                      Knee tools (valgus cut / tibial slope / tibial cut) ada di
                      panel Measurements (ikon list).
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Overlays</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onAddShapeOverlay("circle")}
                        className={`${chipBase} ${chipInactive} w-full`}
                      >
                        Circle
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddShapeOverlay("square")}
                        className={`${chipBase} ${chipInactive} w-full`}
                      >
                        Square
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddShapeOverlay("triangle")}
                        className={`${chipBase} ${chipInactive} w-full`}
                      >
                        Triangle
                      </button>
                    </div>
                    <div className="mt-2">
                      <label className={labelClass}>Image Overlay</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onAddImageOverlay(file);
                          e.currentTarget.value = "";
                        }}
                        className={`${inputFull} file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-gray-600 dark:file:bg-neutral-800 dark:file:text-gray-300`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={groupClass} data-tour="calibration">
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("calibration")}
              aria-expanded={openSections.calibration}
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Calibration
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.calibration ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.calibration && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass}>
                    <label className={labelClass}>Marker Length (mm)</label>
                    <input
                      type="number"
                      value={realMm}
                      onChange={(e) => setRealMm(Number(e.target.value))}
                      className={inputFull}
                    />
                    <button
                      onClick={applyCalibration}
                      className={secondaryButton}
                    >
                      Apply Calibration
                    </button>
                    <button
                      type="button"
                      onClick={syncScaleMode ? stopSyncScale : startSyncScale}
                      className={`${
                        syncScaleMode ? toggleOn : toggleOff
                      } w-full`}
                    >
                      {syncScaleMode ? "Sync Scale: ON" : "Sync X-ray Scale"}
                    </button>
                    <div className={mutedText}>
                      Click 2 points on {realMm} mm scale bar.
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Calibration Presets</label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name"
                      className={inputFull}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onSavePreset}
                        className={secondaryButton}
                      >
                        Save Preset
                      </button>
                      <button
                        type="button"
                        onClick={onLoadPresets}
                        className={miniButton}
                      >
                        Load
                      </button>
                    </div>
                    <div className="mt-2 space-y-1 max-h-[96px] overflow-y-auto pr-1">
                      {calibrationPresets.length ? (
                        calibrationPresets.map((preset) => (
                          <div
                            key={preset.id}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <button
                              type="button"
                              onClick={() => onApplyPreset(preset)}
                              className="flex-1 truncate text-left text-gray-700 hover:text-emerald-600"
                              title={preset.name}
                            >
                              {preset.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemovePreset(preset.id)}
                              className="text-gray-400 hover:text-red-500"
                              aria-label="Remove preset"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className={mutedText}>No presets yet.</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={groupClass} data-tour="annotations">
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("overview")}
              aria-expanded={openSections.overview}
            >
              <span className="inline-flex items-center gap-2">
                <List className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Overview & Notes
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.overview ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.overview && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass}>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={toggleAnnotationMode}
                        aria-pressed={annotationMode}
                        className={`${
                          annotationMode ? toggleOn : toggleOff
                        } flex-1`}
                        title="Annotate (N) - click to add note"
                      >
                        {annotationMode ? "Annotate: ON" : "Annotate: OFF"}
                      </button>
                      <button
                        onClick={clearAnnotations}
                        disabled={!annotations.length}
                        className={miniButton}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {annotations.map((annotation, index) => (
                          <motion.div
                            key={annotation.id}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <button
                              onClick={() => editAnnotation(annotation)}
                              className="flex-1 truncate text-left text-gray-700 hover:text-emerald-600"
                              title={annotation.text}
                            >
                              {index + 1}. {annotation.text}
                            </button>
                            <button
                              onClick={() => removeAnnotation(annotation.id)}
                              className="text-gray-400 hover:text-red-500"
                              aria-label="Remove annotation"
                            >
                              ✕
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Export Report</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onExportReport("png")}
                        className={secondaryButton}
                      >
                        Export PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportReport("pdf")}
                        className={miniButton}
                      >
                        Export PDF
                      </button>
                    </div>
                    <div className={mutedText}>
                      PDF akan terbuka di tab baru (print to PDF).
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MeasurementValuePanelLegacy({
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
  measurementRows,
  measurementTotalLabel,
  removeMeasurement,
  toggleMeasurementLock,
  clearMeasurements,
  lldRows,
  removeLldMeasurement,
  toggleLldLock,
  clearLldMeasurements,
  offsetRows,
  removeOffsetMeasurement,
  toggleOffsetLock,
  clearOffsetMeasurements,
  angleRows,
  removeAngleMeasurement,
  toggleAngleLock,
  clearAngles,
  ahkaRows,
  removeAhkaMeasurement,
  toggleAhkaLock,
  clearAhka,
  drawLinesRows,
  drawLinesTotalLabel,
  removeDrawLine,
  toggleDrawLineLock,
  clearDrawLines,
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
}: {
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
  measurementRows: MeasurementRow[];
  measurementTotalLabel: string | null;
  removeMeasurement: (id: string) => void;
  toggleMeasurementLock: (id: string) => void;
  clearMeasurements: () => void;
  lldRows: MeasurementRow[];
  removeLldMeasurement: (id: string) => void;
  toggleLldLock: (id: string) => void;
  clearLldMeasurements: () => void;
  offsetRows: MeasurementRow[];
  removeOffsetMeasurement: (id: string) => void;
  toggleOffsetLock: (id: string) => void;
  clearOffsetMeasurements: () => void;
  angleRows: MeasurementRow[];
  removeAngleMeasurement: (id: string) => void;
  toggleAngleLock: (id: string) => void;
  clearAngles: () => void;
  ahkaRows: MeasurementRow[];
  removeAhkaMeasurement: (id: string) => void;
  toggleAhkaLock: (id: string) => void;
  clearAhka: () => void;
  drawLinesRows: MeasurementRow[];
  drawLinesTotalLabel: string | null;
  removeDrawLine: (id: string) => void;
  toggleDrawLineLock: (id: string) => void;
  clearDrawLines: () => void;
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
}) {
  const shellClass =
    `bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/70 dark:border-neutral-700/70 w-[228px] max-w-[72vw] md:w-[280px] md:max-w-[82vw] ${
      minimized ? "max-md:w-[210px]" : ""
    }`;
  const headerClass =
    "cursor-move max-md:cursor-default px-3 py-2 border-b border-gray-200/70 dark:border-neutral-700/70 text-[10px] md:text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200 flex items-center justify-between";
  const labelClass =
    "text-[10px] md:text-[11px] font-semibold text-gray-700 dark:text-gray-200";
  const sectionClass =
    "rounded-xl border border-gray-200/60 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-800/40 p-1.5 md:p-2 space-y-2";
  const miniButton =
    "rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const mutedText = "text-[9px] md:text-[10px] text-gray-400";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2 py-1 text-[10px] md:text-[11px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const toggleOn =
    "rounded-lg px-2 py-1 text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition";
  const toggleOff =
    "rounded-lg px-2 py-1 text-[10px] font-medium bg-gray-200/80 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300/80 dark:hover:bg-neutral-700 transition";
  const pill =
    "inline-flex items-center justify-between gap-2 rounded-lg border border-gray-200/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/70 px-2 py-1 text-[10px] text-gray-700 dark:text-gray-200";
  const chipBase =
    "rounded-lg px-2 py-1 text-[10px] font-medium border border-gray-200/70 dark:border-neutral-700/70 transition";
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
              <Grab />
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
              {!hasRows && <div className={mutedText}>No measurements yet.</div>}
              {blocks.map((block) =>
                block.rows.length ? (
                  <div key={block.key} className={sectionClass}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                    <span className={block.valueClass}>{block.label}</span>
                    <span className="text-[10px] text-gray-400">
                      {block.rows.length}
                    </span>
                    {block.totalLabel ? (
                      <span className={`text-[10px] ${block.valueClass}`}>
                        {block.totalLabel}
                      </span>
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
                        className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/70 px-2 py-1 text-[10px] md:text-[11px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                      >
                        <span className="w-10 text-[10px] text-gray-400">
                          {row.label}
                        </span>
                        <span className={`flex-1 ${block.valueClass}`}>
                          {row.value}
                        </span>
                        {typeof row.locked === "boolean" ? (
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
                        ) : null}
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
                    aria-label={showAhkaLabels ? "Hide aHKA label" : "Show aHKA label"}
                    title={showAhkaLabels ? "Hide aHKA label" : "Show aHKA label"}
                  >
                    {showAhkaLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAhkaEditLocked((prev) => !prev)}
                    className={ahkaEditLocked ? toggleOn : toggleOff}
                    aria-label={ahkaEditLocked ? "Unlock aHKA points" : "Lock aHKA points"}
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
                  {showTibialSlopeLabels ? <EyeOff size={16} /> : <Eye size={16} />}
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
	            <label className={labelClass}>Endpoint Dots</label>
	            <div className="space-y-2">
	              <div>
	                <div className="flex items-center justify-between">
	                  <span className={mutedText}>Size</span>
	                  <input
	                    type="number"
	                    min={0.5}
	                    max={10}
	                    step={0.5}
	                    value={pointRadius}
	                    onChange={(e) => {
	                      const raw = Number(e.target.value);
	                      if (Number.isNaN(raw)) return;
	                      setPointRadius(Math.min(10, Math.max(0.5, raw)));
	                    }}
	                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
	                  />
	                </div>
	                <input
	                  type="range"
	                  min={0.5}
	                  max={10}
	                  step={0.5}
	                  value={pointRadius}
	                  onChange={(e) => setPointRadius(Number(e.target.value))}
	                  className="w-full accent-emerald-500"
	                />
	              </div>
	              <div>
	                <div className={mutedText}>Fill</div>
	                <div className="mt-1 grid grid-cols-5 gap-2">
	                  {(
	                    [
	                      { key: "dark", label: "Dark" },
	                      { key: "light", label: "Light" },
	                      { key: "matchLine", label: "Line" },
	                      { key: "transparent", label: "None" },
	                      { key: "custom", label: "Custom" },
	                    ] as const
	                  ).map((opt) => (
	                    <button
	                      key={opt.key}
	                      type="button"
	                      onClick={() => setPointFillMode(opt.key)}
	                      className={`${chipBase} ${
	                        pointFillMode === opt.key
	                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
	                          : chipInactive
	                      }`}
	                    >
	                      {opt.label}
	                    </button>
	                  ))}
	                </div>
	                {pointFillMode === "custom" && (
	                  <div className="mt-2 flex items-center justify-between gap-2">
	                    <input
	                      type="color"
	                      value={pointFillColor}
	                      onChange={(e) => setPointFillColor(e.target.value)}
	                      className="h-9 w-14 rounded-lg border border-gray-200/70 bg-white/90 p-1 dark:border-neutral-700/70 dark:bg-neutral-900/70"
	                      aria-label="Point fill color"
	                    />
	                    <input
	                      type="text"
	                      value={pointFillColor}
	                      onChange={(e) => setPointFillColor(e.target.value)}
	                      className={inputFull}
	                    />
	                  </div>
	                )}
	              </div>
	            </div>
	          </div>

	          <div className={sectionClass}>
	            <label className={labelClass}>Thickness</label>
	            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-gray-200/70 bg-white/70 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Ruler</span>
                  <input
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.5}
                    value={rulerStrokeWidth}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      setRulerStrokeWidth(Math.min(6, Math.max(0.5, raw)));
                    }}
                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6}
                  step={0.5}
                  value={rulerStrokeWidth}
                  onChange={(e) => setRulerStrokeWidth(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="rounded-lg border border-gray-200/70 bg-white/70 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className={mutedText}>LLD</span>
                  <input
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.5}
                    value={lldStrokeWidth}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      setLldStrokeWidth(Math.min(6, Math.max(0.5, raw)));
                    }}
                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6}
                  step={0.5}
                  value={lldStrokeWidth}
                  onChange={(e) => setLldStrokeWidth(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="rounded-lg border border-gray-200/70 bg-white/70 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Offset</span>
                  <input
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.5}
                    value={offsetStrokeWidth}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      setOffsetStrokeWidth(Math.min(6, Math.max(0.5, raw)));
                    }}
                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6}
                  step={0.5}
                  value={offsetStrokeWidth}
                  onChange={(e) => setOffsetStrokeWidth(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="rounded-lg border border-gray-200/70 bg-white/70 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Angle</span>
                  <input
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.5}
                    value={angleStrokeWidth}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      setAngleStrokeWidth(Math.min(6, Math.max(0.5, raw)));
                    }}
                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6}
                  step={0.5}
                  value={angleStrokeWidth}
                  onChange={(e) => setAngleStrokeWidth(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="rounded-lg border border-gray-200/70 bg-white/70 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className={mutedText}>aHKA</span>
                  <input
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.5}
                    value={ahkaStrokeWidth}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      setAhkaStrokeWidth(Math.min(6, Math.max(0.5, raw)));
                    }}
                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6}
                  step={0.5}
                  value={ahkaStrokeWidth}
                  onChange={(e) => setAhkaStrokeWidth(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="rounded-lg border border-gray-200/70 bg-white/70 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Draw Line</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    step={0.5}
                    value={drawLineStrokeWidth}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isNaN(raw)) return;
                      setDrawLineStrokeWidth(Math.min(6, Math.max(1, raw)));
                    }}
                    className="w-20 rounded-lg border border-gray-200/80 bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-gray-100"
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={0.5}
                  value={drawLineStrokeWidth}
                  onChange={(e) =>
                    setDrawLineStrokeWidth(Number(e.target.value))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

            </>
          )}

          {tab === "knee" && (
            <div className={sectionClass}>
              <label className={labelClass}>Knee Planning Tools</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={onToggleValgusCutMode}
                  aria-pressed={valgusCutMode}
                  className={`${chipBase} ${
                    valgusCutMode
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : chipInactive
                  }`}
                >
                  Koreksi Valgus
                </button>
                <button
                  type="button"
                  onClick={onToggleTibialSlopeMode}
                  aria-pressed={tibialSlopeMode}
                  className={`${chipBase} ${
                    tibialSlopeMode
                      ? "bg-cyan-500 text-white hover:bg-cyan-600"
                      : chipInactive
                  }`}
                >
                  Slope Tibia
                </button>
                <button
                  type="button"
                  onClick={onToggleTibialCutMode}
                  aria-pressed={tibialCutMode}
                  className={`${chipBase} ${
                    tibialCutMode
                      ? "bg-teal-500 text-white hover:bg-teal-600"
                      : chipInactive
                  }`}
                >
                  Tibial Cut
                </button>
              </div>

              {(valgusCutMode || valgusCutLines.length || valgusCutAnchor) && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Valgus (°)</div>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={valgusCutAngleDeg}
                        onChange={(e) =>
                          setValgusCutAngleDeg(Number(e.target.value))
                        }
                        className={inputFull}
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Side</div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
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
                        aria-label={
                          valgusCutAdvanced ? "Hide advanced" : "Show advanced"
                        }
                        title={valgusCutAdvanced ? "Hide advanced" : "Show advanced"}
                      >
                        {valgusCutAdvanced ? "Less" : "More"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200/60 bg-white/60 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                        <span className="text-orange-500">Koreksi Valgus</span>
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
              )}

              {(tibialSlopeMode || tibialSlopeLines.length || tibialSlopeAnchor) && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className={mutedText}>Slope (°)</div>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        step={0.5}
                        value={tibialSlopeDeg}
                        onChange={(e) => setTibialSlopeDeg(Number(e.target.value))}
                        className={inputFull}
                      />
                    </div>
                    <div>
                      <div className={mutedText}>Posterior</div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
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
                  <div className="rounded-xl border border-gray-200/60 bg-white/60 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/50">
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
                            className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/70 px-2 py-1 text-[10px] md:text-[11px] text-gray-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-gray-300"
                          >
                            <span className="w-10 text-[10px] text-gray-400">
                              TS{index + 1}
                            </span>
                            <span className="flex-1 text-cyan-500">
                              {line.posteriorSide} {line.slopeDeg}°
                            </span>
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
                              <X className="h-3 w-3" />
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
              )}

              {(tibialCutMode || tibialCutLines.length || tibialCutAnchor) && (
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className={mutedText}>Angle (°)</div>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={tibialCutAngleDeg}
                      onChange={(e) =>
                        setTibialCutAngleDeg(Number(e.target.value))
                      }
                      className={inputFull}
                    />
                  </div>
                  <div>
                    <div className={mutedText}>Direction</div>
                    <div className="mt-1 grid grid-cols-2 gap-2">
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
                <div className="rounded-xl border border-gray-200/60 bg-white/60 p-2 dark:border-neutral-700/70 dark:bg-neutral-900/50">
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
            )}
          </div>
          )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ToolbarDesktopLegacy({
  active,
  toolbarRef,
  toolbarPos,
  onToolbarPointerMove,
  onToolbarPointerUp,
  onToolbarPointerDown,
  moveStep,
  setMoveStep,
  scaleStep,
  rotateStep,
  moveActive,
  scaleActive,
  rotateActive,
  flipActiveX,
  flipActiveY,
  deleteActive,
  updateActiveScale,
  updateActiveRotation,
  updateActiveOpacity,
  toggleActiveLock,
  toggleActiveScaleLock,
  startScaleScrub,
  endScaleScrub,
  bringActiveToFront,
  sendActiveToBack,
  mmPerPixel,
  scaleImplantByMm,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  active: TemplatingCanvasObject;
  toolbarRef: React.RefObject<HTMLDivElement>;
  toolbarPos: { x: number; y: number };
  onToolbarPointerMove: (e: React.PointerEvent) => void;
  onToolbarPointerUp: (e: React.PointerEvent) => void;
  onToolbarPointerDown: (e: React.PointerEvent) => void;
  moveStep: number;
  setMoveStep: React.Dispatch<React.SetStateAction<number>>;
  scaleStep: number;
  rotateStep: number;
  moveActive: (dx: number, dy: number) => void;
  scaleActive: (delta: number) => void;
  rotateActive: (delta: number) => void;
  flipActiveX: () => void;
  flipActiveY: () => void;
  deleteActive: () => void;
  updateActiveScale: (value: number) => void;
  updateActiveRotation: (value: number) => void;
  updateActiveOpacity: (value: number) => void;
  toggleActiveLock: () => void;
  toggleActiveScaleLock: () => void;
  startScaleScrub: () => void;
  endScaleScrub: () => void;
  bringActiveToFront: () => void;
  sendActiveToBack: () => void;
  mmPerPixel: number | null;
  scaleImplantByMm: (targetMm: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  const shellClass =
    "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/70 dark:border-neutral-700/70 w-36";
  const headerClass =
    "cursor-move px-3 py-2 border-b border-gray-200/70 dark:border-neutral-700/70 text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200 flex items-center justify-between";
  const contentClass = "p-3 space-y-3 text-xs";
  const sectionClass =
    "rounded-xl border border-gray-200/60 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-800/40 p-1 space-y-1.2";
  const labelClass =
    "text-[11px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const rangeClass = "w-full accent-emerald-500";
  const helperText = "text-[10px] text-gray-500";
  const iconButton =
    "inline-flex h-5 w-5 items-center justify-center rounded-md border border-gray-200/70 bg-white/80 text-gray-600 hover:bg-gray-100 dark:border-neutral-700/70 dark:bg-neutral-900/70 dark:text-gray-200";
  const scaleDisabled = active.scaleLocked;
  const safeScaleStep = Math.abs(scaleStep) || 0.01;
  const safeRotateStep = Math.abs(rotateStep) || 1;
  const flipDirection = (active.flipX ?? 1) * (active.flipY ?? 1);
  const uiRotation = flipDirection < 0 ? -active.rotation : active.rotation;
  return (
    <motion.div
      ref={toolbarRef}
      className="hidden md:block fixed z-40 select-none touch-none"
      data-tour="toolbar-desktop"
      style={{ left: toolbarPos.x, top: toolbarPos.y }}
      onPointerMove={onToolbarPointerMove}
      onPointerUp={onToolbarPointerUp}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={shellClass}>
        {/* HEADER (DRAG HANDLE) */}
        <div className={headerClass} onPointerDown={onToolbarPointerDown}>
          <span>Implant Tool</span>
          <span className="text-gray-400">
            <Grab />
          </span>
        </div>

        {/* CONTENT */}
        <div className={contentClass}>
          {/* ================= HISTORY ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>History</label>
            <div className="flex gap-1 mt-1">
              <TB onClick={undo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4 "/>
              </TB>
              <TB onClick={redo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4 "/>
              </TB>
            </div>
          </div>

          {/* ================= MOVE ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Move (px)</label>
            <input
              type="number"
              value={moveStep}
              onChange={(e) => setMoveStep(Number(e.target.value))}
              className={inputFull}
            />

            <div className="grid grid-cols-3 gap-0 place-items-center">
              <div />
              <TB onClick={() => moveActive(0, -moveStep)}>↑</TB>
              <div />

              <TB onClick={() => moveActive(-moveStep, 0)}>←</TB>
              <div className="w-6 h-6 rounded-lg bg-gray-100/80 dark:bg-neutral-800/70 text-[9px] text-gray-400 dark:text-gray-500 flex items-center justify-center">
                MOVE
              </div>
              <TB onClick={() => moveActive(moveStep, 0)}>→</TB>

              <div />
              <TB onClick={() => moveActive(0, moveStep)}>↓</TB>
              <div />
            </div>
          </div>

          {/* ================= SCALE (REAL) ================= */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <label className={labelClass}>Scale</label>
              <button
                type="button"
                onClick={toggleActiveScaleLock}
                className={iconButton}
                aria-label={scaleDisabled ? "Unlock scale" : "Lock scale"}
                title={scaleDisabled ? "Unlock scale" : "Lock scale"}
              >
                {scaleDisabled ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </button>
            </div>

            <input
              type="range"
              min={0.1}
              max={3}
              step={0.01}
              value={active.scaleX}
              onChange={(e) => updateActiveScale(Number(e.target.value))}
              onPointerDown={startScaleScrub}
              onPointerUp={endScaleScrub}
              onPointerCancel={endScaleScrub}
              disabled={scaleDisabled}
              className={`${rangeClass} ${scaleDisabled ? "opacity-60" : ""}`}
            />
            {mmPerPixel && active.type !== "shape" && (
              <div className="mt-2 space-y-1">
                <label className={labelClass}>Real Length (mm)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={active.realLengthMm ?? ""}
                  onChange={(e) => scaleImplantByMm(Number(e.target.value))}
                  disabled={scaleDisabled}
                  className={`${inputFull} ${
                    scaleDisabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                <div className={helperText}>
                  Calibrated ✓ ({mmPerPixel.toFixed(3)} mm/px)
                </div>
              </div>
            )}

            <input
              type="number"
              step={0.01}
              value={active.scaleX}
              onChange={(e) => updateActiveScale(Number(e.target.value))}
              disabled={scaleDisabled}
              className={`${inputFull} ${
                scaleDisabled ? "cursor-not-allowed opacity-60" : ""
              }`}
            />

            <div className="flex gap-1 mt-1">
              <TB
                onClick={() => scaleActive(safeScaleStep)}
                disabled={scaleDisabled}
              >
                ＋
              </TB>
              <TB
                onClick={() => scaleActive(-safeScaleStep)}
                disabled={scaleDisabled}
              >
                －
              </TB>
            </div>
          </div>

          {/* ================= LAYER ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Layer</label>
            <div className="flex gap-1">
              <TB onClick={sendActiveToBack}>
                <ArrowDown className="h-4 w-4 " />
              </TB>
              <TB onClick={bringActiveToFront}>
                <ArrowUp className="h-3 w-3 " />
              </TB>
            </div>
            <label className={`${labelClass} mt-2`}>Opacity</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={active.opacity ?? 1}
              onChange={(e) => updateActiveOpacity(Number(e.target.value))}
              className={rangeClass}
            />
          </div>

          {/* ================= ROTATE (REAL) ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Rotate (°)</label>

            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={uiRotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className={rangeClass}
            />

            <input
              type="number"
              step={1}
              value={uiRotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className={inputFull}
            />

            <div className="flex gap-1 mt-1">
              <TB onClick={() => rotateActive(safeRotateStep)}>
                <RotateCw />
              </TB>
              <TB onClick={() => rotateActive(-safeRotateStep)}>
                <RotateCcwIcon />
              </TB>
            </div>
          </div>

          {/* ================= FLIP ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Flip</label>
            <div className="flex gap-1">
              <TB onClick={flipActiveX}>
                <FlipHorizontal />
              </TB>
              <TB onClick={flipActiveY}>
                <FlipVertical />
              </TB>
            </div>
          </div>

          {/* ================= LOCK + DELETE ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Lock & Delete</label>
            <div className="items-center flex justify-start gap-2">
              <TB onClick={toggleActiveLock}>
                {active.locked ? "🔒 Lock" : "🔓 Unlock"}
              </TB>

              <TB danger onClick={deleteActive}>
                <Trash />
              </TB>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolbarMobileLegacy({
  panelOpen,
  onTogglePanel,
}: {
  panelOpen: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onTogglePanel}
      className="md:hidden fixed right-3 top-[calc(env(safe-area-inset-top)+10px)] z-40 h-8 w-8 rounded-full bg-white/95 text-gray-700 shadow-lg ring-1 ring-gray-200/70 backdrop-blur transition hover:bg-white dark:bg-neutral-900/95 dark:text-gray-200 dark:ring-neutral-700/70"
      data-tour="toolbar-mobile"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {panelOpen ? (
        <X className="h-3.5 w-3.5" />
      ) : (
        <Settings2 className="h-3.5 w-3.5" />
      )}
    </motion.button>
  );
}

function ToolbarMobilePanelLegacy({
  open,
  onClose,
  active,
  moveStep,
  setMoveStep,
  scaleStep,
  rotateStep,
  moveActive,
  scaleActive,
  rotateActive,
  flipActiveX,
  flipActiveY,
  deleteActive,
  updateActiveScale,
  updateActiveRotation,
  updateActiveOpacity,
  toggleActiveLock,
  toggleActiveScaleLock,
  startScaleScrub,
  endScaleScrub,
  bringActiveToFront,
  sendActiveToBack,
  mmPerPixel,
  scaleImplantByMm,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  open: boolean;
  onClose: () => void;
  active: TemplatingCanvasObject;
  moveStep: number;
  setMoveStep: React.Dispatch<React.SetStateAction<number>>;
  scaleStep: number;
  rotateStep: number;
  moveActive: (dx: number, dy: number) => void;
  scaleActive: (delta: number) => void;
  rotateActive: (delta: number) => void;
  flipActiveX: () => void;
  flipActiveY: () => void;
  deleteActive: () => void;
  updateActiveScale: (value: number) => void;
  updateActiveRotation: (value: number) => void;
  updateActiveOpacity: (value: number) => void;
  toggleActiveLock: () => void;
  toggleActiveScaleLock: () => void;
  startScaleScrub: () => void;
  endScaleScrub: () => void;
  bringActiveToFront: () => void;
  sendActiveToBack: () => void;
  mmPerPixel: number | null;
  scaleImplantByMm: (targetMm: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  const safeScaleStep = Math.abs(scaleStep) || 0.01;
  const safeRotateStep = Math.abs(rotateStep) || 1;
  const sectionClass =
    "rounded-2xl border border-gray-200/70 dark:border-neutral-700/70 bg-white/90 dark:bg-neutral-900/80 p-2.5 space-y-2";
  const labelClass =
    "text-[10px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const rangeClass = "w-full accent-emerald-500";
  const helperText = "text-[9px] text-gray-500";
  const iconButton =
    "inline-flex h-5 w-5 items-center justify-center rounded-md border border-gray-200/80 bg-white/90 text-gray-600 hover:bg-gray-100 dark:border-neutral-700/70 dark:bg-neutral-900/70 dark:text-gray-200";
  const scaleDisabled = active.scaleLocked;
  const flipDirection = (active.flipX ?? 1) * (active.flipY ?? 1);
  const uiRotation = flipDirection < 0 ? -active.rotation : active.rotation;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="md:hidden fixed bottom-3 right-3 z-50 flex justify-end pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="pointer-events-auto w-[80vw] max-w-[260px] max-h-[65svh] overflow-y-auto overscroll-contain touch-pan-y rounded-3xl border border-gray-200/70 dark:border-neutral-700/70 bg-white/95 dark:bg-neutral-900/95 px-3 pb-3 pt-2 shadow-2xl"
            style={{ WebkitOverflowScrolling: "touch" }}
            initial={{ y: 12, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between pb-3">
              <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                Implant Tool
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={sectionClass}>
                <label className={labelClass}>History</label>
                <div className="flex gap-2">
                  <TB onClick={undo} disabled={!canUndo}>
                    <Undo2 />
                  </TB>
                  <TB onClick={redo} disabled={!canRedo}>
                    <Redo2 />
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Move (px)</label>
                <input
                  type="number"
                  value={moveStep}
                  onChange={(e) => setMoveStep(Number(e.target.value))}
                  className={inputFull}
                />
                <div className="grid grid-cols-3 gap-0 place-items-center">
                  <div />
                  <TB onClick={() => moveActive(0, -moveStep)}>↑</TB>
                  <div />
                  <TB onClick={() => moveActive(-moveStep, 0)}>←</TB>
                  <div className="w-5 h-5 rounded bg-gray-100/80 dark:bg-neutral-800/70 text-[8px] text-gray-400 dark:text-gray-500 flex items-center justify-center">
                    MOVE
                  </div>
                  <TB onClick={() => moveActive(moveStep, 0)}>→</TB>
                  <div />
                  <TB onClick={() => moveActive(0, moveStep)}>↓</TB>
                  <div />
                </div>
              </div>

              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Scale</label>
                  <button
                    type="button"
                    onClick={toggleActiveScaleLock}
                    className={iconButton}
                    aria-label={scaleDisabled ? "Unlock scale" : "Lock scale"}
                    title={scaleDisabled ? "Unlock scale" : "Lock scale"}
                  >
                    {scaleDisabled ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.01}
                  value={active.scaleX}
                  onChange={(e) => updateActiveScale(Number(e.target.value))}
                  onPointerDown={startScaleScrub}
                  onPointerUp={endScaleScrub}
                  onPointerCancel={endScaleScrub}
                  disabled={scaleDisabled}
                  className={`${rangeClass} ${
                    scaleDisabled ? "opacity-60" : ""
                  }`}
                />
                {mmPerPixel && active.type !== "shape" && (
                  <div className="mt-2 space-y-1">
                    <label className={labelClass}>Real Length (mm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={active.realLengthMm ?? ""}
                      onChange={(e) => scaleImplantByMm(Number(e.target.value))}
                      disabled={scaleDisabled}
                      className={`${inputFull} ${
                        scaleDisabled ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    />
                    <div className={helperText}>
                      Calibrated ✓ ({mmPerPixel.toFixed(3)} mm/px)
                    </div>
                  </div>
                )}
                <input
                  type="number"
                  step={0.01}
                  value={active.scaleX}
                  onChange={(e) => updateActiveScale(Number(e.target.value))}
                  disabled={scaleDisabled}
                  className={`${inputFull} ${
                    scaleDisabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                <div className="flex gap-2">
                  <TB
                    onClick={() => scaleActive(safeScaleStep)}
                    disabled={scaleDisabled}
                  >
                    ＋
                  </TB>
                  <TB
                    onClick={() => scaleActive(-safeScaleStep)}
                    disabled={scaleDisabled}
                  >
                    －
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Layer</label>
                <div className="flex gap-2">
                  <TB onClick={sendActiveToBack}>
                    <ArrowDown />
                  </TB>
                  <TB onClick={bringActiveToFront}>
                    <ArrowUp />
                  </TB>
                </div>
                <label className={`${labelClass} mt-2`}>Opacity</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={active.opacity ?? 1}
                  onChange={(e) => updateActiveOpacity(Number(e.target.value))}
                  className={rangeClass}
                />
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Rotate (°)</label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={uiRotation}
                  onChange={(e) => updateActiveRotation(Number(e.target.value))}
                  className={rangeClass}
                />
                <input
                  type="number"
                  step={1}
                  value={uiRotation}
                  onChange={(e) => updateActiveRotation(Number(e.target.value))}
                  className={inputFull}
                />
                <div className="flex gap-2">
                  <TB onClick={() => rotateActive(safeRotateStep)}>
                    <RotateCw />
                  </TB>
                  <TB onClick={() => rotateActive(-safeRotateStep)}>
                    <RotateCcwIcon />
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Flip</label>
                <div className="flex gap-2">
                  <TB onClick={flipActiveX}>
                    <FlipHorizontal />
                  </TB>
                  <TB onClick={flipActiveY}>
                    <FlipVertical />
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Lock & Delete</label>
                <div className="flex gap-2">
                  <TB onClick={toggleActiveLock}>
                    {active.locked ? "🔒 Lock" : "🔓 Unlock"}
                  </TB>
                  <TB danger onClick={deleteActive}>
                    <Trash />
                  </TB>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShortcutsOverlayLegacy({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const groups = [
    {
      title: "General",
      items: [
        { keys: "Shift+/", label: "Toggle shortcuts" },
        { keys: "Esc", label: "Cancel mode or deselect" },
        { keys: "Ctrl/Cmd+Z", label: "Undo" },
        { keys: "Ctrl/Cmd+Shift+Z", label: "Redo" },
        { keys: "Ctrl/Cmd+Y", label: "Redo" },
        { keys: "Del/Backspace", label: "Delete active implant" },
      ],
    },
    {
      title: "Measurements",
      items: [
        { keys: "R", label: "Ruler (click 2 points)" },
        { keys: "L", label: "LLD (vertical 2 points)" },
        { keys: "O", label: "Offset (horizontal 2 points)" },
        { keys: "A", label: "Angle (click 3 points)" },
        { keys: "H", label: "aHKA (hip-knee-ankle, click 3 points)" },
        { keys: "V", label: "Valgus cut (set hip+knee, drag points)" },
        { keys: "T", label: "Tibial slope (set prox+dist, drag points)" },
        { keys: "C", label: "Tibial cut (set prox+dist, drag points)" },
        { keys: "N", label: "Annotate (click to add note)" },
      ],
    },
    {
      title: "Transform",
      items: [
        { keys: "Arrows", label: "Move active implant" },
        { keys: "Shift+Arrows", label: "Scale active implant" },
        { keys: "Ctrl/Cmd+Arrows", label: "Rotate active implant" },
        { keys: "Drag", label: "Move implant" },
        { keys: "Pinch", label: "Scale or rotate (if scale lock off)" },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed right-4 top-4 z-50 w-[min(360px,92vw)]"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-2xl border border-gray-200/70 bg-white/95 shadow-2xl backdrop-blur dark:border-neutral-700/70 dark:bg-neutral-900/95">
            <div className="flex items-center justify-between border-b border-gray-200/70 px-3 py-2 text-[11px] font-semibold text-gray-800 dark:border-neutral-800/70 dark:text-gray-100">
              <span>Shortcuts & Tips</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                aria-label="Close shortcuts"
                title="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="max-h-[70svh] space-y-3 overflow-y-auto px-3 py-3 text-[10px] text-gray-600 dark:text-gray-300">
              {groups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <div
                        key={`${group.title}-${item.keys}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
                          {item.keys}
                        </span>
                        <span className="text-right">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TemplatingStageLegacy({
  stageRef,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onDownObject,
  onDeleteActive,
  onToggleScaleLock,
  background,
  xrayContrast,
  cameraMode,
  videoRef,
  objects,
  activeId,
  setActiveId,
  rulerMode,
  lldMode,
  offsetMode,
  angleMode,
  ahkaMode,
  zoom,
  canvasMode,
  rulerDisplayDivisor,
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
  drawLines,
  drawLineStrokeWidth,
  drawMode,
  drawAnchor,
  drawDraft,
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
}: {
  stageRef: React.RefObject<HTMLDivElement>;
  onStagePointerDown: (e: React.PointerEvent) => void;
  onStagePointerMove: (e: React.PointerEvent) => void;
  onStagePointerUp: (e: React.PointerEvent) => void;
  onDownObject: (e: React.PointerEvent, objectId?: string) => void;
  onDeleteActive: () => void;
  onToggleScaleLock: () => void;
  background: string | null;
  xrayContrast: number;
  cameraMode: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  objects: TemplatingCanvasObject[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  rulerMode: boolean;
  lldMode: boolean;
  offsetMode: boolean;
  angleMode: boolean;
  ahkaMode: boolean;
  zoom: number;
  canvasMode: CanvasMode;
  rulerDisplayDivisor: number;
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
  drawLines: DrawLine[];
  drawLineStrokeWidth: number;
  drawMode: boolean;
  drawAnchor: { x: number; y: number } | null;
  drawDraft: { x: number; y: number } | null;
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
}) {
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
  const toMm = (px: number) => {
    const mmScale = mmPerPixel ?? 1;
    const divisor = rulerDisplayDivisor || 1;
    return (px * mmScale) / divisor;
  };

  const formatDistancePx = (px: number) => `${toMm(px).toFixed(1)} mm`;
  const formatRulerDistancePx = (px: number) =>
    `${adjustRulerMm(toMm(px)).toFixed(1)} mm`;

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
    const baseline = { x: -axisUnit.y, y: axisUnit.x }; // perpendicular
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

  const totalDistancePx = measurements.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const currentLabel =
    draftStart && draftEnd ? formatDistance(draftStart, draftEnd) : null;
  const totalLabel = measurements.length
    ? formatRulerDistancePx(totalDistancePx)
    : null;
  const lastMeasurement = measurements[measurements.length - 1] ?? null;
  const lastLabel = lastMeasurement
    ? formatDistance(lastMeasurement.start, lastMeasurement.end)
    : null;
  const [xrayTransform, setXrayTransform] = useState<XrayTransform | null>(
    null
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const next = getXrayTransform(stageRef, zoom, canvasMode, cameraMode);
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
  }, [stageRef, zoom, canvasMode, cameraMode]);

  const xrayScale = xrayTransform?.scale ?? zoom;
  const xrayOffsetX = xrayTransform?.offsetX ?? 0;
  const xrayOffsetY = xrayTransform?.offsetY ?? 0;
  const xrayStyle = {
    width: XRAY_BASE_WIDTH,
    height: XRAY_BASE_HEIGHT,
    transform: `translate(${xrayOffsetX}px, ${xrayOffsetY}px) scale(${xrayScale})`,
    transformOrigin: "top left",
  };

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 isolate touch-none ${
        rulerMode ||
        angleMode ||
        ahkaMode ||
        valgusCutMode ||
        tibialSlopeMode ||
        tibialCutMode ||
        lldMode ||
        offsetMode ||
        annotationMode ||
        drawMode
          ? "cursor-crosshair"
          : ""
      }`}
      data-tour="stage"
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}
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
                  className="block h-full w-full object-cover"
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
                !rulerMode &&
                !angleMode &&
                !ahkaMode &&
                !valgusCutMode &&
                !tibialSlopeMode &&
                !tibialCutMode &&
                !lldMode &&
                !offsetMode &&
                !annotationMode &&
                !drawMode &&
                o.id === activeId
                  ? "ring-2 ring-blue-500"
                  : ""
              } ${
                !rulerMode &&
                !angleMode &&
                !ahkaMode &&
                !valgusCutMode &&
                !tibialSlopeMode &&
                !tibialCutMode &&
                !lldMode &&
                !offsetMode &&
                !annotationMode &&
                !drawMode
                  ? "cursor-grab active:cursor-grabbing touch-none"
                  : ""
              }`}
            >
              <div
                onPointerDown={(e) => {
                  if (e.shiftKey) return;
                  setActiveId(o.id);
                  e.stopPropagation();
                  onDownObject(e, o.id);
                }}
              >
                {activeId === o.id &&
                  !rulerMode &&
                  !angleMode &&
                  !ahkaMode &&
                  !valgusCutMode &&
                  !tibialSlopeMode &&
                  !tibialCutMode &&
                  !lldMode &&
                  !offsetMode &&
                  !annotationMode &&
                  !drawMode && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* ROTATE HANDLE */}
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

                      {/* SCALE LOCK HANDLE */}
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
${
  o.scaleLocked
    ? "bg-gray-900 text-white"
    : "bg-gray-500/80 text-white hover:bg-gray-600"
}
`}
                        aria-label={
                          o.scaleLocked ? "Unlock scale" : "Lock scale"
                        }
                        title={o.scaleLocked ? "Unlock scale" : "Lock scale"}
                      >
                        {o.scaleLocked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                      </button>

                      {/* CLOSE HANDLE */}
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

                      {/* SCALE HANDLES */}
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
                          title={
                            o.scaleLocked ? "Scale locked" : "Drag to scale"
                          }
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
                    width={300}
                    height={300}
                    unoptimized
                    className="pointer-events-none p-8"
                    style={{
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

        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute z-50"
            style={{ left: annotation.x, top: annotation.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2 -translate-x-1/2 -translate-y-full">
              <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shadow" />
              <button
                onClick={() => onEditAnnotation(annotation)}
                className="max-w-[180px] rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-900 shadow hover:bg-amber-100"
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
            {(valgusCutLines.length ||
              (valgusCutMode && valgusCutAnchor && valgusCutDraft)) && (
              <g>
                {valgusCutLines.map((line, index) => {
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

            {(tibialSlopeLines.length ||
              (tibialSlopeMode && tibialSlopeAnchor && tibialSlopeDraft)) && (
              <g>
                {tibialSlopeLines.map((line, index) => {
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

            {(tibialCutLines.length ||
              (tibialCutMode && tibialCutAnchor && tibialCutDraft)) && (
              <g>
                {tibialCutLines.map((line, index) => {
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

            {angleMeasurements.map((angle) => {
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
                        {formatAngle(
                          anglePoints[0],
                          anglePoints[1],
                          angleDraft
                        )}
                      </text>
                    )}
                  </g>
                );
              })()}

            {ahkaMeasurements.map((m) => {
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
            {measurements.map((m) => {
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
            {lldMeasurements.map((m) => {
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
            {offsetMeasurements.map((m) => {
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
            {drawLines.map((line) => (
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

function ImplantModalLegacy({
  open,
  setOpenImplantModal,
  search,
  setSearch,
  openType,
  setOpenType,
  openSystem,
  setOpenSystem,
  groupedLibrary,
  addImplant,
}: {
  open: boolean;
  setOpenImplantModal: React.Dispatch<React.SetStateAction<boolean>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  openType: Record<"stem" | "cup", boolean>;
  setOpenType: React.Dispatch<
    React.SetStateAction<Record<"stem" | "cup", boolean>>
  >;
  openSystem: Record<string, boolean>;
  setOpenSystem: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  groupedLibrary: GroupedLibrary;
  addImplant: (item: ImplantLibraryItem) => void;
}) {
  const stemCount = Object.values(groupedLibrary.stem).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const cupCount = Object.values(groupedLibrary.cup).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-gray-200/70 dark:border-neutral-700/70 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* HEADER */}
            <div className="px-4 py-3 border-b border-gray-200/70 dark:border-neutral-700/70 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Implant Library
                </div>
                <div className="text-[11px] text-gray-500">
                  {stemCount + cupCount} templates
                </div>
              </div>
              <button
                onClick={() => setOpenImplantModal(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                aria-label="Close implant library"
              >
                ✕
              </button>
            </div>

            {/* SEARCH */}
            <div className="p-3 border-b border-gray-200/70 dark:border-neutral-700/70 bg-gray-50/70 dark:bg-neutral-900/60">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search implant…"
                className="w-full rounded-lg px-3 py-2 text-xs border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="max-h-[65svh] overflow-y-auto">
              {/* ================= STEM ================= */}
              <button
                onClick={() => setOpenType((p) => ({ ...p, stem: !p.stem }))}
                className="w-full px-4 py-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
              >
                <span>🦴 Stem</span>
                <span className="text-[11px] text-gray-500">{stemCount}</span>
              </button>

              <AnimatePresence initial={false}>
                {openType.stem && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.stem).map(
                      ([system, items]) => {
                        const systemKey = `stem:${system}`;
                        const isOpen = Boolean(openSystem[systemKey]);
                        return (
                          <div key={system}>
                            {/* SYSTEM HEADER */}
                            <button
                              onClick={() =>
                                setOpenSystem((p) => ({
                                  ...p,
                                  [systemKey]: !p[systemKey],
                                }))
                              }
                              className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                            >
                              <span>
                                {isOpen ? "▾" : "▸"} {system}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {items.length}
                              </span>
                            </button>

                            {/* SYSTEM CONTENT */}
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  variants={collapseVariants}
                                  initial="collapsed"
                                  animate="open"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  {items.map((item) => (
                                    <button
                                      key={`${system}:${item.id}:${item.label}`}
                                      onClick={() => {
                                        addImplant(item);
                                        setOpenImplantModal(false);
                                      }}
                                      className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ================= CUP ================= */}
              <button
                onClick={() => setOpenType((p) => ({ ...p, cup: !p.cup }))}
                className="w-full px-4 py-2 mt-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
              >
                <span>Cup</span>
                <span className="text-[11px] text-gray-500">{cupCount}</span>
              </button>

              <AnimatePresence initial={false}>
                {openType.cup && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.cup).map(
                      ([system, items]) => {
                        const systemKey = `cup:${system}`;
                        const isOpen = Boolean(openSystem[systemKey]);
                        return (
                          <div key={system}>
                            <button
                              onClick={() =>
                                setOpenSystem((p) => ({
                                  ...p,
                                  [systemKey]: !p[systemKey],
                                }))
                              }
                              className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                            >
                              <span>
                                {isOpen ? "▾" : "▸"} {system}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {items.length}
                              </span>
                            </button>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  variants={collapseVariants}
                                  initial="collapsed"
                                  animate="open"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  {items.map((item) => (
                                    <button
                                      key={`${system}:${item.id}:${item.label}`}
                                      onClick={() => {
                                        addImplant(item);
                                        setOpenImplantModal(false);
                                      }}
                                      className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
