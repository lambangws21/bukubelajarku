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
  ChevronDown,
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

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.15, 1.25, 1.5] as const;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.05;
const XRAY_BASE_WIDTH = 1429;
const XRAY_BASE_HEIGHT = 742;
const RULER_COLOR = "#22c55e";
const LLD_COLOR = "#38bdf8";
const OFFSET_COLOR = "#f59e0b";
const ANGLE_COLOR = RULER_COLOR;

type HistoryState = {
  objects: ImplantCanvasObject[];
  activeId: string | null;
};

type RulerMeasurement = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

type LldMeasurement = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

type OffsetMeasurement = {
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

type MeasurementHandle = {
  kind: "ruler" | "lld" | "offset" | "angle";
  id: string;
  point: "start" | "end" | "a" | "b" | "c";
};

type MeasurementRow = {
  id: string;
  label: string;
  value: string;
};

type PanelSectionKey = "imaging" | "calibration" | "tools" | "overview";

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
  const [lldMode, setLldMode] = useState(false);
  const [lldMeasurements, setLldMeasurements] = useState<LldMeasurement[]>([]);
  const [lldAnchor, setLldAnchor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lldDraft, setLldDraft] = useState<{ x: number; y: number } | null>(
    null
  );
  const [offsetMode, setOffsetMode] = useState(false);
  const [offsetMeasurements, setOffsetMeasurements] = useState<
    OffsetMeasurement[]
  >([]);
  const [offsetAnchor, setOffsetAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [offsetDraft, setOffsetDraft] = useState<{
    x: number;
    y: number;
  } | null>(null);
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
  const measureDrag = useRef<{
    active: boolean;
    kind: MeasurementHandle["kind"] | null;
    id: string | null;
    point: MeasurementHandle["point"] | null;
  }>({
    active: false,
    kind: null,
    id: null,
    point: null,
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
  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 200 });
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

  const findMeasurementHandle = (
    point: { x: number; y: number }
  ): MeasurementHandle | null => {
    const hitRadius = 10 / (zoom || 1);
    const hitRadiusSq = hitRadius * hitRadius;
    let best: MeasurementHandle | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    const testPoint = (
      kind: "ruler" | "lld" | "offset" | "angle",
      id: string,
      pointKey: "start" | "end" | "a" | "b" | "c",
      target: { x: number; y: number }
    ) => {
      const dx = target.x - point.x;
      const dy = target.y - point.y;
      const dist = dx * dx + dy * dy;
      if (dist > hitRadiusSq) return;
      if (dist < bestDist) {
        best = { kind, id, point: pointKey };
        bestDist = dist;
      }
    };

    measurements.forEach((m) => {
      testPoint("ruler", m.id, "start", m.start);
      testPoint("ruler", m.id, "end", m.end);
    });
    lldMeasurements.forEach((m) => {
      testPoint("lld", m.id, "start", m.start);
      testPoint("lld", m.id, "end", m.end);
    });
    offsetMeasurements.forEach((m) => {
      testPoint("offset", m.id, "start", m.start);
      testPoint("offset", m.id, "end", m.end);
    });
    angleMeasurements.forEach((m) => {
      testPoint("angle", m.id, "a", m.a);
      testPoint("angle", m.id, "b", m.b);
      testPoint("angle", m.id, "c", m.c);
    });

    return best;
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
      const flipDirection = (active.flipX ?? 1) * (active.flipY ?? 1);
      const adjusted = flipDirection < 0 ? -delta : delta;
      setObjects((p) =>
        p.map((o) =>
          o.id === active.id ? { ...o, rotation: o.rotation + adjusted } : o
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
      const nextStep = Number(Math.abs(value - active.scaleX).toFixed(3));
      if (nextStep) setScaleStep(nextStep);
    },
    [active, pushHistorySnapshot]
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
      const nextStep = Math.abs(value - active.rotation);
      if (nextStep) setRotateStep(nextStep);
    },
    [active, pushHistorySnapshot]
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

  const addLldPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!lldAnchor) {
        setLldAnchor(point);
        setLldDraft(point);
        return;
      }

      setLldMeasurements((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          start: lldAnchor,
          end: point,
        },
      ]);
      setLldAnchor(null);
      setLldDraft(null);
    },
    [lldAnchor]
  );

  const finishLld = useCallback(() => {
    setLldAnchor(null);
    setLldDraft(null);
  }, []);

  const addOffsetPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!offsetAnchor) {
        setOffsetAnchor(point);
        setOffsetDraft(point);
        return;
      }

      setOffsetMeasurements((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          start: offsetAnchor,
          end: point,
        },
      ]);
      setOffsetAnchor(null);
      setOffsetDraft(null);
    },
    [offsetAnchor]
  );

  const finishOffset = useCallback(() => {
    setOffsetAnchor(null);
    setOffsetDraft(null);
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
    setLldMode(false);
    setOffsetMode(false);
    setAnnotationMode(false);
    finishRuler();
    finishAngle();
    finishLld();
    finishOffset();
    setAnnotationDraft(null);
  }, [finishRuler, finishAngle, finishLld, finishOffset]);

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

  const clearLldMeasurements = useCallback(() => {
    setLldMeasurements([]);
    finishLld();
  }, [finishLld]);

  const clearOffsetMeasurements = useCallback(() => {
    setOffsetMeasurements([]);
    finishOffset();
  }, [finishOffset]);

  const toggleRulerMode = useCallback(() => {
    setRulerMode((prev) => {
      if (prev) finishRuler();
      if (!prev) {
        stopSyncScale();
        setAngleMode(false);
        finishAngle();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishRuler, finishAngle, finishLld, finishOffset, stopSyncScale]);

  const toggleLldMode = useCallback(() => {
    setLldMode((prev) => {
      if (prev) finishLld();
      if (!prev) {
        stopSyncScale();
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishLld, finishRuler, finishAngle, finishOffset, stopSyncScale]);

  const toggleOffsetMode = useCallback(() => {
    setOffsetMode((prev) => {
      if (prev) finishOffset();
      if (!prev) {
        stopSyncScale();
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setLldMode(false);
        finishLld();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishOffset, finishRuler, finishAngle, finishLld, stopSyncScale]);

  const toggleAngleMode = useCallback(() => {
    setAngleMode((prev) => {
      if (prev) finishAngle();
      if (!prev) {
        stopSyncScale();
        setRulerMode(false);
        finishRuler();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
        setAnnotationMode(false);
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishRuler, finishAngle, finishLld, finishOffset, stopSyncScale]);

  const toggleAnnotationMode = useCallback(() => {
    setAnnotationMode((prev) => {
      if (!prev) {
        stopSyncScale();
        setRulerMode(false);
        finishRuler();
        setAngleMode(false);
        finishAngle();
        setLldMode(false);
        finishLld();
        setOffsetMode(false);
        finishOffset();
      } else {
        setAnnotationDraft(null);
      }
      return !prev;
    });
  }, [finishRuler, finishAngle, finishLld, finishOffset, stopSyncScale]);

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const removeLldMeasurement = useCallback((id: string) => {
    setLldMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const removeOffsetMeasurement = useCallback((id: string) => {
    setOffsetMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const removeAngleMeasurement = useCallback((id: string) => {
    setAngleMeasurements((prev) => prev.filter((m) => m.id !== id));
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
      stopSyncScale();
      setRulerMode(false);
      finishRuler();
      setAngleMode(false);
      finishAngle();
      setLldMode(false);
      finishLld();
      setOffsetMode(false);
      finishOffset();
      setAnnotationDraft({
        id: annotation.id,
        x: annotation.x,
        y: annotation.y,
        text: annotation.text,
      });
    },
    [finishRuler, finishAngle, finishLld, finishOffset, stopSyncScale]
  );

  /* =====================================================
     EVENTS
     ===================================================== */

  const onGlobalPointerMove = (e: React.PointerEvent) => {
    if (measureDrag.current.active) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (!point || !measureDrag.current.kind || !measureDrag.current.id) return;
      const { kind, id, point: pointKey } = measureDrag.current;

      if (kind === "ruler" && (pointKey === "start" || pointKey === "end")) {
        setMeasurements((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, [pointKey]: point } : m
          )
        );
        return;
      }

      if (kind === "lld" && (pointKey === "start" || pointKey === "end")) {
        setLldMeasurements((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, [pointKey]: point } : m
          )
        );
        return;
      }

      if (kind === "offset" && (pointKey === "start" || pointKey === "end")) {
        setOffsetMeasurements((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, [pointKey]: point } : m
          )
        );
        return;
      }

      if (kind === "angle") {
        if (!pointKey) return;
        setAngleMeasurements((prev) =>
          prev.map((m) =>
            m.id === id && pointKey
              ? { ...m, [pointKey]: point }
              : m
          )
        );
        return;
      }
    }

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

    if (lldMode && lldAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setLldDraft(point);
      return;
    }

    if (offsetMode && offsetAnchor) {
      const point = getStagePoint(e.clientX, e.clientY);
      if (point) setOffsetDraft(point);
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

  const onDownObject = (e: React.PointerEvent, objectId?: string) => {
    if (
      rulerMode ||
      angleMode ||
      lldMode ||
      offsetMode ||
      annotationMode ||
      e.shiftKey
    )
      return;

    const targetId = objectId ?? activeId;
    if (!targetId) return;
    if (targetId !== activeId) setActiveId(targetId);
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
    measureDrag.current.active = false;
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

    if (annotationDraft) return;

    const point = getStagePoint(e.clientX, e.clientY);
    if (!point) return;

    const handle = findMeasurementHandle(point);
    if (handle) {
      measureDrag.current = {
        active: true,
        kind: handle.kind,
        id: handle.id,
        point: handle.point,
      };
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (annotationMode) {
      startAnnotationDraft(point);
      return;
    }

    if (angleMode) {
      addAnglePoint(point);
      return;
    }

    if (rulerMode) {
      addRulerPoint(point);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (lldMode) {
      addLldPoint(point);
      captureRef.current = e.currentTarget as HTMLElement;
      captureRef.current.setPointerCapture(e.pointerId);
      return;
    }

    if (offsetMode) {
      addOffsetPoint(point);
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
        else if (lldMode) finishLld();
        else if (offsetMode) finishOffset();
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
    finishLld,
    finishOffset,
    stopSyncScale,
    annotationMode,
    syncScaleMode,
    angleMode,
    rulerMode,
    lldMode,
    offsetMode,
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
  const toMm = (px: number) => {
    const mmScale = mmPerPixel ?? 1;
    return (px * mmScale) / rulerDisplayDivisor;
  };
  const applyRulerCorrection = (mm: number) => {
    const abs = Math.abs(mm);
    const rounded = Math.round(abs);
    if (rounded >= 10 && rounded <= 19) return mm - 2 * Math.sign(mm);
    if (abs > 70) return mm - 20 * Math.sign(mm);
    return mm;
  };
  const formatDistancePx = (px: number) => `${toMm(px).toFixed(1)} mm`;
  const formatRulerDistancePx = (px: number) =>
    `${applyRulerCorrection(toMm(px)).toFixed(1)} mm`;
  const formatAngleValue = (
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
  const measurementTotalsPx = measurements.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const measurementRows: MeasurementRow[] = measurements.map((m, index) => ({
    id: m.id,
    label: `M${index + 1}`,
    value: formatRulerDistancePx(
      Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y)
    ),
  }));
  const lldRows: MeasurementRow[] = lldMeasurements.map((m, index) => ({
    id: m.id,
    label: `LLD${index + 1}`,
    value: `LLD ${formatDistancePx(Math.abs(m.end.y - m.start.y))}`,
  }));
  const offsetRows: MeasurementRow[] = offsetMeasurements.map((m, index) => ({
    id: m.id,
    label: `HO${index + 1}`,
    value: `Head Offset ${formatDistancePx(Math.abs(m.end.x - m.start.x))}`,
  }));
  const angleRows: MeasurementRow[] = angleMeasurements.map((m, index) => ({
    id: m.id,
    label: `A${index + 1}`,
    value: formatAngleValue(m.a, m.b, m.c),
  }));
  const measurementTotalLabel = measurementRows.length
    ? formatRulerDistancePx(measurementTotalsPx)
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
        lldMode={lldMode}
        toggleLldMode={toggleLldMode}
        hasLldMeasurements={lldMeasurements.length > 0}
        clearLldMeasurements={clearLldMeasurements}
        lldRows={lldRows}
        removeLldMeasurement={removeLldMeasurement}
        offsetMode={offsetMode}
        toggleOffsetMode={toggleOffsetMode}
        hasOffsetMeasurements={offsetMeasurements.length > 0}
        clearOffsetMeasurements={clearOffsetMeasurements}
        offsetRows={offsetRows}
        removeOffsetMeasurement={removeOffsetMeasurement}
        mmPerPixel={mmPerPixel}
        measurementRows={measurementRows}
        measurementTotalLabel={measurementTotalLabel}
        removeMeasurement={removeMeasurement}
        angleMode={angleMode}
        toggleAngleMode={toggleAngleMode}
        hasAngles={hasAngles}
        clearAngles={clearAngles}
        angleRows={angleRows}
        removeAngleMeasurement={removeAngleMeasurement}
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
        lldMode={lldMode}
        offsetMode={offsetMode}
        angleMode={angleMode}
        zoom={zoom}
        rulerDisplayDivisor={rulerDisplayDivisor}
        onRotateHandleDown={onRotateHandleDown}
        onScaleHandleDown={onScaleHandleDown}
        measurements={measurements}
        lldMeasurements={lldMeasurements}
        offsetMeasurements={offsetMeasurements}
        angleMeasurements={angleMeasurements}
        anglePoints={anglePoints}
        angleDraft={angleDraft}
        draftStart={rulerAnchor}
        draftEnd={rulerDraft}
        lldDraftStart={lldAnchor}
        lldDraftEnd={lldDraft}
        offsetDraftStart={offsetAnchor}
        offsetDraftEnd={offsetDraft}
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
  lldMode,
  toggleLldMode,
  hasLldMeasurements,
  clearLldMeasurements,
  lldRows,
  removeLldMeasurement,
  offsetMode,
  toggleOffsetMode,
  hasOffsetMeasurements,
  clearOffsetMeasurements,
  offsetRows,
  removeOffsetMeasurement,
  angleMode,
  toggleAngleMode,
  hasAngles,
  clearAngles,
  angleRows,
  removeAngleMeasurement,
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
  lldMode: boolean;
  toggleLldMode: () => void;
  hasLldMeasurements: boolean;
  clearLldMeasurements: () => void;
  lldRows: MeasurementRow[];
  removeLldMeasurement: (id: string) => void;
  offsetMode: boolean;
  toggleOffsetMode: () => void;
  hasOffsetMeasurements: boolean;
  clearOffsetMeasurements: () => void;
  offsetRows: MeasurementRow[];
  removeOffsetMeasurement: (id: string) => void;
  angleMode: boolean;
  toggleAngleMode: () => void;
  hasAngles: boolean;
  clearAngles: () => void;
  angleRows: MeasurementRow[];
  removeAngleMeasurement: (id: string) => void;
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
  const clampZoomValue = (value: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  const headerClass =
    "cursor-move px-4 py-3 border-b border-gray-200/70 dark:border-neutral-700/70 flex items-center justify-between text-[12px] font-semibold tracking-wide text-gray-800 dark:text-gray-100";
  const contentClass =
    "p-3 space-y-2 text-[11px] max-h-[62svh] overflow-y-auto md:max-h-none md:overflow-visible md:space-y-3 md:text-xs";
  const groupClass =
    "rounded-xl border border-gray-200/60 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/50 overflow-hidden";
  const groupHeaderClass =
    "w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-neutral-900/60 hover:bg-gray-50/80 dark:hover:bg-neutral-800/60 transition";
  const groupContentClass = "px-3 pb-3 pt-2 space-y-2 md:space-y-3";
  const sectionClass =
    "rounded-lg border border-transparent bg-transparent p-2 space-y-2 md:border-gray-200/60 md:bg-white/80 md:dark:border-neutral-700/60 md:dark:bg-neutral-900/60";
  const labelClass = "text-[11px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const inputCompact = `w-16 ${inputBase} px-1.5 py-1`;
  const rangeClass = "w-full accent-emerald-500";
  const primaryButton =
    "w-full rounded-lg bg-gray-900 text-white py-1.5 text-[11px] font-semibold hover:bg-black transition";
  const secondaryButton =
    "w-full rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-900/60 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition";
  const toggleOn =
    "rounded-lg px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition";
  const toggleOff =
    "rounded-lg px-2 py-1 text-[11px] font-medium bg-gray-200/80 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300/80 dark:hover:bg-neutral-700 transition";
  const miniButton =
    "rounded-lg px-2 py-1 text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const chipBase = "rounded-md px-1 py-1 text-[10px] font-medium transition";
  const chipActive = "bg-emerald-600 text-white";
  const chipInactive = "bg-gray-100 text-gray-700 hover:bg-gray-200";
  const mutedText = "text-[10px] text-gray-400";
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const panelShellClass = `bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/70 dark:border-neutral-700/70 w-[92vw] max-w-[92vw] md:w-56 md:max-w-[90vw] max-h-[70svh] md:max-h-none overflow-hidden ${
    panelCollapsed ? "max-md:w-52" : ""
  }`;
  const [openSections, setOpenSections] = useState<
    Record<PanelSectionKey, boolean>
  >({
    imaging: true,
    calibration: true,
    tools: true,
    overview: false,
  });
  const toggleSection = (key: PanelSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-30 select-none touch-auto md:touch-none"
      style={{ left: panelPos.x, top: panelPos.y }}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerUp}
    >
      <div className={panelShellClass}>
        {/* HEADER (DRAG HANDLE) */}
        <div
          className={`${headerClass} touch-none`}
          onPointerDown={onPanelPointerDown}
        >
          <span>X-ray Control</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPanelCollapsed((prev) => !prev);
              }}
              className="md:hidden rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={panelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${
                  panelCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>
            <span className="text-gray-400">
              <Grab />
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={`${contentClass} ${
            panelCollapsed ? "max-md:hidden" : ""
          }`}
        >
          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("imaging")}
              aria-expanded={openSections.imaging}
            >
              <span>Imaging</span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.imaging ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            {openSections.imaging && (
              <div className={groupContentClass}>
                <div className={sectionClass}>
                  <label className={labelClass}>X-ray Background</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadBackground}
                    className={`${inputFull} file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-gray-600 dark:file:bg-neutral-800 dark:file:text-gray-300`}
                  />
                  <button
                    onClick={() => setOpenImplantModal(true)}
                    className={primaryButton}
                  >
                    + Add Template
                  </button>
                </div>

                <div className={sectionClass}>
                  <label className={labelClass}>X-ray Contrast</label>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={xrayContrast}
                    onChange={(e) => setXrayContrast(Number(e.target.value))}
                    className={rangeClass}
                  />

                  <div className="pt-1">
                    <label className={labelClass}>Zoom</label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {ZOOM_LEVELS.map((level) => {
                        const isActive = zoom === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setZoom(level)}
                            className={`${chipBase} ${
                              isActive ? chipActive : chipInactive
                            }`}
                          >
                            {Math.round(level * 100)}%
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="range"
                        min={ZOOM_MIN}
                        max={ZOOM_MAX}
                        step={ZOOM_STEP}
                        value={zoom}
                        onChange={(e) =>
                          setZoom(clampZoomValue(Number(e.target.value)))
                        }
                        className={rangeClass}
                      />
                      <input
                        type="number"
                        min={Math.round(ZOOM_MIN * 100)}
                        max={Math.round(ZOOM_MAX * 100)}
                        step={1}
                        value={Math.round(zoom * 100)}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) return;
                          setZoom(clampZoomValue(raw / 100));
                        }}
                        onBlur={() => setZoom(clampZoomValue(zoom))}
                        className={inputCompact}
                      />
                      <span className={mutedText}>%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("tools")}
              aria-expanded={openSections.tools}
            >
              <span>Measurement Tools</span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.tools ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            {openSections.tools && (
              <div className={groupContentClass}>
                <div className={sectionClass}>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={toggleRulerMode}
                      className={`${rulerMode ? toggleOn : toggleOff} flex-1`}
                    >
                      {rulerMode ? "Ruler: ON" : "Ruler: OFF"}
                    </button>
                    <button
                      onClick={clearMeasurements}
                      disabled={!hasMeasurements}
                      className={miniButton}
                    >
                      Clear
                    </button>
                    
                  </div>
                  <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
                    {measurementRows.length ? (
                      measurementRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="flex-1 text-emerald-500 dark:text-emerald-400">
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
                    ) : null}
                  </div>
                  {measurementTotalLabel && (
                    <div className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400">
                      {measurementTotalLabel}
                    </div>
                  )}
                </div>

                <div className={sectionClass}>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={toggleLldMode}
                      className={`${lldMode ? toggleOn : toggleOff} flex-1`}
                    >
                      {lldMode ? "LLD: ON" : "LLD: OFF"}
                    </button>
                    <button
                      onClick={clearLldMeasurements}
                      disabled={!hasLldMeasurements}
                      className={miniButton}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
                    {lldRows.length ? (
                      lldRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="flex-1 text-sky-500 dark:text-sky-400">
                            {row.value}
                          </span>
                          <button
                            onClick={() => removeLldMeasurement(row.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove LLD measurement"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>

                <div className={sectionClass}>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={toggleOffsetMode}
                      className={`${offsetMode ? toggleOn : toggleOff} flex-1`}
                    >
                      {offsetMode ? "Offset: ON" : "Offset: OFF"}
                    </button>
                    <button
                      onClick={clearOffsetMeasurements}
                      disabled={!hasOffsetMeasurements}
                      className={miniButton}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
                    {offsetRows.length ? (
                      offsetRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="flex-1 text-amber-500 dark:text-amber-400">
                            {row.value}
                          </span>
                          <button
                            onClick={() => removeOffsetMeasurement(row.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove offset measurement"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>

                <div className={sectionClass}>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={toggleAngleMode}
                      className={`${angleMode ? toggleOn : toggleOff} flex-1`}
                    >
                      {angleMode ? "Angle: ON" : "Angle: OFF"}
                    </button>
                    <button
                      onClick={clearAngles}
                      disabled={!hasAngles}
                      className={miniButton}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto pr-1">
                    {angleRows.length ? (
                      angleRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="flex-1 text-emerald-500 dark:text-emerald-400">
                            {row.value}
                          </span>
                          <button
                            onClick={() => removeAngleMeasurement(row.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove angle measurement"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>


          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("calibration")}
              aria-expanded={openSections.calibration}
            >
              <span>Calibration</span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.calibration ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            {openSections.calibration && (
              <div className={groupContentClass}>
                <div className={sectionClass}>
                  <label className={labelClass}>Marker Length (mm)</label>
                  <input
                    type="number"
                    value={realMm}
                    onChange={(e) => setRealMm(Number(e.target.value))}
                    className={inputFull}
                  />
                  <button onClick={applyCalibration} className={secondaryButton}>
                    Apply Calibration
                  </button>
                  <button
                    type="button"
                    onClick={syncScaleMode ? stopSyncScale : startSyncScale}
                    className={`${syncScaleMode ? toggleOn : toggleOff} w-full`}
                  >
                    {syncScaleMode ? "Sync Scale: ON" : "Sync X-ray Scale"}
                  </button>
                  <div className={mutedText}>
                    Click 2 points on {realMm} mm scale bar.
                  </div>
                </div>
              </div>
            )}
          </div>

        
          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("overview")}
              aria-expanded={openSections.overview}
            >
              <span>Overview & Notes</span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.overview ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            {openSections.overview && (
              <div className={groupContentClass}>

                <div className={sectionClass}>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={toggleAnnotationMode}
                      className={`${annotationMode ? toggleOn : toggleOff} flex-1`}
                    >
                      {annotationMode ? "Annotate: ON" : "Annotate: OFF"}
                    </button>
                    <button
                      onClick={clearAnnotations}
                      disabled={!annotations.length}
                      className={miniButton}
                    >
                      Clear
                    </button>
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
                            className="flex-1 truncate text-left text-gray-700 hover:text-emerald-600"
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
                    ) : null}
                  </div>
                </div>
              </div>
            )}
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
  const shellClass =
    "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/70 dark:border-neutral-700/70 w-36";
  const headerClass =
    "cursor-move px-3 py-2 border-b border-gray-200/70 dark:border-neutral-700/70 text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200 flex items-center justify-between";
  const contentClass = "p-3 space-y-3 text-xs";
  const sectionClass =
    "rounded-xl border border-gray-200/60 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-800/40 p-2 space-y-2";
  const labelClass = "text-[11px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const rangeClass = "w-full accent-emerald-500";
  const helperText = "text-[10px] text-gray-500";
  const safeScaleStep = Math.abs(scaleStep) || 0.01;
  const safeRotateStep = Math.abs(rotateStep) || 1;

  return (
    <div
      ref={toolbarRef}
      className="hidden md:block fixed z-40 select-none touch-none"
      style={{ left: toolbarPos.x, top: toolbarPos.y }}
      onPointerMove={onToolbarPointerMove}
      onPointerUp={onToolbarPointerUp}
    >
      <div className={shellClass}>
        {/* HEADER (DRAG HANDLE) */}
        <div
          className={headerClass}
          onPointerDown={onToolbarPointerDown}
        >
          <span>Implant Tool</span>
          <span className="text-gray-400">
            <Grab />
          </span>
        </div>

        {/* CONTENT */}
        <div className={contentClass}>
          {/* ================= HISTORY ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>History</label>
            <div className="flex gap-1 mt-1">
              <TB onClick={undo} disabled={!canUndo}>
                <Undo2 />
              </TB>
              <TB onClick={redo} disabled={!canRedo}>
                <Redo2 />
              </TB>
            </div>
          </div>

          {/* ================= MOVE ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Move (px)</label>
            <input
              type="number"
              value={moveStep}
              onChange={(e) => setMoveStep(Number(e.target.value))}
              className={inputFull}
            />

            <div className="grid grid-cols-3 gap-0 place-items-center">
              <div />
              <TB onClick={() => moveActive(0, -moveStep)}>↑</TB>
              <div />

              <TB onClick={() => moveActive(-moveStep, 0)}>←</TB>
              <div
                className="w-8 h-8 rounded-lg bg-gray-100/80 dark:bg-neutral-800/70 text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center"
              >
                MOVE
              </div>
              <TB onClick={() => moveActive(moveStep, 0)}>→</TB>

              <div />
              <TB onClick={() => moveActive(0, moveStep)}>↓</TB>
              <div />
            </div>
          </div>

          {/* ================= SCALE (REAL) ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Scale</label>

            <input
              type="range"
              min={0.1}
              max={3}
              step={0.01}
              value={active.scaleX}
              onChange={(e) => updateActiveScale(Number(e.target.value))}
              className={rangeClass}
            />
            {mmPerPixel && (
              <div className="mt-2 space-y-1">
                <label className={labelClass}>Real Length (mm)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={active.realLengthMm ?? ""}
                  onChange={(e) => scaleImplantByMm(Number(e.target.value))}
                  className={inputFull}
                />
                <div className={helperText}>
                  Calibrated ✓ ({mmPerPixel.toFixed(3)} mm/px)
                </div>
              </div>
            )}

            <input
              type="number"
              step={0.01}
              value={active.scaleX}
              onChange={(e) => updateActiveScale(Number(e.target.value))}
              className={inputFull}
            />

            <div className="flex gap-1 mt-1">
              <TB onClick={() => scaleActive(safeScaleStep)}>＋</TB>
              <TB onClick={() => scaleActive(-safeScaleStep)}>－</TB>
            </div>
          </div>

          {/* ================= ROTATE (REAL) ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Rotate (°)</label>

            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={active.rotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className={rangeClass}
            />

            <input
              type="number"
              step={1}
              value={active.rotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className={inputFull}
            />

            <div className="flex gap-1 mt-1">
              <TB onClick={() => rotateActive(safeRotateStep)}>
                <RotateCw />
              </TB>
              <TB onClick={() => rotateActive(-safeRotateStep)}>
                <RotateCcwIcon />
              </TB>
            </div>
          </div>

          {/* ================= FLIP ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Flip</label>
            <div className="flex gap-1">
              <TB onClick={flipActiveX}>
                <FlipHorizontal />
              </TB>
              <TB onClick={flipActiveY}>
                <FlipVertical />
              </TB>
            </div>
          </div>

          {/* ================= LOCK + DELETE ================= */}
          <div className={sectionClass}>
            <label className={labelClass}>Lock & Delete</label>
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
  const safeScaleStep = Math.abs(scaleStep) || 0.01;
  const safeRotateStep = Math.abs(rotateStep) || 1;

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
        <MB onClick={() => scaleActive(safeScaleStep)}>
          <Plus />
        </MB>
        <MB onClick={() => scaleActive(-safeScaleStep)}>
          <Minus />
        </MB>
        <MB onClick={() => rotateActive(safeRotateStep)}>
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
  lldMode,
  offsetMode,
  angleMode,
  zoom,
  rulerDisplayDivisor,
  annotationMode,
  onRotateHandleDown,
  onScaleHandleDown,
  measurements,
  lldMeasurements,
  offsetMeasurements,
  angleMeasurements,
  anglePoints,
  angleDraft,
  draftStart,
  draftEnd,
  lldDraftStart,
  lldDraftEnd,
  offsetDraftStart,
  offsetDraftEnd,
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
  onDownObject: (e: React.PointerEvent, objectId?: string) => void;
  background: string | null;
  xrayContrast: number;
  objects: ImplantCanvasObject[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  rulerMode: boolean;
  lldMode: boolean;
  offsetMode: boolean;
  angleMode: boolean;
  zoom: number;
  rulerDisplayDivisor: number;
  annotationMode: boolean;
  onRotateHandleDown: (e: React.PointerEvent) => void;
  onScaleHandleDown: (e: React.PointerEvent, dir: ScaleDir) => void;
  measurements: RulerMeasurement[];
  lldMeasurements: LldMeasurement[];
  offsetMeasurements: OffsetMeasurement[];
  angleMeasurements: AngleMeasurement[];
  anglePoints: { x: number; y: number }[];
  angleDraft: { x: number; y: number } | null;
  draftStart: { x: number; y: number } | null;
  draftEnd: { x: number; y: number } | null;
  lldDraftStart: { x: number; y: number } | null;
  lldDraftEnd: { x: number; y: number } | null;
  offsetDraftStart: { x: number; y: number } | null;
  offsetDraftEnd: { x: number; y: number } | null;
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
  const toMm = (px: number) => {
    const mmScale = mmPerPixel ?? 1;
    const divisor = rulerDisplayDivisor || 1;
    return (px * mmScale) / divisor;
  };

  const applyRulerCorrection = (mm: number) => {
    const abs = Math.abs(mm);
    const rounded = Math.round(abs);
    if (rounded >= 10 && rounded <= 19) return mm - 2 * Math.sign(mm);
    if (abs > 70) return mm - 20 * Math.sign(mm);
    return mm;
  };

  const formatDistancePx = (px: number) => `${toMm(px).toFixed(1)} mm`;
  const formatRulerDistancePx = (px: number) =>
    `${applyRulerCorrection(toMm(px)).toFixed(1)} mm`;

  const formatDistance = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => formatRulerDistancePx(Math.hypot(end.x - start.x, end.y - start.y));
  const formatAxisDistance = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    axis: "x" | "y"
  ) => formatDistancePx(Math.abs(end[axis] - start[axis]));
  const formatLld = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => `LLD ${formatAxisDistance(start, end, "y")}`;
  const formatOffset = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => `Head Offset ${formatAxisDistance(start, end, "x")}`;

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
    const offset = 22;
    return { x: b.x + dir.x * offset, y: b.y + dir.y * offset };
  };

  const totalDistancePx = measurements.reduce(
    (sum, m) => sum + Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y),
    0
  );
  const currentLabel =
    draftStart && draftEnd ? formatDistance(draftStart, draftEnd) : null;
  const totalLabel = measurements.length
    ? formatRulerDistancePx(totalDistancePx)
    : null;
  const lastMeasurement = measurements[measurements.length - 1] ?? null;
  const lastLabel = lastMeasurement
    ? formatDistance(lastMeasurement.start, lastMeasurement.end)
    : null;

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 isolate ${
        rulerMode || angleMode || lldMode || offsetMode || annotationMode
          ? "cursor-crosshair"
          : ""
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
              !rulerMode &&
              !angleMode &&
              !lldMode &&
              !offsetMode &&
              !annotationMode &&
              o.id === activeId
                ? "ring-2 ring-blue-500"
                : ""
            }`}
          >
            <div
              onPointerDown={(e) => {
                if (
                  rulerMode ||
                  angleMode ||
                  lldMode ||
                  offsetMode ||
                  annotationMode ||
                  e.shiftKey
                )
                  return;
                setActiveId(o.id);
                e.stopPropagation();
                onDownObject(e, o.id);
              }}
            >
              {activeId === o.id &&
                !rulerMode &&
                !angleMode &&
                !lldMode &&
                !offsetMode &&
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
                  stroke={ANGLE_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <line
                  x1={angle.b.x}
                  y1={angle.b.y}
                  x2={angle.c.x}
                  y2={angle.c.y}
                  stroke={ANGLE_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={angle.b.x}
                  cy={angle.b.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={ANGLE_COLOR}
                  strokeWidth={2}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill={ANGLE_COLOR}
                  fontSize="13"
                  fontWeight={700}
                  stroke="#0b0f0d"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
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
                stroke={ANGLE_COLOR}
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
                  stroke={ANGLE_COLOR}
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
                <line
                  x1={anglePoints[1].x}
                  y1={anglePoints[1].y}
                  x2={angleDraft.x}
                  y2={angleDraft.y}
                  stroke={ANGLE_COLOR}
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill={ANGLE_COLOR}
                  fontSize="13"
                  fontWeight={700}
                  stroke="#0b0f0d"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
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
                  stroke={RULER_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={labelX}
                  y2={labelY}
                  stroke={RULER_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={m.start.x}
                  cy={m.start.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={RULER_COLOR}
                  strokeWidth={2}
                />
                <circle
                  cx={m.end.x}
                  cy={m.end.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={RULER_COLOR}
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={labelY}
                  fill={RULER_COLOR}
                  fontSize="13"
                  fontWeight={700}
                  stroke="#0b0f0d"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
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
                  stroke={RULER_COLOR}
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
                  stroke={RULER_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={draftStart.x}
                  cy={draftStart.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={RULER_COLOR}
                  strokeWidth={2}
                />
                <circle
                  cx={draftEnd.x}
                  cy={draftEnd.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={RULER_COLOR}
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={labelY}
                  fill={RULER_COLOR}
                  fontSize="13"
                  fontWeight={700}
                  stroke="#0b0f0d"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {formatDistance(draftStart, draftEnd)}
                </text>
              </g>
              );
            })()}
          {lldMeasurements.map((m) => {
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
                  stroke={LLD_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={labelX}
                  y2={labelY}
                  stroke={LLD_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={m.start.x}
                  cy={m.start.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={LLD_COLOR}
                  strokeWidth={2}
                />
                <circle
                  cx={m.end.x}
                  cy={m.end.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={LLD_COLOR}
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={labelY}
                  fill={LLD_COLOR}
                  fontSize="12"
                  fontWeight={600}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {formatLld(m.start, m.end)}
                </text>
              </g>
            );
          })}
          {lldDraftStart &&
            lldDraftEnd &&
            (() => {
              const dx = lldDraftEnd.x - lldDraftStart.x;
              const dy = lldDraftEnd.y - lldDraftStart.y;
              const length = Math.hypot(dx, dy) || 1;
              const ux = dx / length;
              const uy = dy / length;
              const px = -uy;
              const py = ux;
              const midX = (lldDraftStart.x + lldDraftEnd.x) / 2;
              const midY = (lldDraftStart.y + lldDraftEnd.y) / 2;
              const labelOffset = 14;
              const labelX = midX + px * labelOffset;
              const labelY = midY + py * labelOffset;
              const labelPad = 6;
              const textX = labelX + (px >= 0 ? labelPad : -labelPad);
              const textAnchor = px >= 0 ? "start" : "end";

              return (
                <g>
                  <line
                    x1={lldDraftStart.x}
                    y1={lldDraftStart.y}
                    x2={lldDraftEnd.x}
                    y2={lldDraftEnd.y}
                    stroke={LLD_COLOR}
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
                    stroke={LLD_COLOR}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={lldDraftStart.x}
                    cy={lldDraftStart.y}
                    r={4}
                    fill="#0b0f0d"
                    stroke={LLD_COLOR}
                    strokeWidth={2}
                  />
                  <circle
                    cx={lldDraftEnd.x}
                    cy={lldDraftEnd.y}
                    r={4}
                    fill="#0b0f0d"
                    stroke={LLD_COLOR}
                    strokeWidth={2}
                  />
                  <text
                    x={textX}
                    y={labelY}
                    fill={LLD_COLOR}
                    fontSize="12"
                    fontWeight={600}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                  >
                    {formatLld(lldDraftStart, lldDraftEnd)}
                  </text>
                </g>
              );
            })()}
          {offsetMeasurements.map((m) => {
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
                  stroke={OFFSET_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={labelX}
                  y2={labelY}
                  stroke={OFFSET_COLOR}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle
                  cx={m.start.x}
                  cy={m.start.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={OFFSET_COLOR}
                  strokeWidth={2}
                />
                <circle
                  cx={m.end.x}
                  cy={m.end.y}
                  r={4}
                  fill="#0b0f0d"
                  stroke={OFFSET_COLOR}
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={labelY}
                  fill={OFFSET_COLOR}
                  fontSize="12"
                  fontWeight={600}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {formatOffset(m.start, m.end)}
                </text>
              </g>
            );
          })}
          {offsetDraftStart &&
            offsetDraftEnd &&
            (() => {
              const dx = offsetDraftEnd.x - offsetDraftStart.x;
              const dy = offsetDraftEnd.y - offsetDraftStart.y;
              const length = Math.hypot(dx, dy) || 1;
              const ux = dx / length;
              const uy = dy / length;
              const px = -uy;
              const py = ux;
              const midX = (offsetDraftStart.x + offsetDraftEnd.x) / 2;
              const midY = (offsetDraftStart.y + offsetDraftEnd.y) / 2;
              const labelOffset = 14;
              const labelX = midX + px * labelOffset;
              const labelY = midY + py * labelOffset;
              const labelPad = 6;
              const textX = labelX + (px >= 0 ? labelPad : -labelPad);
              const textAnchor = px >= 0 ? "start" : "end";

              return (
                <g>
                  <line
                    x1={offsetDraftStart.x}
                    y1={offsetDraftStart.y}
                    x2={offsetDraftEnd.x}
                    y2={offsetDraftEnd.y}
                    stroke={OFFSET_COLOR}
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
                    stroke={OFFSET_COLOR}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={offsetDraftStart.x}
                    cy={offsetDraftStart.y}
                    r={4}
                    fill="#0b0f0d"
                    stroke={OFFSET_COLOR}
                    strokeWidth={2}
                  />
                  <circle
                    cx={offsetDraftEnd.x}
                    cy={offsetDraftEnd.y}
                    r={4}
                    fill="#0b0f0d"
                    stroke={OFFSET_COLOR}
                    strokeWidth={2}
                  />
                  <text
                    x={textX}
                    y={labelY}
                    fill={OFFSET_COLOR}
                    fontSize="12"
                    fontWeight={600}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                  >
                    {formatOffset(offsetDraftStart, offsetDraftEnd)}
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
  const stemCount = Object.values(groupedLibrary.stem).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const cupCount = Object.values(groupedLibrary.cup).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-gray-200/70 dark:border-neutral-700/70 shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-4 py-3 border-b border-gray-200/70 dark:border-neutral-700/70 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Implant Library
            </div>
            <div className="text-[11px] text-gray-500">
              {stemCount + cupCount} templates
            </div>
          </div>
          <button
            onClick={() => setOpenImplantModal(false)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
            aria-label="Close implant library"
          >
            ✕
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-3 border-b border-gray-200/70 dark:border-neutral-700/70 bg-gray-50/70 dark:bg-neutral-900/60">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search implant…"
            className="w-full rounded-lg px-3 py-2 text-xs border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="max-h-[65svh] overflow-y-auto">
          {/* ================= STEM ================= */}
          <button
            onClick={() => setOpenType((p) => ({ ...p, stem: !p.stem }))}
            className="w-full px-4 py-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
          >
            <span>🦴 Stem</span>
            <span className="text-[11px] text-gray-500">{stemCount}</span>
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
                {Object.entries(groupedLibrary.stem).map(([system, items]) => {
                  const systemKey = `stem:${system}`;
                  const isOpen = Boolean(openSystem[systemKey]);
                  return (
                  <div key={system}>
                    {/* SYSTEM HEADER */}
                    <button
                      onClick={() =>
                        setOpenSystem((p) => ({
                          ...p,
                          [systemKey]: !p[systemKey],
                        }))
                      }
                      className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                    >
                      <span>
                        {isOpen ? "▾" : "▸"} {system}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {items.length}
                      </span>
                    </button>

                    {/* SYSTEM CONTENT */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          variants={collapseVariants}
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          className="overflow-hidden"
                        >
                          {items.map((item) => (
                            <button
                              key={`${system}:${item.id}:${item.label}`}
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
                );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= CUP ================= */}
          <button
            onClick={() => setOpenType((p) => ({ ...p, cup: !p.cup }))}
            className="w-full px-4 py-2 mt-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
          >
            <span>Cup</span>
            <span className="text-[11px] text-gray-500">{cupCount}</span>
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
                {Object.entries(groupedLibrary.cup).map(([system, items]) => {
                  const systemKey = `cup:${system}`;
                  const isOpen = Boolean(openSystem[systemKey]);
                  return (
                    <div key={system}>
                      <button
                        onClick={() =>
                          setOpenSystem((p) => ({
                            ...p,
                            [systemKey]: !p[systemKey],
                          }))
                        }
                        className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                      >
                        <span>
                          {isOpen ? "▾" : "▸"} {system}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {items.length}
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            variants={collapseVariants}
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            className="overflow-hidden"
                          >
                            {items.map((item) => (
                              <button
                                key={`${system}:${item.id}:${item.label}`}
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
                  );
                })}
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
