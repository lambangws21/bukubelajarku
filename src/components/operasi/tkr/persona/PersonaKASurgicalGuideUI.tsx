"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

import {
  personaKASurgicalStages,
  type SurgicalStage,
  type SurgicalFigure,
} from "@/components/operasi/tkr/persona/data/personaKATechSupport.data";
import { FigureImageGallery } from "./figureImages";

export default function PersonaKASurgicalGuideUI() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [openSheet, setOpenSheet] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentIndex = personaKASurgicalStages.findIndex(
    (s) => s.stage === activeStage
  );

  const stage = personaKASurgicalStages[currentIndex] as SurgicalStage;

  /* ================= SWIPE HANDLERS (MOBILE) ================= */
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
      if (dx < 0 && currentIndex < personaKASurgicalStages.length - 1) {
        // NEXT
        setActiveStage(personaKASurgicalStages[currentIndex + 1].stage);
      }

      if (dx > 0 && currentIndex > 0) {
        // PREV
        setActiveStage(personaKASurgicalStages[currentIndex - 1].stage);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* ================= HEADER ================= */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Persona Kinematic Alignment TKA
        </h1>
        <p className="text-muted-foreground max-w-3xl mt-2 text-sm">
          Stage-based surgical guide untuk technical support berdasarkan
          Persona KA TKA Surgical Technique.
        </p>
      </header>

      {/* ================= MAIN LAYOUT ================= */}
      <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-8">
        {/* ================= DESKTOP SIDEBAR ================= */}
        <aside className="hidden lg:block space-y-2 sticky top-6 self-start">
          {personaKASurgicalStages.map((s) => {
            const isActive = s.stage === activeStage;

            return (
              <button
                key={s.stage}
                onClick={() => setActiveStage(s.stage)}
                className="w-full text-left"
              >
                <motion.div
                  layout
                  className={`rounded-xl border p-4 transition ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500"
                      : "bg-white dark:bg-zinc-900"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    STAGE {s.stage}
                  </p>
                  <p className="font-semibold">{s.stageTitle}</p>

                  {isActive && (
                    <motion.div
                      layoutId="active-stage-indicator"
                      className="mt-2 h-1 w-12 rounded bg-blue-600"
                    />
                  )}
                </motion.div>
              </button>
            );
          })}
        </aside>

        {/* ================= CONTENT (SWIPE AREA) ================= */}
        <section>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="space-y-8 touch-pan-y"
            >
              {/* ===== MOBILE STAGE BUTTON ===== */}
              <button
                onClick={() => setOpenSheet(true)}
                className="lg:hidden w-full flex items-center justify-between
                           px-4 py-2 rounded-lg border bg-muted/40"
              >
                <span className="text-sm font-medium">
                  Stage {stage.stage}: {stage.stageTitle}
                </span>
                <ChevronUp className="w-4 h-4" />
              </button>

              {/* ===== STAGE HEADER ===== */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold">
                  Stage {stage.stage}: {stage.stageTitle}
                </h2>
                <p className="text-muted-foreground text-sm">
                  🎯 <b>Tujuan:</b> {stage.stageGoal}
                </p>
              </div>

              {/* ===== FIGURES ===== */}
              <div className="space-y-6">
                {stage.figures.map((fig: SurgicalFigure) => (
                  <motion.div
                    key={fig.figureCode}
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
                  >
                    {/* IMAGE */}
                    <div className="bg-neutral-50 dark:bg-zinc-800 p-4 md:p-6">
                      <FigureImageGallery
                        images={fig.imagePath}
                        title={fig.title}
                      />
                    </div>

                    {/* TEXT */}
                    <div className="p-4 md:p-6 space-y-4">
                      <p className="text-xs uppercase text-muted-foreground">
                        {fig.figureCode}
                      </p>

                      <h3 className="text-lg font-semibold">
                        {fig.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {fig.explanation}
                      </p>

                      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 text-sm">
                        💡 <b>Tips untuk Technical Support:</b>{" "}
                        {fig.techSupportTip}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* MOBILE SWIPE HINT */}
              <p className="lg:hidden text-xs text-center text-muted-foreground">
                Swipe ← / → untuk pindah stage
              </p>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* ================= MOBILE BOTTOM SHEET ================= */}
      <AnimatePresence>
        {openSheet && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setOpenSheet(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* SHEET */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-background
                         rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />

              {personaKASurgicalStages.map((s) => (
                <button
                  key={s.stage}
                  onClick={() => {
                    setActiveStage(s.stage);
                    setOpenSheet(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border mb-2 ${
                    s.stage === activeStage
                      ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30"
                      : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    STAGE {s.stage}
                  </p>
                  <p className="font-semibold">{s.stageTitle}</p>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
