"use client";

import { useEffect, useMemo, useState } from "react";
import { toSafeImageSrc } from "@/lib/googleDriveImage";

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export default function SafeImage({
  src,
  alt,
  fallbackSrc = "/no-image.png",
  onError,
  loading,
  ...props
}: SafeImageProps) {
  const safeSrc = useMemo(() => toSafeImageSrc(src, fallbackSrc), [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(safeSrc);

  useEffect(() => {
    setCurrentSrc(safeSrc);
  }, [safeSrc]);

  return (
    <img
      {...props}
      src={currentSrc || fallbackSrc}
      alt={alt ?? "Image"}
      loading={loading ?? "lazy"}
      decoding="async"
      onError={(event) => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
        onError?.(event);
      }}
    />
  );
}
