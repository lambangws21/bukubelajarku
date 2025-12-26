"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Activity,
  Bone,
  BookHeadphones,
  Rotate3D,
} from "lucide-react";

import { ActiveCourse } from "@/types/activeCourse";
import { useActiveCourse } from "@/components/dashboard/useActiveCourse";

/* ================= DATA ================= */

const kneeItems = [
  { label: "Surgitech UKA", key: "knee-uka" },
  { label: "Surgitech Persona", key: "knee-persona" },
  { label: "Persona Alignment", key: "knee-persona-alignment" },
  { label: "Surgitech Vanguard", key: "knee-vanguard" },
  { label: "Anatomi Knee", key: "knee-anatomi" },
  { label: "Rotasi Femur", key: "knee-rotation" },
  { label: "Intra-op Guide", key: "knee-guide" },
  { label: "Implant PS vs CR", key: "knee-implant" },
  { label: "Decision Guide", key: "knee-decision" },
  { label: "Quiz", key: "knee-quiz" },
];

const hipItems = [
  { label: "Anatomi Hip", key: "hip-anatomi" },
  { label: "Posisi Pasien", key: "hip-posisi" },

  { label: "Stem", key: "hip-stem" },

  // ✅ INI YANG PENTING
  {
    label: "Acetabulum Rotation",
    key: "acetabulum-rotation",
  },

  { label: "Femoral Head", key: "hip-head" },
];

const posisiPasienSections = [
  { id: "education", label: "Edukasi Singkat" },
  { id: "planning", label: "Planning" },
  { id: "technique", label: "Teknik Operasi" },
  { id: "notes", label: "Clinical Notes" },
];

/* ================= COMPONENT ================= */

export default function SidebarNavigation({
  onSelect,
}: {
  onSelect?: () => void;
}) {
  const { active, setActive } = useActiveCourse();

  const [query, setQuery] = useState("");
  const [openPosisi, setOpenPosisi] = useState(true);

  const handleSelect = (key: ActiveCourse) => {
    setActive(key);
    onSelect?.();
  };

  const filteredKnee = useMemo(
    () =>
      kneeItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const filteredHip = useMemo(
    () =>
      hipItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <aside className="h-screen bg-background border-r px-4 py-6 space-y-4 overflow-y-auto">
      {/* HEADER */}
      <h1 className="text-lg font-bold flex items-center gap-2">
        <BookHeadphones className="w-5 h-5" />
        HERLAMBANG MYBOOK
      </h1>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search course..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background"
        />
      </div>

      {/* KNEE */}
      <Section title="KNEE" icon={Activity}>
        {filteredKnee.map((i) => (
          <Item
            key={i.key}
            label={i.label}
            active={active === i.key}
            onClick={() => handleSelect(i.key as ActiveCourse)}
          />
        ))}
      </Section>

      {/* HIP */}
      <Section title="HIP" icon={Bone}>
        {filteredHip.map((i) => {
          const isPosisi = i.key === "hip-posisi";
          const isActive = active === i.key;

          return (
            <div key={i.key}>
              <Item
                label={i.label}
                active={isActive}
                onClick={() => {
                  handleSelect(i.key as ActiveCourse);
                  if (isPosisi) setOpenPosisi((v) => !v);
                }}
                rightIcon={
                  isPosisi ? (
                    <span className="ml-auto text-xs opacity-60">
                      {openPosisi ? "▾" : "▸"}
                    </span>
                  ) : i.key === "hip-acetabulum-rotation" ? (
                    <Rotate3D className="ml-auto w-4 h-4 opacity-60" />
                  ) : null
                }
              />

              {/* SUB MENU POSISI PASIEN */}
              {isPosisi && isActive && openPosisi && (
                <div className="ml-6 mt-1 space-y-1">
                  {posisiPasienSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        document
                          .getElementById(s.id)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        onSelect?.();
                      }}
                      className="block w-full text-left px-3 py-1 text-xs rounded-md
                        text-muted-foreground hover:bg-muted transition"
                    >
                      • {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Section>
    </aside>
  );
}

/* ================= UI HELPERS ================= */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold mb-2">
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <div className="ml-3 space-y-1">{children}</div>
    </div>
  );
}

function Item({
  label,
  active,
  onClick,
  rightIcon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  rightIcon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      {rightIcon}
    </button>
  );
}
