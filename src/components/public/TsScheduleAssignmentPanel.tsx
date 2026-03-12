"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TsScheduleItem = {
  id: string;
  tanggal: string;
  jam: string;
  dokter: string;
  tindakan: string;
  rumahSakit: string;
  tsMembantu: string;
};

type TsScheduleAssignmentPanelProps = {
  dateLabel: string;
  schedules: TsScheduleItem[];
  tsOptions: string[];
  assigningEntryId: string | null;
  onAssign: (entryId: string, tsNames: string) => Promise<void>;
  compactMode?: boolean;
};

const splitTsNames = (value: string) =>
  value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

const uniqueNames = (names: string[]) => Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));

const hasAssignedTs = (value: string) => {
  const cleaned = value.trim().toLowerCase();
  return Boolean(cleaned) && !cleaned.includes("belum");
};

const colorSets = [
  {
    border: "border-cyan-200/80 dark:border-cyan-900/60",
    bg: "bg-gradient-to-r from-cyan-50/80 via-white to-sky-50/60 dark:from-cyan-950/30 dark:via-slate-900/80 dark:to-sky-950/20",
    icon: "text-cyan-700 dark:text-cyan-300",
  },
  {
    border: "border-violet-200/80 dark:border-violet-900/60",
    bg: "bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60 dark:from-violet-950/30 dark:via-slate-900/80 dark:to-fuchsia-950/20",
    icon: "text-violet-700 dark:text-violet-300",
  },
  {
    border: "border-emerald-200/80 dark:border-emerald-900/60",
    bg: "bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/30 dark:via-slate-900/80 dark:to-teal-950/20",
    icon: "text-emerald-700 dark:text-emerald-300",
  },
];

export default function TsScheduleAssignmentPanel({
  dateLabel,
  schedules,
  tsOptions,
  assigningEntryId,
  onAssign,
  compactMode = false,
}: TsScheduleAssignmentPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TsScheduleItem | null>(null);
  const [selectedTs, setSelectedTs] = useState<string[]>([]);
  const [customTs, setCustomTs] = useState("");
  const [saving, setSaving] = useState(false);

  const availableTs = useMemo(() => uniqueNames(tsOptions), [tsOptions]);
  const assignedCount = useMemo(
    () => schedules.filter((item) => hasAssignedTs(item.tsMembantu)).length,
    [schedules]
  );
  const unassignedCount = schedules.length - assignedCount;

  const openAssignDialog = (schedule: TsScheduleItem) => {
    setSelectedSchedule(schedule);
    setSelectedTs(splitTsNames(schedule.tsMembantu));
    setCustomTs("");
    setOpen(true);
  };

  const toggleTs = (name: string) => {
    setSelectedTs((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  const addCustomTs = () => {
    const parsed = uniqueNames(splitTsNames(customTs));
    if (parsed.length === 0) return;
    setSelectedTs((prev) => uniqueNames([...prev, ...parsed]));
    setCustomTs("");
  };

  const handleSave = async () => {
    if (!selectedSchedule) return;
    const finalTs = uniqueNames([...selectedTs, ...splitTsNames(customTs)]);
    if (finalTs.length === 0) return;

    setSaving(true);
    try {
      await onAssign(selectedSchedule.id, finalTs.join(", "));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className={cn(
        "rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/90 via-white to-fuchsia-50/70 shadow-sm dark:border-violet-900/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-fuchsia-950/20",
        compactMode ? "p-2.5 md:p-3 space-y-2.5" : "p-3 md:p-4 space-y-3"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            List Jadwal Operasi
          </p>
          <h4 className={cn("font-semibold", compactMode ? "text-sm" : "text-sm md:text-base")}>
            Tanggal {dateLabel} ({schedules.length})
          </h4>
          {!compactMode ? <p className="text-xs text-muted-foreground mt-0.5">Klik jadwal untuk pembagian TS.</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-2.5 py-1.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" />
            Sudah ada TS: {assignedCount}
          </span>
        </div>
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/60 px-2.5 py-1.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/20">
          <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Belum ditugaskan: {unassignedCount}
          </span>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground text-center">
          Tidak ada jadwal pada tanggal ini.
        </div>
      ) : (
        <div
          className={cn(
            "space-y-2",
            schedules.length > 3 &&
              (compactMode
                ? "max-h-[320px] overflow-y-auto pr-1"
                : "max-h-[420px] overflow-y-auto pr-1")
          )}
        >
          <AnimatePresence initial={false}>
            {schedules.map((schedule, index) => {
              const assigned = hasAssignedTs(schedule.tsMembantu);
              const color = colorSets[index % colorSets.length];
              return (
                <motion.button
                  key={schedule.id}
                  type="button"
                  onClick={() => openAssignDialog(schedule)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.24) }}
                  whileHover={{ y: -2, scale: compactMode ? 1 : 1.005 }}
                  className={cn(
                    "group w-full rounded-xl border text-left transition-all hover:shadow-md",
                    color.bg,
                    color.border,
                    compactMode ? "px-2.5 py-1.5" : "px-3 py-2"
                  )}
                >
                  <div
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-[1.2fr,1fr,1.2fr,.8fr,.9fr] gap-2",
                      compactMode ? "text-xs" : "text-xs md:text-sm"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Stethoscope className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{schedule.dokter || "-"}</span>
                    </div>
                    <div className="truncate">{schedule.tindakan || "-"}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{schedule.rumahSakit || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock3 className={cn("h-3.5 w-3.5 shrink-0", color.icon)} />
                      <span className="truncate">{schedule.jam || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarDays className={cn("h-3.5 w-3.5 shrink-0", color.icon)} />
                      <span className="truncate">{schedule.tanggal || "-"}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 text-xs text-muted-foreground",
                      compactMode ? "mt-1.5" : "mt-2"
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">TS: {schedule.tsMembantu || "Belum ditentukan"}</span>
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        assigned ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {assigned ? "Update TS" : "Atur TS"}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pembagian TS</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p>Dokter: <span className="font-medium text-foreground">{selectedSchedule?.dokter || "-"}</span></p>
              <p>Tindakan: <span className="font-medium text-foreground">{selectedSchedule?.tindakan || "-"}</span></p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pilih TS</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableTs.map((name) => (
                  <label key={name} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTs.includes(name)}
                      onChange={() => toggleTs(name)}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                ))}
              </div>
              {availableTs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada daftar TS otomatis, tambahkan manual.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tambah TS Manual</p>
              <div className="flex gap-2">
                <Input
                  value={customTs}
                  onChange={(event) => setCustomTs(event.target.value)}
                  placeholder="Contoh: Andi, Budi"
                />
                <Button type="button" variant="outline" onClick={addCustomTs}>
                  Tambah
                </Button>
              </div>
            </div>

            <div className="rounded-md border p-2 text-xs text-muted-foreground">
              TS dipilih: {uniqueNames([...selectedTs, ...splitTsNames(customTs)]).join(", ") || "-"}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                disabled={saving || assigningEntryId === selectedSchedule?.id}
                onClick={() => void handleSave()}
              >
                {saving || assigningEntryId === selectedSchedule?.id ? "Menyimpan..." : "Simpan Pembagian"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
