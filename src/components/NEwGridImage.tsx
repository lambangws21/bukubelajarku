"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Calendar } from "lucide-react";
import Lottie from "lottie-react";
import monkeyAnimation from "@/components/hear-no-evil-monkey.json";

interface DriveImage {
  no: number | string;
  fileName: string;
  fileUrl: string;
  googleDriveId: string;
  createdAt: string;
}

interface Sheet1Image {
  no: number | string;
  date: string;
  keterangan: string;
}

interface ApiResponse {
  sheetName: string;
  driveImages: DriveImage[];
  imagesForSheet1: Sheet1Image[];
}

interface MergedImage extends DriveImage {
  date: string;
  keterangan?: string;
}

export default function DriveImageGrid() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const [images, setImages] = useState<MergedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<MergedImage | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(today);
  const [onlyToday, setOnlyToday] = useState(true); // ✅ Default ON

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec?sheet=ALL"
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: ApiResponse = await res.json();

        const merged: MergedImage[] = data.driveImages.map((img) => {
          const match = data.imagesForSheet1.find(
            (i) => String(i.no) === String(img.no)
          );
          return {
            ...img,
            keterangan: match?.keterangan || "",
            date: match?.date || img.createdAt,
          };
        });

        setImages(merged);
      } catch (error) {
        console.error("Gagal fetch data gambar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const formatDriveUrl = (url: string) =>
    url
      .replace(
        "https://drive.google.com/file/d/",
        "https://drive.google.com/uc?export=view&id="
      )
      .replace("/view?usp=drivesdk", "");

  const filteredImages = useMemo(() => {
    const activeDate = onlyToday ? today : filterDate;
    return images.filter((img) => {
      const matchName = img.fileName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchDate = activeDate ? img.date.startsWith(activeDate) : true;
      return matchName && matchDate;
    });
  }, [images, search, filterDate, onlyToday, today]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-10 text-gray-500 dark:text-gray-400">
        <Lottie
          animationData={monkeyAnimation}
          loop={true}
          className="w-48 h-48"
        />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="w-full flex justify-center py-10 text-gray-500 dark:text-gray-400">
        Tidak ada gambar ditemukan
      </div>
    );
  }

  return (
    <>
      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-3 p-4 items-center md:items-end">
        {/* 🔍 Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama file..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                       transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 📅 Date Picker */}
       {/* 📅 Date Picker + 🆕 Toggle */}
<div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
  
  {/* 📅 Date Picker */}
  <div className="relative w-full sm:w-auto">
    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      type="date"
      className="pl-10 pr-4 py-2 h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                 transition-all disabled:opacity-50 w-full sm:w-auto"
      value={filterDate}
      disabled={onlyToday} // ✅ Disable kalau toggle aktif
      onChange={(e) => {
        const newDate = e.target.value;
        setFilterDate(newDate);
        setOnlyToday(newDate === today); // ✅ Otomatis ON kalau pilih hari ini
      }}
    />
  </div>

  {/* 🆕 Toggle Slide */}
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <div
      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
        onlyToday ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
      onClick={() => {
        const newValue = !onlyToday;
        setOnlyToday(newValue);
        if (newValue) {
          setFilterDate(today); // ✅ Kalau ON, reset ke hari ini
        }
      }}
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
          onlyToday ? "translate-x-6" : "translate-x-0"
        }`}
      ></span>
    </div>
    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Hari ini</span>
  </label>

</div>

      </div>

      {/* Grid Gambar */}
      <motion.div
        layout
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4"
      >
        {filteredImages.map((img) => (
          <motion.div
            key={img.googleDriveId}
            layout
            whileHover={{ scale: 1.03 }}
            className="rounded-lg overflow-hidden shadow hover:shadow-lg transition duration-300 cursor-pointer bg-white dark:bg-gray-900"
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative w-full h-40">
              <Image
                src={formatDriveUrl(img.fileUrl)}
                alt={img.fileName}
                fill
                sizes="(max-width: 768px) 100vw, 
                       (max-width: 1200px) 50vw, 
                       16vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="p-2 text-xs truncate text-gray-700 dark:text-gray-300">
              {img.fileName}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Modal Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition z-10"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>

              <div className="relative w-full h-[60vh] bg-black">
                <Image
                  src={formatDriveUrl(selectedImage.fileUrl)}
                  alt={selectedImage.fileName}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-contain"
                />
              </div>
              <div className="p-4 text-sm text-gray-800 dark:text-gray-200">
                <p className="font-semibold">{selectedImage.fileName}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedImage.date}
                </p>
                {selectedImage.keterangan && (
                  <p className="mt-2">{selectedImage.keterangan}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
