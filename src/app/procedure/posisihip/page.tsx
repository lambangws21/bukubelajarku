"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, MoveDownRight } from "lucide-react";

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


/* ================= MAIN SECTIONS ================= */
const SECTIONS = [
  { id: "education", label: "Edukasi Singkat" },
  { id: "technique", label: "Teknik Operasi" },
  { id: "planning", label: "Planning" },
  { id: "notes", label: "Clinical Notes" },
];

/* ================= ANIMATION PRESETS ================= */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PosisiHip() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [techTab, setTechTab] = useState("stem");

  const activeSection = SECTIONS[activeIndex];
  const progress = ((activeIndex + 1) / SECTIONS.length) * 100;

  const scrollTo = (index: number) => {
    const el = document.getElementById(SECTIONS[index].id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(index);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-14">
      {/* ================= TOP NAV TABS ================= */}
      <Tabs
        value={activeSection.id}
        className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b"
      >
        <TabsList className="w-full justify-start gap-2 overflow-x-auto">
          {SECTIONS.map((s, i) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              onClick={() => scrollTo(i)}
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ================= PROGRESS + NEXT PREV ================= */}
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

      {/* ================= EDUCATION ================= */}
      <section id="education" className="scroll-mt-32">
        <TotalHipArthroplasty />
      </section>

      {/* ================= PLANNING ================= */}
      <motion.section
        id="planning"
        className="scroll-mt-32 space-y-4"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <header>
          <h2 className="text-2xl font-bold">
            Preoperative Planning
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Tahapan perencanaan pra-operatif untuk memastikan
            hasil Total Hip Replacement yang optimal.
          </p>
        </header>

        <PlaningCard />
      </motion.section>

      {/* ================= TECHNIQUE ================= */}
<motion.section
  id="technique"
  className="scroll-mt-32 space-y-10"
  variants={fadeUp}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {/* ===== HEADER ===== */}
  <header className="space-y-2">
    <h2 className="text-3xl font-bold text-purple-500 to-slate-400">
      Surgical Technique
    </h2>
    <p className="text-sm text-muted-foreground max-w-2xl">
      Alur intraoperatif Total Hip Replacement dimulai dari
      persiapan umum, kemudian dilanjutkan dengan teknik
      spesifik berdasarkan komponen implan.
    </p>
  </header>

  {/* ================= STEP 1: GENERAL SURGICAL FLOW ================= */}
  <div className="rounded-xl border bg-muted/30 p-4">
    <h3 className="text-lg font-semibold mb-2">
      Alur Operasi Umum (Overview)
    </h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
      Bagian ini menjelaskan urutan dasar teknik operasi
      Total Hip Replacement sebelum masuk ke teknik spesifik
      tiap komponen implan.
    </p>

    <ThrTechniqueCard />
  </div>

  {/* ================= STEP 2: COMPONENT-BASED TECHNIQUE ================= */}
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-red-500">
      <MoveDownRight className="inline-block mr-2 animate-bounce" /> Teknik Berdasarkan Komponen Implan
    </h3>
    <p className="text-sm text-muted-foreground max-w-3xl">
      Pilih komponen untuk mempelajari teknik pemasangan
      secara lebih mendalam dan sistematis.
    </p>

    <Tabs
      value={techTab}
      onValueChange={setTechTab}
      className="w-full"
    >
  <TabsList className="flex flex-wrap gap-2">
  <TabsTrigger
    value="stem"
    className="
      data-[state=active]:bg-blue-600
      data-[state=active]:text-white
      data-[state=active]:shadow
      border-blue-200
      text-blue-700
      transition-all duration-200 hover:scale-[1.03]


    "
    
  >
    Stem
  </TabsTrigger>

  <TabsTrigger
    value="acetabulum"
    className="
      data-[state=active]:bg-emerald-600
      data-[state=active]:text-white
      data-[state=active]:shadow
      border-emerald-200
      text-emerald-700
      transition-all duration-200 hover:scale-[1.03]

    "
  >
    Acetabulum
  </TabsTrigger>

  <TabsTrigger
    value="head"
    className="
      data-[state=active]:bg-purple-600
      data-[state=active]:text-white
      data-[state=active]:shadow
      border-purple-200
      text-purple-700
      transition-all duration-200 hover:scale-[1.03]

    "
  >
    Head
  </TabsTrigger>

  <TabsTrigger
    value="bipolar"
    className="
      data-[state=active]:bg-amber-500
      data-[state=active]:text-white
      data-[state=active]:shadow
      border-amber-200
      text-amber-700
      transition-all duration-200 hover:scale-[1.03]

    "
  >
    Bipolar
  </TabsTrigger>
</TabsList>


      {/* ===== TAB CONTENT ===== */}
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
          <div className="text-sm text-muted-foreground">
            <FemoralHeadInteractiveLearning/>
          </div>
        )}

        {techTab === "bipolar" && (
          <div className="text-sm text-muted-foreground">
            Modul Bipolar akan ditambahkan.
          </div>
        )}
      </motion.div>
    </Tabs>
  </div>
</motion.section>


      {/* ================= NOTES ================= */}
      <motion.section
        id="notes"
        className="scroll-mt-32 space-y-4"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <header>
          <h2 className="text-2xl font-bold">
            Clinical Notes & Pearls
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Tips klinis, catatan penting, dan potensi
            komplikasi selama dan setelah operasi.
          </p>
        </header>

        <NoteCard />
      </motion.section>
    </main>
  );
}
