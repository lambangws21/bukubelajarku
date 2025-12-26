"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, MoveDownRight } from "lucide-react";

/* ================= CONTENT ================= */
import TotalHipArthroplasty from "@/components/operasi/hip/TotalHipArthroplastyModule";
import { PlaningCard } from "@/components/operasi/hip/planing";
import { ThrTechniqueCard } from "@/components/operasi/hip/Thr-steps";
import NoteCard from "@/components/operasi/hip/notecard";

import WagnerConeInteractiveLearning from "@/components/operasi/hip/WagnerConeInteractiveLearning";
import MLTaperInteractiveLearning from "@/components/operasi/hip/MLTaperInteractiveLearning";
import CPT1214InteractiveLearning from "@/components/operasi/hip/CPT1214InteractiveLearning";
import TrilogyITInteractiveLearning from "@/components/operasi/hip/TrilogyITInteractiveLearning";
import ZCAAllPolyInteractiveLearning from "@/components/operasi/hip/ZCAAllPolyInteractiveLearning";
import ContinuumAcetabularInteractiveLearning from "@/components/operasi/hip/ContinuumAcetabularInteractiveLearning";
import FemoralHeadInteractiveLearning from "@/components/operasi/hip/FemoralHeadInteractiveLearning";

/* ================= SECTIONS ================= */
const SECTIONS = [
  { id: "education", label: "Edukasi Singkat" },
  { id: "planning", label: "Preoperative Planning" },
  { id: "technique", label: "Surgical Technique" },
  { id: "notes", label: "Clinical Notes & Pearls" },
];

/* ================= ANIMATION ================= */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ================= COLLAPSIBLE SECTION ================= */
function CollapsibleSection({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-32 space-y-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between
                   px-4 py-3 rounded-lg
                   bg-muted/40 hover:bg-muted transition"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xl font-bold">
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden px-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function PosisiHip() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [techTab, setTechTab] = useState("stem");

  const progress = ((activeIndex + 1) / SECTIONS.length) * 100;

  const scrollTo = (index: number) => {
    const el = document.getElementById(SECTIONS[index].id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(index);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">

      {/* ================= PROGRESS ================= */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Progress Pembelajaran
          </span>
          <span className="font-medium">
            {Math.round(progress)}%
          </span>
        </div>

        <Progress value={progress} />

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={activeIndex === 0}
            onClick={() => scrollTo(activeIndex - 1)}
          >
            <ChevronLeft size={16} />
            Prev
          </Button>

          <Button
            size="sm"
            disabled={activeIndex === SECTIONS.length - 1}
            onClick={() => scrollTo(activeIndex + 1)}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </motion.div>

      {/* ================= EDUKASI ================= */}
      <CollapsibleSection
        id="education"
        title="Edukasi Singkat"
        defaultOpen
      >
        <TotalHipArthroplasty />
      </CollapsibleSection>

      {/* ================= PLANNING ================= */}
      <CollapsibleSection
        id="planning"
        title="Preoperative Planning"
      >
        <PlaningCard />
      </CollapsibleSection>

      {/* ================= TECHNIQUE ================= */}
      <CollapsibleSection
        id="technique"
        title="Surgical Technique"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-10"
        >
          {/* ===== GENERAL FLOW ===== */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <h3 className="text-lg font-semibold mb-2">
              Alur Operasi Umum (Overview)
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
              Urutan dasar teknik operasi Total Hip Replacement
              sebelum masuk ke teknik spesifik tiap komponen implan.
            </p>
            <ThrTechniqueCard />
          </div>

          {/* ===== COMPONENT BASED ===== */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-500">
              <MoveDownRight className="inline-block mr-2 animate-bounce" />
              Teknik Berdasarkan Komponen Implan
            </h3>

            <Tabs value={techTab} onValueChange={setTechTab}>
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="stem">Stem</TabsTrigger>
                <TabsTrigger value="acetabulum">Acetabulum</TabsTrigger>
                <TabsTrigger value="head">Head</TabsTrigger>
                <TabsTrigger value="bipolar">Bipolar</TabsTrigger>
              </TabsList>
            </Tabs>

            <motion.div
              key={techTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              {techTab === "stem" && (
                <div className="space-y-16">
                  <WagnerConeInteractiveLearning />
                  <MLTaperInteractiveLearning />
                  <CPT1214InteractiveLearning />
                </div>
              )}

              {techTab === "acetabulum" && (
                <div className="space-y-16">
                  <ContinuumAcetabularInteractiveLearning />
                  <TrilogyITInteractiveLearning />
                  <ZCAAllPolyInteractiveLearning />
                </div>
              )}

              {techTab === "head" && (
                <FemoralHeadInteractiveLearning />
              )}

              {techTab === "bipolar" && (
                <p className="text-sm text-muted-foreground">
                  Modul Bipolar akan ditambahkan.
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </CollapsibleSection>

      {/* ================= NOTES ================= */}
      <CollapsibleSection
        id="notes"
        title="Clinical Notes & Pearls"
      >
        <NoteCard />
      </CollapsibleSection>
    </main>
  );
}
