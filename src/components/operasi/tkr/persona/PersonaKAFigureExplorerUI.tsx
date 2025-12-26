"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  personaKAFigures,
  type PersonaFigure,
} from "@/components/operasi/tkr/persona/data/personaKAFigureBased.data";
import { groupFiguresByStage } from "@/components/operasi/tkr/persona/data/personaKAFigure.utils";

const grouped = groupFiguresByStage(personaKAFigures);

export default function PersonaKAFigureExplorerUI() {
  const [activeFigure, setActiveFigure] = useState<number>(1);

  const figure = personaKAFigures.find(
    (f) => f.figure === activeFigure
  ) as PersonaFigure;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Persona KA — Figure Explorer
        </h1>
        <p className="text-muted-foreground max-w-3xl mt-2">
          Penjelasan figure-by-figure berdasarkan Persona KA Surgical Technique
          untuk edukasi teknikal support.
        </p>
      </header>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        {/* LEFT — FIGURE LIST */}
        <aside className="space-y-4">
          {Object.entries(grouped).map(([stage, figs]) => (
            <div key={stage}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                STAGE {stage}
              </p>
              <div className="space-y-1">
                {figs.map((f) => (
                  <button
                    key={f.figure}
                    onClick={() => setActiveFigure(f.figure)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm border ${
                      activeFigure === f.figure
                        ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30"
                        : "bg-white dark:bg-zinc-900"
                    }`}
                  >
                    Figure {f.figure}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* RIGHT — FIGURE DETAIL */}
        <section>
          <AnimatePresence mode="wait">
            <motion.div
              key={figure.figure}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden"
            >
              {/* IMAGE */}
              <div className="bg-neutral-50 dark:bg-zinc-800 p-6 flex justify-center">
                <Image
                  src={figure.imagePath}
                  alt={figure.title}
                  width={520}
                  height={420}
                  className="object-contain"
                />
              </div>

              {/* CONTENT */}
              <div className="p-6 space-y-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Figure {figure.figure}
                </p>
                <h2 className="text-xl font-semibold">
                  {figure.title}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {figure.description}
                </p>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 text-sm">
                  <b>Rasional Biomekanik:</b> {figure.rationale}
                </div>

                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-4 text-sm">
                  💡 <b>Catatan untuk Technical Support:</b>{" "}
                  {figure.techSupportNote}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
