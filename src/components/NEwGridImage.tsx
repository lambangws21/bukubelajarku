"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Calendar, Eraser } from "lucide-react";
import Lottie from "lottie-react";
import monkeyAnimation from "@/components/hear-no-evil-monkey.json";

// ... (Interface tidak berubah) ...
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
  nama: string;
}

interface ApiResponse {
  sheetName: string;
  driveImages: DriveImage[];
  imagesForSheet1: Sheet1Image[];
}

interface MergedImage extends DriveImage {
  date: string;
  keterangan?: string;
  nama?: string;
}


export default function DriveImageGrid() {
  const [images, setImages] = useState<MergedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<MergedImage | null>(null);
  const [search, setSearch] = useState("");
  
  // State untuk rentang tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
            nama: match?.nama || "",
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
    return images.filter((img) => {
      const searchTerm = search.toLowerCase();
      
      const matchSearch =
        (img.nama || "").toLowerCase().includes(searchTerm) ||
        (img.keterangan || "").toLowerCase().includes(searchTerm);

      // Logika filter rentang tanggal
      const itemDate = new Date(img.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if(start) start.setHours(0, 0, 0, 0); // Set ke awal hari
      if(end) end.setHours(23, 59, 59, 999); // Set ke akhir hari

      const matchDate = 
        (!start || itemDate >= start) && 
        (!end || itemDate <= end);

      return matchSearch && matchDate;
    });
  }, [images, search, startDate, endDate]);
  
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  }

  if (loading) {
    // ... (Tidak berubah) ...
    return (
        <div className="w-full flex justify-center py-10">
          <Lottie
            animationData={monkeyAnimation}
            loop={true}
            className="w-48 h-48"
          />
        </div>
      );
  }

  if (!images.length) {
    // ... (Tidak berubah) ...
    return (
        <div className="w-full flex justify-center py-10">
          Tidak ada gambar ditemukan
        </div>
      );
  }

  return (
    <>
      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-4 p-4 items-center">
        {/* Search by Name */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama atau keterangan..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full md:w-auto">
          {/* Start Date */}
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 h-10 rounded-lg border focus:ring-2 transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Tanggal Mulai"
            />
          </div>
          <span className="text-gray-500 hidden sm:block">-</span>
          {/* End Date */}
          <div className="relative w-full sm:w-auto">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 h-10 rounded-lg border focus:ring-2 transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate} // Tanggal akhir tidak bisa sebelum tanggal mulai
              title="Tanggal Akhir"
            />
          </div>
          {/* Clear Button */}
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilter}
              className="p-2 text-gray-500 hover:text-gray-800"
              title="Hapus filter tanggal"
            >
              <Eraser className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Gambar */}
      {/* ... (Tidak berubah) ... */}
      <motion.div
        layout
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4"
      >
        {filteredImages.map((img) => (
          <motion.div
            key={img.googleDriveId}
            layout
            whileHover={{ scale: 1.03 }}
            className="rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer bg-white"
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative w-full h-40">
              <Image
                src={formatDriveUrl(img.fileUrl)}
                alt={img.fileName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 16vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="p-2 text-xs truncate font-semibold">
              {img.nama}
            </div>
          </motion.div>
        ))}
      </motion.div>
      {/* Modal Preview */}
      {/* ... (Tidak berubah) ... */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-200 transition z-10"
              >
                <X className="w-5 h-5" />
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
              <div className="p-4 text-sm">
                <p className="font-semibold">{selectedImage.nama}</p>
                <p className="text-gray-500">{selectedImage.date}</p>
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