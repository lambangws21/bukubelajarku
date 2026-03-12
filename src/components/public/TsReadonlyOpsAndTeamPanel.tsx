"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Bone,
  Building2,
  CalendarDays,
  Car,
  Clock3,
  Home,
  Hospital,
  Loader2,
  Plus,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReadonlyScheduleStatus = "jadwal_baru" | "tunda" | "batal" | "reschedule" | "selesai";

type ReadonlyScheduleItem = {
  id: string;
  tanggalLabel: string;
  jam: string;
  dokter: string;
  tindakan: string;
  rumahSakit: string;
  tsMembantu: string;
  status: ReadonlyScheduleStatus;
  statusLabel: string;
  isOngoingNow: boolean;
};

type ReadonlyTeamMember = {
  no: string;
  nama: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  profileUrl: string;
};

type TsReadonlyOpsAndTeamPanelProps = {
  schedules: ReadonlyScheduleItem[];
  teamMembers: ReadonlyTeamMember[];
  loadingSchedules: boolean;
  loadingTeam: boolean;
  updatingScheduleId?: string | null;
  onScheduleStatusChange?: (scheduleId: string, status: ReadonlyScheduleStatus) => void | Promise<void>;
  onCreateSchedule?: (input: {
    tanggalOperasi: string;
    jamOperasi: string;
    namaDokter: string;
    jenisTindakan: string;
    rumahSakit: string;
    notes: string;
    preXrayFile: File | null;
    postXrayFile: File | null;
  }) => Promise<void>;
};

const getTodayIsoDate = () => {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const scheduleStatusRowClass: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "bg-blue-50/70 dark:bg-blue-950/20",
  tunda: "bg-amber-50/70 dark:bg-amber-950/20",
  batal: "bg-rose-50/70 dark:bg-rose-950/20",
  reschedule: "bg-violet-50/70 dark:bg-violet-950/20",
  selesai: "bg-emerald-50/70 dark:bg-emerald-950/20",
};

const scheduleStatusChipClass: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  tunda: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  batal: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  reschedule: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  selesai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
};

const scheduleStatusLabel: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "Jadwal Baru",
  tunda: "Tunda",
  batal: "Batal",
  reschedule: "Reschedule",
  selesai: "Selesai",
};

const normalizeTeamStatus = (raw: string) => {
  const value = String(raw || "").trim().toLowerCase();
  if (value.includes("sakit")) return "sakit";
  if (value.includes("izin")) return "izin";
  if (value.includes("cuti")) return "cuti";
  if (value.includes("non")) return "non_aktif";
  return "aktif";
};

const normalizeTeamRole = (raw: string) => {
  const value = String(raw || "").trim().toLowerCase();
  if (!value || value.includes("sales") || value.includes("direktor") || value.includes("director")) return "";
  if (value.includes("log")) return "logistik";
  if (value.includes("adm")) return "admin";
  if (value.includes("ts") || value.includes("teknikal") || value.includes("technical")) return "ts";
  return "";
};

const getTeamRoleUi = (role: string) => {
  const normalizedRole = normalizeTeamRole(role);
  if (!normalizedRole) {
    return {
      label: "Sales / Direktor",
      icon: <BriefcaseBusiness className="h-3.5 w-3.5" />,
      chipClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    };
  }
  if (normalizedRole === "logistik") {
    return {
      label: "Logistik",
      icon: <Truck className="h-3.5 w-3.5" />,
      chipClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
    };
  }
  if (normalizedRole === "admin") {
    return {
      label: "Admin",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      chipClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
    };
  }
  return {
    label: "TS",
    icon: <Wrench className="h-3.5 w-3.5" />,
    chipClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",
  };
};

