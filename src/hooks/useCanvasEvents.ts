"use client";
import { useState, useCallback } from "react";

/** Tool bisa mati (`null`) atau salah satu mode aktif */
export type Tool = "measure" | "angle" | "annotate" | null;

export interface Point { x: number; y: number; }

/** Event yang menggambarkan satu anotasi */
export interface AnnotationEvent {
  kind: Exclude<Tool, null>;
  points: Point[];
  /** hanya untuk `annotate` */
  text?: string;
}

/**
 * Hook untuk menyimpan events berupa command,
 * mendukung undo/redo dengan pointer historis.
 */
export function useCanvasEvents() {
  const [events, setEvents] = useState<AnnotationEvent[]>([]);
  const [index, setIndex] = useState<number>(0);

  const pushEvent = useCallback(
    (ev: AnnotationEvent) => {
      setEvents((prev: AnnotationEvent[]) => [
        ...prev.slice(0, index),
        ev,
      ]);
      setIndex((prevIdx: number) => prevIdx + 1);
    },
    [index],
  );

  const undo = useCallback(() => {
    setIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const redo = useCallback(() => {
    setIndex((idx) => Math.min(idx + 1, events.length));
  }, [events.length]);

  return {
    events: events.slice(0, index),
    pushEvent,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < events.length,
  };
}
