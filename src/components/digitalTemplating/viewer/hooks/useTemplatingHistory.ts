"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TemplatingCanvasObject } from "@/components/digitalTemplating/implantLibrary";
import type {
  AhkaMeasurement,
  AngleMeasurement,
  Annotation,
  CorMarker,
  DrawLine,
  FreehandStroke,
  HistoryState,
  LldMeasurement,
  OffsetMeasurement,
  RulerMeasurement,
  TibialCutLine,
  TibialSlopeLine,
  ValgusCutLine,
} from "@/components/digitalTemplating/viewer/types";

const cloneObjects = (items: TemplatingCanvasObject[]) =>
  items.map((o) => ({
    ...o,
    position: { ...o.position },
  }));

const cloneRulerMeasurements = (items: RulerMeasurement[]) =>
  items.map((m) => ({
    ...m,
    start: { ...m.start },
    end: { ...m.end },
  }));

const cloneLldMeasurements = (items: LldMeasurement[]) =>
  items.map((m) => ({
    ...m,
    start: { ...m.start },
    end: { ...m.end },
  }));

const cloneOffsetMeasurements = (items: OffsetMeasurement[]) =>
  items.map((m) => ({
    ...m,
    start: { ...m.start },
    end: { ...m.end },
  }));

const cloneAngleMeasurements = (items: AngleMeasurement[]) =>
  items.map((m) => ({
    ...m,
    a: { ...m.a },
    b: { ...m.b },
    c: { ...m.c },
  }));

const cloneAhkaMeasurements = (items: AhkaMeasurement[]) =>
  items.map((m) => ({
    ...m,
    hip: { ...m.hip },
    knee: { ...m.knee },
    ankle: { ...m.ankle },
  }));

const cloneDrawLines = (items: DrawLine[]) =>
  items.map((l) => ({
    ...l,
    start: { ...l.start },
    end: { ...l.end },
  }));

const cloneStrokes = (items: FreehandStroke[]) =>
  items.map((s) => ({
    ...s,
    points: s.points.map((p) => ({ ...p })),
  }));

const cloneCorMarkers = (items: CorMarker[]) =>
  items.map((m) => ({
    ...m,
    point: { ...m.point },
  }));

const cloneAnnotations = (items: Annotation[]) => items.map((a) => ({ ...a }));

const cloneValgusCutLines = (items: ValgusCutLine[]) =>
  items.map((l) => ({
    ...l,
    hip: { ...l.hip },
    knee: { ...l.knee },
  }));

const cloneTibialSlopeLines = (items: TibialSlopeLine[]) =>
  items.map((l) => ({
    ...l,
    prox: { ...l.prox },
    dist: { ...l.dist },
  }));

const cloneTibialCutLines = (items: TibialCutLine[]) =>
  items.map((l) => ({
    ...l,
    prox: { ...l.prox },
    dist: { ...l.dist },
  }));