const getTeamStatusUi = (status: string, isAssigned: boolean) => {
  const normalizedStatus = normalizeTeamStatus(status);
  if (normalizedStatus === "izin") {
    return {
      label: "Izin",
      icon: <Home className="h-3.5 w-3.5" />,
      chipClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
      cardClass: "border-amber-200/70 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20",
    };
  }
  if (normalizedStatus === "sakit") {
    return {
      label: "Sakit",
      icon: <Hospital className="h-3.5 w-3.5" />,
      chipClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
      cardClass: "border-rose-200/70 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20",
    };
  }
  if (normalizedStatus === "cuti") {
    return {
      label: "Cuti",
      icon: <Car className="h-3.5 w-3.5" />,
      chipClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200",
      cardClass: "border-sky-200/70 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20",
    };
  }
  if (normalizedStatus === "non_aktif") {
    return {
      label: "Non Aktif",
      icon: <XCircle className="h-3.5 w-3.5" />,
      chipClass: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      cardClass: "border-slate-300/70 bg-slate-100/70 dark:border-slate-700 dark:bg-slate-900/50",
    };
  }
  if (isAssigned) {
    return {
      label: "Asistensi",
      icon: <Bone className="h-3.5 w-3.5" />,
      chipClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
      cardClass: "border-violet-200/70 bg-violet-50/70 dark:border-violet-900/50 dark:bg-violet-950/20",
    };
  }
  return {
    label: "Office",
    icon: <Building2 className="h-3.5 w-3.5" />,
    chipClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    cardClass: "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20",
  };
};

