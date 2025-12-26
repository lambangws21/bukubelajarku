"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  personaPdfContents,
  type PersonaPdfContent,
} from "@/components/operasi/tkr/persona/data/personaTechSupportEdu.data";

export default function PersonaTechSupportEduUI() {
  const [active, setActive] = useState<string>(personaPdfContents[0].code);

  const activeStep = personaPdfContents.find(
    (s) => s.code === active
  ) as PersonaPdfContent;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Persona® TKA – Technical Support Guide
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-1">
          Ringkasan edukatif berbasis dokumen resmi
          <span className="font-medium">
            {" "}
            Persona® The Personalized Knee® Surgical Technique
          </span>{" "}
          (Zimmer Biomet).
        </p>
      </header>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        {/* LEFT — STEP NAVIGATION */}
        <aside className="space-y-3">
          {personaPdfContents.map((step) => {
            const isActive = active === step.code;

            return (
              <button
                key={step.code}
                onClick={() => setActive(step.code)}
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
                    IMAGE {step.code}
                  </p>
                  <p className="font-semibold text-sm">{step.title}</p>

                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="mt-2 h-1 w-12 rounded bg-blue-600"
                    />
                  )}
                </motion.div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT — CONTENT */}
        <section>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* TITLE */}
              <div>
                <h2 className="text-2xl font-semibold">{activeStep.title}</h2>
                {/* IMAGE */}
                <div className="relative rounded-2xl overflow-hidden border bg-black/5">
                  <Image
                    src={activeStep.imagePath}
                    alt={activeStep.title}
                    width={500}
                    height={400}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>

                <span className="inline-block mt-2 text-xs rounded-full border px-3 py-1 bg-muted">
                  📷 Reference Image: {activeStep.code}
                </span>
              </div>

              {/* DESCRIPTION */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="rounded-2xl border p-5 bg-white dark:bg-zinc-900 shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Deskripsi sesuai surgical technique
                </p>
                <p className="text-sm leading-relaxed">
                  {activeStep.description}
                </p>
              </motion.div>

              {/* EDUCATIONAL NOTE */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="rounded-2xl border p-5 bg-blue-50 dark:bg-blue-900/30"
              >
                <p className="text-xs uppercase tracking-wide font-semibold mb-1">
                  Catatan edukatif untuk teknikal support
                </p>
                <p className="text-sm leading-relaxed">
                  {activeStep.educationalNote}
                </p>
              </motion.div>

              {/* SOURCE */}
              <div className="rounded-xl border p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground">Sumber resmi:</p>
                <a
                  href={activeStep.pdfReference}
                  target="_blank"
                  className="text-xs text-blue-600 underline"
                >
                  Persona® The Personalized Knee® Surgical Technique (Zimmer
                  Biomet – PDF)
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
