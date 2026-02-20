export type Side = "Right" | "Left";

export type Point = { x: number; y: number };

export type ValgusCutLine = {
  id: string;
  hip: Point;
  knee: Point;
  side: Side;
  angleDeg: number;
  locked?: boolean;
  hidden?: boolean;
};

export type TibialSlopeLine = {
  id: string;
  prox: Point;
  dist: Point;
  posteriorSide: Side;
  slopeDeg: number;
  locked?: boolean;
  hidden?: boolean;
};

export type TibialCutLine = {
  id: string;
  prox: Point;
  dist: Point;
  direction: "Varus" | "Valgus";
  angleDeg: number;
  locked?: boolean;
  hidden?: boolean;
};

export type RulerMeasurement = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
  hidden?: boolean;
};

export type LldMeasurement = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
  hidden?: boolean;
};

export type OffsetMeasurement = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
  hidden?: boolean;
};

export type AngleMeasurement = {
  id: string;
  a: Point;
  b: Point;
  c: Point;
  locked?: boolean;
  hidden?: boolean;
};

export type AhkaMeasurement = {
  id: string;
  hip: Point;
  knee: Point;
  ankle: Point;
  /**
   * Used to map Varus/Valgus consistently for Right vs Left leg.
   * Older sessions may not have this field; infer from knee.x when missing.
   */
  side?: Side;
  locked?: boolean;
  hidden?: boolean;
};

export type DrawLine = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
  hidden?: boolean;
};

export type CutoutRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "rect" | "circle" | "polygon";
  /**
   * For polygon cutout, points are in stage (XRAY_BASE) coordinates.
   * x/y/width/height represent the bounding box of these points.
   */
  points?: Point[];
  locked?: boolean;
  opacity?: number; // 0..1 overlay alpha outside cutout
  hidden?: boolean;
};

export type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
  hidden?: boolean;
  locked?: boolean;
};

export type MeasurementRow = {
  id: string;
  label: string;
  value: string;
  locked?: boolean;
  hidden?: boolean;
};

export type FreehandStroke = {
  id: string;
  kind: "trace" | "pencil";
  points: Point[];
  strokeWidth: number;
  color?: string;
  locked?: boolean;
  hidden?: boolean;
};

export type CorMarker = {
  id: string;
  point: Point;
  label?: string;
  locked?: boolean;
  hidden?: boolean;
};

export type MeasurementHandle = {
  kind:
    | "ruler"
    | "lld"
    | "offset"
    | "angle"
    | "ahka"
    | "valgusCut"
    | "tibialSlope"
    | "tibialCut"
    | "drawLine"
    | "cor";
  id: string;
  point:
    | "start"
    | "end"
    | "a"
    | "b"
    | "c"
    | "hip"
    | "knee"
    | "ankle"
    | "prox"
    | "dist"
    | "point";
};

export type CalibrationPreset = {
  id: string;
  name: string;
  realMm: number;
  pixelsPerMm: number;
  useRealScale: boolean;
  createdAt: number;
};

export type PointFillMode =
  | "dark"
  | "light"
  | "matchLine"
  | "transparent"
  | "custom";

export type HistoryState = {
  objects: import("@/components/digitalTemplating/implantLibrary").TemplatingCanvasObject[];
  activeId: string | null;
  measurements: RulerMeasurement[];
  lldMeasurements: LldMeasurement[];
  offsetMeasurements: OffsetMeasurement[];
  angleMeasurements: AngleMeasurement[];
  ahkaMeasurements: AhkaMeasurement[];
  drawLines: DrawLine[];
  strokes: FreehandStroke[];
  corMarkers: CorMarker[];
  annotations: Annotation[];
  valgusCutLines: ValgusCutLine[];
  tibialSlopeLines: TibialSlopeLine[];
  tibialCutLines: TibialCutLine[];
};

export type PersistedTemplatingSession = {
  v: 1;
  savedAt: number;
  background: string | null;
  xraySourceScale?: number;
  xrayMagnificationFactor?: number;
  xrayContrast: number;
  zoom: number;
  canvasMode: import("./utils").CanvasMode;
  viewPan: { x: number; y: number };
  cutout: CutoutRect | null;
  realMm: number;
  pixelsPerMm: number | null;
  mmPerPixel?: number | null; // legacy (mm/px)
  useRealScale: boolean;
  objects: import("@/components/digitalTemplating/implantLibrary").TemplatingCanvasObject[];
  activeId: string | null;
  measurements: RulerMeasurement[];
  lldMeasurements: LldMeasurement[];
  offsetMeasurements: OffsetMeasurement[];
  angleMeasurements: AngleMeasurement[];
  ahkaMeasurements: AhkaMeasurement[];
  drawLines: DrawLine[];
  strokes: FreehandStroke[];
  corMarkers: CorMarker[];
  annotations: Annotation[];
  valgusCutLines: ValgusCutLine[];
  tibialSlopeLines: TibialSlopeLine[];
  tibialCutLines: TibialCutLine[];
  ui: {
    drawLineStrokeWidth: number;
    ahkaStrokeWidth: number;
    rulerStrokeWidth: number;
    lldStrokeWidth: number;
    offsetStrokeWidth: number;
    angleStrokeWidth: number;
    pointRadius: number;
    pointFillMode: PointFillMode;
    pointFillColor: string;
    traceFillColor?: string;
    traceFillOpacity?: number; // 0..1
    showRulerLabels: boolean;
    showLldLabels: boolean;
    showOffsetLabels: boolean;
    showAngleLabels: boolean;
    showAhkaLabels: boolean;
    ahkaEditLocked: boolean;
    showValgusCutLabels: boolean;
    showTibialSlopeLabels: boolean;
    showTibialCutLabels: boolean;
    measurementsPanelOpen: boolean;
  };
  knee: {
    valgusCutAngleDeg: number;
    valgusCutSide: Side;
    valgusCutOffsetPx: number;
    valgusCutStrokeWidth: number;
    valgusCutLineLengthPx: number;
    tibialSlopeDeg: number;
    tibialPosteriorSide: Side;
    tibialSlopeOffsetPx: number;
    tibialSlopeStrokeWidth: number;
    tibialSlopeLineLengthPx: number;
    tibialCutAngleDeg: number;
    tibialCutDirection: "Varus" | "Valgus";
    tibialCutOffsetPx: number;
    tibialCutStrokeWidth: number;
    tibialCutLineLengthPx: number;
  };
};
