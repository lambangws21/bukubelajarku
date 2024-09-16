"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Import ScrollArea dan ScrollBar
import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/ukr/surgicalstep";
import FormGoogleSheet from "@/app/googlesheetform/page";
import DataOperasi from "@/app/displaydata/page";
import DataOperasiku from "@/components/displayData"

export default function Home() {
  return (
    <div className="w-full p-4">
      <Tabs defaultValue="form" className="w-full">
        {/* Membungkus TabsList dengan ScrollArea untuk membuatnya dapat digulir */}
        <ScrollArea className="max-w-full overflow-x-auto rounded-md border">
          <div className="flex w-max space-x-4 p-2">
            <TabsList className="flex w-full justify-start min-w-max">
              <TabsTrigger value="form">Form Google Sheet</TabsTrigger>
              <TabsTrigger value="dataOperasi">Data Operasi</TabsTrigger>
              {/* <TabsTrigger value="dataOperasiku">Data Operasi 2</TabsTrigger> */}
              <TabsTrigger value="posisiHip">Posisi Hip</TabsTrigger>
              <TabsTrigger value="surgicalStepsUka">Surgical Steps UKA</TabsTrigger>
              <TabsTrigger value="surgicalTechniquePersona">Surgical Technique Persona</TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="form">
          <FormGoogleSheet />
        </TabsContent>
        <TabsContent value="dataOperasi">
          <DataOperasi />
        </TabsContent>
        {/* <TabsContent value="dataOperasiku">
          <DataOperasiku />
        </TabsContent> */}
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
