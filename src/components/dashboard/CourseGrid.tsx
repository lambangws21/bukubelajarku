"use client";

import CourseCard from "@/components/dashboard/CourseCard";
import { Activity, Layers, Brain } from "lucide-react";

export default function CourseGrid({ setActive }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <CourseCard
        title="Persona KA TKR"
        desc="Alignment & Philosophy"
        icon={Activity}
        onClick={() => setActive("personaAlignment")}
      />
      <CourseCard
        title="Vanguard TKR"
        desc="Classic Surgical Workflow"
        icon={Layers}
        onClick={() => setActive("vanguard")}
      />
      <CourseCard
        title="TKA Knowledge"
        desc="Mental checklist & OR tips"
        icon={Brain}
        onClick={() => setActive("knowledge")}
      />
    </div>
  );
}
