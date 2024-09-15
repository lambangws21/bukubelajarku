"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/ukr/surgicalstep";
import FormGoogleSheet from "@/app/googlesheetform/page";

export default function Home() {
  return (
    <div className="w-full p-4">
      <Tabs defaultValue="form" className="w-full">
        {/* Membungkus TabsList dengan ScrollArea untuk membuatnya dapat digulir */}
        <ScrollArea className="max-w-full overflow-x-auto">
          <TabsList className="flex justify-center">
            <TabsTrigger value="form">Form Google Sheet</TabsTrigger>
            <TabsTrigger value="posisiHip">Posisi Hip</TabsTrigger>
            <TabsTrigger value="surgicalStepsUka">Surgical Steps UKA</TabsTrigger>
            <TabsTrigger value="surgicalTechniquePersona">Surgical Technique Persona</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="form">
          <FormGoogleSheet />
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
      </Tabs>
    </div>
  );
}
