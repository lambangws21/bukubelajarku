"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, FileClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdvanceHistory = dynamic(
  () => import("@/components/Dasboards/DasboardAdvance/DasboardPage"),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading Advance...</div> }
);

const AsistensiHistory = dynamic(
  () => import("@/components/Dasboards/DasboardAsistensi/DasboardPage"),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading Asistensi...</div> }
);

const IntertainHistory = dynamic(
  () => import("@/components/Dasboards/DasboardIntertain/MealsMeetingPanel"),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading Meals Meeting...</div> }
);

export default function RiwayatPage() {
  return (
    <div className="min-h-svh p-4 md:p-6 bg-background space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileClock className="h-6 w-6 text-cyan-500" />
            Riwayat
          </h1>
          <p className="text-sm text-muted-foreground">
            Semua data Advance, Asistensi, dan Intertain dalam satu menu.
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="advance" className="w-full">
        <TabsList className="h-auto p-1 gap-1 flex-wrap">
          <TabsTrigger value="advance">Advance</TabsTrigger>
          <TabsTrigger value="asistensi">Asistensi</TabsTrigger>
          <TabsTrigger value="intertain">Meals Meeting</TabsTrigger>
        </TabsList>

        <TabsContent value="advance" className="mt-4">
          <AdvanceHistory />
        </TabsContent>
        <TabsContent value="asistensi" className="mt-4">
          <AsistensiHistory />
        </TabsContent>
        <TabsContent value="intertain" className="mt-4">
          <IntertainHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
