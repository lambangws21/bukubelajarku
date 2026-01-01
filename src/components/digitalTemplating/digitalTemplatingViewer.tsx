"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  STEM_LIBRARY,
  ImplantLibraryItem,
  ImplantCanvasObject,
} from "@/components/digitalTemplating/implantLibrary";
import {
  ArrowLeft,
  ArrowRight,
  Grab,
  Minus,
  Plus,
  RotateCcwIcon,
  RotateCw,
  Trash,
} from "lucide-react";

/* =====================================================
   IMPLANT TEMPLATING CANVAS – UI/UX REFACTOR
   LOGIC: UNCHANGED
   ===================================================== */

export default function ImplantTemplatingCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });

  /* ================= BACKGROUND ================= */
  const [background, setBackground] = useState<string | null>(null);
  const [xrayContrast, setXrayContrast] = useState(1);

  /* ================= OBJECTS ================= */
  const [objects, setObjects] = useState<ImplantCanvasObject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = objects.find((o) => o.id === activeId);

  /* ================= UI ================= */
  const [dragging, setDragging] = useState(false);
  const [openImplantModal, setOpenImplantModal] = useState(false);

  /* ================= CALIBRATION ================= */
  const [calStart, setCalStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [calEnd, setCalEnd] = useState<{ x: number; y: number } | null>(null);
  const [realMm, setRealMm] = useState(100);
  const [mmPerPixel, setMmPerPixel] = useState<number | null>(null);

  /* ================= MEASURE ================= */
  const [mStart, setMStart] = useState<{ x: number; y: number } | null>(null);
  const [mEnd, setMEnd] = useState<{ x: number; y: number } | null>(null);

  /* ================= DRAGGABLE PANEL ================= */
  const [panelPos, setPanelPos] = useState({ x: 16, y: 16 });
  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  /* ================= DRAGGABLE TOOLBAR ================= */
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 200 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toolbarDrag = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  /* ================= TOOL VALUES ================= */
  const [moveStep, setMoveStep] = useState(2); // px
  const [scaleStep, setScaleStep] = useState(0.01);
  const [rotateStep, setRotateStep] = useState(1); // deg

  /* =====================================================
     HELPERS
     ===================================================== */

  const createImplant = (item: ImplantLibraryItem): ImplantCanvasObject => ({
    id: crypto.randomUUID(),
    type: "implant",
    name: item.label,
    imageSrc: item.imageSrc,
    position: { x: 300, y: 200 },
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 0.6,
    locked: true,
  });

  const addImplant = (item: ImplantLibraryItem) => {
    const implant = createImplant(item);
    setObjects((p) => [...p, implant]);
    setActiveId(implant.id);
  };

  const moveActive = useCallback(
    (dx: number, dy: number) => {
      if (!active) return;
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id
            ? { ...o, position: { x: o.position.x + dx, y: o.position.y + dy } }
            : o
        )
      );
    },
    [active]
  );

  const scaleActive = useCallback(
    (delta: number) => {
      if (!active) return;
      setObjects((p) =>
        p.map((o) => {
          if (o.id !== active.id) return o;
          const v = Math.max(0.1, o.scaleX + delta);
          return o.locked
            ? { ...o, scaleX: v, scaleY: v }
            : { ...o, scaleX: v };
        })
      );
    },
    [active]
  );

  const rotateActive = useCallback(
    (delta: number) => {
      if (!active) return;
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, rotation: o.rotation + delta } : o
        )
      );
    },
    [active]
  );

  const deleteActive = useCallback(() => {
    if (!active) return;
    setObjects((p) => p.filter((o) => o.id !== active.id));
    setActiveId(null);
  }, [active]);

  /* =====================================================
     EVENTS
     ===================================================== */

  const uploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setBackground(r.result as string);
    r.readAsDataURL(f);
  };

  const onDownObject = (e: React.MouseEvent) => {
    if (!active) return;
    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMove = (e: React.MouseEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();

    if (dragging && active) {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      moveActive(dx, dy);
      last.current = { x: e.clientX, y: e.clientY };
    }

    if (calStart)
      setCalEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (mStart) setMEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onUp = () => setDragging(false);

  const startCalibration = (e: React.MouseEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    setCalStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCalEnd(null);
  };

  const startMeasure = (e: React.MouseEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    setMStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setMEnd(null);
  };

  const applyCalibration = () => {
    if (!calStart || !calEnd) return;
    const px = Math.hypot(calEnd.x - calStart.x, calEnd.y - calStart.y);
    setMmPerPixel(realMm / px);
    setCalStart(null);
    setCalEnd(null);
  };

  const distanceMm =
    mmPerPixel && mStart && mEnd
      ? Math.hypot(mEnd.x - mStart.x, mEnd.y - mStart.y) * mmPerPixel
      : 0;

  /* =====================================================
     KEYBOARD SHORTCUT
     ===================================================== */

  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey && !e.ctrlKey) {
        if (e.key === "ArrowUp") moveActive(0, -2);
        if (e.key === "ArrowDown") moveActive(0, 2);
        if (e.key === "ArrowLeft") moveActive(-2, 0);
        if (e.key === "ArrowRight") moveActive(2, 0);
      }

      if (e.shiftKey) {
        if (e.key === "ArrowUp") scaleActive(0.01);
        if (e.key === "ArrowDown") scaleActive(-0.01);
      }

      if (e.ctrlKey) {
        if (e.key === "ArrowLeft") rotateActive(-1);
        if (e.key === "ArrowRight") rotateActive(1);
      }

      if (e.key === "Delete" || e.key === "Backspace") deleteActive();
      if (e.key === "Escape") setActiveId(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, moveActive, scaleActive, rotateActive, deleteActive]);

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div
      className="
      relative w-full h-[100svh] overflow-hidden
      bg-gray-100 text-gray-900
      dark:bg-neutral-950 dark:text-gray-100
      transition-colors
    "
    >
      {/* LEFT PANEL */}
      {/* ================= DRAGGABLE LEFT PANEL ================= */}
      <div
        ref={panelRef}
        className="fixed z-30 select-none touch-none"
        style={{ left: panelPos.x, top: panelPos.y }}
        onPointerMove={(e) => {
          if (!dragState.current.dragging) return;

          setPanelPos({
            x: e.clientX - dragState.current.x,
            y: e.clientY - dragState.current.y,
          });
        }}
        onPointerUp={(e) => {
          dragState.current.dragging = false;
          panelRef.current?.releasePointerCapture(e.pointerId);
        }}
      >
        <div
          className="  bg-white/90 dark:bg-neutral-900/90
  backdrop-blur rounded-2xl shadow-xl
  border border-gray-200 dark:border-neutral-700
  w-56 max-w-[90vw]"
        >
          {/* HEADER (DRAG HANDLE) */}
          <div
            className=" cursor-move px-3 py-2 border-b
  border-gray-200 dark:border-neutral-700
  flex items-center justify-between
  text-xs font-semibold"
            onPointerDown={(e) => {
              dragState.current.dragging = true;
              dragState.current.x = e.clientX - panelPos.x;
              dragState.current.y = e.clientY - panelPos.y;

              panelRef.current?.setPointerCapture(e.pointerId);
            }}
          >
            <span className="text-xs font-semibold tracking-wide">
              X-ray Control
            </span>
            <span className="text-xs text-gray-400"><Grab /></span>
          </div>

          {/* CONTENT */}
          <div className="p-3 space-y-3 text-xs">
            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                X-ray Background
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={uploadBackground}
                className=" border rounded w-full px-2 py-1 text-xs
  bg-white dark:bg-neutral-800
  border-gray-300 dark:border-neutral-600"
              />
            </div>

            <button
              onClick={() => setOpenImplantModal(true)}
              className="w-full rounded-lg bg-black text-white py-1.5 text-xs
                   hover:bg-gray-800 transition"
            >
              + Add Implant
            </button>

            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                X-ray Contrast
              </label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={xrayContrast}
                onChange={(e) => setXrayContrast(Number(e.target.value))}
                className="border rounded w-full px-2 py-1 text-xs
  bg-white dark:bg-neutral-800
  border-gray-300 dark:border-neutral-600"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Marker Length (mm)
              </label>
              <input
                type="number"
                value={realMm}
                onChange={(e) => setRealMm(Number(e.target.value))}
                className="border rounded w-full px-2 py-1 text-xs
  bg-white dark:bg-neutral-800
  border-gray-300 dark:border-neutral-600"
              />
            </div>

            <button
              onClick={applyCalibration}
              className="w-full rounded-lg bg-gray-900 text-white py-1 text-xs
                   hover:bg-black transition"
            >
              Apply Calibration
            </button>
          </div>
        </div>
      </div>

      {active && (
        <>
          {/* ================= DRAGGABLE TOOLBAR (DESKTOP) ================= */}
          <div
            ref={toolbarRef}
            className="hidden md:block fixed z-40 select-none touch-none"
            style={{ left: toolbarPos.x, top: toolbarPos.y }}
            onPointerMove={(e) => {
              if (!toolbarDrag.current.dragging) return;
              setToolbarPos({
                x: e.clientX - toolbarDrag.current.x,
                y: e.clientY - toolbarDrag.current.y,
              });
            }}
            onPointerUp={(e) => {
              toolbarDrag.current.dragging = false;
              toolbarRef.current?.releasePointerCapture(e.pointerId);
            }}
          >
            <div
              className="  bg-white/90 dark:bg-neutral-900/90
  backdrop-blur rounded-2xl shadow-xl
  border border-gray-200 dark:border-neutral-700
  w-32"
            >
              {/* HEADER (DRAG HANDLE) */}
              <div
                className=" cursor-move px-3 py-2 border-b
  border-gray-200 dark:border-neutral-700
  text-xs font-semibold gap-2 select-none touch-none "
                onPointerDown={(e) => {
                  toolbarDrag.current.dragging = true;
                  toolbarDrag.current.x = e.clientX - toolbarPos.x;
                  toolbarDrag.current.y = e.clientY - toolbarPos.y;
                  toolbarRef.current?.setPointerCapture(e.pointerId);
                }}
              >
                Implant Tool
                <span className="text-gray-400"><Grab /></span>
              </div>

              {/* CONTENT */}
              <div className="p-3 space-y-4 text-xs">
                {/* ================= MOVE ================= */}
                <div>
                  <label className="font-medium">Move (px)</label>
                  <input
                    type="number"
                    value={moveStep}
                    onChange={(e) => setMoveStep(Number(e.target.value))}
                    className="border rounded w-full px-2 py-1 mb-1"
                  />

                  <div className="grid grid-cols-3 gap-0 place-items-center">
                    <div />
                    <TB onClick={() => moveActive(0, -moveStep)}>↑</TB>
                    <div />

                    <TB onClick={() => moveActive(-moveStep, 0)}>←</TB>
                    <div
                      className="
    w-8 h-8 rounded-lg
    bg-gray-50 dark:bg-neutral-800
    text-[10px] text-gray-400 dark:text-gray-500
    flex items-center justify-center
  "
                    >
                      MOVE
                    </div>
                    <TB onClick={() => moveActive(moveStep, 0)}>→</TB>

                    <div />
                    <TB onClick={() => moveActive(0, moveStep)}>↓</TB>
                    <div />
                  </div>
                </div>

                <Divider />

                {/* ================= SCALE (REAL) ================= */}
                <div>
                  <label className="font-medium">Scale</label>

                  <input
                    type="range"
                    min={0.1}
                    max={3}
                    step={0.01}
                    value={active.scaleX}
                    onChange={(e) => {
                      const v = Number(e.target.value);

                      // update REAL scale
                      setObjects((p) =>
                        p.map((o) =>
                          o.id === active.id
                            ? { ...o, scaleX: v, scaleY: v }
                            : o
                        )
                      );

                      // update step (eslint-safe & UX-consistent)
                      setScaleStep(
                        Number((v - active.scaleX).toFixed(3)) || scaleStep
                      );
                    }}
                    className="w-full"
                  />

                  <input
                    type="number"
                    step={0.01}
                    value={active.scaleX}
                    onChange={(e) => {
                      const v = Number(e.target.value);

                      setObjects((p) =>
                        p.map((o) =>
                          o.id === active.id
                            ? { ...o, scaleX: v, scaleY: v }
                            : o
                        )
                      );

                      setScaleStep(
                        Number((v - active.scaleX).toFixed(3)) || scaleStep
                      );
                    }}
                    className="border rounded w-full px-2 py-1 mt-1"
                  />

                  <div className="flex gap-1 mt-1">
                    <TB onClick={() => scaleActive(scaleStep)}>＋</TB>
                    <TB onClick={() => scaleActive(-scaleStep)}>－</TB>
                  </div>
                </div>

                <Divider />

                {/* ================= ROTATE (REAL) ================= */}
                <div>
                  <label className="font-medium">Rotate (°)</label>

                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={active.rotation}
                    onChange={(e) => {
                      const v = Number(e.target.value);

                      setObjects((p) =>
                        p.map((o) =>
                          o.id === active.id ? { ...o, rotation: v } : o
                        )
                      );

                      setRotateStep(v - active.rotation || rotateStep);
                    }}
                    className="w-full"
                  />

                  <input
                    type="number"
                    step={1}
                    value={active.rotation}
                    onChange={(e) => {
                      const v = Number(e.target.value);

                      setObjects((p) =>
                        p.map((o) =>
                          o.id === active.id ? { ...o, rotation: v } : o
                        )
                      );

                      setRotateStep(v - active.rotation || rotateStep);
                    }}
                    className="border rounded w-full px-2 py-1 mt-1"
                  />

                  <div className="flex gap-1 mt-1">
                    <TB onClick={() => rotateActive(rotateStep)}>
                      <RotateCw />
                    </TB>
                    <TB onClick={() => rotateActive(-rotateStep)}>
                      <RotateCcwIcon />
                    </TB>
                  </div>
                </div>

                <Divider />

                {/* ================= LOCK + DELETE ================= */}
                <div className="items-center flex justify-start gap-2">
                  <TB
                    onClick={() =>
                      setObjects((p) =>
                        p.map((o) =>
                          o.id === active.id ? { ...o, locked: !o.locked } : o
                        )
                      )
                    }
                  >
                    {active.locked ? "🔒 Lock" : "🔓 Unlock"}
                  </TB>

                  <TB danger onClick={deleteActive}>
                    <Trash />
                  </TB>
                </div>
              </div>
            </div>
          </div>

          {/* ================= MOBILE TOOLBAR (BOTTOM) ================= */}
          <div className=" md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40
  pb-[env(safe-area-inset-bottom)]">
            <div className=" bg-white/95 dark:bg-neutral-900/95
    backdrop-blur rounded-xl shadow-xl
    px-4 py-3 flex gap-3 items-center
    border border-gray-200 dark:border-neutral-700">
              <MB onClick={() => moveActive(-moveStep, 0)}>
                <ArrowLeft />
              </MB>
              <MB onClick={() => moveActive(moveStep, 0)}>
                <ArrowRight />
              </MB>
              <MB onClick={() => scaleActive(scaleStep)}>
                <Plus />
              </MB>
              <MB onClick={() => scaleActive(-scaleStep)}>
                <Minus />
              </MB>
              <MB onClick={() => rotateActive(rotateStep)}>
                <RotateCw />
              </MB>
              <MB danger onClick={deleteActive}>
                🗑
              </MB>
            </div>
          </div>
        </>
      )}

      {/* STAGE */}
      <div
        ref={stageRef}
        className="absolute inset-0"
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseDown={(e) =>
          e.shiftKey ? startCalibration(e) : startMeasure(e)
        }
      >
        {background && (
          <Image
            src={background}
            alt="X-ray"
            fill
            unoptimized
            className="object-contain"
            style={{ filter: `contrast(${xrayContrast})` }}
          />
        )}

        {objects.map((o) => (
          <div
            key={o.id}
            onMouseDown={() => setActiveId(o.id)}
            style={{
              transform: `
                translate(${o.position.x}px, ${o.position.y}px)
                scale(${o.scaleX}, ${o.scaleY})
                rotate(${o.rotation}deg)
              `,
              transformOrigin: "center",
              opacity: o.opacity,
            }}
            className={`absolute ${
              o.id === activeId ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div onMouseDown={onDownObject}>
              <Image
                src={o.imageSrc}
                alt={o.name}
                width={300}
                height={300}
                unoptimized
                className="pointer-events-none p-8"
                style={{
                  mixBlendMode: "screen",
                  width: "auto",
                  height: "auto",
                }}
              />
            </div>
          </div>
        ))}

        <svg className="absolute inset-0 pointer-events-none">
          {mStart && mEnd && mmPerPixel && (
            <>
              <line
                x1={mStart.x}
                y1={mStart.y}
                x2={mEnd.x}
                y2={mEnd.y}
                stroke="red"
              />
              <text
                x={(mStart.x + mEnd.x) / 2}
                y={(mStart.y + mEnd.y) / 2 - 5}
                fill="red"
                fontSize="14"
              >
                {distanceMm.toFixed(1)} mm
              </text>
            </>
          )}
        </svg>
      </div>

      {/* MODAL */}
      {openImplantModal && (
  <div
    className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/40 dark:bg-black/60
      px-3
    "
  >
    <div
      className="
        w-full max-w-xs sm:max-w-sm
        rounded-2xl shadow-xl
        bg-white dark:bg-neutral-900
        border border-gray-200 dark:border-neutral-700
        overflow-hidden
        animate-in fade-in zoom-in
      "
    >
      {/* HEADER */}
      <div
        className="
          px-3 py-2
          flex items-center justify-between
          border-b
          border-gray-200 dark:border-neutral-700
        "
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Implant Library
        </span>

        <button
          onClick={() => setOpenImplantModal(false)}
          className="
            text-gray-500 dark:text-gray-400
            hover:text-gray-800 dark:hover:text-gray-200
            text-sm
          "
        >
          ✕
        </button>
      </div>

      {/* LIST */}
      <div
        className="
          max-h-[60svh]
          overflow-y-auto
          overscroll-contain
        "
      >
        {STEM_LIBRARY.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              addImplant(item);
              setOpenImplantModal(false);
            }}
            className="
              w-full text-left
              px-4 py-2
              text-xs sm:text-sm
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-neutral-800
              active:bg-gray-200 dark:active:bg-neutral-700
              transition
            "
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

    </div>
  );
}

/* =====================================================
   UI COMPONENTS
   ===================================================== */

function TB({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm
      ${
        danger
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function MB({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-11 rounded-full flex items-center justify-center text-lg
      ${danger ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-800"}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-gray-500 my-1" />;
}
