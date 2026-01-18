export type Side = "Right" | "Left";

export type Point = { x: number; y: number };

export type ValgusCutLine = {
  id: string;
  hip: Point;
  knee: Point;
  side: Side;
  angleDeg: number;
  locked?: boolean;
};

export type TibialSlopeLine = {
  id: string;
  prox: Point;
  dist: Point;
  posteriorSide: Side;
  slopeDeg: number;
  locked?: boolean;
};

export type TibialCutLine = {
  id: string;
  prox: Point;
  dist: Point;
  direction: "Varus" | "Valgus";
  angleDeg: number;
  locked?: boolean;
};

export type RulerMeasurement = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
};

export type LldMeasurement = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
};

export type OffsetMeasurement = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
};

export type AngleMeasurement = {
  id: string;
  a: Point;
  b: Point;
  c: Point;
  locked?: boolean;
};

export type AhkaMeasurement = {
  id: string;
  hip: Point;
  knee: Point;
  ankle: Point;
  locked?: boolean;
};

export type DrawLine = {
  id: string;
  start: Point;
  end: Point;
  locked?: boolean;
};

export type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type MeasurementRow = {
  id: string;
  label: string;
  value: string;
  locked?: boolean;
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
    | "drawLine";
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
    | "dist";
};

export type CalibrationPreset = {
  id: string;
  name: string;
  realMm: number;
  mmPerPixel: number;
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
  annotations: Annotation[];
  valgusCutLines: ValgusCutLine[];
  tibialSlopeLines: TibialSlopeLine[];
  tibialCutLines: TibialCutLine[];
};
