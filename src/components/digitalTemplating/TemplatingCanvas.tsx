// file: src/components/digitalTemplating/TemplatingCanvas.tsx
"use client";
import React, {
  useRef,
  useState,
  useCallback,
  ChangeEvent,
} from "react";
import {
  useCanvasEvents,
  AnnotationEvent,
  Tool
} from "@/hooks/useCanvasEvents";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { Ruler, Triangle, Pencil } from "lucide-react";

interface Props {
  unit: "px" | "mm" | "cm";
  pixelsPerMm: number;
  templateImages?: string[];
}

/** Ukuran gambar (naturalWidth/Height) setelah upload */
interface ImageSize {
  width: number;
  height: number;
}

export interface Point {
    x: number;
    y: number;
  }
  

export default function TemplatingCanvas({
  unit,
  pixelsPerMm,
  templateImages = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [tool, setTool] = useState<Tool>(null);
  const { events, pushEvent, undo, redo, canUndo, canRedo } =
    useCanvasEvents();

  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number }[]>([]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageSrc(img.src);
      setTool(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      pushEvent({ kind: "measure", points: [] }); // opsional clear events
    };

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const convert = useCallback(
    (px: number) => {
      if (unit === "px") return `${px.toFixed(0)} px`;
      const mm = px / pixelsPerMm;
      return unit === "cm"
        ? `${(mm / 10).toFixed(2)} cm`
        : `${mm.toFixed(1)} mm`;
    },
    [unit, pixelsPerMm]
  );

  const calculateAngle = useCallback(
    (a: Point, b: Point, c: Point): number => {
      const ab = Math.hypot(b.x - a.x, b.y - a.y);
      const bc = Math.hypot(c.x - b.x, c.y - b.y);
      const ac = Math.hypot(c.x - a.x, c.y - a.y);
      if (ab === 0 || bc === 0) return NaN;
      const cosVal = (ab * ab + bc * bc - ac * ac) / (2 * ab * bc);
      const clamped = Math.max(-1, Math.min(1, cosVal));
      return Math.acos(clamped) * (180 / Math.PI);
    },
    []
  );

  
  
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: w, height: h } = imageSize ?? { width: 0, height: 0 };
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.style.width = w ? "100%" : "";
    canvas.style.height = h ? "auto" : "";
    canvas.width = Math.round(w * pixelRatio);
    canvas.height = Math.round(h * pixelRatio);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.resetTransform();

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    if (imageSrc && imageSize) {
      const img = new Image();
      img.src = imageSrc;
      if (!img.complete) return;
      ctx.drawImage(img, 0, 0);
    }

    templateImages.forEach((src, i) => {
      const tpl = new Image();
      tpl.src = src;
      if (tpl.complete) {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(tpl, 50 + i * 110, 50 + i * 110, 100, 100);
        ctx.globalAlpha = 1;
      }
    });

    events.forEach((ev: AnnotationEvent) => {
      if (!ev.points.length) return;
      const [p0, ...rest] = ev.points;
      ctx.strokeStyle = ev.kind === "measure" ? "red" : "orange";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      rest.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();

      if (ev.kind === "measure" && ev.points.length === 2) {
        const [a, b] = ev.points;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillStyle = "blue";
        ctx.font = "14px Arial";
        ctx.fillText(convert(Math.hypot(b.x - a.x, b.y - a.y)), mx + 5, my - 5);
      } else if (ev.kind === "angle" && ev.points.length === 3) {
        const ang = calculateAngle(ev.points[0], ev.points[1], ev.points[2]);
        const b = ev.points[1];
        ctx.fillStyle = "purple";
        ctx.font = "14px Arial";
        ctx.fillText(isNaN(ang) ? "N/A" : `${ang.toFixed(1)}°`, b.x + 5, b.y - 5);
      } else if (ev.kind === "annotate" && ev.text && ev.points.length === 1) {
        const { x, y } = ev.points[0];
        ctx.fillStyle = "green";
        ctx.font = "14px Arial";
        ctx.fillText(ev.text, x + 2, y + 2);
      }
    });

    if (tempPoints.length >= 1) {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = tool === "measure" ? "red" : "orange";
      ctx.beginPath();
      ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
      tempPoints.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    imageSrc,
    imageSize,
    templateImages,
    events,
    tempPoints,
    offset,
    zoom,
    tool,
    convert,
    calculateAngle,
  ]);

  useAnimationFrame(redraw, [
    imageSrc,
    imageSize,
    templateImages,
    events,
    tempPoints,
    offset,
    zoom,
    tool,
    convert,
    calculateAngle,
  ]);

  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - offset.x) / zoom,
        y: (clientY - rect.top - offset.y) / zoom,
      };
    },
    [offset, zoom]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const p = toLocal(e.clientX, e.clientY);
    if (tool === "measure" || tool === "annotate") {
      setTempPoints([p]);
    } else if (tool === "angle" && tempPoints.length < 2) {
      setTempPoints(prev => [...prev, p]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!tempPoints.length) return;
    const p = toLocal(e.clientX, e.clientY);
    setTempPoints(([first]) => [first, p]);
  };

  const handlePointerUp = () => {
    const len = tempPoints.length;
    if (tool === "measure" && len === 2) {
      pushEvent({ kind: "measure", points: tempPoints });
    } else if (tool === "angle" && len === 3) {
      pushEvent({ kind: "angle", points: tempPoints });
    } else if (tool === "annotate" && len === 1) {
      const txt = prompt("Tulis anotasi:") || "";
      pushEvent({ kind: "annotate", points: tempPoints, text: txt });
    }
    setTempPoints([]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const f = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(3, z * f)));
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-white/85 rounded p-3">
        <label className="cursor-pointer text-sm">
          Upload X-ray
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageUpload}
          />
        </label>
        <button
          className={tool === "measure" ? "bg-blue-600 text-white" : ""}
          onClick={() => setTool(t => (t === "measure" ? null : "measure"))}
        >
          <Ruler size={18} />
        </button>
        <button
          className={tool === "angle" ? "bg-blue-600 text-white" : ""}
          onClick={() => setTool(t => (t === "angle" ? null : "angle"))}
        >
          <Triangle size={18} />
        </button>
        <button
          className={tool === "annotate" ? "bg-blue-600 text-white" : ""}
          onClick={() => setTool(t => (t === "annotate" ? null : "annotate"))}
        >
          <Pencil size={18} />
        </button>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="bg-black max-w-full max-h-full block mx-auto"
        style={{ touchAction: "pan-x pan-y pinch-zoom", cursor: tool ? "crosshair" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
