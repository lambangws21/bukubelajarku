"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
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
type ReadonlyMobileView = "jadwal" | "staff";
type CreateScheduleStep = 1 | 2 | 3;
type DateQuickFilter = "today" | "tomorrow" | "all";

type ReadonlyScheduleItem = {
  id: string;
  tanggalKey: string;
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
    onProgress?: (value: number) => void;
  }) => Promise<void>;
  onAssignSchedule?: (scheduleId: string) => void | Promise<void>;
  onEditSchedule?: (scheduleId: string) => void | Promise<void>;
  onDeleteSchedule?: (scheduleId: string) => void | Promise<void>;
};

const READONLY_CREATE_DRAFT_KEY = "ts_support_readonly_create_draft_v1";
const READONLY_FILTER_KEY = "ts_support_readonly_filters_v1";

const getIsoDateWithOffset = (offsetDays = 0) => {
  const now = new Date();
  if (offsetDays !== 0) now.setDate(now.getDate() + offsetDays);
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const getTodayIsoDate = () => getIsoDateWithOffset(0);

const toMinutes = (time: string) => {
  const [hourStr, minuteStr] = String(time || "").split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.MAX_SAFE_INTEGER;
  return hour * 60 + minute;
};

const scheduleStatusRowClass: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "bg-blue-100/25 dark:bg-blue-950/45",
  tunda: "bg-amber-100/25 dark:bg-amber-950/45",
  batal: "bg-rose-100/25 dark:bg-rose-950/45",
  reschedule: "bg-violet-100/25 dark:bg-violet-950/45",
  selesai: "bg-emerald-100/25 dark:bg-emerald-950/45",
};

const scheduleStatusChipClass: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "bg-blue-700 text-white dark:bg-blue-300 dark:text-blue-950",
  tunda: "bg-amber-700 text-white dark:bg-amber-300 dark:text-amber-950",
  batal: "bg-rose-700 text-white dark:bg-rose-300 dark:text-rose-950",
  reschedule: "bg-violet-700 text-white dark:bg-violet-300 dark:text-violet-950",
  selesai: "bg-emerald-700 text-white dark:bg-emerald-300 dark:text-emerald-950",
};

const scheduleStatusLabel: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "Jadwal Baru",
  tunda: "Tunda",
  batal: "Batal",
  reschedule: "Reschedule",
  selesai: "Selesai",
};

const createStepLabel: Record<CreateScheduleStep, string> = {
  1: "Data Operasi",
  2: "Detail RS",
  3: "Upload X-ray",
};

