"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Bone,
  Activity,
  Brain,
  Shield,
  ScanLine,
  HeartPulse,
  Layers,
  Stethoscope,
} from "lucide-react";

/* ================= CONTENT ================= */
import SurgicalTechniquePersona from "@/components/operasi/tkr/persona/PersonaSurgitech";
import PosisiHip from "@/app/procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import AnatomiTkr from "@/components/operasi/tkr/anatomi-guide-tkr";
import AnatomiThr from "@/components/operasi/thr/anatomi-thr";

import WagnerConeInteractiveLearning from "@/components/operasi/hip/WagnerConeInteractiveLearning";
import MLTaperInteractiveLearning from "@/components/operasi/hip/MLTaperInteractiveLearning";
import CPT1214InteractiveLearning from "@/components/operasi/hip/CPT1214InteractiveLearning";
import ContinuumAcetabularInteractiveLearning from "@/components/operasi/hip/ContinuumAcetabularInteractiveLearning";
import TrilogyITInteractiveLearning from "@/components/operasi/hip/TrilogyITInteractiveLearning";
import ZCAAllPolyInteractiveLearning from "@/components/operasi/hip/ZCAAllPolyInteractiveLearning";
import FemoralHeadInteractiveLearning from "@/components/operasi/hip/FemoralHeadInteractiveLearning";

import TKAKnowledgeUI from "@/components/operasi/tkr/(knee)/TKAKnowledgeUI";
import TKAFemoralRotationCourse from "@/components/operasi/tkr/(knee)/TKAFemoralRotationCourse";
import TKAIntraOpGuideUI from "@/components/operasi/tkr/(knee)/TKAIntraOpGuideUI";
import TKAMentalChecklistUI from "@/components/operasi/tkr/(knee)/TKAMentalChecklistUI";
import TKAImplantDecisionGuideUI from "../operasi/tkr/(knee)/TKAImplantDecisionGuideUI";
import PersonaKASurgicalGuideUI from "../operasi/tkr/persona/PersonaKASurgicalGuideUI";

/* ================= TYPES ================= */
type RootTab = "hip" | "knee";
type KneeTab =
  | "uka"
  | "persona"
  | "personaAlignment"
  | "vanguard"
  | "anatomiKnee"
  | "knowledge"
  | "rotation"
  | "guide"
  | "implant";
type HipTab = "anatomi" | "posisi" | "implant";
type HipImplantTab = "stem" | "acetabulum" | "head";

/* ================= UI HELPERS ================= */
const tabBase =
  "relative px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap";
const tabActive =
  "bg-primary text-primary-foreground shadow-md scale-[1.02]";
const tabInactive =
  "text-muted-foreground hover:bg-muted";

/* ================= COMPONENT ================= */
export default function DashboardPage() {
  const [rootTab, setRootTab] = useState<RootTab>("knee");
  const [kneeTab, setKneeTab] = useState<KneeTab>("uka");
  const [hipTab, setHipTab] = useState<HipTab>("anatomi");
  const [hipImplantTab, setHipImplantTab] =
    useState<HipImplantTab>("stem");

  /* ===== persist ===== */
  useEffect(() => {
    localStorage.setItem("rootTab", rootTab);
    localStorage.setItem("kneeTab", kneeTab);
    localStorage.setItem("hipTab", hipTab);
    localStorage.setItem("hipImplantTab", hipImplantTab);
  }, [rootTab, kneeTab, hipTab, hipImplantTab]);

  useEffect(() => {
    setRootTab((localStorage.getItem("rootTab") as RootTab) ?? "knee");
    setKneeTab((localStorage.getItem("kneeTab") as KneeTab) ?? "uka");
    setHipTab((localStorage.getItem("hipTab") as HipTab) ?? "anatomi");
    setHipImplantTab(
      (localStorage.getItem("hipImplantTab") as HipImplantTab) ??
        "stem"
    );
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* DATE */}
      <div className="flex justify-end text-xs text-muted-foreground">
        <Calendar className="w-4 h-4 mr-1" /> {today}
      </div>

      {/* ================= ROOT ================= */}
      <Tabs.Root value={rootTab} onValueChange={(v) => setRootTab(v as RootTab)}>
        <Tabs.List className="flex gap-2 p-1 rounded-full bg-muted/60 backdrop-blur overflow-x-auto">
          <RootTabButton
            value="hip"
            icon={Bone}
            active={rootTab === "hip"}
          />
          <RootTabButton
            value="knee"
            icon={Activity}
            active={rootTab === "knee"}
          />
        </Tabs.List>

        <AnimatePresence mode="wait">
          {rootTab === "hip" && (
            <Tabs.Content value="hip" forceMount>
              <MotionPanel>
                <HipSection
                  hipTab={hipTab}
                  setHipTab={setHipTab}
                  hipImplantTab={hipImplantTab}
                  setHipImplantTab={setHipImplantTab}
                />
              </MotionPanel>
            </Tabs.Content>
          )}

          {rootTab === "knee" && (
            <Tabs.Content value="knee" forceMount>
              <MotionPanel>
                <KneeSection kneeTab={kneeTab} setKneeTab={setKneeTab} />
              </MotionPanel>
            </Tabs.Content>
          )}
        </AnimatePresence>
      </Tabs.Root>
    </motion.div>
  );
}

