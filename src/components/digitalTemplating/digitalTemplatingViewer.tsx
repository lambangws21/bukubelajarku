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
  FlipHorizontal,
  FlipVertical,
  Grab,
  Minus,
  Plus,
  Rotate3d,
  RotateCcwIcon,
  RotateCw,
  Trash,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

/* =====================================================
   IMPLANT TEMPLATING CANVAS – UI/UX REFACTOR
   LOGIC: UNCHANGED
   ===================================================== */

export default function ImplantTemplatingCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });

  const SNAP_ANGLES = [0, 90, -90, 180, -180];
  const SNAP_THRESHOLD = 5;

  function snapAngle(angle: number) {
    for (const a of SNAP_ANGLES) {
      if (Math.abs(angle - a) <= SNAP_THRESHOLD) return a;
    }
    return angle;
  }

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

  const [search, setSearch] = useState("");
  const [openType, setOpenType] = useState<Record<"stem" | "cup", boolean>>({
    stem: true,
    cup: false,
  });
  const [openSystem, setOpenSystem] = useState<Record<string, boolean>>({});

  /* ================= DRAGGABLE PANEL ================= */
  const [panelPos, setPanelPos] = useState({ x: 16, y: 16 });
  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  const rotateDrag = useRef<{ x: number; active: boolean }>({
    x: 0,
    active: false,
  });


  type ScaleDir = "top" | "bottom" | "left" | "right";
  const scaleDrag = useRef<{
    startY: number;
    startScaleX: number;
    startScaleY: number;
    dir: ScaleDir | null;
  }>({
    startY: 0,
    startScaleX: 1,
    startScaleY: 1,
    dir: null,
  });
  

  const SCALE_HANDLES: {
    dir: ScaleDir;
    x: string;
    y: string;
  }[] = [
    { dir: "top", x: "50%", y: "-4px" },
    { dir: "bottom", x: "50%", y: "100%" },
    { dir: "left", x: "-4px", y: "50%" },
    { dir: "right", x: "100%", y: "50%" },
  ];

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
    flipX: 1,
    flipY: 1,
    rotation: 0,
    opacity: 0.6,
    locked: true,
  });



  const scaleByHandle = (dir: ScaleDir, delta: number) => {
    if (!active) return;

    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== active.id) return o;

        let sx = o.scaleX;
        let sy = o.scaleY;

        if (dir === "left" || dir === "right") sx = Math.max(0.05, sx + delta);
        if (dir === "top" || dir === "bottom") sy = Math.max(0.05, sy + delta);

        return o.locked
          ? { ...o, scaleX: sx, scaleY: sx }
          : { ...o, scaleX: sx, scaleY: sy };
      })
    );
  };

  const scaleImplantByMm = (targetMm: number) => {
    if (!active || !mmPerPixel) return;

    // estimasi panjang pixel image
    const IMAGE_BASE_PX = 300; // sesuai <Image width={300} />

    const currentRealMm = IMAGE_BASE_PX * active.scaleX * mmPerPixel;
    const factor = targetMm / currentRealMm;

    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? {
              ...o,
              scaleX: o.scaleX * factor,
              scaleY: o.scaleY * factor,
              realLengthMm: targetMm,
            }
          : o
      )
    );
  };

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

  /* ================= FLIP ================= */

  const flipActiveX = useCallback(() => {
    if (!active) return;
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? { ...o, flipX: ((o.flipX ?? 1) * -1) as 1 | -1 }
          : o
      )
    );
  }, [active]);

  const flipActiveY = useCallback(() => {
    if (!active) return;
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? { ...o, flipY: ((o.flipY ?? 1) * -1) as 1 | -1 }
          : o
      )
    );
  }, [active]);

  const onRotateDown = (e: React.PointerEvent) => {
    rotateDrag.current = { x: e.clientX, active: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // const onRotateMove = (e: React.PointerEvent) => {
  //   if (!rotateDrag.current.active || !active) return;

  //   const dx = e.clientX - rotateDrag.current.x;
  //   const raw = active.rotation + dx * 0.5;
  //   const snapped = snapAngle(raw);

  //   setObjects((p) =>
  //     p.map((o) =>
  //       o.id === active.id ? { ...o, rotation: snapped } : o
  //     )
  //   );

  //   rotateDrag.current.x = e.clientX;
  // };

  const onRotateMove = (e: React.PointerEvent) => {
    if (!rotateDrag.current.active) return;

    const dx = e.clientX - rotateDrag.current.x;

    setObjects((prev) =>
      prev.map((o) =>
        o.id === activeId
          ? { ...o, rotation: snapAngle(o.rotation + dx * 0.5) }
          : o
      )
    );

    rotateDrag.current.x = e.clientX;
  };

  const onRotateUp = () => {
    rotateDrag.current.active = false;
  };

  const onScaleDown = (e: React.PointerEvent, dir: ScaleDir) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onScaleMove = (e: React.PointerEvent) => {
    if (!scaleDrag.current.dir) return;
    const dy = e.clientY - scaleDrag.current.startY;
    scaleByHandle(scaleDrag.current.dir, dy * 0.005);
  };

  const onScaleUp = () => {
    scaleDrag.current.dir = null;
  };

  /* =====================================================
     EVENTS
     ===================================================== */

  const onGlobalPointerMove = (e: React.PointerEvent) => {
    if (rotateDrag.current.active) {
      const dx = e.clientX - rotateDrag.current.x;

      setObjects((prev) =>
        prev.map((o) =>
          o.id === activeId
            ? { ...o, rotation: snapAngle(o.rotation + dx * 0.5) }
            : o
        )
      );

      rotateDrag.current.x = e.clientX;
      return;
    }

    if (scaleDrag.current.dir) {
      const dy = e.clientY - scaleDrag.current.startY;
      applyScaleFromDrag(dy);
      return;
    }

    if (dragging && active) {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      moveActive(dx, dy);
      last.current = { x: e.clientX, y: e.clientY };
    }
    if (!scaleDrag.current.dir || !active) return;

  const dy = e.clientY - scaleDrag.current.startY;

  // sensitivity
  const factor = 1 + dy * 0.005;

  const clamped = Math.max(0.05, factor);

  setObjects((prev) =>
    prev.map((o) => {
      if (o.id !== activeId) return o;

      if (scaleDrag.current.dir === "left" || scaleDrag.current.dir === "right") {
        return {
          ...o,
          scaleX: scaleDrag.current.startScaleX * clamped,
          scaleY: o.locked
            ? scaleDrag.current.startScaleX * clamped
            : o.scaleY,
        };
      }

      // TOP / BOTTOM
      return {
        ...o,
        scaleY: scaleDrag.current.startScaleY * clamped,
        scaleX: o.locked
          ? scaleDrag.current.startScaleY * clamped
          : o.scaleX,
      };
    })
  );
  };

  const uploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setBackground(r.result as string);
    r.readAsDataURL(f);
  };

  const onDownObject = (e: React.PointerEvent) => {
    if (!active) return;

    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
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

  // const onUp = (e: React.PointerEvent) => {
  //   setDragging(false);
  //   (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  // };

  const onUp = (e: React.PointerEvent) => {
    rotateDrag.current.active = false;
    scaleDrag.current.dir = null;
    setDragging(false);

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

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

  const filteredLibrary = STEM_LIBRARY.filter((item) =>
    `${item.label} ${item.system} ${item.size}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const groupedLibrary = filteredLibrary.reduce<
    Record<"stem" | "cup", Record<string, ImplantLibraryItem[]>>
  >(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = {};
      if (!acc[item.type][item.system]) acc[item.type][item.system] = [];
      acc[item.type][item.system].push(item);
      return acc;
    },
    { stem: {}, cup: {} }
  );

  const collapseVariants: Variants = {
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: [0.25, 0.1, 0.25, 1], // easeOut cubic-bezier
      },
    },
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1], // easeIn
      },
    },
  };

  const applyScaleFromDrag = (dy: number) => {
    if (!scaleDrag.current.dir || !active) return;
  
    const sensitivity = 0.005;
  
    const dirMultiplier =
      scaleDrag.current.dir === "top" ? -1 : 1;
  
    const factor = 1 + dy * sensitivity * dirMultiplier;
    const clamped = Math.max(0.05, factor);
  
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== activeId) return o;
  
        if (
          scaleDrag.current.dir === "left" ||
          scaleDrag.current.dir === "right"
        ) {
          return {
            ...o,
            scaleX: scaleDrag.current.startScaleX * clamped,
            scaleY: o.locked
              ? scaleDrag.current.startScaleX * clamped
              : o.scaleY,
          };
        }
  
        // TOP / BOTTOM
        return {
          ...o,
          scaleY: scaleDrag.current.startScaleY * clamped,
          scaleX: o.locked
            ? scaleDrag.current.startScaleY * clamped
            : o.scaleX,
        };
      })
    );
  };
  

  return (
    <div
      className="
      relative w-full h-svh overflow-hidden
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
            <span className="text-xs text-gray-400">
              <Grab />
            </span>
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
              + Add Template
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
                <span className="text-gray-400">
                  <Grab />
                </span>
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
                  {mmPerPixel && (
                    <div className="mt-2 space-y-1">
                      <label className="font-medium text-[11px]">
                        Real Length (mm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={active.realLengthMm ?? ""}
                        onChange={(e) =>
                          scaleImplantByMm(Number(e.target.value))
                        }
                        className="border rounded w-full px-2 py-1 text-xs"
                      />
                      <div className="text-[10px] text-gray-500">
                        Calibrated ✓ ({mmPerPixel.toFixed(3)} mm/px)
                      </div>
                    </div>
                  )}

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

                {/* ================= FLIP ================= */}
                <Divider />

                <div className="flex gap-1">
                  <TB onClick={flipActiveX}>
                    <FlipHorizontal />
                  </TB>
                  <TB onClick={flipActiveY}>
                    <FlipVertical />
                  </TB>
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
          <div
            className=" md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40
  pb-[env(safe-area-inset-bottom)]"
          >
            <div
              className=" bg-white/95 dark:bg-neutral-900/95
    backdrop-blur rounded-xl shadow-xl
    px-4 py-3 flex gap-3 items-center
    border border-gray-200 dark:border-neutral-700"
            >
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
        onPointerDown={onDownObject}
        onPointerMove={onGlobalPointerMove}
        onPointerUp={onUp}
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
                scale(
                  ${o.scaleX * (o.flipX ?? 1)},
                  ${o.scaleY * (o.flipY ?? 1)}
                )
                rotate(${o.rotation}deg)
              `,
              transformOrigin: "center",
              opacity: o.opacity,
            }}
            className={`absolute ${
              o.id === activeId ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div onPointerDown={onDownObject}>
              {activeId === o.id && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* ROTATE HANDLE */}
                  <div
  onPointerDown={(e) => {
    if (!active) return;

    rotateDrag.current = {
      x: e.clientX,
      active: true,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  }}
  className="
    pointer-events-auto absolute z-20
    -top-10 left-1/2 -translate-x-1/2
    w-8 h-8 rounded-full
    bg-blue-600 text-white
    flex items-center justify-center
    shadow-lg
    cursor-ew-resize
  "
>
  <Rotate3d />
</div>

                  {/* SCALE HANDLES */}
                  {SCALE_HANDLES.map(({ dir, x, y }) => (
                    <div
                      key={dir}
                      onPointerDown={(e) => {
                        if (!active) return;
                      
                        scaleDrag.current = {
                          startY: e.clientY,
                          startScaleX: active.scaleX,
                          startScaleY: active.scaleY,
                          dir,
                        };
                      
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        e.stopPropagation();
                      }}
                      
                      className={`
      pointer-events-auto absolute z-20
      w-3 h-3 rounded-full
      bg-white border border-blue-700
      ${
        dir === "left" || dir === "right"
          ? "cursor-ew-resize"
          : "cursor-ns-resize"
      }
    `}
                      style={{
                        left: x,
                        top: y,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </div>
              )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border shadow-xl overflow-hidden">
            {/* HEADER */}
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <span className="text-sm font-semibold">Implant Library</span>
              <button onClick={() => setOpenImplantModal(false)}>✕</button>
            </div>

            {/* SEARCH */}
            <div className="p-3 border-b">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search implant…"
                className="w-full rounded-lg px-3 py-2 text-xs border bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="max-h-[65svh] overflow-y-auto">
              {/* ================= STEM ================= */}
              <button
                onClick={() => setOpenType((p) => ({ ...p, stem: !p.stem }))}
                className="w-full px-4 py-2 text-left text-xs font-semibold bg-gray-100 dark:bg-neutral-800"
              >
                🦴 Stem
              </button>

              <AnimatePresence initial={false}>
                {openType.stem && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.stem).map(
                      ([system, items]) => (
                        <div key={system}>
                          {/* SYSTEM HEADER */}
                          <button
                            onClick={() =>
                              setOpenSystem((p) => ({
                                ...p,
                                [system]: !p[system],
                              }))
                            }
                            className="w-full px-6 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border"
                          >
                            {openSystem[system] ? "▾" : "▸"} {system}
                          </button>

                          {/* SYSTEM CONTENT */}
                          <AnimatePresence initial={false}>
                            {openSystem[system] && (
                              <motion.div
                                variants={collapseVariants}
                                initial="collapsed"
                                animate="open"
                                exit="collapsed"
                                className="overflow-hidden"
                              >
                                {items.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => {
                                      addImplant(item);
                                      setOpenImplantModal(false);
                                    }}
                                    className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ================= CUP ================= */}
              <button
                onClick={() => setOpenType((p) => ({ ...p, cup: !p.cup }))}
                className="w-full px-4 py-2 mt-2 text-left text-xs font-semibold bg-gray-100 dark:bg-neutral-800"
              >
                Cup
              </button>

              <AnimatePresence initial={false}>
                {openType.cup && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.cup).map(
                      ([system, items]) => (
                        <div key={system}>
                          <div className="px-6 py-1 text-[11px] text-gray-500">
                            {system}
                          </div>

                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                addImplant(item);
                                setOpenImplantModal(false);
                              }}
                              className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
