"use client";

import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle } from "react-konva";

interface Annotation {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Measurement {
  id: string;
  points: { x: number; y: number }[];
}

export default function XrayViewer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<{ x: number; y: number }[]>([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mmPerPixel, setMmPerPixel] = useState<number | null>(null);
  const stageRef = useRef<any>(null);

  // Load uploaded image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Load image object
  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);
    };
  }, [imageSrc]);

  // Zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Pan
  const handleDragMove = (e: any) => {
    setPosition(e.target.position());
  };

  // Double click: add annotation
  const handleDblClick = (e: any) => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const annotation: Annotation = {
      id: crypto.randomUUID(),
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
      label: `Mark ${annotations.length + 1}`,
    };
    setAnnotations([...annotations, annotation]);
  };

  // Single click: start or end measurement
  const handleClick = (e: any) => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const point = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };

    if (currentMeasurement.length === 0) {
      setCurrentMeasurement([point]);
    } else {
      const newMeasurement: Measurement = {
        id: crypto.randomUUID(),
        points: [currentMeasurement[0], point],
      };
      setMeasurements([...measurements, newMeasurement]);
      setCurrentMeasurement([]);
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span>Resolution (mm/px)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.0001"
            placeholder="e.g. 0.143"
            value={mmPerPixel ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) {
                setMmPerPixel(null);
                return;
              }
              const next = Number(raw.trim().replace(",", "."));
              setMmPerPixel(Number.isFinite(next) && next > 0 ? next : null);
            }}
            className="w-32 rounded border px-2 py-1 text-sm"
          />
        </label>
        <button
          onClick={resetZoom}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Reset Zoom
        </button>
      </div>
      {imageObj && (
        <Stage
          width={800}
          height={600}
          draggable
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onDragMove={handleDragMove}
          onDblClick={handleDblClick}
          onClick={handleClick}
          ref={stageRef}
          className="border border-gray-300 shadow-md"
        >
          <Layer>
            <KonvaImage image={imageObj} />
            {/* Annotations */}
            {annotations.map((a) => (
              <React.Fragment key={a.id}>
                <Circle x={a.x} y={a.y} radius={4} fill="red" />
                <Text x={a.x + 6} y={a.y - 10} text={a.label} fontSize={14} fill="red" />
              </React.Fragment>
            ))}

            {/* Measurements */}
            {measurements.map((m) => {
              const [start, end] = m.points;
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const distancePx = Math.sqrt(dx * dx + dy * dy);
              const distanceText =
                mmPerPixel && mmPerPixel > 0
                  ? `${(distancePx * mmPerPixel).toFixed(1)} mm`
                  : "Set mm/px";
              return (
                <React.Fragment key={m.id}>
                  <Line points={[start.x, start.y, end.x, end.y]} stroke="yellow" strokeWidth={2} />
                  <Text
                    x={(start.x + end.x) / 2}
                    y={(start.y + end.y) / 2}
                    text={distanceText}
                    fontSize={14}
                    fill="yellow"
                  />
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
