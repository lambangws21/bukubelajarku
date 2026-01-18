"use client";

import { useCallback, useMemo, useState } from "react";
import type { CanvasMode } from "@/components/digitalTemplating/viewer/utils";
import { getXrayTransform } from "@/components/digitalTemplating/viewer/utils";
import {
  XRAY_BASE_HEIGHT,
  XRAY_BASE_WIDTH,
} from "@/components/digitalTemplating/viewer/constants";
import type {
  MeasurementHandle,
  Side,
  TibialCutLine,
  TibialSlopeLine,
  ValgusCutLine,
} from "@/components/digitalTemplating/viewer/types";

export type KneeLineKind = "valgusCut" | "tibialSlope" | "tibialCut";

export function useKneePlanningState() {
  const [valgusCutMode, setValgusCutMode] = useState(false);
  const [valgusCutAngleDeg, setValgusCutAngleDeg] = useState(5);
  const [valgusCutSide, setValgusCutSide] = useState<Side>("Right");
  const [valgusCutLines, setValgusCutLines] = useState<ValgusCutLine[]>([]);
  const [valgusCutAnchor, setValgusCutAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [valgusCutDraft, setValgusCutDraft] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [valgusCutOffsetPx, setValgusCutOffsetPx] = useState(10);
  const [valgusCutStrokeWidth, setValgusCutStrokeWidth] = useState(2);
  const [valgusCutLineLengthPx, setValgusCutLineLengthPx] = useState(100);

  const [tibialSlopeMode, setTibialSlopeMode] = useState(false);
  const [tibialSlopeDeg, setTibialSlopeDeg] = useState(7);
  const [tibialPosteriorSide, setTibialPosteriorSide] = useState<Side>("Right");
  const [tibialSlopeLines, setTibialSlopeLines] = useState<TibialSlopeLine[]>(
    []
  );
  const [tibialSlopeAnchor, setTibialSlopeAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tibialSlopeDraft, setTibialSlopeDraft] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tibialSlopeOffsetPx, setTibialSlopeOffsetPx] = useState(10);
  const [tibialSlopeLineLengthPx, setTibialSlopeLineLengthPx] = useState(90);
  const [tibialSlopeStrokeWidth, setTibialSlopeStrokeWidth] = useState(2);

  const [tibialCutMode, setTibialCutMode] = useState(false);
  const [tibialCutAngleDeg, setTibialCutAngleDeg] = useState(3);
  const [tibialCutDirection, setTibialCutDirection] = useState<
    "Varus" | "Valgus"
  >("Valgus");
  const [tibialCutLines, setTibialCutLines] = useState<TibialCutLine[]>([]);
  const [tibialCutAnchor, setTibialCutAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tibialCutDraft, setTibialCutDraft] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tibialCutOffsetPx, setTibialCutOffsetPx] = useState(10);
  const [tibialCutLineLengthPx, setTibialCutLineLengthPx] = useState(90);
  const [tibialCutStrokeWidth, setTibialCutStrokeWidth] = useState(2);

  return {
    valgusCutMode,
    setValgusCutMode,
    valgusCutAngleDeg,
    setValgusCutAngleDeg,
    valgusCutSide,
    setValgusCutSide,
    valgusCutLines,
    setValgusCutLines,
    valgusCutAnchor,
    setValgusCutAnchor,
    valgusCutDraft,
    setValgusCutDraft,
    valgusCutOffsetPx,
    setValgusCutOffsetPx,
    valgusCutStrokeWidth,
    setValgusCutStrokeWidth,
    valgusCutLineLengthPx,
    setValgusCutLineLengthPx,

    tibialSlopeMode,
    setTibialSlopeMode,
    tibialSlopeDeg,
    setTibialSlopeDeg,
    tibialPosteriorSide,
    setTibialPosteriorSide,
    tibialSlopeLines,
    setTibialSlopeLines,
    tibialSlopeAnchor,
    setTibialSlopeAnchor,
    tibialSlopeDraft,
    setTibialSlopeDraft,
    tibialSlopeOffsetPx,
    setTibialSlopeOffsetPx,
    tibialSlopeLineLengthPx,
    setTibialSlopeLineLengthPx,
    tibialSlopeStrokeWidth,
    setTibialSlopeStrokeWidth,

    tibialCutMode,
    setTibialCutMode,
    tibialCutAngleDeg,
    setTibialCutAngleDeg,
    tibialCutDirection,
    setTibialCutDirection,
    tibialCutLines,
    setTibialCutLines,
    tibialCutAnchor,
    setTibialCutAnchor,
    tibialCutDraft,
    setTibialCutDraft,
    tibialCutOffsetPx,
    setTibialCutOffsetPx,
    tibialCutLineLengthPx,
    setTibialCutLineLengthPx,
    tibialCutStrokeWidth,
    setTibialCutStrokeWidth,
  };
}

