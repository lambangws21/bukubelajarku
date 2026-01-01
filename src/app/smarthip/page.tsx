// app/smarthip/page.tsx
"use client";

import { useSmartHip } from "@/components/smarthip/useSmartHip";
import { SmartHipCanvas } from "@/components/smarthip/SmartHipCanvas";
import { SmartHipSidebar } from "@/components/smarthip/SmartHipSidebar";

export default function SmartHipPage() {
  const hip = useSmartHip();

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <div className="flex-1 flex items-center justify-center">
        <SmartHipCanvas hip={hip} />
      </div>
      <SmartHipSidebar hip={hip} />
    </div>
  );
}
