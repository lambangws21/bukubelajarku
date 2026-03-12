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
  status: "jadwal_baru" | "tunda" | "batal" | "reschedule" | "selesai";
  statusLabel: string;
  isOngoingNow: boolean;
};

export type TsAssignmentOption = {
  name: string;
  status: "aktif" | "sakit" | "izin" | "cuti" | "non_aktif";
};

type TsScheduleAssignmentPanelProps = {
  dateLabel: string;
  schedules: TsScheduleItem[];
  tsOptions: TsAssignmentOption[];
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

const STATUS_UI: Record<
  TsScheduleItem["status"],
  {
    border: string;
    bg: string;
    icon: string;
    chip: string;
  }
> = {
  jadwal_baru: {
    border: "border-blue-200/80 dark:border-blue-900/60",
    bg: "bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/60 dark:from-blue-950/30 dark:via-slate-900/80 dark:to-cyan-950/20",
    icon: "text-blue-700 dark:text-blue-300",
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  },
  tunda: {
    border: "border-amber-200/80 dark:border-amber-900/60",
    bg: "bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 dark:from-amber-950/30 dark:via-slate-900/80 dark:to-orange-950/20",
    icon: "text-amber-700 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  },
  batal: {
    border: "border-rose-200/80 dark:border-rose-900/60",
    bg: "bg-gradient-to-r from-rose-50/80 via-white to-red-50/60 dark:from-rose-950/30 dark:via-slate-900/80 dark:to-red-950/20",
    icon: "text-rose-700 dark:text-rose-300",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  },
  reschedule: {
    border: "border-violet-200/80 dark:border-violet-900/60",
    bg: "bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60 dark:from-violet-950/30 dark:via-slate-900/80 dark:to-fuchsia-950/20",
    icon: "text-violet-700 dark:text-violet-300",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  },
  selesai: {
    border: "border-emerald-200/80 dark:border-emerald-900/60",
    bg: "bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/30 dark:via-slate-900/80 dark:to-teal-950/20",
    icon: "text-emerald-700 dark:text-emerald-300",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
};

const TEAM_STATUS_CHIP_CLASS: Record<TsAssignmentOption["status"], string> = {
  aktif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  sakit: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  izin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  cuti: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200",
  non_aktif: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

const TEAM_STATUS_LABEL: Record<TsAssignmentOption["status"], string> = {
  aktif: "aktif",
  sakit: "sakit",
  izin: "izin",
  cuti: "cuti",
  non_aktif: "non aktif",
};

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

  const availableTs = useMemo(() => {
    const map = new Map<string, TsAssignmentOption["status"]>();
    for (const option of tsOptions) {
      const name = option.name.trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, option.status);
    }
    return Array.from(map.entries())
      .map(([name, status]) => ({ name, status }))
      .sort((first, second) => first.name.localeCompare(second.name, "id"));
  }, [tsOptions]);
  const renderedTsOptions = useMemo(() => {
    const map = new Map<string, TsAssignmentOption["status"]>();
    for (const option of availableTs) map.set(option.name, option.status);
    for (const name of selectedTs) {
      if (!map.has(name)) map.set(name, "aktif");
    }
    return Array.from(map.entries())
      .map(([name, status]) => ({ name, status }))
      .sort((first, second) => first.name.localeCompare(second.name, "id"));
  }, [availableTs, selectedTs]);
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
                ? "max-h-[410px] overflow-y-auto pr-1"
                : "max-h-[420px] overflow-y-auto pr-1")
          )}
        >
          <AnimatePresence initial={false}>
            {schedules.map((schedule, index) => {
              const assigned = hasAssignedTs(schedule.tsMembantu);
              const color = STATUS_UI[schedule.status];
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
                    schedule.isOngoingNow && "ring-2 ring-rose-300/80 dark:ring-rose-800/70",
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
                      <Clock3
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          schedule.isOngoingNow ? "text-rose-600 animate-pulse" : color.icon
                        )}
                      />
                      <span className="truncate">{schedule.jam || "-"}</span>
                      {schedule.isOngoingNow ? (
                        <motion.span
                          initial={{ opacity: 0.7, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1.02 }}
                          transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                          </span>
                          Berlangsung
                        </motion.span>
                      ) : null}
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
                    <div className="inline-flex items-center gap-1">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", color.chip)}>
                        {schedule.statusLabel}
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
                {renderedTsOptions.map((option) => {
                  const checked = selectedTs.includes(option.name);
                  const disabled = option.status !== "aktif" && !checked;
                  return (
                  <label
                    key={option.name}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm",
                      disabled && "opacity-60"
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleTs(option.name)}
                    />
                    <span className="truncate">{option.name}</span>
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", TEAM_STATUS_CHIP_CLASS[option.status])}>
                      {TEAM_STATUS_LABEL[option.status]}
                    </span>
                  </label>
                  );
                })}
              </div>
              {renderedTsOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada nama TS dari Sheet Team, tambahkan dari panel Team TS di kiri.
                </p>
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