/* ================= SECTIONS ================= */

function HipSection({
  hipTab,
  setHipTab,
  hipImplantTab,
  setHipImplantTab,
}: any) {
  return (
    <Tabs.Root value={hipTab} onValueChange={setHipTab}>
      <Tabs.List className="flex gap-2 overflow-x-auto pb-2">
        <Tab value="anatomi" icon={HeartPulse} active={hipTab === "anatomi"} />
        <Tab value="posisi" icon={Stethoscope} active={hipTab === "posisi"} />
        <Tab value="implant" icon={Shield} active={hipTab === "implant"} />
      </Tabs.List>

      <Tabs.Content value="anatomi"><AnimatedSection><AnatomiThr /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="posisi"><AnimatedSection><PosisiHip /></AnimatedSection></Tabs.Content>

      <Tabs.Content value="implant">
        <Tabs.Root value={hipImplantTab} onValueChange={setHipImplantTab}>
          <Tabs.List className="flex gap-2 mt-4 overflow-x-auto">
            <Tab value="stem" icon={Layers} active={hipImplantTab === "stem"} />
            <Tab value="acetabulum" icon={ScanLine} active={hipImplantTab === "acetabulum"} />
            <Tab value="head" icon={Brain} active={hipImplantTab === "head"} />
          </Tabs.List>

          <Tabs.Content value="stem"><AnimatedSection>
            <WagnerConeInteractiveLearning />
            <MLTaperInteractiveLearning />
            <CPT1214InteractiveLearning />
          </AnimatedSection></Tabs.Content>

          <Tabs.Content value="acetabulum"><AnimatedSection>
            <ContinuumAcetabularInteractiveLearning />
            <TrilogyITInteractiveLearning />
            <ZCAAllPolyInteractiveLearning />
          </AnimatedSection></Tabs.Content>

          <Tabs.Content value="head"><AnimatedSection>
            <FemoralHeadInteractiveLearning />
          </AnimatedSection></Tabs.Content>
        </Tabs.Root>
      </Tabs.Content>
    </Tabs.Root>
  );
}

function KneeSection({ kneeTab, setKneeTab }: any) {
  return (
    <Tabs.Root value={kneeTab} onValueChange={setKneeTab}>
      <Tabs.List className="flex gap-2 flex-wrap">
        {[
          ["uka", "UKA"],
          ["persona", "Persona"],
          ["personaAlignment", "Persona Alignment"],
          ["vanguard", "Vanguard"],
          ["anatomiKnee", "Anatomi"],
          ["knowledge", "Knowledge"],
          ["rotation", "Rotation Guide"],
          ["guide", "Intra-op"],
          ["implant", " PS vs CR"],
          ["decision", "Decision Guide"],
        ].map(([v, l]) => (
          <Tab key={v} value={v} label={l} active={kneeTab === v} />
        ))}
      </Tabs.List>

      <Tabs.Content value="uka"><AnimatedSection><SurgicalStepsUka /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="persona"><AnimatedSection><SurgicalTechniquePersona /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="personaAlignment"><AnimatedSection><PersonaKASurgicalGuideUI /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="vanguard"><AnimatedSection><VanguardStepsGallery /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="anatomiKnee"><AnimatedSection><AnatomiTkr /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="knowledge"><AnimatedSection><TKAKnowledgeUI /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="rotation"><AnimatedSection><TKAFemoralRotationCourse /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="guide"><AnimatedSection><TKAIntraOpGuideUI /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="implant"><AnimatedSection><TKAMentalChecklistUI /></AnimatedSection></Tabs.Content>
      <Tabs.Content value="decision"><AnimatedSection><TKAImplantDecisionGuideUI /></AnimatedSection></Tabs.Content>
    </Tabs.Root>
  );
}

/* ================= UI COMPONENTS ================= */

function RootTabButton({ value, icon: Icon, active }: any) {
  return (
    <Tabs.Trigger
      value={value}
      className={`${tabBase} ${active ? tabActive : tabInactive}`}
    >
      <Icon className="w-4 h-4 inline mr-1" />
      {value.toUpperCase()}
    </Tabs.Trigger>
  );
}

function Tab({ value, icon: Icon, label, active }: any) {
  return (
    <Tabs.Trigger
      value={value}
      className={`${tabBase} ${active ? tabActive : tabInactive}`}
    >
      {Icon && <Icon className="w-4 h-4 inline mr-1" />}
      {label ?? value}
    </Tabs.Trigger>
  );
}

function MotionPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-4"
    >
      {children}
    </motion.div>
  );
}
