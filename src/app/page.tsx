// File: app/page.tsx
"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/button-darkmode";

// 📂 Import Halaman
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import DataOperasiku from "@/components/jadwalVisit/page";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import DigitalTemplatingPage from "@/components/digitalTemplating/page";
import LandingPage from "@/app/kasus/page";
import Dashboard from "@/components/Dasboards/DashboardPersonal";
import RiwayatOperasi from "@/components/RiwayatOperasi";
import StockPage from "@/components/stock/stokNoEdit";

// 🎯 Konfigurasi Tab
const tabItems = [
  { value: "posisiHip", label: "Posisi & Teknik Hip", component: <PosisiHip /> },
  { value: "surgicalStepsUka", label: "UKA", component: <SurgicalStepsUka /> },
  { value: "surgicalTechniquePersona", label: "Persona", component: <SurgicalTechniquePersona /> },
  { value: "vanguardSteps", label: "Vanguard", component: <VanguardStepsGallery /> },
  { value: "digitalTemplating", label: "Templating", component: <DigitalTemplatingPage /> },
  { value: "landingPage", label: "Case Study", component: <LandingPage /> },
  { value: "RiwayatOperasi", label: "Riwayat Operasi", component: <RiwayatOperasi /> },
  { value: "stok", label: "Stok Implan", component: <StockPage /> },
  { value: "Dashboard", label: "Personal", component: <Dashboard /> },
];

export default function Home() {
  return (
    <div className="w-full px-4 py-6 bg-background text-foreground transition-colors">
      {/* 🏷️ Header */}
      <motion.div
        className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-1">
            Catatan Operasi 
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            Teknik bedah berdasarkan jenis tindakan: THR, UKA, Persona, Vanguard, dan Templating.
          </p>
        </div>
        <ThemeToggle />
      </motion.div>

      {/* 📌 Tabs Navigation */}
      <Tabs defaultValue="surgicalStepsUka" className="w-full">
        <ScrollArea className="overflow-x-auto rounded-md border mb-4 bg-card">
          <div className="flex w-max p-2">
            <TabsList className="flex gap-2 bg-muted rounded-md px-2">
              {tabItems.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="whitespace-nowrap px-4 py-2 rounded-md transition-all 
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* 📄 Tab Content */}
        {tabItems.map(({ value, component }) => (
          <TabsContent key={value} value={value}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {component}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
