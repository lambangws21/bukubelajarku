"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, X } from "lucide-react"; // Menambahkan ikon X
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedImage, setSelectedImage] = useState<DriveImage | null>(null); // State untuk gambar terpilih

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
  };

  const totalJumlah = filteredImages.reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-6 text-teal-600">📸 Foto Bukti Biaya</h2>

      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter Jenis Biaya
          </label>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
          >
            {uniqueJenisBiaya.map((jenis) => (
              <option key={jenis} value={jenis}>
                {jenis}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter Tanggal
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Jumlah Data dan Total */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-teal-600">
          Menampilkan <strong className="font-semibold ">{filteredImages.length}</strong> data
        </p>
        <p className="text-sm text-teal-700 font-semibold">
          Total: Rp{totalJumlah.toLocaleString("id-ID")}
        </p>
      </div>

      {/* Card List */}
      {filteredImages.length === 0 ? (
        <p className="text-gray-500 text-center">Tidak ada gambar sesuai filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredImages.map((img, index) => {
              const imageUrl = `https://drive.google.com/uc?export=view&id=${img.googleDriveId}`;
              return (
                <motion.div
                  key={`${img.no}-${img.googleDriveId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition hover:scale-[1.01] overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedImage(img)} // Menampilkan modal saat di-klik
                >
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={imageUrl}
                      alt={img.fileName}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform"
                      unoptimized
                      priority={index === 0}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/no-image.png";
                      }}
                    />
                  </div>
                  <div className="p-4 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-teal-600 font-semibold text-3xl">{img.jenisBiaya}</span>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{formatDate(img.date)}</p>
                    <p className="text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">
                      {img.keterangan}
                    </p>
                    <div className="text-right font-semibold text-teal-600 text-2xl">
                      Rp{img.jumlah.toLocaleString("id-ID")}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Preview Gambar */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)} // Menutup modal saat backdrop di-klik
          >
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat konten di-klik
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition z-10"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>

              <div className="relative w-full flex-grow bg-black">
                <Image
                  src={`https://drive.google.com/uc?export=view&id=${selectedImage.googleDriveId}`}
                  alt={selectedImage.fileName}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">
                <p className="font-semibold">{selectedImage.keterangan}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {formatDate(selectedImage.date)} - Rp{selectedImage.jumlah.toLocaleString("id-ID")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriveImageGrid;