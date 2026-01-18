"use client";

import { useCallback, useRef } from "react";

export function useImageCache() {
  const cacheRef = useRef<Record<string, HTMLImageElement>>({});

  const createDomImage = useCallback(() => {
    if (typeof window === "undefined") return null;
    return new window.Image();
  }, []);

  const ensureImageLoaded = useCallback(
    (src: string) => {
      const cached = cacheRef.current[src];
      if (cached?.complete) return Promise.resolve(cached);
      return new Promise<HTMLImageElement | null>((resolve) => {
        const img = cached ?? createDomImage();
        if (!img) {
          resolve(null);
          return;
        }
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        if (!cached) {
          img.src = src;
          cacheRef.current[src] = img;
        }
      });
    },
    [createDomImage]
  );

  const getCachedImage = useCallback(
    (src: string) => {
      const cached = cacheRef.current[src];
      if (cached?.complete) return cached;
      if (!cached) {
        const img = createDomImage();
        if (!img) return null;
        img.crossOrigin = "anonymous";
        img.src = src;
        cacheRef.current[src] = img;
      }
      return null;
    },
    [createDomImage]
  );

  return { ensureImageLoaded, getCachedImage };
}

