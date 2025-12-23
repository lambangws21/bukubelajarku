'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

// Impor komponen-komponen untuk konten tab
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "@/app/procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import AnatomiTkr from "@/components/operasi/tkr/anatomi-guide-tkr";
import AnatomiThr from "@/components/operasi/thr/anatomi-thr";

// --- Konfigurasi ---

// Konfigurasi untuk setiap tab
const tabConfig = [
  { value: "posisiHip", label: "Posisi & Teknik Hip", Component: PosisiHip },
  { value: "surgicalStepsUka", label: "UKA", Component: SurgicalStepsUka },
  { value: "surgicalTechniquePersona", label: "Persona", Component: SurgicalTechniquePersona },
  { value: "vanguardSteps", label: "Vanguard", Component: VanguardStepsGallery },
  { value: "AnatomiThr", label:"ANATOMI-THR", Component: AnatomiThr },
  { value: "AnatomiTkr", label:"ANATOMI-TKR", Component: AnatomiTkr },
  
] as const;

type TabValue = typeof tabConfig[number]['value'];

// --- Komponen Utama ---

export default function DashboardPage() {
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === "undefined") return "posisiHip";
    const saved = localStorage.getItem("pinnedTab") as TabValue | null;
    return tabConfig.some(t => t.value === saved)
      ? saved!
      : "posisiHip";
  });

  const today = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("pinnedTab", tab);
  }, [tab]);

  return (
    <motion.div>
      <div className="flex justify-end text-sm">
        <Calendar className="w-4 h-4 mr-1" /> {today}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        {/* ... */}
      </Tabs>
    </motion.div>
  );
}
