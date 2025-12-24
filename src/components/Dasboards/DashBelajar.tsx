"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import {
  Calendar,
  Bone,
  Activity,
  Brain,
  Shield,
  HeartPulse,
  ScanLine,
} from "lucide-react";

/* ================= CONTENT ================= */
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "@/app/procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import AnatomiTkr from "@/components/operasi/tkr/anatomi-guide-tkr";
import AnatomiThr from "@/components/operasi/thr/anatomi-thr";

/* ================= COLOR MAP (STATIC) ================= */
const tabColorClass = {
  blue: {
    active: "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
  },
  emerald: {
    active:
      "data-[state=active]:bg-emerald-600 data-[state=active]:text-white",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
  },
  purple: {
    active:
      "data-[state=active]:bg-purple-600 data-[state=active]:text-white",
    hover: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
  },
  amber: {
    active:
      "data-[state=active]:bg-amber-500 data-[state=active]:text-white",
    hover: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
  },
  rose: {
    active:
      "data-[state=active]:bg-rose-600 data-[state=active]:text-white",
    hover: "hover:bg-rose-100 dark:hover:bg-rose-900/30",
  },
  cyan: {
    active:
      "data-[state=active]:bg-cyan-600 data-[state=active]:text-white",
    hover: "hover:bg-cyan-100 dark:hover:bg-cyan-900/30",
  },
} as const;

/* ================= TAB CONFIG ================= */
const tabConfig = [
  {
    value: "posisiHip",
    label: "HIP",
    icon: Bone,
    color: "blue",
    modules: 6,
    Component: PosisiHip,
  },
  {
    value: "surgicalStepsUka",
    label: "UKA",
    icon: Activity,
    color: "emerald",
    modules: 3,
    Component: SurgicalStepsUka,
  },
  {
    value: "surgicalTechniquePersona",
    label: "Persona",
    icon: Brain,
    color: "purple",
    modules: 5,
    Component: SurgicalTechniquePersona,
  },
  {
    value: "vanguardSteps",
    label: "Vanguard",
    icon: Shield,
    color: "amber",
    modules: 4,
    Component: VanguardStepsGallery,
  },
  {
    value: "anatomiThr",
    label: "ANATOMI HIP",
    icon: HeartPulse,
    color: "rose",
    modules: 2,
    Component: AnatomiThr,
  },
  {
    value: "anatomiTkr",
    label: "ANATOMI KNEE",
    icon: ScanLine,
    color: "cyan",
    modules: 2,
    Component: AnatomiTkr,
  },
] as const;

type TabValue = typeof tabConfig[number]["value"];

/* ================= COMPONENT ================= */

export default function DashboardPage() {
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === "undefined") return "posisiHip";
    const saved = localStorage.getItem("pinnedTab") as TabValue | null;
    return tabConfig.some((t) => t.value === saved)
      ? saved!
      : "posisiHip";
  });

  useEffect(() => {
    localStorage.setItem("pinnedTab", tab);
  }, [tab]);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* ================= DATE ================= */}
      <div className="flex justify-end text-sm text-muted-foreground mb-2">
        <Calendar className="w-4 h-4 mr-1" /> {today}
      </div>

      {/* ================= TABS ================= */}
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <Tabs.List className="flex gap-2 overflow-x-auto scrollbar-hide rounded-full bg-muted p-1">
          {tabConfig.map(
            ({ value, label, icon: Icon, color, modules }) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className={`
                  group inline-flex items-center gap-2 px-4 py-2 rounded-full
                  text-sm font-medium transition-all whitespace-nowrap
                  ${tabColorClass[color].active}
                  ${tabColorClass[color].hover}
                  data-[state=active]:shadow
                `}
              >
                <Icon className="w-4 h-4" />

                <span>{label}</span>

                {/* ===== MODULE BADGE ===== */}
                <span
                  className="
                    ml-1 rounded-full bg-background/70 px-2 py-0.5
                    text-[10px] font-semibold
                    group-data-[state=active]:bg-white/20
                  "
                >
                  {modules}
                </span>
              </Tabs.Trigger>
            )
          )}
        </Tabs.List>

        {/* ================= CONTENT ================= */}
        {tabConfig.map(({ value, Component }) => (
          <Tabs.Content key={value} value={value} className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Component />
            </motion.div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </motion.div>
  );
}
