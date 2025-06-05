// File: app/page.tsx

"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Import berbagai halaman/komponen
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import DataOperasiku from "@/components/jadwalVisit/page";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import { ThemeToggle } from "@/components/button-darkmode";
import DigitalTemplatingPage from "@/components/digitalTemplating/templating";
import LandingPage from "@/app/kasus/page";
import StockPage from "@/components/stock/Stock";

export default function Home() {
  return (
    <div className="w-full px-4 py-6 bg-background text-foreground transition-colors">
      {/* Judul & Toggle Tema */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-1">
            Catatan Operasi
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            Teknik bedah berdasarkan jenis tindakan: THR, UKA, Persona, Vanguard, dan Templating.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="surgicalStepsUka" className="w-full">
        <ScrollArea className="overflow-x-auto rounded-md border mb-4 bg-card">
          <div className="flex w-max space-x-2 p-2">
            <TabsList className="flex w-full justify-start items-center gap-2 bg-muted">
              {/* --------------------- Kelompok 1: Teknik Bedah --------------------- */}
              <TabsTrigger
                value="posisiHip"
                className="whitespace-nowrap"
              >
                Posisi & Teknik Hip
              </TabsTrigger>
              <TabsTrigger
                value="surgicalStepsUka"
                className="whitespace-nowrap"
              >
                UKA
              </TabsTrigger>
              <TabsTrigger
                value="surgicalTechniquePersona"
                className="whitespace-nowrap"
              >
                Persona
              </TabsTrigger>
              <TabsTrigger
                value="vanguardSteps"
                className="whitespace-nowrap"
              >
                Vanguard
              </TabsTrigger>
              <TabsTrigger
                value="digitalTemplating"
                className="whitespace-nowrap"
              >
                Templating
              </TabsTrigger>

              {/* Separator (batas) di antara kelompok */}
              <span className="inline-block h-6 border-l border-gray-300 mx-2" />

              {/* --------------------- Kelompok 2: Lainnya --------------------- */}
              <TabsTrigger
                value="landingPage"
                className="whitespace-nowrap"
              >
                Case Study
              </TabsTrigger>
              <TabsTrigger
                value="stockImplan"
                className="whitespace-nowrap"
              >
                Manajemen Stock
              </TabsTrigger>
              <TabsTrigger
                value="dataOperasiku"
                className="whitespace-nowrap"
              >
                Visit Dokter
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* --------------------- Konten Tiap Tab --------------------- */}
        <TabsContent value="landingPage">
          <LandingPage />
        </TabsContent>

        <TabsContent value="posisiHip">
          <PosisiHip />
        </TabsContent>

        <TabsContent value="surgicalStepsUka">
          <SurgicalStepsUka />
        </TabsContent>

        <TabsContent value="surgicalTechniquePersona">
          <SurgicalTechniquePersona />
        </TabsContent>

        <TabsContent value="vanguardSteps">
          <VanguardStepsGallery />
        </TabsContent>

        <TabsContent value="digitalTemplating">
          <DigitalTemplatingPage />
        </TabsContent>

        <TabsContent value="stockImplan">
          <StockPage />
        </TabsContent>

        <TabsContent value="dataOperasiku">
          <DataOperasiku />
        </TabsContent>
      </Tabs>
    </div>
  );
}
