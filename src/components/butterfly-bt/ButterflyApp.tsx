"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import AxisOverlay from "./AxisOverlay";
import ButterflyRuler from "./ButterflyRuler";
import type { AxisKey, Axes, Point } from "./types";
import { radToDeg, angleOfAxis, signedAngleBetween } from "./geometry";

const STAGE_W = 1100;
const STAGE_H = 720;

function labelVarusValgus(signedDeg: number): { label: string; abs: number } {
  const abs = Math.abs(signedDeg);
  if (abs < 0.25) return { label: "Neutral", abs: 0 };
  // convention: if tibia is rotated clockwise relative to femur -> negative; we map negative to VARUS by default.
  // You can swap if klinik kamu pakai definisi kebalikan.
  return signedDeg < 0 ? { label: "Varus", abs } : { label: "Valgus", abs };
}

export default function ButterflyApp() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  const [axes, setAxes] = useState<Axes>({
    femur: { a: { x: 430, y: 120 }, b: { x: 560, y: 640 } },
    tibia: { a: { x: 600, y: 160 }, b: { x: 540, y: 660 } },
  });

  const [activeKey, setActiveKey] = useState<AxisKey>("femur");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      // cleanup object URL
      if (imgUrl && imgUrl.startsWith("blob:")) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const femurRad = useMemo(() => angleOfAxis(axes.femur), [axes.femur]);
  const tibiaRad = useMemo(() => angleOfAxis(axes.tibia), [axes.tibia]);

  const signedRad = useMemo(() => signedAngleBetween(femurRad, tibiaRad), [femurRad, tibiaRad]);
  const signedDeg = useMemo(() => radToDeg(signedRad), [signedRad]);

  const vv = useMemo(() => labelVarusValgus(signedDeg), [signedDeg]);

  const femurDeg = useMemo(() => radToDeg(femurRad), [femurRad]);

  function onPickFile(file: File) {
    const url = URL.createObjectURL(file);
    setImgUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onPickFile(file);
  }

  function onAxisChange(key: AxisKey, axis: { a: Point; b: Point }) {
    setAxes((prev) => ({ ...prev, [key]: axis }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Butterfly Scala BT — Varus/Valgus Ruler</h1>
          <p className="text-zinc-300 mt-1">
            Upload X-ray → set <span className="font-medium text-zinc-100">Femur Axis</span> &{" "}
            <span className="font-medium text-zinc-100">Tibia Axis</span> → sudut terukur realtime.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700 active:scale-[0.99]"
            onClick={() => fileRef.current?.click()}
          >
            Upload X-ray
          </button>

          <button
            className={`rounded-xl px-4 py-2 text-sm active:scale-[0.99] ${
              activeKey === "femur" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            onClick={() => setActiveKey("femur")}
          >
            Edit Femur
          </button>

          <button
            className={`rounded-xl px-4 py-2 text-sm active:scale-[0.99] ${
              activeKey === "tibia" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            onClick={() => setActiveKey("tibia")}
          >
            Edit Tibia
          </button>

          <button
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700 active:scale-[0.99]"
            onClick={() => {
              setAxes({
                femur: { a: { x: 430, y: 120 }, b: { x: 560, y: 640 } },
                tibia: { a: { x: 600, y: 160 }, b: { x: 540, y: 660 } },
              });
            }}
          >
            Reset Axis
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
            }}
          />
        </div>
      </div>

      {/* Stage */}
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_320px]">
        <div
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="relative aspect-[1100/720] w-full">
            {/* X-ray */}
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt="X-ray"
                fill
                className="object-contain opacity-[0.96]"
                priority
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-zinc-200 font-medium">Drop X-ray di sini</p>
                  <p className="text-zinc-400 text-sm mt-1">atau klik “Upload X-ray”</p>
                </div>
              </div>
            )}

            {/* Axis overlay */}
            <AxisOverlay
              width={STAGE_W}
              height={STAGE_H}
              axes={axes}
              activeKey={activeKey}
              setActiveKey={setActiveKey}
              onChange={onAxisChange}
            />

            {/* Butterfly ruler aligned to femur axis */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <ButterflyRuler size={520} rotationDeg={femurDeg} opacity={0.92} />
            </div>

            {/* Angle badge */}
            <motion.div
              className="absolute left-4 top-4 rounded-2xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 backdrop-blur"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <div className="text-xs text-zinc-300">Sudut Tibia vs Femur</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-semibold">{vv.abs.toFixed(1)}°</div>
                <div
                  className={`text-sm font-medium ${
                    vv.label === "Varus"
                      ? "text-emerald-300"
                      : vv.label === "Valgus"
                      ? "text-indigo-300"
                      : "text-zinc-300"
                  }`}
                >
                  {vv.label}
                </div>
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                (Konvensi: signed + = Valgus, signed − = Varus)
              </div>
            </motion.div>
          </div>
        </div>

        {/* Side panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-semibold">Kontrol & Tips</h2>

          <div className="mt-3 space-y-3 text-sm text-zinc-300 leading-relaxed">
            <div className="rounded-xl bg-zinc-950/40 p-3 border border-zinc-800">
              <div className="font-medium text-zinc-100">Cara pakai cepat</div>
              <ol className="mt-2 list-decimal pl-5 space-y-1">
                <li>Upload X-ray (AP long leg lebih ideal).</li>
                <li>Atur 2 titik <b>Femur</b> mengikuti mechanical axis.</li>
                <li>Atur 2 titik <b>Tibia</b> dari midtalus ke proximal tibia axis.</li>
                <li>Lihat output sudut Varus/Valgus di kiri atas.</li>
              </ol>
            </div>

            <div className="rounded-xl bg-zinc-950/40 p-3 border border-zinc-800">
              <div className="font-medium text-zinc-100">Catatan</div>
              <p className="mt-1">
                Overlay Butterfly (Scala BT) otomatis mengikuti arah femur axis untuk memudahkan pembacaan.
                Kalau kamu mau pembacaan “valgus di medial / varus di lateral” spesifik anatomi,
                kita bisa tambahkan toggle kiri/kanan lutut.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-950/40 p-3 border border-zinc-800">
              <div className="font-medium text-zinc-100">Next upgrade (kalau kamu mau)</div>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Pinch zoom + pan gambar (mobile).</li>
                <li>Mode “Right/Left knee” biar label varus/valgus lebih klinis.</li>
                <li>Tambah MPTA/LDFA tool & hitung aHKA (aHKAA).</li>
                <li>Export hasil ke PNG/PDF.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
