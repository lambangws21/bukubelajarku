"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { vanguardSteps } from "./data/vanguardSteps";

/* ================= KEYWORD HIGHLIGHT ================= */
const highlightKeywords = (text: string): string => {
  const keywords = [
    "Potong",
    "Pasang",
    "Gunakan",
    "Masukkan",
    "Cek",
    "Keluarkan",
    "Bor",
    "Isi",
  ];

  let result = text;
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})`, "gi");
    result = result.replace(
      regex,
      `<span class="font-semibold text-blue-600 dark:text-blue-400">$1</span>`
    );
  });
  return result;
};

export default function VanguardStepsGallery() {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const step = vanguardSteps[selectedStep];
  const images = step.images ?? [];

  /* ================= SWIPE HANDLERS ================= */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null
    )
      return;

    const dx =
      e.changedTouches[0].clientX - touchStartX.current;
    const dy =
      e.changedTouches[0].clientY - touchStartY.current;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // horizontal swipe dominan
    if (absX > absY && absX > 50) {
      if (dx < 0) {
        // NEXT
        if (images.length > 1) {
          setSelectedImage((prev) =>
            (prev + 1) % images.length
          );
        } else if (selectedStep < vanguardSteps.length - 1) {
          setSelectedStep((prev) => prev + 1);
          setSelectedImage(0);
        }
      }

      if (dx > 0) {
        // PREV
        if (images.length > 1) {
          setSelectedImage((prev) =>
            (prev - 1 + images.length) % images.length
          );
        } else if (selectedStep > 0) {
          setSelectedStep((prev) => prev - 1);
          setSelectedImage(0);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleStepClick = (index: number) => {
    setSelectedStep(index);
    setSelectedImage(0);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowModal(true);
    }
  };

  const nextImage = () => {
    if (!images.length) return;
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!images.length) return;
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* ===== HEADER ===== */}
      <header className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">
          Vanguard® Premier Total Knee
        </h2>
        <p className="text-sm text-muted-foreground">
          Step-by-step Surgical Technique (Educational View)
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        {/* ================= SIDEBAR DESKTOP ================= */}
        <aside className="md:w-1/3 max-h-[70vh] overflow-y-auto space-y-2">
          {vanguardSteps.map((s, index: number) => (
            <button
              key={s.step}
              onClick={() => handleStepClick(index)}
              className={`
                w-full text-left p-3 rounded-xl border transition
                ${
                  selectedStep === index
                    ? "bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "bg-background border-muted hover:bg-muted"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                  {s.step}
                </span>
                <span className="font-medium text-sm">
                  {s.title}
                </span>
              </div>
            </button>
          ))}
        </aside>

        {/* ================= DETAIL DESKTOP (SWIPE IMAGE) ================= */}
        <motion.section
          key={step.step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 bg-card p-6 rounded-2xl shadow"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <h3 className="text-xl font-semibold mb-3">
            Step {step.step} — {step.title}
          </h3>

          <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
            {step.description.map((point: string, i: number) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{
                  __html: highlightKeywords(point),
                }}
              />
            ))}
          </ul>

          {step.note && (
            <div className="text-sm bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg mb-4">
              💡 <span className="italic">{step.note}</span>
            </div>
          )}

          {/* ===== IMAGE CAROUSEL ===== */}
          <div className="relative w-full h-[360px] rounded-xl overflow-hidden border bg-muted">
            {images.length ? (
              <Image
                src={images[selectedImage]}
                alt={`Vanguard Step ${step.step}`}
                fill
                priority
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Gambar tidak tersedia
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i === selectedImage
                          ? "bg-blue-600"
                          : "bg-blue-300/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.section>
      </div>
      {/* ================= HEADER ================= */}
<div className="mb-4">
  <h2 className="text-2xl md:text-3xl font-bold">
    Vanguard® Surgical Technique
  </h2>
  <p className="text-sm text-muted-foreground">
    Figure Explorer
  </p>
</div>

{/* ================= VIDEO ================= */}
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="mb-6"
>
  <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b bg-muted/40">
      <h3 className="text-sm md:text-base font-semibold">
        🎥 Surgical Technique Video
      </h3>
      <p className="text-xs text-muted-foreground">
        Official Zimmer Biomet educational content
      </p>
    </div>

    <div className="relative w-full pt-[56.25%] bg-black">
      <iframe
        src="https://zimmerbiomet.tv/videos/1685/embed"
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allowFullScreen
        loading="lazy"
      />
    </div>
  </div>
</motion.div>

{/* ================= MAIN CONTENT ================= */}
<div className="flex flex-col md:flex-row gap-6">
  {/* sidebar & detail tetap */}
</div>


      {/* ================= MODAL MOBILE (SWIPE STEP + IMAGE) ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-background rounded-2xl p-4 max-w-md w-full max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <h3 className="font-semibold mb-3">
                Step {step.step} — {step.title}
              </h3>

              <ul className="list-disc pl-5 text-sm mb-3">
                {step.description.map((point: string, i: number) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywords(point),
                    }}
                  />
                ))}
              </ul>

              {images.length > 0 && (
                <div className="relative h-64 rounded-xl overflow-hidden border mb-3">
                  <Image
                    src={images[selectedImage]}
                    alt={step.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground mb-2">
                Swipe ← / → untuk pindah step / gambar
              </p>

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