const createStepOrder: CreateScheduleStep[] = [1, 2, 3];

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
      cardClass: "border-slate-300/70 bg-slate-100/20 dark:border-slate-700 dark:bg-slate-900/50",
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
  onAssignSchedule,
  onEditSchedule,
  onDeleteSchedule,
}: TsReadonlyOpsAndTeamPanelProps) {
  const [mobileView, setMobileView] = useState<ReadonlyMobileView>("jadwal");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateScheduleStep>(1);
  const [createSaving, setCreateSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateQuickFilter>("today");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
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

  const hospitalOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        schedules
          .map((item) => String(item.rumahSakit || "").trim())
          .filter(Boolean)
      )
    );
    return unique.sort((first, second) => first.localeCompare(second, "id"));
  }, [schedules]);

  const operatorOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        schedules
          .map((item) => String(item.dokter || "").trim())
          .filter(Boolean)
      )
    );
    return unique.sort((first, second) => first.localeCompare(second, "id"));
  }, [schedules]);

  useEffect(() => {
    if (hospitalFilter !== "all" && !hospitalOptions.includes(hospitalFilter)) {
      setHospitalFilter("all");
    }
  }, [hospitalFilter, hospitalOptions]);

  useEffect(() => {
    if (operatorFilter !== "all" && !operatorOptions.includes(operatorFilter)) {
      setOperatorFilter("all");
    }
  }, [operatorFilter, operatorOptions]);

  const todayKey = useMemo(() => getIsoDateWithOffset(0), []);
  const tomorrowKey = useMemo(() => getIsoDateWithOffset(1), []);

  const filteredSchedules = useMemo(() => {
    const list = schedules.filter((item) => {
      const dateKey = String(item.tanggalKey || "").trim();
      if (dateFilter === "today" && dateKey && dateKey !== todayKey) return false;
      if (dateFilter === "tomorrow" && dateKey && dateKey !== tomorrowKey) return false;
      if (hospitalFilter !== "all" && item.rumahSakit !== hospitalFilter) return false;
      if (operatorFilter !== "all" && item.dokter !== operatorFilter) return false;
      return true;
    });

    return [...list].sort((first, second) => {
      if (first.tanggalKey !== second.tanggalKey) return String(first.tanggalKey || "").localeCompare(String(second.tanggalKey || ""));
      return toMinutes(first.jam) - toMinutes(second.jam);
    });
  }, [dateFilter, hospitalFilter, operatorFilter, schedules, todayKey, tomorrowKey]);

  const renderStaffTableSection = (
    members: ReadonlyTeamMember[],
    title: string,
    containerClass: string
  ) => {
    if (!members.length) return null;
    return (
      <div className={cn("rounded-xl border p-2", containerClass)}>
        <p className="mb-1 text-[11px] font-medium">{title}</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/40">
          <table className="w-full min-w-[560px] table-fixed text-xs">
            <thead className="bg-slate-100/20 dark:bg-slate-900/80">
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2.5 py-2">Nama</th>
                <th className="w-[92px] px-2.5 py-2">Role</th>
                <th className="w-[98px] px-2.5 py-2">Status</th>
                <th className="px-2.5 py-2">Asistensi</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
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
                  <tr key={member.no} className="border-t border-slate-200/70 dark:border-slate-800">
                    <td className="px-2.5 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {member.profileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.profileUrl}
                            alt={`Foto ${member.nama || "TS"}`}
                            className="h-8 w-8 rounded-full border object-cover"
                          />
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
                        <span className="truncate font-medium">{member.nama || "-"}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          roleUi.chipClass
                        )}
                        title={roleUi.label}
                      >
                        {roleUi.icon}
                        {isSalesDirector ? null : roleUi.label}
                      </span>
                    </td>
                    <td className="px-2.5 py-2">
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
                    </td>
                    <td className="px-2.5 py-2 text-muted-foreground">
                      <span className="block truncate">
                        {isTsRole ? (isAssigned ? assignedDoctors.join(" & ") : "Belum ditugaskan") : "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawFilters = window.localStorage.getItem(READONLY_FILTER_KEY);
      if (rawFilters) {
        const parsed = JSON.parse(rawFilters) as {
          dateFilter?: DateQuickFilter;
          hospitalFilter?: string;
          operatorFilter?: string;
        };
        if (parsed.dateFilter) setDateFilter(parsed.dateFilter);
        if (parsed.hospitalFilter) setHospitalFilter(parsed.hospitalFilter);
        if (parsed.operatorFilter) setOperatorFilter(parsed.operatorFilter);
      }
      const rawDraft = window.localStorage.getItem(READONLY_CREATE_DRAFT_KEY);
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft) as Partial<typeof createForm>;
        setCreateForm((prev) => ({
          ...prev,
          tanggalOperasi: parsedDraft.tanggalOperasi || prev.tanggalOperasi,
          jamOperasi: parsedDraft.jamOperasi || "",
          namaDokter: parsedDraft.namaDokter || "",
          jenisTindakan: parsedDraft.jenisTindakan || "",
          rumahSakit: parsedDraft.rumahSakit || "",
          notes: parsedDraft.notes || "",
        }));
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      READONLY_FILTER_KEY,
      JSON.stringify({ dateFilter, hospitalFilter, operatorFilter })
    );
  }, [dateFilter, hospitalFilter, operatorFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(READONLY_CREATE_DRAFT_KEY, JSON.stringify(createForm));
  }, [createForm]);

  const isCurrentStepValid = (step: CreateScheduleStep) => {
    if (step === 1) {
      return Boolean(createForm.namaDokter.trim()) && Boolean(createForm.jenisTindakan.trim());
    }
    if (step === 2) {
      return Boolean(createForm.rumahSakit.trim());
    }
    return true;
  };

  const handleCreateDialogOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setCreateStep(1);
      setUploadProgress(0);
    }
  };

  const goToNextCreateStep = () => {
    if (!isCurrentStepValid(createStep)) {
      if (createStep === 1) toast.error("Lengkapi Dokter dan Tindakan.");
      if (createStep === 2) toast.error("Lengkapi Rumah Sakit.");
      return;
    }
    setCreateStep((prev) => (prev === 1 ? 2 : 3));
  };

  const goToPrevCreateStep = () => {
    setCreateStep((prev) => (prev === 3 ? 2 : 1));
  };

  const handleCreateSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreateSchedule) return;
    if (createStep < 3) {
      goToNextCreateStep();
      return;
    }
    if (!createForm.namaDokter.trim() || !createForm.jenisTindakan.trim() || !createForm.rumahSakit.trim()) {
      toast.error("Lengkapi Dokter, Tindakan, dan Rumah Sakit.");
      return;
    }

    setCreateSaving(true);
    setUploadProgress(8);
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
        onProgress: (progress) => setUploadProgress(Math.max(8, Math.min(100, progress))),
      });
      setCreateOpen(false);
      setCreateStep(1);
      setUploadProgress(0);
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
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(READONLY_CREATE_DRAFT_KEY);
      }
    } catch {
      return;
    } finally {
      setUploadProgress(0);
      setCreateSaving(false);
    }
  };

  return (
    <div className={cn("grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr),340px]", onCreateSchedule && "pb-20 md:pb-0")}>
      <div className="col-span-full -mb-1 flex items-center justify-between xl:hidden">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            className={cn(
              "h-11 rounded-md px-4 font-medium transition-colors",
              mobileView === "jadwal"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:bg-slate-200/70 dark:hover:bg-slate-800"
            )}
            onClick={() => setMobileView("jadwal")}
          >
            Jadwal
          </button>
          <button
            type="button"
            className={cn(
              "h-11 rounded-md px-4 font-medium transition-colors",
              mobileView === "staff"
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:bg-slate-200/70 dark:hover:bg-slate-800"
            )}
            onClick={() => setMobileView("staff")}
          >
            Staff
          </button>
        </div>
      </div>

      <Card
        className={cn(
          "rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/20 via-white to-teal-50/70 p-3 md:p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20",
          mobileView !== "jadwal" && "hidden xl:block"
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <CalendarDays className="h-3.5 w-3.5" />
              Jadwal Operasi
            </p>
            <h4 className="font-semibold text-base md:text-lg">
              {filteredSchedules.length} jadwal
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tanggal saat ini: {todayLabel}</p>
          </div>
          {onCreateSchedule ? (
            <Button
              type="button"
              size="sm"
              className="hidden h-11 px-4 md:inline-flex"
              onClick={() => {
                setCreateStep(1);
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tambah Jadwal
            </Button>
          ) : null}
        </div>

        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "h-11 rounded-full border px-4 text-xs font-medium transition-colors",
                dateFilter === "today"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              )}
              onClick={() => setDateFilter("today")}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className={cn(
                "h-11 rounded-full border px-4 text-xs font-medium transition-colors",
                dateFilter === "tomorrow"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              )}
              onClick={() => setDateFilter("tomorrow")}
            >
              Besok
            </button>
            <button
              type="button"
              className={cn(
                "h-11 rounded-full border px-4 text-xs font-medium transition-colors",
                dateFilter === "all"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              )}
              onClick={() => setDateFilter("all")}
            >
              Semua
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={hospitalFilter}
              onChange={(event) => setHospitalFilter(event.target.value)}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">Filter RS: Semua</option>
              {hospitalOptions.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
            <select
              value={operatorFilter}
              onChange={(event) => setOperatorFilter(event.target.value)}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">Filter Operator: Semua</option>
              {operatorOptions.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loadingSchedules && filteredSchedules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Tidak ada jadwal untuk filter yang dipilih.
          </div>
        ) : null}
        {loadingSchedules ? (
          <div className="rounded-xl border border-slate-200 bg-white/20 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          </div>
        ) : null}

        {!loadingSchedules && filteredSchedules.length > 0 ? (
          <div
            className={cn(
              "overflow-x-auto rounded-xl border border-slate-200 bg-white/20 dark:border-slate-800 dark:bg-slate-900/70",
              filteredSchedules.length > 10 && "max-h-[640px] overflow-y-auto"
            )}
          >
            <table className="w-full min-w-[780px] text-xs">
              <thead className="sticky top-0 bg-slate-100/20 dark:bg-slate-900/95">
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="sticky left-0 z-40 w-[72px] min-w-[72px] overflow-hidden border-r border-slate-200 bg-slate-100/25 px-2 py-2 shadow-[2px_0_0_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[2px_0_0_rgba(2,6,23,0.55)]">
                    Jam
                  </th>
                  <th className="sticky left-[72px] z-30 min-w-[150px] overflow-hidden border-r border-slate-200 bg-slate-100/25 px-3 py-2 shadow-[2px_0_0_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[2px_0_0_rgba(2,6,23,0.55)]">
                    Dokter
                  </th>
                  <th className="px-3 py-2">Tindakan</th>
                  <th className="px-3 py-2">Rumah Sakit</th>
                  <th className="px-3 py-2">TS</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((item) => (
                  (() => {
                    const rowBgClass = scheduleStatusRowClass[item.status];
                    const jamStickyBgClass = item.status === "jadwal_baru"
                      ? "bg-blue-100/25 dark:bg-blue-950/20"
                      : item.status === "tunda"
                        ? "bg-amber-100/25 dark:bg-amber-950/20"
                        : item.status === "batal"
                          ? "bg-rose-100/25 dark:bg-rose-950/20"
                          : item.status === "reschedule"
                            ? "bg-violet-100/25 dark:bg-violet-950/20"
                            : "bg-emerald-100/25 dark:bg-emerald-950/20";
                    const doctorStickyBgClass = item.status === "jadwal_baru"
                      ? "bg-blue-100/25 dark:bg-blue-950/20"
                      : item.status === "tunda"
                        ? "bg-amber-100/25 dark:bg-amber-950/20"
                        : item.status === "batal"
                          ? "bg-rose-100/25 dark:bg-rose-950/20"
                          : item.status === "reschedule"
                            ? "bg-violet-100/25 dark:bg-violet-950/20"
                            : "bg-emerald-100/25 dark:bg-emerald-950/20";
                    return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-t border-slate-200/80 dark:border-slate-800",
                      rowBgClass,
                      item.isOngoingNow && "ring-1 ring-inset ring-rose-300/80 dark:ring-rose-800/70"
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-30 w-[72px] min-w-[72px] overflow-hidden whitespace-nowrap border-r border-slate-200/80 px-2 py-2 shadow-[2px_0_0_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-[2px_0_0_rgba(2,6,23,0.55)]",
                        jamStickyBgClass
                      )}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Clock3 className={cn("h-3.5 w-3.5 text-slate-500", item.isOngoingNow && "text-rose-600")} />
                        <span className="truncate">{item.jam || "--:--"}</span>
                        {item.isOngoingNow ? (
                          <motion.span
                            initial={{ opacity: 0.7, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1.02 }}
                            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                            title="Berlangsung"
                            className="ml-1 inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                            </span>
                          </motion.span>
                        ) : null}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "sticky left-[72px] z-20 min-w-[150px] overflow-hidden border-r border-slate-200/80 px-3 py-2 shadow-[2px_0_0_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-[2px_0_0_rgba(2,6,23,0.55)]",
                        doctorStickyBgClass
                      )}
                    >
                      <p className="inline-flex items-center gap-1 font-medium">
                        <UserRound className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                        <span className="block max-w-[130px] truncate">{item.dokter || "-"}</span>
                      </p>
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
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => void onAssignSchedule?.(item.id)}
                          disabled={!onAssignSchedule}
                          title="Assign TS"
                        >
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-700 dark:text-blue-300"
                          onClick={() => void onEditSchedule?.(item.id)}
                          disabled={!onEditSchedule}
                          title="Edit Jadwal"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-700 dark:text-rose-300"
                          onClick={() => void onDeleteSchedule?.(item.id)}
                          disabled={!onDeleteSchedule}
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Operasi</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={handleCreateSchedule}>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {createStepOrder.map((step) => {
                    const isActive = createStep === step;
                    const isDone = createStep > step;
                    return (
                      <div key={step} className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                            isDone && "bg-emerald-600 text-white",
                            isActive && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
                            !isDone && !isActive && "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          {step}
                        </span>
                        <p
                          className={cn(
                            "truncate text-[11px] font-medium",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {createStepLabel[step]}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Langkah {createStep} dari 3 • {createStepLabel[createStep]}
                </p>
              </div>
              {createStep === 1 ? (
                <>
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
                </>
              ) : null}
              {createStep === 2 ? (
                <>
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
                      rows={4}
                      value={createForm.notes}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                    />
                  </div>
                </>
              ) : null}
              {createStep === 3 ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground">X-ray Pre Op</label>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => setPreXrayFile(event.target.files?.[0] || null)}
                      />
                      {preXrayFile ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {preXrayFile.name}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">X-ray Post Op</label>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => setPostXrayFile(event.target.files?.[0] || null)}
                      />
                      {postXrayFile ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {postXrayFile.name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-emerald-600 transition-[width] duration-300"
                        style={{ width: `${uploadProgress || 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Kompres otomatis aktif. Progress upload: {uploadProgress || 0}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="font-medium">Ringkasan</p>
                    <p className="mt-1 text-muted-foreground">
                      {createForm.namaDokter || "-"} • {createForm.jenisTindakan || "-"} • {createForm.rumahSakit || "-"}
                    </p>
                  </div>
                </>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Kolom TS sengaja dikosongkan. Penugasan TS dapat dilakukan belakangan.
              </p>
              <div className="flex justify-between gap-2">
                <div>
                  {createStep > 1 ? (
                    <Button type="button" variant="outline" onClick={goToPrevCreateStep}>
                      Kembali
                    </Button>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleCreateDialogOpenChange(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={createSaving}>
                    {createStep < 3 ? "Lanjut" : createSaving ? "Menyimpan..." : "Simpan Jadwal"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      <Card
        className={cn(
          "rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/20 via-white to-fuchsia-50/70 p-3 shadow-sm dark:border-violet-900/50 dark:from-violet-950/20 dark:via-slate-900 dark:to-fuchsia-950/20",
          mobileView !== "staff" && "hidden xl:block"
        )}
      >
        <div className="mb-3">
          <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300">
            <Users className="h-3.5 w-3.5" />
            List Staff Operasi
          </p>
          <h4 className="text-sm font-semibold md:text-base">{teamMembers.length} personel</h4>
        </div>

        <div className={cn("space-y-2", teamMembers.length > 5 && "max-h-[420px] overflow-y-auto pr-1")}>
          {renderStaffTableSection(
            groupedTeamMembers.activeGroup,
            "Siap Bertugas",
            "border-emerald-200/70 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/15 dark:text-emerald-300"
          )}

          {renderStaffTableSection(
            groupedTeamMembers.leaveGroup,
            "Izin / Cuti / Sakit",
            "border-amber-200/70 bg-amber-50/40 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/15 dark:text-amber-300"
          )}

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

      {onCreateSchedule ? (
        <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 md:hidden">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full max-w-md rounded-full shadow-lg shadow-emerald-900/25"
            onClick={() => {
              setCreateStep(1);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Tambah Jadwal Operasi
          </Button>
        </div>
      ) : null}
    </div>
  );
}
