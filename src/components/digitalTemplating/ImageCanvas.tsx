// src/components/PACSViewer/ImageCanvas.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Toolbar from "@/components/digitalTemplating/Toolbar"; // Pastikan path ini benar jika struktur folder Anda berbeda
import Image from "next/image";

// --- Interfaces ---
export type ImageItem = {
  id: string;
  name: string;
  file: File;
  url: string;
};

interface Point {
  x: number;
  y: number;
}

interface LineMeasurement {
  id: string;
  type: "line";
  start: Point;
  end: Point;
  distance: number;
}

interface AngleMeasurement {
  id: string;
  type: "angle";
  p1: Point;
  p2: Point;
  p3: Point;
  angle: number;
}

interface AreaMeasurement {
  id: string;
  type: "area";
  points: Point[];
  area: number;
}

interface Annotation {
  id: string;
  type: "annotation";
  text: string;
  position: Point;
}

type CanvasObject =
  | LineMeasurement
  | AngleMeasurement
  | AreaMeasurement
  | Annotation;

// Define and export multiple calibration presets
// YOU NEED TO ADJUST THE 'widthPx' VALUES BASED ON PRECISE MEASUREMENTS FROM YOUR X-RAY IMAGES.
// The 'x' and 'y' coordinates are for visualization purposes only, showing where a *hypothetical* ruler would be.
export const ALL_CALIBRATION_PRESETS = {
  // Exported
  auto: { x: 960, y: 400, widthPx: 55, realWorldMm: 40 }, // Default, based on previous 4cm estimation
  "1cm_ruler": { x: 100, y: 100, widthPx: 14, realWorldMm: 10 }, // Estimated 1cm ruler (10mm)
  "2cm_ruler": { x: 100, y: 150, widthPx: 28, realWorldMm: 20 }, // Estimated 2cm ruler (20mm)
  "5cm_ruler": { x: 100, y: 200, widthPx: 70, realWorldMm: 50 }, // Estimated 5cm ruler (50mm)
  "10cm_ruler": { x: 100, y: 250, widthPx: 138, realWorldMm: 100 }, // Estimated 10cm ruler (100mm)
};

// Export a type for the keys of the calibration presets so Toolbar.tsx and PACSviewer.tsx can use it
export type CalibrationPresetKey = keyof typeof ALL_CALIBRATION_PRESETS; // Exported

