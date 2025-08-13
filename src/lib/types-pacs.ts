// src/types/types-pacs.ts

// --- Tipe Dasar ---
export interface Point {
  x: number;
  y: number;
}

export type ImageItem = {
  id: string;
  name: string;
  file: File;
  url: string;
};

// --- Tipe Objek Canvas ---
export interface LineMeasurement {
  id: string;
  type: "line";
  start: Point;
  end: Point;
  distance: number;
}

export interface AngleMeasurement {
  id: string;
  type: "angle";
  p1: Point;
  p2: Point;
  p3: Point;
  angle: number;
}

export interface AreaMeasurement {
  id: string;
  type: "area";
  points: Point[];
  area: number;
}

export interface Annotation {
  id:string;
  type: "annotation";
  text: string;
  position: Point;
}

export type CanvasObject =
  | LineMeasurement
  | AngleMeasurement
  | AreaMeasurement
  | Annotation;

// --- Tipe untuk State & Props ---
export type Tool =
  | "pan"
  | "windowLevel"
  | "lineMeasurement"
  | "angleMeasurement"
  | "areaMeasurement"
  | "annotation";

export interface WindowLevel {
  center: number;
  width: number;
}

// Pastikan path ke constants benar jika Anda memindahkannya
export type CalibrationPresetKey = keyof typeof import("./constants").ALL_CALIBRATION_PRESETS;

// --- Tipe untuk Reducer ---
export interface ViewerState {
  pan: Point;
  zoom: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  windowLevel: WindowLevel;
  activeTool: Tool | null;
  pixelsPerMm: number;
  canvasObjects: CanvasObject[];
  drawingPoints: Point[];
  currentMousePos: Point | null;
  isAnnotating: boolean;
  annotationPos: Point | null;
  isInteracting: boolean;
}

export type ViewerAction =
  | { type: "RESET_VIEW" }
  | { type: "SET_PAN"; payload: Point }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_ROTATION"; payload: number }
  | { type: "TOGGLE_FLIP_H" }
  | { type: "TOGGLE_FLIP_V" }
  | { type: "SET_WINDOW_LEVEL"; payload: WindowLevel }
  | { type: "SET_ACTIVE_TOOL"; payload: Tool | null }
  | { type: "SET_PIXELS_PER_MM"; payload: number }
  | { type: "ADD_CANVAS_OBJECT"; payload: CanvasObject }
  | { type: "CLEAR_MEASUREMENTS" }
  | { type: "SET_DRAWING_POINTS"; payload: Point[] }
  | { type: "ADD_DRAWING_POINT"; payload: Point }
  | { type: "SET_CURRENT_MOUSE_POS"; payload: Point | null }
  | { type: "START_ANNOTATING"; payload: Point }
  | { type: "STOP_ANNOTATING" }
  | { type: "START_INTERACTION" }
  | { type: "STOP_INTERACTION" };