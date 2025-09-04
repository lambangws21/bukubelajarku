// file: components/template/TemplatingTools.tsx
"use client";

import { useEffect, useRef } from "react";
import { fabric } from "fabric";

interface TemplatingToolsProps {
  imageUrl: string;
  enableZoom?: boolean;
  enableAnnotations?: boolean;
  enableRuler?: boolean;
  enableAngleMeasurement?: boolean;
}

export default function TemplatingTools({
  imageUrl,
  enableZoom = true,
  enableAnnotations = true,
  enableRuler = true,
  enableAngleMeasurement = true,
}: TemplatingToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !enableZoom) return;
  
    const canvasEl = canvas.getElement();
    if (!canvasEl) return;
  
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = canvas.getZoom();
      const delta = e.deltaY;
      const newZoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;
      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, newZoom);
    };
  
    canvasEl.addEventListener("wheel", handleWheel);
  
    return () => {
      canvasEl.removeEventListener("wheel", handleWheel);
    };
  }, [enableZoom]);
  
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.IEvent) => {
      const pointer = canvas.getPointer(opt.e);
      const startX = pointer.x;
      const startY = pointer.y;

      let line: fabric.Line | null = null;

      const mouseMove = (moveOpt: fabric.IEvent) => {
        const movePointer = canvas.getPointer(moveOpt.e);
        if (line) {
          line.set({ x2: movePointer.x, y2: movePointer.y });
          canvas.renderAll();
        }
      };

      const mouseUp = () => {
        canvas.off("mouse:move", mouseMove);
        canvas.off("mouse:up", mouseUp);
      };

      if (enableRuler || enableAngleMeasurement) {
        line = new fabric.Line([startX, startY, startX, startY], {
          stroke: "red",
          strokeWidth: 2,
          selectable: false,
        });
        canvas.add(line);

        canvas.on("mouse:move", mouseMove);
        canvas.on("mouse:up", mouseUp);
      }
    };

    if (enableRuler || enableAngleMeasurement) {
      canvas.on("mouse:down", handleMouseDown);
    }

    return () => {
      canvas.off("mouse:down", handleMouseDown);
    };
  }, [enableRuler, enableAngleMeasurement]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !enableZoom) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = canvas.getZoom();
      const delta = e.deltaY;
      const newZoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;
      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, newZoom);
    };

    canvas.getElement().addEventListener("wheel", handleWheel);

    return () => {
      canvas.getElement().removeEventListener("wheel", handleWheel);
    };
  }, [enableZoom]);

  return (
    <canvas ref={canvasRef} className="border w-full h-full" />
  );
}
