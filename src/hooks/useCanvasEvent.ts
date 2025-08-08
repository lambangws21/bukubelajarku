// src/hooks/useCanvasEvents.ts
import { useState, useCallback } from "react";

type Tool = "measure" | "angle" | "annotate" | null;

export interface AnnotationEvent {
  kind: "measure" | "angle" | "annotate";
  points: { x: number; y: number }[];
  text?: string;
}

export function useCanvasEvents() {
  const [events, setEvents] = useState<AnnotationEvent[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushEvent = useCallback((evt: AnnotationEvent) => {
    setEvents(evts => {
      const truncated = evts.slice(0, historyIndex);
      return [...truncated, evt];
    });
    setHistoryIndex(i => i + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    setHistoryIndex(i => Math.max(0, i - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex(i => Math.min(events.length, i + 1));
  }, [events.length]);

  const rendered = events.slice(0, historyIndex);

  return { events: rendered, pushEvent, undo, redo };
}
