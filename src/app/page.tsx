"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import FormGoogle from "@/app/pages/form/page";
import DataOperasi from "@/app/pages/displaydata/page";
import DataOperasiku from "@/components/jadwalVisit/page";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";

export default function Home() {
  return (
    <div className="w-full p-4">
      <Tabs defaultValue="form" className="w-full">
        <ScrollArea className="max-w-full overflow-x-auto rounded-md border">
          <div className="flex w-max space-x-4 p-2">
            <TabsList className="flex w-full justify-start min-w-max">
              <TabsTrigger value="dataOperasiku">Visit Dokter</TabsTrigger>
              <TabsTrigger value="posisiHip">Posisi Hip</TabsTrigger>
              <TabsTrigger value="surgicalStepsUka">Surgical Steps UKA</TabsTrigger>
              <TabsTrigger value="surgicalTechniquePersona">Surgical Technique Persona</TabsTrigger>
              <TabsTrigger value="vanguardSteps">Surgical Technique Vanguard</TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="dataOperasiku">
          <DataOperasiku />
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
          <VanguardStepsGallery /> {/* ✅ Gunakan komponen, bukan data */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
