'use client';

import React from "react";
import Image from "next/image";

interface DriveImage {
  no: number;
  fileName: string;
  googleDriveId: string;
  createdAt: string;
  date: string;
  jenisBiaya: string;
  keterangan: string;
  jumlah: number;
  klaimOleh: string;
}

interface DriveImageGridProps {
  driveImages?: DriveImage[];
}

const DriveImageGrid: React.FC<DriveImageGridProps> = ({ driveImages }) => {
  if (!driveImages || driveImages.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Foto Bukti Biaya</h2>
        <p className="text-gray-500">Tidak ada gambar tersedia.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Foto Bukti Biaya</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {driveImages.map((img, index) => {
          const imageUrl = `https://drive.google.com/uc?export=view&id=${img.googleDriveId}`;

          return (
            <div
              key={`${img.no}-${img.googleDriveId}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition"
            >
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative w-full h-48 bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={img.fileName}
                    fill
                    className="object-contain"
                    unoptimized
                    priority={index === 0}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/no-image.png";
                    }}
                  />
                </div>
              </a>
              <div className="p-2 text-sm space-y-1">
                <p className="font-medium truncate">{img.fileName}</p>
                <p className="text-gray-500">{img.createdAt}</p>
                <p><strong>Jenis:</strong> {img.jenisBiaya}</p>
                <p><strong>Keterangan:</strong> {img.keterangan}</p>
                <p><strong>Jumlah:</strong> Rp{img.jumlah.toLocaleString()}</p>
                <p><strong>Klaim:</strong> {img.klaimOleh}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriveImageGrid;
