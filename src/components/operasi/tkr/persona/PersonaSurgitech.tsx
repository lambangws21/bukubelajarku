"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

import {
  personaFigureSteps,
  PersonaFigureStep,
} from "@/components/operasi/tkr/persona/data/personaSurgicalFigures.data";
import { groupByPhase } from "@/components/operasi/tkr/persona/data/groupByPhase";

const grouped = groupByPhase(personaFigureSteps);

export default function SurgicalStepsPersona() {
  const [activeFigure, setActiveFigure] = useState<number>(1);
  const [openSheet, setOpenSheet] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentIndex = personaFigureSteps.findIndex(
    (s) => s.figure === activeFigure
  );

  const current = personaFigureSteps[currentIndex] as PersonaFigureStep;

  /* ================= SWIPE HANDLERS ================= */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // 👉 gesture horizontal dominan
    if (absX > absY && absX > 50) {
      if (dx < 0 && currentIndex < personaFigureSteps.length - 1) {
        // swipe left → NEXT
        setActiveFigure(personaFigureSteps[currentIndex + 1].figure);
      }

      if (dx > 0 && currentIndex > 0) {
        // swipe right → PREV
        setActiveFigure(personaFigureSteps[currentIndex - 1].figure);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* ================= HEADER ================= */}
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold">
          Persona® Surgical Technique
        </h2>
        <p className="text-sm text-muted-foreground">Figure Explorer</p>
      </div>
    

      <div className="flex flex-col md:flex-row gap-6">
        {/* ================= DESKTOP SIDEBAR ================= */}
        <aside className="hidden md:block md:w-1/3 space-y-4 max-h-[75vh] overflow-y-auto">
          {Object.entries(grouped).map(([phase, figs]) => (
            <div key={phase}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {phase}
              </p>
              {figs.map((f) => (
                <button
                  key={f.figure}
                  onClick={() => setActiveFigure(f.figure)}
                  className={`w-full text-left p-3 rounded-lg border mb-1 transition ${
                    activeFigure === f.figure
                      ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <strong>Figure {f.figure}</strong>
                  <p className="text-sm">{f.title}</p>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ================= DETAIL (SWIPE AREA) ================= */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.figure}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="md:w-2/3 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg space-y-4 touch-pan-y"
          >
            {/* MOBILE STEP BUTTON */}
            <button
              onClick={() => setOpenSheet(true)}
              className="md:hidden w-full flex items-center justify-between px-4 py-2 rounded-lg border bg-muted/40"
            >
              <span className="text-sm font-medium">
                Figure {current.figure}: {current.title}
              </span>
              <ChevronUp className="w-4 h-4" />
            </button>

            <h3 className="hidden md:block text-xl font-semibold">
              Figure {current.figure}: {current.title}
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-sm">
              {current.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            {current.note && (
              <p className="italic bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded text-sm">
                💡 {current.note}
              </p>
            )}

            <div className="relative w-full h-[260px] md:h-[350px] border rounded-lg overflow-hidden">
              <Image
                src={current.image}
                alt={current.title}
                fill
                className="object-contain"
              />
            </div>

            {/* MOBILE HINT */}
            <p className="md:hidden text-xs text-center text-muted-foreground pt-2">
              Swipe ← / → untuk pindah figure
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
        {/* ================= EDUCATIONAL VIDEO ================= */}
        <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* HEADER */}
          <div className="px-4 py-3 border-b bg-muted/40">
            <h3 className="text-sm md:text-base font-semibold">
              🎥 Surgical Technique Video
            </h3>
            <p className="text-xs text-muted-foreground">
              Official Zimmer Biomet educational content
            </p>
          </div>

          {/* RESPONSIVE IFRAME */}
          <div className="relative w-full pt-[56.25%] bg-black">
            <iframe
              src="https://zimmerbiomet.tv/videos/1613/embed"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </motion.div>

      {/* ================= MOBILE BOTTOM SHEET ================= */}
      <AnimatePresence>
        {openSheet && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setOpenSheet(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto md:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />

              {Object.entries(grouped).map(([phase, figs]) => (
                <div key={phase} className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {phase}
                  </p>
                  {figs.map((f) => (
                    <button
                      key={f.figure}
                      onClick={() => {
                        setActiveFigure(f.figure);
                        setOpenSheet(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border mb-1 ${
                        activeFigure === f.figure
                          ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30"
                          : ""
                      }`}
                    >
                      <strong>Figure {f.figure}</strong>
                      <p className="text-sm">{f.title}</p>
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
