// file: app/templating/page.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Ruler, Undo, ZoomIn, ZoomOut, ImagePlus, FileText, Triangle } from "lucide-react";

export default function DigitalTemplatingPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [midPoint, setMidPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [unit, setUnit] = useState<'px' | 'mm' | 'cm'>('mm');
  const pixelsPerMm = 3.78;
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [templateImages, setTemplateImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setTemplateImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const convertLength = (px: number) => {
    switch (unit) {
      case 'mm': return `${(px / pixelsPerMm).toFixed(1)} mm`;
      case 'cm': return `${(px / (pixelsPerMm * 10)).toFixed(2)} cm`;
      default: return `${px.toFixed(1)} px`;
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offset.x, offset.y);

      templateImages.forEach((src, index) => {
        const template = new Image();
        template.src = src;
        template.onload = () => {
          ctx.drawImage(template, offset.x + 50 * (index + 1), offset.y + 50 * (index + 1), 100, 100);
        };
      });
    };
  }, [imageSrc, offset, templateImages]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - offset.x;
    const y = (e.clientY - rect.top) / zoom - offset.y;

    if (selectedTool === 'measure' || selectedTool === 'angle') {
      setIsDrawing(true);
      if (selectedTool === 'measure') setStartPoint({ x, y });
      if (selectedTool === 'angle' && !startPoint) setStartPoint({ x, y });
      else if (selectedTool === 'angle' && startPoint && !midPoint) setMidPoint({ x, y });
    } else if (selectedTool === 'annotate') {
      const text = prompt("Masukkan anotasi:");
      if (text) {
        const ctx = canvasRef.current!.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "green";
        ctx.font = "14px Arial";
        ctx.fillText(text, x, y);
      }
    } else {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && dragStart) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setDragging(false);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - offset.x;
    const y = (e.clientY - rect.top) / zoom - offset.y;

    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx) return;
    setHistory([...history, ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)]);

    if (selectedTool === 'measure' && startPoint) {
      setIsDrawing(false);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      const dx = x - startPoint.x;
      const dy = y - startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      ctx.fillStyle = "blue";
      ctx.font = "14px Arial";
      ctx.fillText(convertLength(length), (startPoint.x + x) / 2, (startPoint.y + y) / 2);
      setStartPoint(null);
    }

    if (selectedTool === 'angle' && startPoint && midPoint) {
      const endPoint = { x, y };
      const angle = calculateAngle(startPoint, midPoint, endPoint);

      ctx.strokeStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(midPoint.x, midPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();

      ctx.fillStyle = "purple";
      ctx.font = "14px Arial";
      const angleText = isNaN(angle) ? "Sudut tidak valid" : `${angle.toFixed(1)}°`;
      ctx.fillText(angleText, midPoint.x + 10, midPoint.y + 10);

      setStartPoint(null);
      setMidPoint(null);
    }
  };

  const calculateAngle = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
    const ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    const bc = Math.sqrt(Math.pow(c.x - b.x, 2) + Math.pow(c.y - b.y, 2));
    const ac = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));

    const denominator = 2 * ab * bc;
    if (denominator === 0) return NaN;

    const cosAngle = (ab * ab + bc * bc - ac * ac) / denominator;
    const clamped = Math.min(1, Math.max(-1, cosAngle));

    return Math.acos(clamped) * (180 / Math.PI);
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3);
    setZoom(newZoom);
    if (canvasRef.current) {
      canvasRef.current.style.transform = `scale(${newZoom})`;
    }
  };

  const handleUndo = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && history.length > 0) {
      const last = history[history.length - 1];
      ctx.putImageData(last, 0, 0);
      setHistory(history.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64 p-4 rounded shadow border bg-card">
          <h2 className="font-semibold text-lg mb-3">Tools</h2>
          <label className="block mb-2">
            <span className="text-sm font-medium flex items-center gap-1"><ImagePlus className="w-4 h-4" /> Upload X-ray</span>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <label className="block mb-2">
            <span className="text-sm font-medium flex items-center gap-1"><FileText className="w-4 h-4" /> Upload Template</span>
            <Input type="file" accept="image/*" multiple onChange={handleTemplateUpload} />
          </label>
          <Button size="sm" className="w-full mb-2" onClick={() => setSelectedTool("measure")}><Ruler className="w-4 h-4 mr-1" /> Ukur</Button>
          <Button size="sm" className="w-full mb-2" onClick={() => setSelectedTool("angle")}><Triangle className="w-4 h-4 mr-1" /> Sudut</Button>
          <Button size="sm" className="w-full mb-2" onClick={() => setSelectedTool("annotate")}><Pencil className="w-4 h-4 mr-1" /> Anotasi</Button>
          <Button size="sm" className="w-full mb-2" onClick={handleUndo}><Undo className="w-4 h-4 mr-1" /> Undo</Button>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'px' | 'mm' | 'cm')}
            className="w-full border rounded px-2 py-1 text-sm mb-2"
          >
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="px">px</option>
          </select>
        </div>

        <div className="relative flex-1 border rounded-lg overflow-hidden flex items-center justify-center">
          {imageSrc ? (
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border rounded cursor-crosshair w-full h-auto"
                style={{ transformOrigin: "top left", transform: `scale(${zoom})`, transition: "transform 0.3s ease" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                <Button size="sm" onClick={() => handleZoom(0.1)}><ZoomIn className="w-4 h-4" /></Button>
                <Button size="sm" onClick={() => handleZoom(-0.1)}><ZoomOut className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Belum ada gambar diunggah.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
