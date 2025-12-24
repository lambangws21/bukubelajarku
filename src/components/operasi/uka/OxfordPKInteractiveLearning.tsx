"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { OxfordPKLearningData, OxfordPKPhase } from "@/components/operasi/uka/oxfordPKData";

export default function OxfordPKInteractiveLearning() {
  const steps = OxfordPKLearningData.filter(s => s.phase === "surgical");

  const [selected, setSelected] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const step = steps[selected];

  const handleClick = (index: number) => {
    setSelected(index);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowModal(true);
    }
  };

  const highlightKeywords = (text: string): string => {
    const keywords = [
      "Potong", "Pasang", "Gunakan", "Masukkan",
      "Cek", "Keluarkan", "Bor", "Isi"
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
  

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center text-emerald-600">
        Oxford Partial Knee – Surgical Steps
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* ================= SIDEBAR ================= */}
        <div className="md:w-1/3 space-y-2 max-h-[70vh] overflow-y-auto">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => handleClick(i)}
              className={`
                w-full text-left p-3 rounded-lg border transition
                ${
                  selected === i
                    ? "bg-emerald-100 border-emerald-500 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                    : "bg-background border-muted hover:bg-muted"
                }
              `}
            >
              <strong>{i + 1}. {s.title}</strong>
            </button>
          ))}
        </div>

        {/* ================= DETAIL DESKTOP ================= */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 bg-card p-6 rounded-xl shadow"
        >
          <h3 className="text-xl font-semibold mb-3">
            {step.title}
          </h3>

          <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
            {step.content.map((c, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{ __html: highlightKeywords(c) }}
              />
            ))}
          </ul>

          {step.note && (
            <p className="text-sm italic bg-amber-100 dark:bg-amber-900/40 p-2 rounded mb-4">
              💡 {step.note}
            </p>
          )}

          {step.image && (
            <div className="relative w-full h-[360px] rounded-lg overflow-hidden border">
              <Image
                src={step.image}
                alt={step.title}
                fill
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* ================= MODAL MOBILE ================= */}
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
              className="bg-background rounded-xl p-4 max-w-md w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-3">{step.title}</h3>

              <ul className="list-disc pl-5 text-sm mb-3">
                {step.content.map((c, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: highlightKeywords(c) }}
                  />
                ))}
              </ul>

              {step.image && (
                <div className="relative h-64 rounded overflow-hidden border mb-3">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-emerald-600 text-white py-2 rounded"
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
