// app/templating/page.tsx
"use client";
import React, { useState } from "react";
import TemplatingCanvas from "@/components/digitalTemplating/TemplatingCanvas";

export default function DigitalTemplatingPage() {
  const [unit, setUnit] = useState<"px" | "mm" | "cm">("mm");

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <h1 className="text-xl font-semibold">Digital Implant Templating</h1>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="px">px</option>
          <option value="mm">mm</option>
          <option value="cm">cm</option>
        </select>
      </div>
      <div className="flex-1 flex">
        <TemplatingCanvas
          unit={unit}
          pixelsPerMm={3.78}
        />
      </div>
    </div>
  );
}
