// src/components/PACSViewer/constants.ts

export const TOOLS = {
    PAN: "pan",
    ZOOM: "zoom",
    WINDOW_LEVEL: "windowLevel",
    LINE: "lineMeasurement",
    ANGLE: "angleMeasurement",
    AREA: "areaMeasurement",
    ANNOTATION: "annotation",
  } as const;
  
  export const ALL_CALIBRATION_PRESETS = {
    auto: { x: 960, y: 400, widthPx: 55, realWorldMm: 40 },
    "1cm_ruler": { x: 100, y: 100, widthPx: 14, realWorldMm: 10 },
    "2cm_ruler": { x: 100, y: 150, widthPx: 28, realWorldMm: 20 },
    "5cm_ruler": { x: 100, y: 200, widthPx: 70, realWorldMm: 50 },
    "10cm_ruler": { x: 100, y: 250, widthPx: 138, realWorldMm: 100 },
  };