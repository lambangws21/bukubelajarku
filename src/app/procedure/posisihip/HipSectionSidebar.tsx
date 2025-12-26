"use client";

import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "education", label: "Edukasi Singkat" },
  { id: "planning", label: "Preoperative Planning" },
  { id: "technique", label: "Surgical Technique" },
  { id: "notes", label: "Clinical Notes" },
];

export default function HipSectionSidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="h-screen sticky top-0 w-[260px] bg-background border-r px-4 py-6 hidden lg:block">
      <h3 className="text-sm font-semibold mb-4">
        📘 THR Navigation
      </h3>

      <nav className="space-y-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition
              ${
                active === s.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
