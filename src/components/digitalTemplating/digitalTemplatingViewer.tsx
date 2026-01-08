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
  Redo2,
  Trash,
  Undo2,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

type ScaleDir = "top" | "bottom" | "left" | "right";
type GroupedLibrary = Record<
  "stem" | "cup",
  Record<string, ImplantLibraryItem[]>
>;

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

const ZOOM_LEVELS = [1, 1.15, 1.25, 1.5] as const;

type HistoryState = {
  objects: ImplantCanvasObject[];
  activeId: string | null;
};

type RulerMeasurement = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

type AngleMeasurement = {
  id: string;
  a: { x: number; y: number };
  b: { x: number; y: number };
  c: { x: number; y: number };
};

type MeasurementRow = {
  id: string;
  label: string;
  value: string;
};

type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
};

const cloneObjects = (items: ImplantCanvasObject[]) =>
  items.map((o) => ({
    ...o,
    position: { ...o.position },
  }));

/* =====================================================
   IMPLANT TEMPLATING CANVAS – UI/UX REFACTOR
   LOGIC: UNCHANGED
   ===================================================== */

export default function ImplantTemplatingCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });
  const captureRef = useRef<HTMLElement | null>(null);

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
  const [zoom, setZoom] = useState(1);

  /* ================= OBJECTS ================= */
  const [objects, setObjects] = useState<ImplantCanvasObject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = objects.find((o) => o.id === activeId);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const objectsRef = useRef(objects);
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    objectsRef.current = objects;
    activeIdRef.current = activeId;
  }, [objects, activeId]);

  const snapshotCurrent = useCallback(
    () => ({
      objects: cloneObjects(objectsRef.current),
      activeId: activeIdRef.current,
    }),
    []
  );

  const pushHistorySnapshot = useCallback(() => {
    setHistory((prev) => [...prev, snapshotCurrent()]);
    setFuture([]);
  }, [snapshotCurrent]);

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
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [syncScaleMode, setSyncScaleMode] = useState(false);
  const [useRealScale, setUseRealScale] = useState(false);

  /* ================= MEASURE ================= */
  const [rulerMode, setRulerMode] = useState(false);
  const [measurements, setMeasurements] = useState<RulerMeasurement[]>([]);
  const [rulerAnchor, setRulerAnchor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [rulerDraft, setRulerDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [angleMode, setAngleMode] = useState(false);
  const [angleMeasurements, setAngleMeasurements] = useState<AngleMeasurement[]>(
    []
  );
  const [anglePoints, setAnglePoints] = useState<{ x: number; y: number }[]>([]);
  const [angleDraft, setAngleDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationDraft, setAnnotationDraft] = useState<{
    id?: string;
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [openType, setOpenType] = useState<Record<"stem" | "cup", boolean>>({
    stem: true,
    cup: false,
  });
  const [openSystem, setOpenSystem] = useState<Record<string, boolean>>({});

  /* ================= DRAGGABLE PANEL ================= */
  const [panelPos, setPanelPos] = useState({ x: 16, y: 16 });
  const panelRef = useRef<HTMLDivElement>(null);
  const panelAutoPlaced = useRef(false);
  const panelManualMove = useRef(false);
  const dragState = useRef({
    dragging: false,
    x: 0,
    y: 0,
  });

  const rotateDrag = useRef<{ x: number; active: boolean }>({
    x: 0,
    active: false,
  });

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

  const getStagePoint = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scale = zoom || 1;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const previous = prev[prev.length - 1];

      setFuture((next) => [...next, snapshotCurrent()]);
      setObjects(previous.objects);
      setActiveId(previous.activeId);

      return prev.slice(0, -1);
    });
  }, [snapshotCurrent]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (!prev.length) return prev;
      const next = prev[prev.length - 1];

      setHistory((historyPrev) => [...historyPrev, snapshotCurrent()]);
      setObjects(next.objects);
      setActiveId(next.activeId);

      return prev.slice(0, -1);
    });
  }, [snapshotCurrent]);

  const scaleImplantByMm = (targetMm: number) => {
    if (!active || !mmPerPixel) return;
    pushHistorySnapshot();

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
    if (
      !objects.length &&
      !panelManualMove.current &&
      !panelAutoPlaced.current &&
      typeof window !== "undefined"
    ) {
      const margin = 16;
      const panelWidth = panelRef.current?.offsetWidth ?? 224;
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const x = Math.max(margin, window.innerWidth - panelWidth - margin);

      setPanelPos((prev) => {
        const y = Math.min(prev.y, window.innerHeight - panelHeight - margin);
        return { x, y: Math.max(margin, y) };
      });

      panelAutoPlaced.current = true;
    }

    pushHistorySnapshot();
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

  const moveActiveWithHistory = useCallback(
    (dx: number, dy: number) => {
      if (!active) return;
      pushHistorySnapshot();
      moveActive(dx, dy);
    },
    [active, moveActive, pushHistorySnapshot]
  );

  const scaleActive = useCallback(
    (delta: number) => {
      if (!active) return;
      pushHistorySnapshot();
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
    [active, pushHistorySnapshot]
  );

  const rotateActive = useCallback(
    (delta: number) => {
      if (!active) return;
      pushHistorySnapshot();
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, rotation: o.rotation + delta } : o
        )
      );
    },
    [active, pushHistorySnapshot]
  );

  const deleteActive = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) => p.filter((o) => o.id !== active.id));
    setActiveId(null);
  }, [active, pushHistorySnapshot]);

  /* ================= FLIP ================= */

  const flipActiveX = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? { ...o, flipX: ((o.flipX ?? 1) * -1) as 1 | -1 }
          : o
      )
    );
  }, [active, pushHistorySnapshot]);

  const flipActiveY = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id
          ? { ...o, flipY: ((o.flipY ?? 1) * -1) as 1 | -1 }
          : o
      )
    );
  }, [active, pushHistorySnapshot]);

  const updateActiveScale = useCallback(
    (value: number) => {
      if (!active || value === active.scaleX) return;
      pushHistorySnapshot();
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, scaleX: value, scaleY: value } : o
        )
      );
      setScaleStep(Number((value - active.scaleX).toFixed(3)) || scaleStep);
    },
    [active, pushHistorySnapshot, scaleStep]
  );

  const updateActiveRotation = useCallback(
    (value: number) => {
      if (!active || value === active.rotation) return;
      pushHistorySnapshot();
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, rotation: value } : o
        )
      );
      setRotateStep(value - active.rotation || rotateStep);
    },
    [active, pushHistorySnapshot, rotateStep]
  );

  const toggleActiveLock = useCallback(() => {
    if (!active) return;
    pushHistorySnapshot();
    setObjects((p) =>
      p.map((o) =>
        o.id === active.id ? { ...o, locked: !o.locked } : o
      )
    );
  }, [active, pushHistorySnapshot]);

  const addRulerPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!rulerAnchor) {
        setRulerAnchor(point);
        setRulerDraft(point);
        return;
      }

      setMeasurements((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          start: rulerAnchor,
          end: point,
        },
      ]);
      setRulerAnchor(null);
      setRulerDraft(null);
    },
    [rulerAnchor]
  );

  const finishRuler = useCallback(() => {
    setRulerAnchor(null);
    setRulerDraft(null);
  }, []);

  const addAnglePoint = useCallback((point: { x: number; y: number }) => {
    setAnglePoints((prev) => {
      if (prev.length === 0) {
        setAngleDraft(point);
        return [point];
      }
      if (prev.length === 1) {
        setAngleDraft(point);
        return [prev[0], point];
      }

      setAngleMeasurements((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          a: prev[0],
          b: prev[1],
          c: point,
        },
      ]);
      setAngleDraft(null);
      return [];
    });
  }, []);

  const finishAngle = useCallback(() => {
    setAnglePoints([]);
    setAngleDraft(null);
  }, []);

  const startSyncScale = useCallback(() => {
    setSyncScaleMode(true);
    setRulerMode(false);
    setAngleMode(false);
    setAnnotationMode(false);
    finishRuler();
    finishAngle();
    setAnnotationDraft(null);
  }, [finishRuler, finishAngle]);

  const stopSyncScale = useCallback(() => {
    setSyncScaleMode(false);
    setIsCalibrating(false);
    setCalStart(null);
    setCalEnd(null);
  }, []);

  const clearMeasurements = useCallback(() => {
    setMeasurements([]);
    finishRuler();
  }, [finishRuler]);

  const toggleRulerMode = useCallback(() => {
    setRulerMode((prev) => {
      if (prev) finishRuler();
      if (!prev) {
        stopSyncScale();
        setAngleMode(false);
        finishAngle();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishRuler, finishAngle, stopSyncScale]);

  const toggleAngleMode = useCallback(() => {
    setAngleMode((prev) => {
      if (prev) finishAngle();
      if (!prev) {
        stopSyncScale();
        setRulerMode(false);
        finishRuler();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishRuler, finishAngle, stopSyncScale]);

  const toggleAnnotationMode = useCallback(() => {
    setAnnotationMode((prev) => {
      if (!prev) {
        stopSyncScale();
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
      } else {
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishRuler, finishAngle, stopSyncScale]);

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setAnnotationDraft(null);
  }, []);

  const clearAngles = useCallback(() => {
    setAngleMeasurements([]);
    finishAngle();
  }, [finishAngle]);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setAnnotationDraft((prev) => (prev?.id === id ? null : prev));
  }, []);

  const startAnnotationDraft = useCallback(
    (point: { x: number; y: number }) => {
      if (annotationDraft) return;
      setAnnotationDraft({ x: point.x, y: point.y, text: "" });
    },
    [annotationDraft]
  );

  const updateAnnotationDraftText = useCallback((text: string) => {
    setAnnotationDraft((prev) => (prev ? { ...prev, text } : prev));
  }, []);

  const cancelAnnotationDraft = useCallback(() => {
    setAnnotationDraft(null);
  }, []);

  const saveAnnotationDraft = useCallback(() => {
    if (!annotationDraft) return;
    const text = annotationDraft.text.trim();
    if (!text) {
      setAnnotationDraft(null);
      return;
    }

    if (annotationDraft.id) {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationDraft.id
            ? { ...a, text }
            : a
        )
      );
    } else {
      setAnnotations((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          x: annotationDraft.x,
          y: annotationDraft.y,
          text,
        },
      ]);
    }

    setAnnotationDraft(null);
  }, [annotationDraft]);

  const editAnnotation = useCallback(
    (annotation: Annotation) => {
      setAnnotationMode(true);
      setRulerMode(false);
      finishRuler();
      setAnnotationDraft({
        id: annotation.id,
        x: annotation.x,
        y: annotation.y,
        text: annotation.text,
      });
    },
    [finishRuler]
  );

  /* =====================================================
     EVENTS
     ===================================================== */

  const onGlobalPointerMove = (e: React.PointerEvent) => {
    if (rotateDrag.current.active) {
      const dx = (e.clientX - rotateDrag.current.x) / zoom;

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

    if (isCalibrating && calStart) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setCalEnd(point);
      return;
    }

    if (annotationMode && annotationDraft) return;

    if (angleMode && anglePoints.length) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setAngleDraft(point);
      return;
    }

    if (rulerMode && rulerAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setRulerDraft(point);
      return;
    }

    if (dragging && active) {
      const dx = (e.clientX - last.current.x) / zoom;
      const dy = (e.clientY - last.current.y) / zoom;
      moveActive(dx, dy);
      last.current = { x: e.clientX, y: e.clientY };
    }
  };

  const uploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setBackground(r.result as string);
      setZoom(1);
    };
    r.readAsDataURL(f);
  };

  const onDownObject = (e: React.PointerEvent) => {
    if (!active || rulerMode || angleMode || annotationMode || e.shiftKey) return;

    pushHistorySnapshot();
    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };

    captureRef.current = e.currentTarget as HTMLElement;
    captureRef.current.setPointerCapture(e.pointerId);
  };

  // const onUp = (e: React.PointerEvent) => {
  //   setDragging(false);
  //   (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  // };

  const onUp = (e: React.PointerEvent) => {
    rotateDrag.current.active = false;
    scaleDrag.current.dir = null;
    setDragging(false);
    setIsCalibrating(false);

    if (syncScaleMode && calStart) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) {
        const px = Math.hypot(point.x - calStart.x, point.y - calStart.y);
        if (px !== 0) {
          setMmPerPixel(realMm / px);
          setUseRealScale(true);
        }
      }
      stopSyncScale();
    }

    captureRef.current?.releasePointerCapture(e.pointerId);
    captureRef.current = null;
  };

  const startCalibration = (e: React.PointerEvent) => {
    const point = getStagePoint(e.clientX, e.clientY);
    if (!point) return;
    setCalStart(point);
    setCalEnd(point);
    setIsCalibrating(true);
  };

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (syncScaleMode) {
      startCalibration(e);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (e.shiftKey) {
      startCalibration(e);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (annotationMode) {
      if (annotationDraft) return;
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point) return;
      startAnnotationDraft(point);
      return;
    }

    if (angleMode) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point) return;
      addAnglePoint(point);
      return;
    }

    if (rulerMode) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point) return;
      addRulerPoint(point);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    onDownObject(e);
  };

  const onStagePointerUp = (e: React.PointerEvent) => {
    onUp(e);
  };

  const applyCalibration = () => {
    if (!calStart || !calEnd) return;
    const px = Math.hypot(calEnd.x - calStart.x, calEnd.y - calStart.y);
    if (px === 0) return;
    setMmPerPixel(realMm / px);
    setCalStart(null);
    setCalEnd(null);
  };

  /* =====================================================
     KEYBOARD SHORTCUT
     ===================================================== */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTypingTarget) {
        if (e.key === "Escape") return;
        if (isMod && (key === "z" || key === "y")) return;
        return;
      }

      if (e.key === "Escape") {
        if (annotationMode) cancelAnnotationDraft();
        else if (syncScaleMode) stopSyncScale();
        else if (angleMode) finishAngle();
        else if (rulerMode) finishRuler();
        else setActiveId(null);
        return;
      }

      if (isMod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (isMod && key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (!e.shiftKey && !isMod) {
        if (e.key === "ArrowUp") moveActiveWithHistory(0, -2);
        if (e.key === "ArrowDown") moveActiveWithHistory(0, 2);
        if (e.key === "ArrowLeft") moveActiveWithHistory(-2, 0);
        if (e.key === "ArrowRight") moveActiveWithHistory(2, 0);
      }

      if (e.shiftKey && !isMod) {
        if (e.key === "ArrowUp") scaleActive(0.01);
        if (e.key === "ArrowDown") scaleActive(-0.01);
      }

      if (isMod) {
        if (e.key === "ArrowLeft") rotateActive(-1);
        if (e.key === "ArrowRight") rotateActive(1);
      }

      if (e.key === "Delete" || e.key === "Backspace") deleteActive();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    moveActiveWithHistory,
    scaleActive,
    rotateActive,
    deleteActive,
    redo,
    undo,
    cancelAnnotationDraft,
    finishRuler,
    finishAngle,
    stopSyncScale,
    annotationMode,
    syncScaleMode,
    angleMode,
    rulerMode,
  ]);

  /* =====================================================
     RENDER
     ===================================================== */

  const filteredLibrary = STEM_LIBRARY.filter((item) =>
    `${item.label} ${item.system} ${item.size}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const groupedLibrary = filteredLibrary.reduce<
    GroupedLibrary
  >(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = {};
      if (!acc[item.type][item.system]) acc[item.type][item.system] = [];
      acc[item.type][item.system].push(item);
      return acc;
    },
    { stem: {}, cup: {} }
  );

  const applyScaleFromDrag = (dy: number) => {
    if (!scaleDrag.current.dir || !active) return;
  
    const sensitivity = 0.005;
  
    const dirMultiplier =
      scaleDrag.current.dir === "top" ? -1 : 1;
  
    const adjustedDy = dy / zoom;
    const factor = 1 + adjustedDy * sensitivity * dirMultiplier;
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

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;
  const rulerDisplayDivisor = useRealScale ? 1 : 3;
  const formatDistancePx = (px: number) => {
    const mmScale = mmPerPixel ?? 1;
    return `${((px * mmScale) / rulerDisplayDivisor).toFixed(1)} mm`;
  };
  const measurementTotalsPx = measurements.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const measurementRows: MeasurementRow[] = measurements.map((m, index) => ({
    id: m.id,
    label: `M${index + 1}`,
    value: formatDistancePx(
      Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y)
    ),
  }));
  const measurementTotalLabel = measurementRows.length
    ? formatDistancePx(measurementTotalsPx)
    : null;
  const hasAngles = angleMeasurements.length > 0;

  const onPanelPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;

    setPanelPos({
      x: e.clientX - dragState.current.x,
      y: e.clientY - dragState.current.y,
    });
  };

  const onPanelPointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    panelRef.current?.releasePointerCapture(e.pointerId);
  };

  const onPanelPointerDown = (e: React.PointerEvent) => {
    dragState.current.dragging = true;
    panelManualMove.current = true;
    dragState.current.x = e.clientX - panelPos.x;
    dragState.current.y = e.clientY - panelPos.y;

    panelRef.current?.setPointerCapture(e.pointerId);
  };


  const onToolbarPointerMove = (e: React.PointerEvent) => {
    if (!toolbarDrag.current.dragging) return;
    setToolbarPos({
      x: e.clientX - toolbarDrag.current.x,
      y: e.clientY - toolbarDrag.current.y,
    });
  };

  const onToolbarPointerUp = (e: React.PointerEvent) => {
    toolbarDrag.current.dragging = false;
    toolbarRef.current?.releasePointerCapture(e.pointerId);
  };

  const onToolbarPointerDown = (e: React.PointerEvent) => {
    toolbarDrag.current.dragging = true;
    toolbarDrag.current.x = e.clientX - toolbarPos.x;
    toolbarDrag.current.y = e.clientY - toolbarPos.y;
    toolbarRef.current?.setPointerCapture(e.pointerId);
  };

  const onRotateHandleDown = (e: React.PointerEvent) => {
    if (!active) return;

    pushHistorySnapshot();
    rotateDrag.current = {
      x: e.clientX,
      active: true,
    };

    captureRef.current = e.currentTarget as HTMLElement;
    captureRef.current.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const onScaleHandleDown = (e: React.PointerEvent, dir: ScaleDir) => {
    if (!active) return;

    pushHistorySnapshot();
    scaleDrag.current = {
      startY: e.clientY,
      startScaleX: active.scaleX,
      startScaleY: active.scaleY,
      dir,
    };

    captureRef.current = e.currentTarget as HTMLElement;
    captureRef.current.setPointerCapture(e.pointerId);
    e.stopPropagation();
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
      <DraggablePanel
        panelRef={panelRef}
        panelPos={panelPos}
        onPanelPointerMove={onPanelPointerMove}
        onPanelPointerUp={onPanelPointerUp}
        onPanelPointerDown={onPanelPointerDown}
        uploadBackground={uploadBackground}
        setOpenImplantModal={setOpenImplantModal}
        xrayContrast={xrayContrast}
        setXrayContrast={setXrayContrast}
        realMm={realMm}
        setRealMm={setRealMm}
        applyCalibration={applyCalibration}
        zoom={zoom}
        setZoom={setZoom}
        syncScaleMode={syncScaleMode}
        startSyncScale={startSyncScale}
        stopSyncScale={stopSyncScale}
        rulerMode={rulerMode}
        toggleRulerMode={toggleRulerMode}
        hasMeasurements={measurements.length > 0}
        clearMeasurements={clearMeasurements}
        mmPerPixel={mmPerPixel}
        measurementRows={measurementRows}
        measurementTotalLabel={measurementTotalLabel}
        removeMeasurement={removeMeasurement}
        angleMode={angleMode}
        toggleAngleMode={toggleAngleMode}
        hasAngles={hasAngles}
        clearAngles={clearAngles}
        annotationMode={annotationMode}
        toggleAnnotationMode={toggleAnnotationMode}
        annotations={annotations}
        editAnnotation={editAnnotation}
        removeAnnotation={removeAnnotation}
        clearAnnotations={clearAnnotations}
      />

      {active && (
        <>
          <ToolbarDesktop
            active={active}
            toolbarRef={toolbarRef}
            toolbarPos={toolbarPos}
            onToolbarPointerMove={onToolbarPointerMove}
            onToolbarPointerUp={onToolbarPointerUp}
            onToolbarPointerDown={onToolbarPointerDown}
            moveStep={moveStep}
            setMoveStep={setMoveStep}
            scaleStep={scaleStep}
            rotateStep={rotateStep}
            moveActive={moveActiveWithHistory}
            scaleActive={scaleActive}
            rotateActive={rotateActive}
            flipActiveX={flipActiveX}
            flipActiveY={flipActiveY}
            deleteActive={deleteActive}
            updateActiveScale={updateActiveScale}
            updateActiveRotation={updateActiveRotation}
            toggleActiveLock={toggleActiveLock}
            mmPerPixel={mmPerPixel}
            scaleImplantByMm={scaleImplantByMm}
            canUndo={canUndo}
            canRedo={canRedo}
            undo={undo}
            redo={redo}
          />
          <ToolbarMobile
            moveStep={moveStep}
            scaleStep={scaleStep}
            rotateStep={rotateStep}
            moveActive={moveActiveWithHistory}
            scaleActive={scaleActive}
            rotateActive={rotateActive}
            deleteActive={deleteActive}
            canUndo={canUndo}
            canRedo={canRedo}
            undo={undo}
            redo={redo}
          />
        </>
      )}

      <TemplatingStage
        stageRef={stageRef}
        onStagePointerDown={onStagePointerDown}
        onStagePointerMove={onGlobalPointerMove}
        onStagePointerUp={onStagePointerUp}
        onDownObject={onDownObject}
        background={background}
        xrayContrast={xrayContrast}
        objects={objects}
        activeId={activeId}
        setActiveId={setActiveId}
        rulerMode={rulerMode}
        angleMode={angleMode}
        zoom={zoom}
        rulerDisplayDivisor={rulerDisplayDivisor}
        onRotateHandleDown={onRotateHandleDown}
        onScaleHandleDown={onScaleHandleDown}
        measurements={measurements}
        angleMeasurements={angleMeasurements}
        anglePoints={anglePoints}
        angleDraft={angleDraft}
        draftStart={rulerAnchor}
        draftEnd={rulerDraft}
        mmPerPixel={mmPerPixel}
        annotationMode={annotationMode}
        annotations={annotations}
        annotationDraft={annotationDraft}
        onEditAnnotation={editAnnotation}
        onUpdateAnnotationDraftText={updateAnnotationDraftText}
        onSaveAnnotationDraft={saveAnnotationDraft}
        onCancelAnnotationDraft={cancelAnnotationDraft}
      />

      <ImplantModal
        open={openImplantModal}
        setOpenImplantModal={setOpenImplantModal}
        search={search}
        setSearch={setSearch}
        openType={openType}
        setOpenType={setOpenType}
        openSystem={openSystem}
        setOpenSystem={setOpenSystem}
        groupedLibrary={groupedLibrary}
        addImplant={addImplant}
      />
    </div>
  );
}

/* =====================================================
   UI COMPONENTS
   ===================================================== */

function DraggablePanel({
  panelRef,
  panelPos,
  onPanelPointerMove,
  onPanelPointerUp,
  onPanelPointerDown,
  uploadBackground,
  setOpenImplantModal,
  xrayContrast,
  setXrayContrast,
  realMm,
  setRealMm,
  applyCalibration,
  zoom,
  setZoom,
  syncScaleMode,
  startSyncScale,
  stopSyncScale,
  rulerMode,
  toggleRulerMode,
  angleMode,
  toggleAngleMode,
  hasAngles,
  clearAngles,
  hasMeasurements,
  clearMeasurements,
  mmPerPixel,
  measurementRows,
  measurementTotalLabel,
  removeMeasurement,
  annotationMode,
  toggleAnnotationMode,
  annotations,
  editAnnotation,
  removeAnnotation,
  clearAnnotations,
}: {
  panelRef: React.RefObject<HTMLDivElement>;
  panelPos: { x: number; y: number };
  onPanelPointerMove: (e: React.PointerEvent) => void;
  onPanelPointerUp: (e: React.PointerEvent) => void;
  onPanelPointerDown: (e: React.PointerEvent) => void;
  uploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setOpenImplantModal: React.Dispatch<React.SetStateAction<boolean>>;
  xrayContrast: number;
  setXrayContrast: React.Dispatch<React.SetStateAction<number>>;
  realMm: number;
  setRealMm: React.Dispatch<React.SetStateAction<number>>;
  applyCalibration: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  syncScaleMode: boolean;
  startSyncScale: () => void;
  stopSyncScale: () => void;
  rulerMode: boolean;
  toggleRulerMode: () => void;
  angleMode: boolean;
  toggleAngleMode: () => void;
  hasAngles: boolean;
  clearAngles: () => void;
  hasMeasurements: boolean;
  clearMeasurements: () => void;
  mmPerPixel: number | null;
  measurementRows: MeasurementRow[];
  measurementTotalLabel: string | null;
  removeMeasurement: (id: string) => void;
  annotationMode: boolean;
  toggleAnnotationMode: () => void;
  annotations: Annotation[];
  editAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
}) {
  return (
    <div
      ref={panelRef}
      className="fixed z-30 select-none touch-none"
      style={{ left: panelPos.x, top: panelPos.y }}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerUp}
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
          onPointerDown={onPanelPointerDown}
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
              Zoom
            </label>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {ZOOM_LEVELS.map((level) => {
                const isActive = zoom === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setZoom(level)}
                    className={`rounded-md px-1 py-1 text-[10px] transition ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {Math.round(level * 100)}%
                  </button>
                );
              })}
            </div>
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

          <div>
            <button
              type="button"
              onClick={syncScaleMode ? stopSyncScale : startSyncScale}
              className={`w-full rounded-lg py-1 text-xs transition ${
                syncScaleMode
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {syncScaleMode ? "Sync Scale: ON" : "Sync X-ray Scale"}
            </button>
            <div className="mt-1 text-[10px] text-gray-400">
              Click 2 points on {realMm} mm scale bar.
            </div>
          </div>

          <div className="pt-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              Ruler (mm)
            </label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={toggleRulerMode}
                className={`flex-1 rounded-lg px-2 py-1 text-[11px] transition
                  ${
                    rulerMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
              >
                {rulerMode ? "Ruler: ON" : "Ruler: OFF"}
              </button>
              <button
                onClick={clearMeasurements}
                disabled={!hasMeasurements}
                className="rounded-lg px-2 py-1 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              {mmPerPixel
                ? `Calibrated ✓ (${mmPerPixel.toFixed(3)} mm/px)`
                : "Calibrate for accurate mm"}
            </div>
            <div className="mt-1 text-[10px] text-gray-400">
              Click 2 points per measurement. ESC to finish.
            </div>
          </div>

          <div className="pt-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              Angle (°)
            </label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={toggleAngleMode}
                className={`flex-1 rounded-lg px-2 py-1 text-[11px] transition
                  ${
                    angleMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
              >
                {angleMode ? "Angle: ON" : "Angle: OFF"}
              </button>
              <button
                onClick={clearAngles}
                disabled={!hasAngles}
                className="rounded-lg px-2 py-1 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <div className="mt-1 text-[10px] text-gray-400">
              Click 3 points: start, vertex, end.
            </div>
          </div>

          <div className="pt-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              Measurements Overview
            </label>
            <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
              {measurementRows.length ? (
                measurementRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="text-gray-500">{row.label}</span>
                    <span className="flex-1 text-right text-gray-800">
                      {row.value}
                    </span>
                    <button
                      onClick={() => removeMeasurement(row.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove measurement"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-gray-400">
                  No measurements yet.
                </div>
              )}
            </div>
            {measurementTotalLabel && (
              <div className="mt-2 text-[11px] text-gray-600">
                Total: {measurementTotalLabel}
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              Annotations
            </label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={toggleAnnotationMode}
                className={`flex-1 rounded-lg px-2 py-1 text-[11px] transition
                  ${
                    annotationMode
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
              >
                {annotationMode ? "Annotate: ON" : "Annotate: OFF"}
              </button>
              <button
                onClick={clearAnnotations}
                disabled={!annotations.length}
                className="rounded-lg px-2 py-1 text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <div className="mt-1 text-[10px] text-gray-400">
              Click to add notes. Enter to save.
            </div>
            <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
              {annotations.length ? (
                annotations.map((annotation, index) => (
                  <div
                    key={annotation.id}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <button
                      onClick={() => editAnnotation(annotation)}
                      className="flex-1 truncate text-left text-gray-800 hover:text-amber-700"
                      title={annotation.text}
                    >
                      {index + 1}. {annotation.text}
                    </button>
                    <button
                      onClick={() => removeAnnotation(annotation.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove annotation"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-gray-400">
                  No annotations yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarDesktop({
  active,
  toolbarRef,
  toolbarPos,
  onToolbarPointerMove,
  onToolbarPointerUp,
  onToolbarPointerDown,
  moveStep,
  setMoveStep,
  scaleStep,
  rotateStep,
  moveActive,
  scaleActive,
  rotateActive,
  flipActiveX,
  flipActiveY,
  deleteActive,
  updateActiveScale,
  updateActiveRotation,
  toggleActiveLock,
  mmPerPixel,
  scaleImplantByMm,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  active: ImplantCanvasObject;
  toolbarRef: React.RefObject<HTMLDivElement>;
  toolbarPos: { x: number; y: number };
  onToolbarPointerMove: (e: React.PointerEvent) => void;
  onToolbarPointerUp: (e: React.PointerEvent) => void;
  onToolbarPointerDown: (e: React.PointerEvent) => void;
  moveStep: number;
  setMoveStep: React.Dispatch<React.SetStateAction<number>>;
  scaleStep: number;
  rotateStep: number;
  moveActive: (dx: number, dy: number) => void;
  scaleActive: (delta: number) => void;
  rotateActive: (delta: number) => void;
  flipActiveX: () => void;
  flipActiveY: () => void;
  deleteActive: () => void;
  updateActiveScale: (value: number) => void;
  updateActiveRotation: (value: number) => void;
  toggleActiveLock: () => void;
  mmPerPixel: number | null;
  scaleImplantByMm: (targetMm: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  return (
    <div
      ref={toolbarRef}
      className="hidden md:block fixed z-40 select-none touch-none"
      style={{ left: toolbarPos.x, top: toolbarPos.y }}
      onPointerMove={onToolbarPointerMove}
      onPointerUp={onToolbarPointerUp}
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
          onPointerDown={onToolbarPointerDown}
        >
          Implant Tool
          <span className="text-gray-400">
            <Grab />
          </span>
        </div>

        {/* CONTENT */}
        <div className="p-3 space-y-4 text-xs">
          {/* ================= HISTORY ================= */}
          <div>
            <label className="font-medium">History</label>
            <div className="flex gap-1 mt-1">
              <TB onClick={undo} disabled={!canUndo}>
                <Undo2 />
              </TB>
              <TB onClick={redo} disabled={!canRedo}>
                <Redo2 />
              </TB>
            </div>
          </div>

          <Divider />

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
              onChange={(e) => updateActiveScale(Number(e.target.value))}
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
                  onChange={(e) => scaleImplantByMm(Number(e.target.value))}
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
              onChange={(e) => updateActiveScale(Number(e.target.value))}
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
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className="w-full"
            />

            <input
              type="number"
              step={1}
              value={active.rotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
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
            <TB onClick={toggleActiveLock}>
              {active.locked ? "🔒 Lock" : "🔓 Unlock"}
            </TB>

            <TB danger onClick={deleteActive}>
              <Trash />
            </TB>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarMobile({
  moveStep,
  scaleStep,
  rotateStep,
  moveActive,
  scaleActive,
  rotateActive,
  deleteActive,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  moveStep: number;
  scaleStep: number;
  rotateStep: number;
  moveActive: (dx: number, dy: number) => void;
  scaleActive: (delta: number) => void;
  rotateActive: (delta: number) => void;
  deleteActive: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  return (
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
        <MB onClick={undo} disabled={!canUndo}>
          <Undo2 />
        </MB>
        <MB onClick={redo} disabled={!canRedo}>
          <Redo2 />
        </MB>
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
  );
}

function TemplatingStage({
  stageRef,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onDownObject,
  background,
  xrayContrast,
  objects,
  activeId,
  setActiveId,
  rulerMode,
  angleMode,
  zoom,
  rulerDisplayDivisor,
  annotationMode,
  onRotateHandleDown,
  onScaleHandleDown,
  measurements,
  angleMeasurements,
  anglePoints,
  angleDraft,
  draftStart,
  draftEnd,
  mmPerPixel,
  annotations,
  annotationDraft,
  onEditAnnotation,
  onUpdateAnnotationDraftText,
  onSaveAnnotationDraft,
  onCancelAnnotationDraft,
}: {
  stageRef: React.RefObject<HTMLDivElement>;
  onStagePointerDown: (e: React.PointerEvent) => void;
  onStagePointerMove: (e: React.PointerEvent) => void;
  onStagePointerUp: (e: React.PointerEvent) => void;
  onDownObject: (e: React.PointerEvent) => void;
  background: string | null;
  xrayContrast: number;
  objects: ImplantCanvasObject[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  rulerMode: boolean;
  angleMode: boolean;
  zoom: number;
  rulerDisplayDivisor: number;
  annotationMode: boolean;
  onRotateHandleDown: (e: React.PointerEvent) => void;
  onScaleHandleDown: (e: React.PointerEvent, dir: ScaleDir) => void;
  measurements: RulerMeasurement[];
  angleMeasurements: AngleMeasurement[];
  anglePoints: { x: number; y: number }[];
  angleDraft: { x: number; y: number } | null;
  draftStart: { x: number; y: number } | null;
  draftEnd: { x: number; y: number } | null;
  mmPerPixel: number | null;
  annotations: Annotation[];
  annotationDraft: {
    id?: string;
    x: number;
    y: number;
    text: string;
  } | null;
  onEditAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotationDraftText: (text: string) => void;
  onSaveAnnotationDraft: () => void;
  onCancelAnnotationDraft: () => void;
}) {
  const formatDistancePx = (px: number) => {
    const mmScale = mmPerPixel ?? 1;
    const divisor = rulerDisplayDivisor || 1;
    return `${((px * mmScale) / divisor).toFixed(1)} mm`;
  };

  const formatDistance = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => formatDistancePx(Math.hypot(end.x - start.x, end.y - start.y));

  const formatAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const abLen = Math.hypot(ab.x, ab.y);
    const cbLen = Math.hypot(cb.x, cb.y);
    if (abLen === 0 || cbLen === 0) return "0.0°";
    const dot = ab.x * cb.x + ab.y * cb.y;
    const cos = Math.max(-1, Math.min(1, dot / (abLen * cbLen)));
    const angle = (Math.acos(cos) * 180) / Math.PI;
    return `${angle.toFixed(1)}°`;
  };

  const getAngleLabel = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ) => {
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const v1Len = Math.hypot(v1.x, v1.y);
    const v2Len = Math.hypot(v2.x, v2.y);
    if (!v1Len || !v2Len) return { x: b.x + 12, y: b.y + 12 };
    const u1 = { x: v1.x / v1Len, y: v1.y / v1Len };
    const u2 = { x: v2.x / v2Len, y: v2.y / v2Len };
    const bis = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bisLen = Math.hypot(bis.x, bis.y);
    let dir = bis;
    if (!bisLen) {
      dir = { x: -u1.y, y: u1.x };
    } else {
      dir = { x: bis.x / bisLen, y: bis.y / bisLen };
    }
    const offset = 16;
    return { x: b.x + dir.x * offset, y: b.y + dir.y * offset };
  };

  const totalDistancePx = measurements.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const currentLabel =
    draftStart && draftEnd ? formatDistance(draftStart, draftEnd) : null;
  const totalLabel = measurements.length
    ? formatDistancePx(totalDistancePx)
    : null;
  const lastMeasurement = measurements[measurements.length - 1] ?? null;
  const lastLabel = lastMeasurement
    ? formatDistance(lastMeasurement.start, lastMeasurement.end)
    : null;

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 isolate ${
        rulerMode || angleMode || annotationMode ? "cursor-crosshair" : ""
      }`}
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `scale(${zoom})` }}
      >
      <div className="absolute inset-0 z-0 pointer-events-none">
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
      </div>

      <div className="absolute inset-0 z-10">
        {objects.map((o) => (
          <div
            key={o.id}
            onMouseDown={(e) => {
              if (!rulerMode && !angleMode && !annotationMode && !e.shiftKey) {
                setActiveId(o.id);
              }
            }}
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
              !rulerMode && !angleMode && !annotationMode && o.id === activeId
                ? "ring-2 ring-blue-500"
                : ""
            }`}
          >
            <div
              onPointerDown={(e) => {
                if (rulerMode || angleMode || annotationMode || e.shiftKey) return;
                e.stopPropagation();
                onDownObject(e);
              }}
            >
              {activeId === o.id &&
                !rulerMode &&
                !angleMode &&
                !annotationMode && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* ROTATE HANDLE */}
                  <div
                    onPointerDown={onRotateHandleDown}
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
                      onPointerDown={(e) => onScaleHandleDown(e, dir)}
                      className={`
pointer-events-auto absolute z-20
w-3 h-3 rounded-full
bg-white border border-blue-700
${
  dir === "left" || dir === "right"
    ? "cursor-ns-resize"
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
      </div>

      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute z-50"
          style={{ left: annotation.x, top: annotation.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 -translate-x-1/2 -translate-y-full">
            <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shadow" />
            <button
              onClick={() => onEditAnnotation(annotation)}
              className="max-w-[180px] rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-900 shadow hover:bg-amber-100"
              title={annotation.text}
            >
              {annotation.text}
            </button>
          </div>
        </div>
      ))}

      {annotationDraft && (
        <div
          className="absolute z-50"
          style={{ left: annotationDraft.x, top: annotationDraft.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="w-48 -translate-x-1/2 -translate-y-full rounded-lg border border-amber-200 bg-white/95 p-2 text-[11px] shadow-lg">
            <input
              autoFocus
              value={annotationDraft.text}
              onChange={(e) => onUpdateAnnotationDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSaveAnnotationDraft();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancelAnnotationDraft();
                }
              }}
              placeholder="Add note..."
              className="w-full rounded border border-amber-200 px-2 py-1 text-[11px]"
            />
            <div className="mt-1 flex gap-1">
              <button
                onClick={onSaveAnnotationDraft}
                className="flex-1 rounded bg-amber-500 px-2 py-1 text-white hover:bg-amber-600"
              >
                Save
              </button>
              <button
                onClick={onCancelAnnotationDraft}
                className="flex-1 rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 9999, mixBlendMode: "normal" }}
      >
        {rulerMode && (currentLabel || lastLabel || totalLabel) && (
          <div className="absolute left-3 top-3 rounded-lg bg-red-800/70 px-3 py-2 text-[16px] text-green-400 shadow-sm">
            {currentLabel && <div>Current: {currentLabel}</div>}
            {!currentLabel && lastLabel && <div>Last: {lastLabel}</div>}
            {totalLabel && <div>Total: {totalLabel}</div>}
          </div>
        )}

        <svg
          className="absolute inset-0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          {angleMeasurements.map((angle) => {
            const labelPos = getAngleLabel(angle.a, angle.b, angle.c);
            return (
              <g key={angle.id}>
                <line
                  x1={angle.b.x}
                  y1={angle.b.y}
                  x2={angle.a.x}
                  y2={angle.a.y}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <line
                  x1={angle.b.x}
                  y1={angle.b.y}
                  x2={angle.c.x}
                  y2={angle.c.y}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={angle.b.x}
                  cy={angle.b.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#22c55e"
                  fontSize="12"
                  fontWeight={600}
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  {formatAngle(angle.a, angle.b, angle.c)}
                </text>
              </g>
            );
          })}
          {anglePoints.length === 1 && angleDraft && (
            <g>
              <line
                x1={anglePoints[0].x}
                y1={anglePoints[0].y}
                x2={angleDraft.x}
                y2={angleDraft.y}
                stroke="#22c55e"
                strokeWidth={3}
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            </g>
          )}
          {anglePoints.length === 2 && angleDraft && (() => {
            const labelPos = getAngleLabel(
              anglePoints[0],
              anglePoints[1],
              angleDraft
            );
            return (
              <g>
                <line
                  x1={anglePoints[1].x}
                  y1={anglePoints[1].y}
                  x2={anglePoints[0].x}
                  y2={anglePoints[0].y}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
                <line
                  x1={anglePoints[1].x}
                  y1={anglePoints[1].y}
                  x2={angleDraft.x}
                  y2={angleDraft.y}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#22c55e"
                  fontSize="12"
                  fontWeight={600}
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  {formatAngle(anglePoints[0], anglePoints[1], angleDraft)}
                </text>
              </g>
            );
          })()}
          {measurements.map((m) => {
            const dx = m.end.x - m.start.x;
            const dy = m.end.y - m.start.y;
            const length = Math.hypot(dx, dy) || 1;
            const ux = dx / length;
            const uy = dy / length;
            const px = -uy;
            const py = ux;
            const midX = (m.start.x + m.end.x) / 2;
            const midY = (m.start.y + m.end.y) / 2;
            const labelOffset = 14;
            const labelX = midX + px * labelOffset;
            const labelY = midY + py * labelOffset;
            const labelPad = 6;
            const textX = labelX + (px >= 0 ? labelPad : -labelPad);
            const textAnchor = px >= 0 ? "start" : "end";

            return (
              <g key={m.id}>
                <line
                  x1={m.start.x}
                  y1={m.start.y}
                  x2={m.end.x}
                  y2={m.end.y}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={labelX}
                  y2={labelY}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={m.start.x}
                  cy={m.start.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <circle
                  cx={m.end.x}
                  cy={m.end.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={labelY}
                  fill="#22c55e"
                  fontSize="12"
                  fontWeight={600}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {formatDistance(m.start, m.end)}
                </text>
              </g>
            );
          })}
          {draftStart &&
            draftEnd &&
            (() => {
            const dx = draftEnd.x - draftStart.x;
            const dy = draftEnd.y - draftStart.y;
            const length = Math.hypot(dx, dy) || 1;
            const ux = dx / length;
            const uy = dy / length;
            const px = -uy;
            const py = ux;
            const midX = (draftStart.x + draftEnd.x) / 2;
            const midY = (draftStart.y + draftEnd.y) / 2;
            const labelOffset = 14;
            const labelX = midX + px * labelOffset;
            const labelY = midY + py * labelOffset;
            const labelPad = 6;
            const textX = labelX + (px >= 0 ? labelPad : -labelPad);
            const textAnchor = px >= 0 ? "start" : "end";

            return (
              <g>
                <line
                  x1={draftStart.x}
                  y1={draftStart.y}
                  x2={draftEnd.x}
                  y2={draftEnd.y}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={labelX}
                  y2={labelY}
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={draftStart.x}
                  cy={draftStart.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <circle
                  cx={draftEnd.x}
                  cy={draftEnd.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={labelY}
                  fill="#22c55e"
                  fontSize="12"
                  fontWeight={600}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {formatDistance(draftStart, draftEnd)}
                </text>
              </g>
              );
            })()}
        </svg>
      </div>
      </div>
    </div>
  );
}

function ImplantModal({
  open,
  setOpenImplantModal,
  search,
  setSearch,
  openType,
  setOpenType,
  openSystem,
  setOpenSystem,
  groupedLibrary,
  addImplant,
}: {
  open: boolean;
  setOpenImplantModal: React.Dispatch<React.SetStateAction<boolean>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  openType: Record<"stem" | "cup", boolean>;
  setOpenType: React.Dispatch<
    React.SetStateAction<Record<"stem" | "cup", boolean>>
  >;
  openSystem: Record<string, boolean>;
  setOpenSystem: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  groupedLibrary: GroupedLibrary;
  addImplant: (item: ImplantLibraryItem) => void;
}) {
  if (!open) return null;

  return (
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
                {Object.entries(groupedLibrary.stem).map(([system, items]) => (
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
                ))}
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
                {Object.entries(groupedLibrary.cup).map(([system, items]) => (
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
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TB({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm
      ${
        danger
          ? "bg-red-50 text-red-600 hover:bg-red-100 disabled:hover:bg-red-50"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:hover:bg-gray-100"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function MB({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-11 rounded-full flex items-center justify-center text-lg
      ${
        danger
          ? "bg-red-100 text-red-600 disabled:hover:bg-red-100"
          : "bg-gray-200 text-gray-800 disabled:hover:bg-gray-200"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-gray-500 my-1" />;
}
