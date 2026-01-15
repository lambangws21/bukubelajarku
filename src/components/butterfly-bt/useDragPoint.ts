import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "./types";

type DragState = {
  dragging: boolean;
  startPointer: Point;
  startValue: Point;
};

type TargetEl = Element & {
  setPointerCapture(pointerId: number): void;
  releasePointerCapture(pointerId: number): void;
  getBoundingClientRect(): DOMRect;
};

export function useDragPoint<T extends TargetEl>(onChange: (p: Point) => void) {
  const stateRef = useRef<DragState | null>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent<T>) => {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    stateRef.current = {
      dragging: true,
      startPointer: { x, y },
      startValue: { x: 0, y: 0 },
    };
  }, []);

  const bindStartValue = useCallback((startValue: Point) => {
    const s = stateRef.current;
    if (!s) return;
    s.startValue = startValue;
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<T>) => {
      const s = stateRef.current;
      if (!s || !s.dragging) return;

      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - s.startPointer.x;
      const dy = y - s.startPointer.y;

      onChange({ x: s.startValue.x + dx, y: s.startValue.y + dy });
    },
    [onChange]
  );

  const onPointerUp = useCallback((e: ReactPointerEvent<T>) => {
    const s = stateRef.current;
    if (!s) return;

    const target = e.currentTarget;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    stateRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, bindStartValue };
}
