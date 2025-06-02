// file: app/components/InteractiveCasesWithPreview.tsx
"use client";

import { useState, useEffect, CSSProperties } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MinusCircle, PlusCircle } from "lucide-react";

interface CaseImageRecord {
  tindakan: string;
  note: string;
  googleDriveId: string; // bisa berupa "id1,id2,id3"
  imageUrl: string | null;
}

interface DisplayCase {
  tindakan: string;
  note: string;
  images: string[];
}

export default function InteractiveCasesWithPreview() {
  const [cases, setCases] = useState<DisplayCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch("/api/addCases/getCases");
        const json = await res.json();
        if (json.status === "success" && Array.isArray(json.data)) {
          const display: DisplayCase[] = (json.data as CaseImageRecord[]).map(item => {
            const ids = item.googleDriveId
              .split(",")
              .map(id => id.trim())
              .filter(id => id);
            const imageUrls = ids.map(id => `https://drive.google.com/uc?export=view&id=${id}`);
            return {
              tindakan: item.tindakan,
              note: item.note,
              images: imageUrls,
            };
          });
          setCases(display);
        } else {
          setError("Data tidak valid");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-300">
        <p>Memuat kasus…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-red-500 dark:bg-gray-900 dark:text-red-400 px-4">
        <p>{error}</p>
      </div>
    );
  }

  const openDetail = (idx: number) => {
    setSelectedIdx(idx);
    setSlideIdx(0);
    setZoom(1);
  };
  const closeDetail = () => setSelectedIdx(null);
  const prevSlide = () => {
    if (selectedIdx === null) return;
    setSlideIdx(prev =>
      prev === 0 ? cases[selectedIdx].images.length - 1 : prev - 1
    );
    setZoom(1);
  };
  const nextSlide = () => {
    if (selectedIdx === null) return;
    setSlideIdx(prev =>
      prev === cases[selectedIdx].images.length - 1 ? 0 : prev + 1
    );
    setZoom(1);
  };
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 1));

  const zoomStyle: CSSProperties = {
    transform: `scale(${zoom})`,
    transition: "transform 0.2s",
    cursor: zoom > 1 ? "grab" : "auto",
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">Daftar Kasus</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {cases.map((c, idx) => (
          <motion.div
            key={idx}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openDetail(idx)}
          >
            <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <Image
                src={c.images[0]}
                alt={`Kasus ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain"
                onError={e => {
                  (e.target as HTMLImageElement).src = "/no-image.png";
                }}
                unoptimized={false}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {c.tindakan}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm sm:text-base line-clamp-2">
                {c.note}
              </p>
              <button className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm sm:text-base">
                Lihat detail
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            key="modal"
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-auto px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden w-full max-w-4xl mx-auto mt-8 mb-8 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white z-10"
                onClick={closeDetail}
              >
                <X size={32} className="rounded-full hover:bg-red-500/30 p-1" />
              </button>

              {/* Main Image Container */}
              <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <motion.div
                  style={zoomStyle}
                  className="relative w-full h-full"
                  drag={zoom > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                >
                  <Image
                      src={cases[selectedIdx].images[slideIdx]}
                      alt={`Detail Kasus ${selectedIdx + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 800px"
                      className="object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).src = "/no-image.png";
                      }}
                      unoptimized={false}
                    />
                </motion.div>
                {cases[selectedIdx].images.length > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-200 p-2 rounded-full z-10"
                      onClick={prevSlide}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-200 p-2 rounded-full z-10"
                      onClick={nextSlide}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-[200px] right-4 flex space-x-2 z-10">
                <button
                  className="px-2 py-2 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-200 rounded-full"
                  onClick={zoomOut}
                >
                  <MinusCircle size={20} />
                </button>
                <button
                  className="px-2 py-2 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-200 rounded-full"
                  onClick={zoomIn}
                >
                  <PlusCircle size={20} />
                </button>
              </div>

              {/* Thumbnail Strip */}
              {cases[selectedIdx].images.length > 1 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {cases[selectedIdx].images.map((thumbUrl, tIdx) => (
                      <div
                        key={tIdx}
                        className={`relative w-16 h-10 sm:w-20 sm:h-12 flex-shrink-0 rounded border-2 ${
                          tIdx === slideIdx
                            ? "border-indigo-600 dark:border-indigo-400"
                            : "border-gray-300 dark:border-gray-600"
                        } overflow-hidden cursor-pointer`}
                        onClick={() => {
                          setSlideIdx(tIdx);
                          setZoom(1);
                        }}
                      >
                        <Image
                          src={thumbUrl}
                          alt={`Thumb ${tIdx + 1}`}
                          fill
                          sizes="80px"
                          className="object-fill"
                          onError={e => {
                            (e.target as HTMLImageElement).src = "/no-image.png";
                          }}
                          unoptimized={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detail Text */}
              <div className="p-4 text-gray-900 dark:text-gray-100 space-y-4">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold">
                  {cases[selectedIdx].tindakan}
                </h3>
                <p className="text-sm sm:text-base whitespace-pre-line">
                  {cases[selectedIdx].note}
                </p>
                <button
                  onClick={closeDetail}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
