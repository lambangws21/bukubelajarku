"use client";

import React, { useState, useEffect } from "react";
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

const DriveImageGrid: React.FC<DriveImageGridProps> = ({ driveImages = [] }) => {
  const [filteredImages, setFilteredImages] = useState<DriveImage[]>(driveImages);
  const [selectedJenis, setSelectedJenis] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    let filtered = driveImages;

    if (selectedJenis !== "All") {
      filtered = filtered.filter((img) => img.jenisBiaya === selectedJenis);
    }

    if (selectedDate) {
      filtered = filtered.filter((img) => img.date === selectedDate);
    }

    setFilteredImages(filtered);
  }, [driveImages, selectedJenis, selectedDate]);

  const uniqueJenisBiaya = ["All", ...new Set(driveImages.map((img) => img.jenisBiaya))];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Foto Bukti Biaya</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter Jenis Biaya
          </label>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {uniqueJenisBiaya.map((jenis) => (
              <option key={jenis} value={jenis}>
                {jenis}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter Tanggal
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <p className="text-gray-500">Tidak ada gambar sesuai filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredImages.map((img, index) => {
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
      )}
    </div>
  );
};

export default DriveImageGrid;
