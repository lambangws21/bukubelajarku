"use client";

import { thrLearningData, dislocationRules } from "@/components/operasi/thr/data/data";
import ThrSectionCard from "@/components/operasi/thr/ThrSectionCard";
import ThrDislocationPanel from "@/components/operasi/thr/ThrDislocationPanel";

export default function ThrRenderer() {
  return (
    <div className="space-y-8">
      {thrLearningData.map((section) => (
        <ThrSectionCard key={section.id} section={section} />
      ))}

      {/* DISLOCATION DECISION */}
      <ThrDislocationPanel rules={dislocationRules} />
    </div>
  );
}
