"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface ImageItem {
  no: number;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
  googleDriveId: string;
  fileName: string;
  createdAt: string;
}

interface Props {
  data: ImageItem[];
}

export default function ImageGalleryWithPreview({ data }: Props) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {data.map((item, index) => {
        const imgUrl = `https://drive.google.com/uc?export=view&id=${item.googleDriveId}`;
        return (
          <Dialog key={item.no}>
            <DialogTrigger asChild>
              <div
                className="cursor-pointer group text-center"
                onClick={() => setSelectedImage(item)}
              >
                <div className="relative w-full h-40">
                  <Image
                    src={imgUrl}
                    alt={item.fileName}
                    fill
                    unoptimized
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover rounded border shadow group-hover:opacity-80 transition"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {item.fileName}
                </div>
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-2"
                >
                  <DialogTitle>{selectedImage.fileName}</DialogTitle>

                  <DialogDescription>
                    Bukti pengeluaran klaim oleh {selectedImage.klaimOleh} pada{" "}
                    {selectedImage.date}
                  </DialogDescription>

                  <div className="relative w-full h-[400px]">
                    <Image
                      src={imgUrl}
                      alt={item.fileName}
                      fill
                      unoptimized
                      priority={index === 0} // tetap aman
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover rounded border shadow group-hover:opacity-80 transition"
                    />
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p>{selectedImage.keterangan}</p>
                    <p>
                      {selectedImage.jenisBiaya} — {selectedImage.date}
                    </p>
                    <p>Jumlah: Rp{selectedImage.jumlah.toLocaleString()}</p>
                    <p>Klaim oleh: {selectedImage.klaimOleh}</p>
                    <p>Uploaded: {selectedImage.createdAt}</p>
                  </div>
                </motion.div>
              )}
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
}
