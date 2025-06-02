// file: app/page.tsx

"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import DataOperasiku from "@/components/jadwalVisit/page";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import { ThemeToggle } from "@/components/button-darkmode";
import DigitalTemplatingPage from "@/components/digitalTemplating/templating";
import LandingPage from "@/app/kasus/page";




export default function Home() {
  return (
    <div className="w-full px-4 py-6 bg-background text-foreground transition-colors">
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
            <TabsList className="flex w-full justify-start gap-2 bg-muted">       
              <TabsTrigger value="posisiHip">Posisi & Teknik Hip</TabsTrigger>
              <TabsTrigger value="surgicalStepsUka">UKA</TabsTrigger>
              <TabsTrigger value="surgicalTechniquePersona">Persona</TabsTrigger>
              <TabsTrigger value="vanguardSteps">Vanguard</TabsTrigger>
              <TabsTrigger value="digitalTemplating">Templating</TabsTrigger>
              <TabsTrigger value="landingPage">Case Study</TabsTrigger>
              <TabsTrigger value="dataOperasiku">Visit Dokter</TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
          <DigitalTemplatingPage/>
        </TabsContent>
        <TabsContent value="dataOperasiku">
          <DataOperasiku />
        </TabsContent>
      </Tabs>
    </div>
  );
}