interface ImageCanvasProps {
  image: ImageItem | undefined;
  onRemove: () => void;
  onFilesSelected: (files: FileList | null) => void;
  // New props for calibration passed from parent
  selectedCalibrationPreset: CalibrationPresetKey;
  onCalibrationSelect: (presetName: CalibrationPresetKey) => void;
  // PROPS BARU UNTUK PEMBESARAN - Pastikan ini DITAMBAHKAN DI SINI
  enlargementFactor: number;
  onEnlargementChange: (factor: number) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  image,
  onFilesSelected,
  onRemove,
  selectedCalibrationPreset,
  onCalibrationSelect,
  // KOREKSI PENTING: Pastikan properti ini ada di sini dalam destructuring
  enlargementFactor,
  onEnlargementChange,
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [windowLevel, setWindowLevel] = useState({ center: 128, width: 256 });
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Real-world scale (pixels per millimeter). This is now derived from the selectedCalibrationPreset prop.
  const [pixelsPerMm, setPixelsPerMm] = useState(1);

  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);

  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const [annotationPos, setAnnotationPos] = useState<Point | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const isPanning = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });
  const isWindowLeveling = useRef(false);
  const startWindowLevel = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);

  // Use the pre-defined ALL_CALIBRATION_PRESETS directly
  const calibrationPresets = useMemo(() => ALL_CALIBRATION_PRESETS, []);

  // Efek untuk mereset state saat gambar berubah dan menerapkan kalibrasi
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setWindowLevel({ center: 128, width: 256 });
    setActiveTool(null);
    setCanvasObjects([]);
    setDrawingPoints([]);
    setCurrentMousePos(null);
    setIsAnnotating(false);
    setAnnotationText("");
    setAnnotationPos(null);

    // Apply selected calibration preset passed as prop
    const preset = calibrationPresets[selectedCalibrationPreset];
    setPixelsPerMm(preset.widthPx / preset.realWorldMm);
  }, [image, selectedCalibrationPreset, calibrationPresets]); // Dependencies updated

  // Efek untuk menggambar objek di canvas overlay
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const container = imageContainerRef.current;

    if (!canvas || !ctx || !container) return;

    // Set canvas dimensions to match container (adjust for DPR)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(container.clientWidth * dpr));
    canvas.height = Math.max(1, Math.floor(container.clientHeight * dpr));
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Normalize to CSS pixels

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Menggambar objek yang sudah jadi (garis, sudut, area, anotasi)
    canvasObjects.forEach((obj) => {
      if (obj.type === "line") {
        ctx.strokeStyle = "#FFFF00"; // Kuning cerah
        ctx.lineWidth = 2 / zoom; // Skala lebar garis
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(obj.start.x, obj.start.y);
        ctx.lineTo(obj.end.x, obj.end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(obj.start.x, obj.start.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obj.end.x, obj.end.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = `${12 / zoom}px Arial`;
        const midX = (obj.start.x + obj.end.x) / 2;
        const midY = (obj.start.y + obj.end.y) / 2;
        ctx.fillText(
          `${obj.distance.toFixed(1)} mm`,
          midX + 5 / zoom,
          midY - 5 / zoom
        ); // Display in mm
      } else if (obj.type === "angle") {
        ctx.strokeStyle = "#00FFFF"; // Cyan
        ctx.lineWidth = 2 / zoom;
        ctx.fillStyle = "#FFFFFF";

        ctx.beginPath();
        ctx.moveTo(obj.p1.x, obj.p1.y);
        ctx.lineTo(obj.p2.x, obj.p2.y);
        ctx.lineTo(obj.p3.x, obj.p3.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(obj.p1.x, obj.p1.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obj.p2.x, obj.p2.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obj.p3.x, obj.p3.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = `${12 / zoom}px Arial`;
        ctx.fillText(
          `${obj.angle.toFixed(1)}°`,
          obj.p2.x + 10 / zoom,
          obj.p2.y - 10 / zoom
        );
      } else if (obj.type === "area") {
        ctx.strokeStyle = "#FF00FF"; // Magenta
        ctx.lineWidth = 2 / zoom;
        ctx.fillStyle = "rgba(255, 0, 255, 0.2)"; // Isi dengan transparansi

        if (obj.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length; i++) {
            ctx.lineTo(obj.points[i].x, obj.points[i].y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.fill();

          obj.points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 / zoom, 0, 2 * Math.PI);
            ctx.fill();
          });

          ctx.font = `${12 / zoom}px Arial`;
          const centroidX =
            obj.points.reduce((sum, p) => sum + p.x, 0) / obj.points.length;
          const centroidY =
            obj.points.reduce((sum, p) => sum + p.y, 0) / obj.points.length;
          ctx.fillText(`${obj.area.toFixed(1)} mm²`, centroidX, centroidY); // Display in mm²
        }
      } else if (obj.type === "annotation") {
        ctx.fillStyle = "#FFD700"; // Emas
        ctx.font = `${14 / zoom}px Arial`;
        ctx.fillText(obj.text, obj.position.x, obj.position.y);
      }
    });

    const currentPreset = calibrationPresets[selectedCalibrationPreset];
    if (
      image &&
      currentPreset &&
      currentPreset.widthPx > 0 &&
      selectedCalibrationPreset !== "auto"
    ) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(
        currentPreset.x,
        currentPreset.y,
        currentPreset.widthPx,
        currentPreset.widthPx
      );
      ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
      ctx.font = `${14 / zoom}px Arial`;
      ctx.fillText(
        `${currentPreset.realWorldMm / 10}cm`,
        currentPreset.x + 5 / zoom,
        currentPreset.y + 15 / zoom
      );
    }

    if (
      activeTool === "lineMeasurement" &&
      drawingPoints.length === 1 &&
      currentMousePos
    ) {
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      ctx.lineTo(currentMousePos.x, currentMousePos.y);
      ctx.stroke();
    } else if (
      activeTool === "angleMeasurement" &&
      drawingPoints.length > 0 &&
      currentMousePos
    ) {
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      ctx.lineTo(
        drawingPoints[1] ? drawingPoints[1].x : currentMousePos.x,
        drawingPoints[1] ? drawingPoints[1].y : currentMousePos.y
      );
      if (drawingPoints.length === 2) {
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
      }
      ctx.stroke();
    } else if (
      activeTool === "areaMeasurement" &&
      drawingPoints.length > 0 &&
      currentMousePos
    ) {
      ctx.strokeStyle = "#FF00FF";
      ctx.lineWidth = 2 / zoom;
      ctx.fillStyle = "rgba(255, 0, 255, 0.1)";
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      for (let i = 1; i < drawingPoints.length; i++) {
        ctx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
      }
      ctx.lineTo(currentMousePos.x, currentMousePos.y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }

    ctx.restore();
  }, [
    canvasObjects,
    drawingPoints,
    currentMousePos,
    pan,
    zoom,
    activeTool,
    pixelsPerMm,
    image,
    calibrationPresets,
    selectedCalibrationPreset,
  ]);

  const getRelativeMouseCoords = useCallback(
    (e: React.MouseEvent | MouseEvent): Point => {
      const container = imageContainerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;

      const effectiveX = (containerX - pan.x) / zoom;
      const effectiveY = (containerY - pan.y) / zoom;

      return { x: effectiveX, y: effectiveY };
    },
    [pan, zoom]
  );

  const calculateDistance = useCallback(
    (p1: Point, p2: Point): number => {
      const distancePx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      // Sekarang enlargementFactor datang dari props
      return distancePx / pixelsPerMm / enlargementFactor;
    },
    [pixelsPerMm, enlargementFactor]
  );

  const calculateAngle = useCallback(
    (p1: Point, p2: Point, p3: Point): number => {
      const v1x = p1.x - p2.x;
      const v1y = p1.y - p2.y;
      const v2x = p3.x - p2.x;
      const v2y = p3.y - p2.y;

      const dotProduct = v1x * v2x + v1y * v2y;
      const magnitude1 = Math.hypot(v1x, v1y);
      const magnitude2 = Math.hypot(v2x, v2y);

      if (magnitude1 === 0 || magnitude2 === 0) return 0;

      const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
      return angleRad * (180 / Math.PI);
    },
    []
  );

  const calculatePolygonArea = useCallback(
    (points: Point[]): number => {
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      // Sekarang enlargementFactor datang dari props
      return (
        Math.abs(area / 2) /
        (pixelsPerMm * pixelsPerMm) /
        (enlargementFactor * enlargementFactor)
      );
    },
    [pixelsPerMm, enlargementFactor]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!image) return;

      const coords = getRelativeMouseCoords(e);

      if (activeTool === "pan") {
        isPanning.current = true;
        startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        e.currentTarget.classList.add("cursor-grabbing");
      } else if (activeTool === "windowLevel") {
        isWindowLeveling.current = true;
        startWindowLevel.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.classList.add("cursor-ew-resize");
      } else if (activeTool === "lineMeasurement") {
        isDrawing.current = true;
        setDrawingPoints([coords]);
        setCurrentMousePos(coords);
      } else if (activeTool === "angleMeasurement") {
        isDrawing.current = true;
        if (drawingPoints.length < 3) {
          setDrawingPoints((prev) => [...prev, coords]);
          setCurrentMousePos(coords);
        }
      } else if (activeTool === "areaMeasurement") {
        isDrawing.current = true;
        setDrawingPoints((prev) => [...prev, coords]);
        setCurrentMousePos(coords);
      } else if (activeTool === "annotation") {
        setIsAnnotating(true);
        setAnnotationPos(coords);
      }
    },
    [image, pan, activeTool, drawingPoints, getRelativeMouseCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!image) return;

      const coords = getRelativeMouseCoords(e);
      setCurrentMousePos(coords);

      if (activeTool === "pan" && isPanning.current) {
        setPan(() => ({
          x: e.clientX - startPan.current.x,
          y: e.clientY - startPan.current.y,
        }));
      } else if (activeTool === "windowLevel" && isWindowLeveling.current) {
        const deltaX = e.clientX - startWindowLevel.current.x;
        const deltaY = e.clientY - startWindowLevel.current.y;

        setWindowLevel((prev) => {
          let newCenter = prev.center + deltaY * 0.5;
          let newWidth = prev.width + deltaX * 0.5;

          newCenter = Math.max(0, Math.min(255, newCenter));
          newWidth = Math.max(1, newWidth);

          return { center: newCenter, width: newWidth };
        });
        startWindowLevel.current = { x: e.clientX, y: e.clientY };
      }
    },
    [image, activeTool, getRelativeMouseCoords]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      isPanning.current = false;
      isWindowLeveling.current = false;
      e.currentTarget.classList.remove("cursor-grabbing", "cursor-ew-resize");

      const endCoords = getRelativeMouseCoords(e);

      if (
        activeTool === "lineMeasurement" &&
        isDrawing.current &&
        drawingPoints.length === 1
      ) {
        const startPoint = drawingPoints[0];
        const distance = calculateDistance(startPoint, endCoords);
        setCanvasObjects((prev) => [
          ...prev,
          {
            id: `line-${Date.now()}`,
            type: "line",
            start: startPoint,
            end: endCoords,
            distance: distance,
          },
        ]);
        setDrawingPoints([]);
        setCurrentMousePos(null);
        isDrawing.current = false;
      } else if (activeTool === "angleMeasurement" && isDrawing.current) {
        if (drawingPoints.length === 2) {
          const [p1, p2] = drawingPoints;
          const angle = calculateAngle(p1, p2, endCoords);
          setCanvasObjects((prev) => [
            ...prev,
            {
              id: `angle-${Date.now()}`,
              type: "angle",
              p1: p1,
              p2: p2,
              p3: endCoords,
              angle: angle,
            },
          ]);
          setDrawingPoints([]);
          setCurrentMousePos(null);
          isDrawing.current = false;
        }
      } else if (activeTool === "areaMeasurement" && isDrawing.current) {
        if (e.detail === 2) {
          // Double click to finalize polygon
          if (drawingPoints.length >= 3) {
            const area = calculatePolygonArea(drawingPoints);
            setCanvasObjects((prev) => [
              ...prev,
              {
                id: `area-${Date.now()}`,
                type: "area",
                points: drawingPoints,
                area: area,
              },
            ]);
          }
          setDrawingPoints([]);
          setCurrentMousePos(null);
          isDrawing.current = false;
        }
      }
    },
    [
      activeTool,
      drawingPoints,
      getRelativeMouseCoords,
      calculateDistance,
      calculateAngle,
      calculatePolygonArea,
    ]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current || isWindowLeveling.current) {
        handleMouseUp(e);
      }
      if (isDrawing.current) {
        setCurrentMousePos(null);
      }
    },
    [handleMouseUp, isDrawing]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!image) return;
      e.preventDefault();
      const scaleFactor = 1.1;
      setZoom((prev) =>
        e.deltaY < 0 ? prev * scaleFactor : prev / scaleFactor
      );
    },
    [image]
  );

  const handleZoomIn = () => setZoom((prev) => prev * 1.2);
  const handleZoomOut = () => setZoom((prev) => prev / 1.2);
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleFlipH = () => setFlipH((prev) => !prev);
  const handleFlipV = () => setFlipV((prev) => !prev);

  const handleClearMeasurements = () => {
    setCanvasObjects([]);
    setDrawingPoints([]);
    setCurrentMousePos(null);
  };

  const handleReset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setWindowLevel({ center: 128, width: 256 });
    setActiveTool(null);
    handleClearMeasurements();
    setIsAnnotating(false);
    setAnnotationText("");
    setAnnotationPos(null);
  };

  const handleAnnotationInputBlur = () => {
    if (annotationText.trim() !== "" && annotationPos) {
      setCanvasObjects((prev) => [
        ...prev,
        {
          id: `anno-${Date.now()}`,
          type: "annotation",
          text: annotationText,
          position: annotationPos,
        },
      ]);
    }
    setIsAnnotating(false);
    setAnnotationText("");
    setAnnotationPos(null);
  };

  const handleAnnotationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAnnotationText(e.target.value);
  };

  const handleAnnotationInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleAnnotationInputBlur();
    }
  };

  const brightness = (windowLevel.center / 255) * 2;
  const contrast = (windowLevel.width / 255) * 2;

  return (
    // Mengubah flexbox container utama: toolbar dan area gambar akan berdampingan
    <div className="relative w-full h-[960px] bg-gray-900 flex rounded-lg overflow-hidden">
      {/* Toolbar selalu di sini, mengambil lebar tetap (w-20) */}
      <Toolbar
        onFilesSelected={onFilesSelected}
        onReset={handleReset}
        onToolSelect={setActiveTool}
        activeTool={activeTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut} // <-- CORRECTED LINE
        onRotateCW={handleRotateCW}
        onFlipH={handleFlipH}
        onFlipV={handleFlipV}
        onClearMeasurements={handleClearMeasurements}
        // Meneruskan properti kalibrasi ke Toolbar
        calibrationPresets={ALL_CALIBRATION_PRESETS}
        selectedCalibrationPreset={selectedCalibrationPreset}
        onCalibrationSelect={onCalibrationSelect}
        enlargementFactor={enlargementFactor}
        onEnlargementChange={onEnlargementChange}
        className="z-50 flex-none w-20 p-2"
      />

      {/* Area utama untuk gambar dan overlay, mengambil sisa ruang yang tersedia */}
      <div className="relative flex-1 flex items-center justify-center">
        {!image && (
          <div className="text-gray-400">Unggah gambar untuk memulai</div>
        )}
        {image && (
          <div
            ref={imageContainerRef}
            className={`absolute inset-0 flex items-center justify-center 
              ${activeTool === "pan" ? "cursor-grab" : ""}
              ${activeTool === "windowLevel" ? "cursor-ew-resize" : ""}
              ${
                activeTool === "lineMeasurement" ||
                activeTool === "angleMeasurement" ||
                activeTool === "areaMeasurement"
                  ? "cursor-crosshair"
                  : ""
              }
              ${activeTool === "annotation" ? "cursor-text" : ""}
            `}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          >
            <Image
              src={image.url}
              alt={image.name}
              fill
              style={{
                objectFit: "contain",
                transform: `
                  translateX(${pan.x}px) 
                  translateY(${pan.y}px) 
                  scale(${zoom}) 
                  rotate(${rotation}deg)
                  scaleX(${flipH ? -1 : 1})
                  scaleY(${flipV ? -1 : 1})
                `,
                filter: `brightness(${brightness}) contrast(${contrast})`,
                transformOrigin: "center center",
                transition: "transform 0.1s ease-out, filter 0.1s ease-out",
                userSelect: "none",
                pointerEvents: "none",
              }}
              className="absolute"
            />
            <canvas ref={overlayCanvasRef} className="absolute inset-0 z-10" />

            {isAnnotating && annotationPos && (
              <input
                type="text"
                value={annotationText}
                onChange={handleAnnotationInputChange}
                onBlur={handleAnnotationInputBlur}
                onKeyDown={handleAnnotationInputKeyDown}
                autoFocus
                className="absolute bg-gray-700 text-white p-1 rounded text-sm z-20"
                style={{
                  left: annotationPos.x * zoom + pan.x,
                  top: annotationPos.y * zoom + pan.y,
                  transform: "translate(-50%, -100%)",
                  minWidth: "80px",
                }}
                placeholder="Ketik anotasi..."
              />
            )}
          </div>
        )}
        {image && (
          <div className="absolute bottom-4 left-4 p-2 bg-gray-800 bg-opacity-70 rounded text-xs text-white">
            <p>Zoom: {(zoom * 100).toFixed(0)}%</p>
            <p>
              Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})
            </p>
            <p>Rotasi: {rotation}°</p>
            <p>WL Center: {windowLevel.center.toFixed(0)}</p>
            <p>WL Width: {windowLevel.width.toFixed(0)}</p>
            <p>Alat Aktif: {activeTool || "None"}</p>
            <p>Objek Canvas: {canvasObjects.length}</p>
            <p>Px/mm: {pixelsPerMm.toFixed(3)}</p>
            {selectedCalibrationPreset !== "auto" && (
              <p className="text-blue-300">
                Skala:{" "}
                {selectedCalibrationPreset.replace("_ruler", "").toUpperCase()}{" "}
                Ruler
              </p>
            )}
          </div>
        )}
        {image && (
          <button
            onClick={onRemove}
            className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white rounded z-20"
            title="Remove image"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageCanvas;
