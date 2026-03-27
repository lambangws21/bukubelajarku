"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Activity,
  Bone,
  BookHeadphones,
  Rotate3D,
  Layers,
  Wallet,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
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
  {
    label: "Acetabulum Rotation",
    key: "acetabulum-rotation",
  },
  { label: "Femoral Head", key: "hip-head" },
];

const toolsItems = [
  { label: "Permintaan Advance", key: "tool-advance", icon: Wallet, isNew: true },
  { label: "Templating Digital", key: "tool-templating", icon: Layers, isNew: true },
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
  const [openKnee, setOpenKnee] = useState(false);
  const [openHip, setOpenHip] = useState(false);

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

  const filteredTools = useMemo(
    () =>
      toolsItems.filter((i) =>
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
          placeholder="Cari modul..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background"
        />
      </div>

      {/* TOOLS */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Tools Cepat
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Baru
          </span>
        </div>
        <Section title="TOOLS" icon={Wallet}>
          {filteredTools.map((i) => (
            <Item
              key={i.key}
              label={i.label}
              active={active === i.key}
              onClick={() => handleSelect(i.key as ActiveCourse)}
              rightIcon={
                <span className="ml-auto flex items-center gap-2">
                  <i.icon className="h-4 w-4 opacity-60" />
                  {i.isNew && (
                    <span className="rounded-full border border-primary/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                      New
                    </span>
                  )}
                </span>
              }
            />
          ))}
        </Section>
      </div>

      {/* KNEE */}
      <CollapsibleSection
        title="KNEE"
        icon={Activity}
        count={filteredKnee.length}
        open={openKnee}
        onToggle={() => setOpenKnee((prev) => !prev)}
      >
        {filteredKnee.map((i) => (
          <Item
            key={i.key}
            label={i.label}
            active={active === i.key}
            onClick={() => handleSelect(i.key as ActiveCourse)}
          />
        ))}
      </CollapsibleSection>

      {/* HIP */}
      <CollapsibleSection
        title="HIP"
        icon={Bone}
        count={filteredHip.length}
        open={openHip}
        onToggle={() => setOpenHip((prev) => !prev)}
      >
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
                  ) : i.key === "acetabulum-rotation" ? (
                    <Rotate3D className="ml-auto w-4 h-4 opacity-60" />
                  ) : null
                }
              />

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
      </CollapsibleSection>

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
  icon: LucideIcon;
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

function CollapsibleSection({
  title,
  icon: Icon,
  open,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4" />
          {title}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {count}
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </button>
      {open ? <div className="px-2 pb-2">{children}</div> : null}
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
