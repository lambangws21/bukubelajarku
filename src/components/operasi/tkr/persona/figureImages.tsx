import Image from "next/image";
import { motion } from "framer-motion";



type Props = {
  images?: string[];
  title: string;
};

export function FigureImageGallery({ images, title }: Props) {
  if (!images || images.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No image available
      </div>
    );
  }

  // SINGLE IMAGE
  if (images.length === 1) {
    return (
      <div className="relative w-full h-[350px]">
        <Image
          src={images[0]}
          alt={title}
          fill
          className="object-contain"
        />
      </div>
    );
  }

  // MULTI IMAGE (GRID)
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {images.map((img, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.03 }}
          className="relative h-64 rounded-lg overflow-hidden border"
        >
          <Image
            src={img}
            alt={`${title} ${idx + 1}`}
            fill
            className="object-contain"
          />
        </motion.div>
      ))}
    </div>
  );
}
