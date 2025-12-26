import Image from "next/image";
import { ImageRef } from "@/components/operasi/thr/data/data";

export default function ThrImageGallery({
  images,
}: {
  images: ImageRef[];
}) {
  return (
    <div className="space-y-6 mb-6">
      {images.map((img) => (
        <div key={img.fig}>
          <p className="text-sm font-medium mb-2">
            {img.fig} — {img.title}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {img.imagePaths.map((src, i) => (
              <div
                key={i}
                className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border"
              >
                <Image
                  src={src}
                  alt={`${img.fig}-${i}`}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