export function useTemplatingHistory({
  objects,
  setObjects,
  activeId,
  setActiveId,
  measurements,
  setMeasurements,
  lldMeasurements,
  setLldMeasurements,
  offsetMeasurements,
  setOffsetMeasurements,
  angleMeasurements,
  setAngleMeasurements,
  ahkaMeasurements,
  setAhkaMeasurements,
  drawLines,
  setDrawLines,
  strokes,
  setStrokes,
  corMarkers,
  setCorMarkers,
  annotations,
  setAnnotations,
  valgusCutLines,
  setValgusCutLines,
  tibialSlopeLines,
  setTibialSlopeLines,
  tibialCutLines,
  setTibialCutLines,
  resetInteractionDrafts,
}: {
  objects: TemplatingCanvasObject[];
  setObjects: React.Dispatch<React.SetStateAction<TemplatingCanvasObject[]>>;
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  measurements: RulerMeasurement[];
  setMeasurements: React.Dispatch<React.SetStateAction<RulerMeasurement[]>>;
  lldMeasurements: LldMeasurement[];
  setLldMeasurements: React.Dispatch<React.SetStateAction<LldMeasurement[]>>;
  offsetMeasurements: OffsetMeasurement[];
  setOffsetMeasurements: React.Dispatch<React.SetStateAction<OffsetMeasurement[]>>;
  angleMeasurements: AngleMeasurement[];
  setAngleMeasurements: React.Dispatch<React.SetStateAction<AngleMeasurement[]>>;
  ahkaMeasurements: AhkaMeasurement[];
  setAhkaMeasurements: React.Dispatch<React.SetStateAction<AhkaMeasurement[]>>;
  drawLines: DrawLine[];
  setDrawLines: React.Dispatch<React.SetStateAction<DrawLine[]>>;
  strokes: FreehandStroke[];
  setStrokes: React.Dispatch<React.SetStateAction<FreehandStroke[]>>;
  corMarkers: CorMarker[];
  setCorMarkers: React.Dispatch<React.SetStateAction<CorMarker[]>>;
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  valgusCutLines: ValgusCutLine[];
  setValgusCutLines: React.Dispatch<React.SetStateAction<ValgusCutLine[]>>;
  tibialSlopeLines: TibialSlopeLine[];
  setTibialSlopeLines: React.Dispatch<React.SetStateAction<TibialSlopeLine[]>>;
  tibialCutLines: TibialCutLine[];
  setTibialCutLines: React.Dispatch<React.SetStateAction<TibialCutLine[]>>;
  resetInteractionDrafts: () => void;
}) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const objectsRef = useRef(objects);
  const activeIdRef = useRef(activeId);
  const measurementsRef = useRef<RulerMeasurement[]>(measurements);
  const lldMeasurementsRef = useRef<LldMeasurement[]>(lldMeasurements);
  const offsetMeasurementsRef = useRef<OffsetMeasurement[]>(offsetMeasurements);
  const angleMeasurementsRef = useRef<AngleMeasurement[]>(angleMeasurements);
  const ahkaMeasurementsRef = useRef<AhkaMeasurement[]>(ahkaMeasurements);
  const drawLinesRef = useRef<DrawLine[]>(drawLines);
  const strokesRef = useRef<FreehandStroke[]>(strokes);
  const corMarkersRef = useRef<CorMarker[]>(corMarkers);
  const annotationsRef = useRef<Annotation[]>(annotations);
  const valgusCutLinesRef = useRef<ValgusCutLine[]>(valgusCutLines);
  const tibialSlopeLinesRef = useRef<TibialSlopeLine[]>(tibialSlopeLines);
  const tibialCutLinesRef = useRef<TibialCutLine[]>(tibialCutLines);

  useEffect(() => {
    objectsRef.current = objects;
    activeIdRef.current = activeId;
    measurementsRef.current = measurements;
    lldMeasurementsRef.current = lldMeasurements;
    offsetMeasurementsRef.current = offsetMeasurements;
    angleMeasurementsRef.current = angleMeasurements;
    ahkaMeasurementsRef.current = ahkaMeasurements;
    drawLinesRef.current = drawLines;
    strokesRef.current = strokes;
    corMarkersRef.current = corMarkers;
    annotationsRef.current = annotations;
    valgusCutLinesRef.current = valgusCutLines;
    tibialSlopeLinesRef.current = tibialSlopeLines;
    tibialCutLinesRef.current = tibialCutLines;
  }, [
    activeId,
    ahkaMeasurements,
    angleMeasurements,
    annotations,
    corMarkers,
    drawLines,
    lldMeasurements,
    measurements,
    objects,
    offsetMeasurements,
    strokes,
    tibialCutLines,
    tibialSlopeLines,
    valgusCutLines,
  ]);

  const snapshotCurrent = useCallback(
    () => ({
      objects: cloneObjects(objectsRef.current),
      activeId: activeIdRef.current,
      measurements: cloneRulerMeasurements(measurementsRef.current),
      lldMeasurements: cloneLldMeasurements(lldMeasurementsRef.current),
      offsetMeasurements: cloneOffsetMeasurements(offsetMeasurementsRef.current),
      angleMeasurements: cloneAngleMeasurements(angleMeasurementsRef.current),
      ahkaMeasurements: cloneAhkaMeasurements(ahkaMeasurementsRef.current),
      drawLines: cloneDrawLines(drawLinesRef.current),
      strokes: cloneStrokes(strokesRef.current),
      corMarkers: cloneCorMarkers(corMarkersRef.current),
      annotations: cloneAnnotations(annotationsRef.current),
      valgusCutLines: cloneValgusCutLines(valgusCutLinesRef.current),
      tibialSlopeLines: cloneTibialSlopeLines(tibialSlopeLinesRef.current),
      tibialCutLines: cloneTibialCutLines(tibialCutLinesRef.current),
    }),
    []
  );

  const pushHistorySnapshot = useCallback(() => {
    setHistory((prev) => [...prev, snapshotCurrent()]);
    setFuture([]);
  }, [snapshotCurrent]);

  const resetHistory = useCallback(() => {
    setHistory([]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const previous = prev[prev.length - 1];

      setFuture((next) => [...next, snapshotCurrent()]);
      setObjects(previous.objects);
      setActiveId(previous.activeId);
      setMeasurements(previous.measurements);
      setLldMeasurements(previous.lldMeasurements);
      setOffsetMeasurements(previous.offsetMeasurements);
      setAngleMeasurements(previous.angleMeasurements);
      setAhkaMeasurements(previous.ahkaMeasurements);
      setDrawLines(previous.drawLines);
      setStrokes(previous.strokes);
      setCorMarkers(previous.corMarkers);
      setAnnotations(previous.annotations);
      setValgusCutLines(previous.valgusCutLines);
      setTibialSlopeLines(previous.tibialSlopeLines);
      setTibialCutLines(previous.tibialCutLines);
      resetInteractionDrafts();

      return prev.slice(0, -1);
    });
  }, [
    resetInteractionDrafts,
    setActiveId,
    setAhkaMeasurements,
    setAngleMeasurements,
    setAnnotations,
    setCorMarkers,
    setDrawLines,
    setLldMeasurements,
    setMeasurements,
    setObjects,
    setOffsetMeasurements,
    setStrokes,
    setTibialCutLines,
    setTibialSlopeLines,
    setValgusCutLines,
    snapshotCurrent,
  ]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (!prev.length) return prev;
      const next = prev[prev.length - 1];

      setHistory((historyPrev) => [...historyPrev, snapshotCurrent()]);
      setObjects(next.objects);
      setActiveId(next.activeId);
      setMeasurements(next.measurements);
      setLldMeasurements(next.lldMeasurements);
      setOffsetMeasurements(next.offsetMeasurements);
      setAngleMeasurements(next.angleMeasurements);
      setAhkaMeasurements(next.ahkaMeasurements);
      setDrawLines(next.drawLines);
      setStrokes(next.strokes);
      setCorMarkers(next.corMarkers);
      setAnnotations(next.annotations);
      setValgusCutLines(next.valgusCutLines);
      setTibialSlopeLines(next.tibialSlopeLines);
      setTibialCutLines(next.tibialCutLines);
      resetInteractionDrafts();

      return prev.slice(0, -1);
    });
  }, [
    resetInteractionDrafts,
    setActiveId,
    setAhkaMeasurements,
    setAngleMeasurements,
    setAnnotations,
    setCorMarkers,
    setDrawLines,
    setLldMeasurements,
    setMeasurements,
    setObjects,
    setOffsetMeasurements,
    setStrokes,
    setTibialCutLines,
    setTibialSlopeLines,
    setValgusCutLines,
    snapshotCurrent,
  ]);

  return {
    objectsRef,
    pushHistorySnapshot,
    resetHistory,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
  };
}