export default function TsReadonlyOpsAndTeamPanel({
  schedules,
  teamMembers,
  loadingSchedules,
  loadingTeam,
  updatingScheduleId = null,
  onScheduleStatusChange,
  onCreateSchedule,
}: TsReadonlyOpsAndTeamPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    tanggalOperasi: getTodayIsoDate(),
    jamOperasi: "",
    namaDokter: "",
    jenisTindakan: "",
    rumahSakit: "",
    notes: "",
  });
  const [preXrayFile, setPreXrayFile] = useState<File | null>(null);
  const [postXrayFile, setPostXrayFile] = useState<File | null>(null);

  const teamAssignmentsByName = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const schedule of schedules) {
      const dokter = schedule.dokter?.trim();
      if (!dokter) continue;
      const tsNames = schedule.tsMembantu
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      for (const tsName of tsNames) {
        const key = tsName.toLowerCase();
        const current = map.get(key) || new Set<string>();
        current.add(dokter);
        map.set(key, current);
      }
    }
    return map;
  }, [schedules]);

  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const groupedTeamMembers = useMemo(() => {
    const activeGroup: ReadonlyTeamMember[] = [];
    const leaveGroup: ReadonlyTeamMember[] = [];

    for (const member of teamMembers) {
      const normalizedStatus = normalizeTeamStatus(member.status);
      if (normalizedStatus === "cuti" || normalizedStatus === "izin" || normalizedStatus === "sakit") {
        leaveGroup.push(member);
      } else {
        activeGroup.push(member);
      }
    }

    return { activeGroup, leaveGroup };
  }, [teamMembers]);

  const handleCreateSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreateSchedule) return;
    if (!createForm.namaDokter.trim() || !createForm.jenisTindakan.trim() || !createForm.rumahSakit.trim()) {
      toast.error("Lengkapi Dokter, Tindakan, dan Rumah Sakit.");
      return;
    }

    setCreateSaving(true);
    try {
      await onCreateSchedule({
        tanggalOperasi: createForm.tanggalOperasi || getTodayIsoDate(),
        jamOperasi: createForm.jamOperasi.trim(),
        namaDokter: createForm.namaDokter.trim(),
        jenisTindakan: createForm.jenisTindakan.trim(),
        rumahSakit: createForm.rumahSakit.trim(),
        notes: createForm.notes.trim(),
        preXrayFile,
        postXrayFile,
      });
      setCreateOpen(false);
      setCreateForm({
        tanggalOperasi: getTodayIsoDate(),
        jamOperasi: "",
        namaDokter: "",
        jenisTindakan: "",
        rumahSakit: "",
        notes: "",
      });
      setPreXrayFile(null);
      setPostXrayFile(null);
    } catch {
      return;
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr),340px]">
      <Card className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/70 p-3 md:p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <CalendarDays className="h-3.5 w-3.5" />
              Jadwal Operasi
            </p>
            <h4 className="font-semibold text-base md:text-lg">{schedules.length} jadwal</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tanggal saat ini: {todayLabel}</p>
          </div>
          {onCreateSchedule ? (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tambah Jadwal
            </Button>
          ) : null}
        </div>

        {!loadingSchedules && schedules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Tidak ada jadwal untuk ditampilkan.
          </div>
        ) : null}
        {loadingSchedules ? (
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          </div>
        ) : null}

        {!loadingSchedules && schedules.length > 0 ? (
          <div
            className={cn(
              "overflow-x-auto rounded-xl border border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70",
              schedules.length > 10 && "max-h-[640px] overflow-y-auto"
            )}
          >
            <table className="w-full min-w-[760px] text-xs">
              <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/95">
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Dokter</th>
                  <th className="px-3 py-2">Jam</th>
                  <th className="px-3 py-2">Tindakan</th>
                  <th className="px-3 py-2">Rumah Sakit</th>
                  <th className="px-3 py-2">TS</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-t border-slate-200/80 dark:border-slate-800",
                      scheduleStatusRowClass[item.status],
                      item.isOngoingNow && "ring-1 ring-inset ring-rose-300/80 dark:ring-rose-800/70"
                    )}
                  >
                    <td className="px-3 py-2">
                      <p className="inline-flex items-center gap-1 font-medium">
                        <UserRound className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                        <span className="truncate">{item.dokter || "-"}</span>
                      </p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className={cn("h-3.5 w-3.5 text-slate-500", item.isOngoingNow && "text-rose-600")} />
                        {item.jam || "--:--"}
                        {item.isOngoingNow ? (
                          <motion.span
                            initial={{ opacity: 0.7, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1.02 }}
                            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                            className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                            </span>
                            Berlangsung
                          </motion.span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.tindakan || "-"}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        <Hospital className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                        {item.rumahSakit || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.tsMembantu || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.tanggalLabel}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                            scheduleStatusChipClass[item.status]
                          )}
                        >
                          {item.statusLabel}
                        </span>
                        {onScheduleStatusChange ? (
                          <select
                            value={item.status}
                            onChange={(event) => {
                              void onScheduleStatusChange(
                                item.id,
                                event.target.value as ReadonlyScheduleStatus
                              );
                            }}
                            disabled={updatingScheduleId === item.id}
                            className="h-6 rounded-md border border-slate-300 bg-white px-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
                          >
                            {(Object.keys(scheduleStatusLabel) as ReadonlyScheduleStatus[]).map((statusKey) => (
                              <option key={statusKey} value={statusKey}>
                                {scheduleStatusLabel[statusKey]}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        {updatingScheduleId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Operasi</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={handleCreateSchedule}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Tanggal</label>
                  <Input
                    type="date"
                    value={createForm.tanggalOperasi}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, tanggalOperasi: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Jam</label>
                  <Input
                    type="time"
                    value={createForm.jamOperasi}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, jamOperasi: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Dokter *</label>
                  <Input
                    value={createForm.namaDokter}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, namaDokter: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tindakan *</label>
                  <Input
                    value={createForm.jenisTindakan}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, jenisTindakan: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rumah Sakit *</label>
                <Input
                  value={createForm.rumahSakit}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, rumahSakit: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Catatan</label>
                <Textarea
                  rows={3}
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">X-ray Pre Op</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPreXrayFile(event.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">X-ray Post Op</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPostXrayFile(event.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Kolom TS sengaja dikosongkan. Penugasan TS dapat dilakukan belakangan.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createSaving}>
                  {createSaving ? "Menyimpan..." : "Simpan Jadwal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/90 via-white to-fuchsia-50/70 p-3 shadow-sm dark:border-violet-900/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-fuchsia-950/20">
        <div className="mb-3">
          <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300">
            <Users className="h-3.5 w-3.5" />
            List Staff Operasi
          </p>
          <h4 className="text-sm font-semibold md:text-base">{teamMembers.length} personel</h4>
        </div>

        <div className={cn("space-y-2", teamMembers.length > 5 && "max-h-[420px] overflow-y-auto pr-1")}>
          {groupedTeamMembers.activeGroup.length > 0 ? (
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-2 dark:border-emerald-900/50 dark:bg-emerald-950/15">
              <p className="mb-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Siap Bertugas</p>
              <div className="space-y-2">
                {groupedTeamMembers.activeGroup.map((member) => {
                  const normalizedRole = normalizeTeamRole(member.role);
                  const isSalesDirector = normalizedRole === "";
                  const isTsRole = normalizedRole === "ts";
                  const assignedDoctors = Array.from(
                    teamAssignmentsByName.get((member.nama || "").trim().toLowerCase()) || []
                  );
                  const isAssigned = assignedDoctors.length > 0;
                  const statusUi = getTeamStatusUi(member.status, isAssigned);
                  const roleUi = getTeamRoleUi(member.role);
                  return (
                    <div
                      key={member.no}
                      className={cn("rounded-xl border px-2.5 py-2 text-xs", statusUi.cardClass)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2">
                          {member.profileUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.profileUrl} alt={`Foto ${member.nama || "TS"}`} className="h-14 w-14 rounded-full border object-cover" />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold">
                              {(member.nama || "TS")
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() || "")
                                .join("")}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.nama || "-"}</p>
                            <span
                              className={cn(
                                "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                roleUi.chipClass
                              )}
                              title={roleUi.label}
                            >
                              {roleUi.icon}
                              {isSalesDirector ? null : roleUi.label}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            statusUi.chipClass
                          )}
                          title={statusUi.label}
                        >
                          {statusUi.icon}
                          {statusUi.label}
                        </span>
                      </div>
                      {isTsRole ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {isAssigned ? `Ditugaskan: ${assignedDoctors.join(" & ")}` : "Belum ditugaskan hari ini"}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {groupedTeamMembers.leaveGroup.length > 0 ? (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-2 dark:border-amber-900/50 dark:bg-amber-950/15">
              <p className="mb-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">Izin / Cuti / Sakit</p>
              <div className="space-y-2">
                {groupedTeamMembers.leaveGroup.map((member) => {
                  const normalizedRole = normalizeTeamRole(member.role);
                  const isSalesDirector = normalizedRole === "";
                  const isTsRole = normalizedRole === "ts";
                  const assignedDoctors = Array.from(
                    teamAssignmentsByName.get((member.nama || "").trim().toLowerCase()) || []
                  );
                  const isAssigned = assignedDoctors.length > 0;
                  const statusUi = getTeamStatusUi(member.status, isAssigned);
                  const roleUi = getTeamRoleUi(member.role);
                  return (
                    <div
                      key={member.no}
                      className={cn("rounded-xl border px-2.5 py-2 text-xs", statusUi.cardClass)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2">
                          {member.profileUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.profileUrl} alt={`Foto ${member.nama || "TS"}`} className="h-8 w-8 rounded-full border object-cover" />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold">
                              {(member.nama || "TS")
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() || "")
                                .join("")}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.nama || "-"}</p>
                            <span
                              className={cn(
                                "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                roleUi.chipClass
                              )}
                              title={roleUi.label}
                            >
                              {roleUi.icon}
                              {isSalesDirector ? null : roleUi.label}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            statusUi.chipClass
                          )}
                          title={statusUi.label}
                        >
                          {statusUi.icon}
                          {statusUi.label}
                        </span>
                      </div>
                      {isTsRole ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {isAssigned ? `Ditugaskan: ${assignedDoctors.join(" & ")}` : "Belum ditugaskan hari ini"}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!loadingTeam && teamMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Belum ada data Team TS.
            </div>
          ) : null}
          {loadingTeam ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-violet-200/60 bg-white/80 px-2.5 py-2 dark:border-violet-900/40 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-violet-200/60 bg-white/80 px-2.5 py-2 dark:border-violet-900/40 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-violet-200/60 bg-white/80 px-2.5 py-2 dark:border-violet-900/40 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
