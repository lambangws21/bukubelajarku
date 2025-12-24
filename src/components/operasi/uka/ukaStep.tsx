"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ukaSteps } from "./ukaSteps";
import {
  CheckCircle2,
  PlayCircle,
  Layers,
} from "lucide-react";

/* ================= ACTION HIGHLIGHT ================= */

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
      `<span class="font-semibold text-emerald-600 dark:text-emerald-400">$1</span>`
    );
  });
  return result;
};

/* ================= COMPONENT ================= */

const UkaStepsGallery = () => {
  const [selectedStep, setSelectedStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const step = ukaSteps[selectedStep];
  const imageUrl = `/uka_images/uka_step_${selectedStep + 1}.png`;

  const progress = useMemo(
    () => Math.round(((selectedStep + 1) / ukaSteps.length) * 100),
    [selectedStep]
  );

  const handleStepClick = (index: number) => {
    setSelectedStep(index);
    if (window.innerWidth < 768) setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-10">
      {/* ================= HEADER ================= */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">
          UKA Oxford – Surgical Steps
        </h2>
        <p className="text-sm text-muted-foreground">
          Alur intraoperatif Unicompartmental Knee Arthroplasty
        </p>

        {/* Progress */}
        <div className="flex justify-center items-center gap-2 text-xs text-emerald-600">
          <CheckCircle2 size={14} />
          Step {selectedStep + 1} / {ukaSteps.length} • {progress}%
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* ================= SIDEBAR ================= */}
        <div className="md:w-1/3 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {ukaSteps.map((s, index) => (
            <button
              key={s.Step}
              onClick={() => handleStepClick(index)}
              className={`
                w-full text-left rounded-xl p-3 border transition-all
                ${
                  selectedStep === index
                    ? "bg-emerald-100 border-emerald-500 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                    : "bg-muted/30 hover:bg-muted border-border"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                  {s.Step}
                </span>
                <span className="font-medium">{s.Tahapan}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ================= DETAIL (DESKTOP) ================= */}
        <motion.div
          key={step.Step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 rounded-2xl border bg-background p-6 shadow"
        >
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Layers size={18} />
            {step.Step}. {step.Tahapan}
          </h3>

          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground mb-4">
            {step.Deskripsi.map((p, i) =>
              p.trim() ? (
                <li key={i}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywords(p),
                    }}
                  />
                </li>
              ) : null
            )}
          </ul>

          {step.Note && (
            <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/40 p-3 text-sm italic">
              💡 {step.Note}
            </div>
          )}

          <div className="relative mt-4 w-full h-[360px] rounded-xl overflow-hidden border">
            <Image
              src={imageUrl}
              alt={step.Tahapan}
              fill
              priority
              className="object-contain"
            />
          </div>
        </motion.div>
      </div>

      {/* ================= VIDEO ================= */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <PlayCircle className="text-emerald-600" />
          Video Edukasi Animasi
        </h3>

        <div className="relative pt-[56.25%] rounded-xl overflow-hidden border">
          <iframe
            src="https://zimmerbiomet.tv/videos/2235/embed"
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        </div>
      </div>

      {/* ================= MOBILE MODAL ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-background rounded-xl p-4 w-full max-w-md max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-3">
                {step.Step}. {step.Tahapan}
              </h3>

              <ul className="list-disc pl-5 text-sm space-y-2 mb-4">
                {step.Deskripsi.map((p, i) =>
                  p.trim() ? (
                    <li key={i}>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywords(p),
                        }}
                      />
                    </li>
                  ) : null
                )}
              </ul>

              {step.Note && (
                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded mb-4 text-sm italic">
                  💡 {step.Note}
                </div>
              )}

              <div className="relative w-full h-64 rounded-xl overflow-hidden border">
                <Image
                  src={imageUrl}
                  alt={step.Tahapan}
                  fill
                  className="object-contain"
                />
              </div>

              <button
                className="mt-4 w-full rounded-lg bg-emerald-600 text-white py-2"
                onClick={() => setShowModal(false)}
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UkaStepsGallery;
