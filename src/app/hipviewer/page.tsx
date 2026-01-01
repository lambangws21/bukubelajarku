"use client";

import { useState } from "react";
import Image from "next/image";
import { AcetabularCup } from "@/components/smarthip/acetabularCup";
import { CupSizeSelector } from "@/components/smarthip/cupSelector";

export default function HipTemplatingViewer() {
  const [size, setSize] = useState(54);
  const [rotation, setRotation] = useState(0);
  const [xrayUrl, setXrayUrl] = useState<string | null>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setXrayUrl(url);
  }

  return (
    <div className="relative w-full h-[600px] bg-black overflow-hidden rounded-xl">
      {/* ================= X-RAY IMAGE ================= */}
      {xrayUrl ? (
        <Image
          src={xrayUrl}
          alt="X-ray Pelvis"
          fill
          className="object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm opacity-60">
          Upload X-ray Pelvis (AP)
        </div>
      )}

      {/* ================= CUP OVERLAY ================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AcetabularCup size={size} rotation={rotation} />
      </div>

      {/* ================= UI CONTROLS ================= */}
      <div className="absolute bottom-4 left-4 space-y-3 bg-white/90 p-3 rounded-xl shadow-lg">
        {/* Upload */}
        <label className="block">
          <span className="text-xs font-medium">Upload X-ray</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="mt-1 block text-xs"
          />
        </label>

        {/* Cup size */}
        <CupSizeSelector size={size} onChange={setSize} />

        {/* Rotation */}
        <div>
          <label className="text-xs font-medium">Cup Rotation</label>
          <input
            type="range"
            min={-90}
            max={90}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>
    </div>
  );
}
