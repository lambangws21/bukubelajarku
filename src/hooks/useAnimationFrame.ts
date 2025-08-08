"use client";
import { useEffect, useRef } from "react";

/**
 * Menjalankan `callback()` secara terus-menerus pada ~60fps
 * Berguna untuk menggambar ulang canvas saat state berubah
 */
export function useAnimationFrame(callback: () => void, deps: any[]) {
  const requestRef = useRef<number>();
  const prevTime = useRef<number>();

  const loop = (time: number) => {
    if (prevTime.current !== undefined) {
      callback();
    }
    prevTime.current = time;
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