type KneePlanningState = ReturnType<typeof useKneePlanningState>;

const clampStagePoint = (p: { x: number; y: number }) => ({
  x: Math.min(XRAY_BASE_WIDTH, Math.max(0, p.x)),
  y: Math.min(XRAY_BASE_HEIGHT, Math.max(0, p.y)),
});

const distancePointToSegmentSq = (
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    return apx * apx + apy * apy;
  }
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  const dx = point.x - cx;
  const dy = point.y - cy;
  return dx * dx + dy * dy;
};

export function useKneePlanningActions({
  state,
  pushHistorySnapshot,
  onToggleAny,
  onEnableTool,
  stageRef,
  zoom,
  canvasMode,
  cameraMode,
}: {
  state: KneePlanningState;
  pushHistorySnapshot: () => void;
  onToggleAny: () => void;
  onEnableTool: () => void;
  stageRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  canvasMode: CanvasMode;
  cameraMode: boolean;
}) {
  const {
    valgusCutMode,
    setValgusCutMode,
    valgusCutAngleDeg,
    valgusCutSide,
    valgusCutLines,
    setValgusCutLines,
    valgusCutAnchor,
    setValgusCutAnchor,
    setValgusCutDraft,
    valgusCutStrokeWidth,
    tibialSlopeMode,
    setTibialSlopeMode,
    tibialSlopeDeg,
    tibialPosteriorSide,
    tibialSlopeLines,
    setTibialSlopeLines,
    tibialSlopeAnchor,
    setTibialSlopeAnchor,
    setTibialSlopeDraft,
    tibialSlopeStrokeWidth,
    tibialCutMode,
    setTibialCutMode,
    tibialCutAngleDeg,
    tibialCutDirection,
    tibialCutLines,
    setTibialCutLines,
    tibialCutAnchor,
    setTibialCutAnchor,
    setTibialCutDraft,
    tibialCutStrokeWidth,
  } = state;

  const resetValgusCut = useCallback(() => {
    if (!valgusCutLines.length) return;
    pushHistorySnapshot();
    setValgusCutLines([]);
    setValgusCutAnchor(null);
    setValgusCutDraft(null);
  }, [
    pushHistorySnapshot,
    setValgusCutAnchor,
    setValgusCutDraft,
    setValgusCutLines,
    valgusCutLines.length,
  ]);

  const resetTibialSlope = useCallback(() => {
    if (!tibialSlopeLines.length) return;
    pushHistorySnapshot();
    setTibialSlopeLines([]);
    setTibialSlopeAnchor(null);
    setTibialSlopeDraft(null);
  }, [
    pushHistorySnapshot,
    setTibialSlopeAnchor,
    setTibialSlopeDraft,
    setTibialSlopeLines,
    tibialSlopeLines.length,
  ]);

  const resetTibialCut = useCallback(() => {
    if (!tibialCutLines.length) return;
    pushHistorySnapshot();
    setTibialCutLines([]);
    setTibialCutAnchor(null);
    setTibialCutDraft(null);
  }, [
    pushHistorySnapshot,
    setTibialCutAnchor,
    setTibialCutDraft,
    setTibialCutLines,
    tibialCutLines.length,
  ]);

  const removeValgusCutLine = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setValgusCutLines((prev) => prev.filter((line) => line.id !== id));
    },
    [pushHistorySnapshot, setValgusCutLines]
  );

  const toggleValgusCutLineLock = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setValgusCutLines((prev) =>
        prev.map((line) =>
          line.id === id ? { ...line, locked: !line.locked } : line
        )
      );
    },
    [pushHistorySnapshot, setValgusCutLines]
  );

  const removeTibialSlopeLine = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setTibialSlopeLines((prev) => prev.filter((line) => line.id !== id));
    },
    [pushHistorySnapshot, setTibialSlopeLines]
  );

  const toggleTibialSlopeLineLock = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setTibialSlopeLines((prev) =>
        prev.map((line) =>
          line.id === id ? { ...line, locked: !line.locked } : line
        )
      );
    },
    [pushHistorySnapshot, setTibialSlopeLines]
  );

  const removeTibialCutLine = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setTibialCutLines((prev) => prev.filter((line) => line.id !== id));
    },
    [pushHistorySnapshot, setTibialCutLines]
  );

  const toggleTibialCutLineLock = useCallback(
    (id: string) => {
      pushHistorySnapshot();
      setTibialCutLines((prev) =>
        prev.map((line) =>
          line.id === id ? { ...line, locked: !line.locked } : line
        )
      );
    },
    [pushHistorySnapshot, setTibialCutLines]
  );

  const toggleValgusCutMode = useCallback(() => {
    onToggleAny();
    setValgusCutMode((prev) => {
      if (!prev) {
        onEnableTool();
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
        setTibialCutMode(false);
        setTibialCutDraft(null);
      }
      setValgusCutAnchor(null);
      setValgusCutDraft(null);
      return !prev;
    });
  }, [
    onEnableTool,
    onToggleAny,
    setTibialCutDraft,
    setTibialCutMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutAnchor,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleTibialSlopeMode = useCallback(() => {
    onToggleAny();
    setTibialSlopeMode((prev) => {
      if (!prev) {
        onEnableTool();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialCutMode(false);
        setTibialCutDraft(null);
      }
      setTibialSlopeAnchor(null);
      setTibialSlopeDraft(null);
      return !prev;
    });
  }, [
    onEnableTool,
    onToggleAny,
    setTibialCutDraft,
    setTibialCutMode,
    setTibialSlopeAnchor,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const toggleTibialCutMode = useCallback(() => {
    onToggleAny();
    setTibialCutMode((prev) => {
      if (!prev) {
        onEnableTool();
        setValgusCutMode(false);
        setValgusCutDraft(null);
        setTibialSlopeMode(false);
        setTibialSlopeDraft(null);
      }
      setTibialCutAnchor(null);
      setTibialCutDraft(null);
      return !prev;
    });
  }, [
    onEnableTool,
    onToggleAny,
    setTibialCutAnchor,
    setTibialCutDraft,
    setTibialCutMode,
    setTibialSlopeDraft,
    setTibialSlopeMode,
    setValgusCutDraft,
    setValgusCutMode,
  ]);

  const findKneeLineSegmentHit = useCallback(
    (point: { x: number; y: number }): { kind: KneeLineKind; id: string } | null => {
      const transform = getXrayTransform(stageRef, zoom, canvasMode, cameraMode);
      const scale = transform?.scale ?? zoom;
      const baseStroke = Math.max(
        valgusCutStrokeWidth,
        tibialSlopeStrokeWidth,
        tibialCutStrokeWidth
      );
      const hitRadius = Math.max(10, baseStroke * scale + 10) / scale;
      const hitRadiusSq = hitRadius * hitRadius;
      let best: { kind: KneeLineKind; id: string } | null = null;
      let bestDist = Number.POSITIVE_INFINITY;

      const test = (
        kind: KneeLineKind,
        id: string,
        a: { x: number; y: number },
        b: { x: number; y: number }
      ) => {
        const distSq = distancePointToSegmentSq(point, a, b);
        if (distSq > hitRadiusSq) return;
        if (distSq < bestDist) {
          bestDist = distSq;
          best = { kind, id };
        }
      };

      valgusCutLines.forEach((line) => {
        if (line.locked) return;
        test("valgusCut", line.id, line.hip, line.knee);
      });
      tibialSlopeLines.forEach((line) => {
        if (line.locked) return;
        test("tibialSlope", line.id, line.prox, line.dist);
      });
      tibialCutLines.forEach((line) => {
        if (line.locked) return;
        test("tibialCut", line.id, line.prox, line.dist);
      });

      return best;
    },
    [
      canvasMode,
      cameraMode,
      stageRef,
      tibialCutLines,
      tibialCutStrokeWidth,
      tibialSlopeLines,
      tibialSlopeStrokeWidth,
      valgusCutLines,
      valgusCutStrokeWidth,
      zoom,
    ]
  );

  const handleKneeDraftMove = useCallback(
    (point: { x: number; y: number }) => {
      if (valgusCutMode && valgusCutAnchor) {
        setValgusCutDraft(point);
        return true;
      }
      if (tibialSlopeMode && tibialSlopeAnchor) {
        setTibialSlopeDraft(point);
        return true;
      }
      if (tibialCutMode && tibialCutAnchor) {
        setTibialCutDraft(point);
        return true;
      }
      return false;
    },
    [
      tibialCutAnchor,
      tibialCutMode,
      tibialSlopeAnchor,
      tibialSlopeMode,
      valgusCutAnchor,
      valgusCutMode,
      setTibialCutDraft,
      setTibialSlopeDraft,
      setValgusCutDraft,
    ]
  );

  const handleKneeStageClick = useCallback(
    (
      point: { x: number; y: number },
      createId: () => string
    ) => {
      if (valgusCutMode) {
        if (!valgusCutAnchor) {
          setValgusCutAnchor(point);
          setValgusCutDraft(point);
          return true;
        }
        pushHistorySnapshot();
        setValgusCutLines((prev) => [
          ...prev,
          {
            id: createId(),
            hip: valgusCutAnchor,
            knee: point,
            side: valgusCutSide,
            angleDeg: valgusCutAngleDeg,
            locked: false,
          },
        ]);
        setValgusCutAnchor(null);
        setValgusCutDraft(null);
        return true;
      }

      if (tibialSlopeMode) {
        if (!tibialSlopeAnchor) {
          setTibialSlopeAnchor(point);
          setTibialSlopeDraft(point);
          return true;
        }
        pushHistorySnapshot();
        setTibialSlopeLines((prev) => [
          ...prev,
          {
            id: createId(),
            prox: tibialSlopeAnchor,
            dist: point,
            posteriorSide: tibialPosteriorSide,
            slopeDeg: tibialSlopeDeg,
            locked: false,
          },
        ]);
        setTibialSlopeAnchor(null);
        setTibialSlopeDraft(null);
        return true;
      }

      if (tibialCutMode) {
        if (!tibialCutAnchor) {
          setTibialCutAnchor(point);
          setTibialCutDraft(point);
          return true;
        }
        pushHistorySnapshot();
        setTibialCutLines((prev) => [
          ...prev,
          {
            id: createId(),
            prox: tibialCutAnchor,
            dist: point,
            direction: tibialCutDirection,
            angleDeg: tibialCutAngleDeg,
            locked: false,
          },
        ]);
        setTibialCutAnchor(null);
        setTibialCutDraft(null);
        return true;
      }

      return false;
    },
    [
      pushHistorySnapshot,
      setTibialCutAnchor,
      setTibialCutDraft,
      setTibialCutLines,
      setTibialSlopeAnchor,
      setTibialSlopeDraft,
      setTibialSlopeLines,
      setValgusCutAnchor,
      setValgusCutDraft,
      setValgusCutLines,
      tibialCutAnchor,
      tibialCutAngleDeg,
      tibialCutDirection,
      tibialCutMode,
      tibialPosteriorSide,
      tibialSlopeAnchor,
      tibialSlopeDeg,
      tibialSlopeMode,
      valgusCutAnchor,
      valgusCutAngleDeg,
      valgusCutMode,
      valgusCutSide,
    ]
  );

  const handleKneeHandleDrag = useCallback(
    (
      kind: MeasurementHandle["kind"],
      id: string,
      pointKey: MeasurementHandle["point"],
      point: { x: number; y: number }
    ) => {
      if (kind === "valgusCut" && (pointKey === "hip" || pointKey === "knee")) {
        setValgusCutLines((prev) =>
          prev.map((line) => {
            if (line.id !== id) return line;
            if (line.locked) return line;
            return pointKey === "hip"
              ? { ...line, hip: point }
              : { ...line, knee: point };
          })
        );
        return true;
      }

      if (kind === "tibialSlope" && (pointKey === "prox" || pointKey === "dist")) {
        setTibialSlopeLines((prev) =>
          prev.map((line) => {
            if (line.id !== id) return line;
            if (line.locked) return line;
            return pointKey === "prox"
              ? { ...line, prox: point }
              : { ...line, dist: point };
          })
        );
        return true;
      }

      if (kind === "tibialCut" && (pointKey === "prox" || pointKey === "dist")) {
        setTibialCutLines((prev) =>
          prev.map((line) => {
            if (line.id !== id) return line;
            if (line.locked) return line;
            return pointKey === "prox"
              ? { ...line, prox: point }
              : { ...line, dist: point };
          })
        );
        return true;
      }

      return false;
    },
    [setTibialCutLines, setTibialSlopeLines, setValgusCutLines]
  );

  const moveKneeLine = useCallback(
    (kind: KneeLineKind, id: string, dx: number, dy: number) => {
      const applyDelta = (p: { x: number; y: number }) =>
        clampStagePoint({ x: p.x + dx, y: p.y + dy });

      if (kind === "valgusCut") {
        setValgusCutLines((prev) =>
          prev.map((line) =>
            line.id === id
              ? { ...line, hip: applyDelta(line.hip), knee: applyDelta(line.knee) }
              : line
          )
        );
        return;
      }

      if (kind === "tibialSlope") {
        setTibialSlopeLines((prev) =>
          prev.map((line) =>
            line.id === id
              ? {
                  ...line,
                  prox: applyDelta(line.prox),
                  dist: applyDelta(line.dist),
                }
              : line
          )
        );
        return;
      }

      setTibialCutLines((prev) =>
        prev.map((line) =>
          line.id === id
            ? {
                ...line,
                prox: applyDelta(line.prox),
                dist: applyDelta(line.dist),
              }
            : line
        )
      );
    },
    [setTibialCutLines, setTibialSlopeLines, setValgusCutLines]
  );

  return useMemo(
    () => ({
      resetValgusCut,
      resetTibialSlope,
      resetTibialCut,
      removeValgusCutLine,
      toggleValgusCutLineLock,
      removeTibialSlopeLine,
      toggleTibialSlopeLineLock,
      removeTibialCutLine,
      toggleTibialCutLineLock,
      toggleValgusCutMode,
      toggleTibialSlopeMode,
      toggleTibialCutMode,
      findKneeLineSegmentHit,
      handleKneeDraftMove,
      handleKneeStageClick,
      handleKneeHandleDrag,
      moveKneeLine,
    }),
    [
      findKneeLineSegmentHit,
      handleKneeDraftMove,
      handleKneeHandleDrag,
      handleKneeStageClick,
      moveKneeLine,
      removeTibialCutLine,
      removeTibialSlopeLine,
      removeValgusCutLine,
      resetTibialCut,
      resetTibialSlope,
      resetValgusCut,
      toggleTibialCutLineLock,
      toggleTibialCutMode,
      toggleTibialSlopeLineLock,
      toggleTibialSlopeMode,
      toggleValgusCutLineLock,
      toggleValgusCutMode,
    ]
  );
}
