// src/components/PACSViewer/PACSViewer.tsx
"use client";

import React, { useState, JSX } from "react";
// Import CalibrationPresetKey from ImageCanvas (ALL_CALIBRATION_PRESETS tidak lagi diperlukan di sini)
import ImageCanvas, { ImageItem, CalibrationPresetKey } from '@/components/digitalTemplating/ImageCanvas'; 
import ThumbnailList from '@/components/digitalTemplating/NewThumbailList'; 
// Toolbar tidak lagi diimpor secara langsung di sini karena sudah di dalam ImageCanvas
// import Toolbar from "@/components/PACS/Toolbar"; 

export default function PACSViewer(): JSX.Element {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  // State untuk preset kalibrasi yang dipilih, dikelola di komponen induk
  const [selectedCalibrationPreset, setSelectedCalibrationPreset] = useState<CalibrationPresetKey>('auto');
  
  // STATE BARU: untuk faktor pembesaran (default 1.0 = 100%)
  const [enlargementFactor, setEnlargementFactor] = useState<number>(1.0);


  const handleAddFiles = (files: FileList | null): void => {
    if (!files) return;
    const arr: ImageItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      arr.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        file,
        url,
      });
    });
    if (arr.length === 0) return;
    setImages((prev) => [...prev, ...arr]);
    setActiveIndex(images.length);
  };

  const handleRemoveImage = (id: string): void => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="p-4 space-y-4 font-sans bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">PACS-like Viewer</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        <div className="bg-black rounded-lg overflow-hidden border border-gray-300 shadow-lg">
          <ImageCanvas
            key={images[activeIndex]?.id ?? "empty"} // Key berubah saat gambar berubah, memaksa re-render
            image={images[activeIndex]}
            onRemove={() => {
              const id = images[activeIndex]?.id;
              if (id) handleRemoveImage(id);
            }}
            onFilesSelected={handleAddFiles}
            // Meneruskan properti kalibrasi ke ImageCanvas
            selectedCalibrationPreset={selectedCalibrationPreset}
            onCalibrationSelect={setSelectedCalibrationPreset}
            // MENERUSKAN PROPS BARU UNTUK FAKTOR PEMBESARAN
            enlargementFactor={enlargementFactor}
            onEnlargementChange={setEnlargementFactor}
          />
        </div>

        <div>
          <ThumbnailList
            images={images}
            activeIndex={activeIndex}
            onSelect={(idx) => setActiveIndex(idx)}
            onRemove={handleRemoveImage}
          />
        </div>
      </div>
    </div>
  );
}
