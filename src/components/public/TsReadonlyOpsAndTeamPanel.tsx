"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Bone,
  Building2,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  Hospital,
  Loader2,
  MapPin,
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

type TeamDetailDialogState = {
  member: ReadonlyTeamMember;
  assignedDoctors: string[];
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

const getIsoDateWithOffset = (offsetDays = 0) => {
  const now = new Date();
  if (offsetDays !== 0) now.setDate(now.getDate() + offsetDays);
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const getTodayIsoDate = () => getIsoDateWithOffset(0);

const toDateKey = (date: Date) => {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const dateFromKey = (key: string) => {
  const parsed = new Date(`${String(key || "").trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const shiftDateKey = (key: string, days: number) => {
  const date = dateFromKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const getWeekStartKey = (key: string) => {
  const date = dateFromKey(key) || new Date();
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return toDateKey(date);
};

const getMonthKey = (key: string) => String(key || "").slice(0, 7);

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

const scheduleStatusMobileCardClass: Record<ReadonlyScheduleStatus, string> = {
  jadwal_baru: "border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30",
  tunda: "border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30",
  batal: "border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30",
  reschedule: "border-violet-200 bg-violet-50/80 dark:border-violet-900/50 dark:bg-violet-950/30",
  selesai: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30",
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

const getInitials = (value: string) =>
  String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TS";

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
  const [selectedDateKey, setSelectedDateKey] = useState(() => getTodayIsoDate());
  const [weekStartKey, setWeekStartKey] = useState(() => getWeekStartKey(getTodayIsoDate()));
  const [calendarOpen, setCalendarOpen] = useState(false);
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
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<TeamDetailDialogState | null>(null);
  const todayAsistensiKey = useMemo(() => getIsoDateWithOffset(0), []);
  const selectedDateLabel = useMemo(() => {
    const date = dateFromKey(selectedDateKey);
    if (!date) return selectedDateKey;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }, [selectedDateKey]);
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat("id-ID", { weekday: "short" }), []);
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat("id-ID", { day: "numeric" }), []);
  const monthDayFormatter = useMemo(() => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }), []);

  const teamAssignmentsByName = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const schedule of schedules) {
      const scheduleDateKey = String(schedule.tanggalKey || "").trim();
      if (!scheduleDateKey || scheduleDateKey !== todayAsistensiKey) continue;
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
  }, [schedules, todayAsistensiKey]);

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

  const teamMemberByName = useMemo(() => {
    const map = new Map<string, ReadonlyTeamMember>();
    for (const member of teamMembers) {
      const key = String(member.nama || "").trim().toLowerCase();
      if (!key) continue;
      map.set(key, member);
    }
    return map;
  }, [teamMembers]);

  const schedulesByDateCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const schedule of schedules) {
      const key = String(schedule.tanggalKey || "").trim();
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const list = schedules.filter((item) => String(item.tanggalKey || "").trim() === selectedDateKey);

    return [...list].sort((first, second) => {
      if (first.tanggalKey !== second.tanggalKey) return String(first.tanggalKey || "").localeCompare(String(second.tanggalKey || ""));
      return toMinutes(first.jam) - toMinutes(second.jam);
    });
  }, [schedules, selectedDateKey]);

  const teamAssignmentsForSelectedDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const schedule of filteredSchedules) {
      const dokter = String(schedule.dokter || "").trim();
      if (!dokter) continue;
      const tsNames = String(schedule.tsMembantu || "")
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
  }, [filteredSchedules]);

  const selectedMonthKey = useMemo(() => getMonthKey(selectedDateKey), [selectedDateKey]);

  const weekDateItems = useMemo(() => {
    const start = dateFromKey(weekStartKey) || dateFromKey(getWeekStartKey(selectedDateKey));
    if (!start) return [];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDateKey(date);
      return {
        key,
        day: weekdayFormatter.format(date),
        date: dayFormatter.format(date),
        count: schedulesByDateCount.get(key) || 0,
        isToday: key === todayAsistensiKey,
        inCurrentMonth: getMonthKey(key) === selectedMonthKey,
      };
    });
  }, [dayFormatter, schedulesByDateCount, selectedDateKey, selectedMonthKey, todayAsistensiKey, weekStartKey, weekdayFormatter]);

  const weekRangeLabel = useMemo(() => {
    const first = weekDateItems[0];
    const last = weekDateItems[6];
    if (!first || !last) return "";
    const firstDate = dateFromKey(first.key);
    const lastDate = dateFromKey(last.key);
    if (!firstDate || !lastDate) return "";
    return `${monthDayFormatter.format(firstDate)} - ${monthDayFormatter.format(lastDate)}`;
  }, [monthDayFormatter, weekDateItems]);

  const canGoPrevWeek = useMemo(
    () => getMonthKey(shiftDateKey(weekStartKey, -7)) === selectedMonthKey,
    [selectedMonthKey, weekStartKey]
  );

  const canGoNextWeek = useMemo(
    () => getMonthKey(shiftDateKey(weekStartKey, 7)) === selectedMonthKey,
    [selectedMonthKey, weekStartKey]
  );

  const moveWeekWithinMonth = (direction: -1 | 1) => {
    const nextWeekStart = shiftDateKey(weekStartKey, direction * 7);
    if (getMonthKey(nextWeekStart) !== selectedMonthKey) return;
    setWeekStartKey(nextWeekStart);
    const nextSelectedDate = shiftDateKey(selectedDateKey, direction * 7);
    if (getMonthKey(nextSelectedDate) === selectedMonthKey) {
      setSelectedDateKey(nextSelectedDate);
    }
  };

  useEffect(() => {
    if (dateFromKey(selectedDateKey)) return;
    const fallbackKey = getTodayIsoDate();
    setSelectedDateKey(fallbackKey);
    setWeekStartKey(getWeekStartKey(fallbackKey));
  }, [selectedDateKey]);

  const mobileHighlightedScheduleId = useMemo(() => {
    if (!filteredSchedules.length) return null;
    const ongoing = filteredSchedules.find((item) => item.isOngoingNow);
    return ongoing?.id || filteredSchedules[0]?.id || null;
  }, [filteredSchedules]);

  const renderStaffTableSection = (
    members: ReadonlyTeamMember[],
    title: string,
    containerClass: string
  ) => {
    if (!members.length) return null;
    return (
      <div className={cn("rounded-xl border p-2", containerClass)}>
        <p className="mb-1 text-[11px] font-medium">{title}</p>
        <div className="space-y-2 md:hidden">
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
              <button
                key={member.no}
                type="button"
                className={cn(
                  "w-full rounded-lg border bg-white/80 p-2.5 text-left transition hover:shadow-sm dark:bg-slate-900/60",
                  statusUi.cardClass
                )}
                onClick={() => setSelectedTeamDetail({ member, assignedDoctors })}
              >
                <div className="flex items-center gap-2">
                  {member.profileUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.profileUrl}
                      alt={`Foto ${member.nama || "TS"}`}
                      className="h-9 w-9 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-semibold">
                      {getInitials(member.nama || "TS")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{member.nama || "-"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          roleUi.chipClass
                        )}
                      >
                        {roleUi.icon}
                        {isSalesDirector ? null : roleUi.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          statusUi.chipClass
                        )}
                      >
                        {statusUi.icon}
                        {statusUi.label}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">
                  {isTsRole ? (isAssigned ? assignedDoctors.join(", ") : "Belum ditugaskan") : "Mendukung asistensi operasional"}
                </p>
              </button>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/40 md:block">
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
                            {getInitials(member.nama || "TS")}
                          </span>
                        )}
                        <button
                          type="button"
                          className="truncate text-left font-medium text-foreground/90 underline-offset-2 hover:underline"
                          onClick={() => setSelectedTeamDetail({ member, assignedDoctors })}
                        >
                          {member.nama || "-"}
                        </button>
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
                      <span className="block whitespace-normal break-words">
                        {isTsRole ? (isAssigned ? assignedDoctors.join(", ") : "Belum ditugaskan") : "-"}
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
    <div className="grid grid-rows-1 gap-4 pb-20 md:pb-0 xl:grid-cols-[minmax(0,1fr),340px]">
      <div className="col-span-full -mb-1 hidden items-center justify-between md:flex xl:hidden">
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
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selectedDateLabel} • {schedulesByDateCount.get(selectedDateKey) || 0} agenda
            </p>
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

        <div className="mb-3 hidden space-y-1.5 sm:block">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={() => moveWeekWithinMonth(-1)}
              disabled={!canGoPrevWeek}
              title="Minggu sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex w-max items-center gap-1.5 pr-1">
                {weekDateItems.map((item) => {
                  const isSelected = item.key === selectedDateKey;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={cn(
                        "rounded-xl border px-2 py-1 text-center disabled:cursor-not-allowed disabled:opacity-45",
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-200"
                          : item.isToday
                            ? "border-emerald-400/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
                      )}
                      onClick={() => {
                        if (!item.inCurrentMonth) return;
                        setSelectedDateKey(item.key);
                      }}
                      disabled={!item.inCurrentMonth}
                    >
                      <p className="text-[10px] uppercase">{item.day}</p>
                      <p className="text-sm font-semibold leading-none">{item.date}</p>
                      <p
                        className={cn(
                          "mt-1 inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px]",
                          isSelected
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        <MapPin className="h-2.5 w-2.5" />
                        {item.count}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={() => moveWeekWithinMonth(1)}
              disabled={!canGoNextWeek}
              title="Minggu berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 px-2.5 text-[11px]"
              onClick={() => setCalendarOpen(true)}
            >
              Kalender
            </Button>
          </div>
          <p className="px-1 text-[11px] text-muted-foreground">Minggu {weekRangeLabel || "-"}</p>
        </div>

        {loadingSchedules ? (
          <div className="rounded-xl border border-slate-200 bg-white/20 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 xl:hidden">
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-xs text-muted-foreground">{selectedDateLabel}</p>
                <p className="text-3xl font-semibold leading-tight">
                  {selectedDateKey === todayAsistensiKey ? "Today" : "Agenda"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => moveWeekWithinMonth(-1)}
                    disabled={!canGoPrevWeek}
                    title="Minggu sebelumnya"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <p className="truncate px-1 text-[11px] text-muted-foreground">Minggu {weekRangeLabel || "-"}</p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => moveWeekWithinMonth(1)}
                      disabled={!canGoNextWeek}
                      title="Minggu berikutnya"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full px-2.5 text-[11px]"
                      onClick={() => setCalendarOpen(true)}
                    >
                      Kalender
                    </Button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {weekDateItems.map((item) => {
                    const isSelected = item.key === selectedDateKey;
                    return (
                      <button
                        key={`mobile-${item.key}`}
                        type="button"
                        className={cn(
                          "rounded-xl border px-1 py-1.5 text-center disabled:cursor-not-allowed disabled:opacity-45",
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-200"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
                        )}
                        onClick={() => {
                          if (!item.inCurrentMonth) return;
                          setSelectedDateKey(item.key);
                        }}
                        disabled={!item.inCurrentMonth}
                      >
                        <p className="text-[10px] uppercase">{item.day}</p>
                        <p className="text-sm font-semibold">{item.date}</p>
                        <p className="mt-1 inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          {item.count}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className={cn(
                  "relative space-y-2 rounded-2xl border border-slate-200/70 bg-white/50 p-2 pl-8 dark:border-slate-800 dark:bg-slate-900/30",
                  filteredSchedules.length > 3 && "max-h-[540px] overflow-y-auto pr-1",
                  filteredSchedules.length === 0 && "min-h-[180px]"
                )}
              >
                {filteredSchedules.length > 0 ? (
                  <>
                    <div className="absolute bottom-2 left-[13px] top-2 w-[2px] rounded-full bg-gradient-to-b from-blue-200 via-cyan-300 to-blue-200 dark:from-blue-900/60 dark:via-cyan-800/60 dark:to-blue-900/60" />
                    {filteredSchedules.map((item) => {
                      const isHighlighted = item.id === mobileHighlightedScheduleId || item.isOngoingNow;
                      const assignedTs = item.tsMembantu
                        .split(",")
                        .map((name) => name.trim())
                        .filter(Boolean);
                      const assignedProfiles = assignedTs.slice(0, 4).map((name) => {
                        const normalizedName = name.toLowerCase();
                        const member = teamMemberByName.get(normalizedName) || {
                          no: "-",
                          nama: name,
                          role: "",
                          email: "",
                          phone: "",
                          status: "aktif",
                          profileUrl: "",
                        };
                        const assignedDoctors = Array.from(
                          teamAssignmentsForSelectedDate.get(normalizedName) || new Set<string>()
                        );
                        if (!assignedDoctors.length && item.dokter) assignedDoctors.push(item.dokter);
                        return { name, member, assignedDoctors };
                      });
                      return (
                        <div key={item.id} className="relative">
                          <span
                            className={cn(
                              "absolute -left-[23px] top-6 z-10 inline-flex h-4 w-4 rounded-full border-2 border-white shadow-sm dark:border-slate-900",
                              isHighlighted ? "bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950/50" : "bg-slate-300 dark:bg-slate-700"
                            )}
                          />
                          <div
                            className={cn(
                              "rounded-2xl border p-3 shadow-sm backdrop-blur-[2px]",
                              isHighlighted
                                ? "border-blue-500/30 bg-gradient-to-br from-blue-500 to-blue-400 text-white"
                                : scheduleStatusMobileCardClass[item.status]
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={cn("truncate text-base font-semibold", !isHighlighted && "text-foreground")}>
                                  {item.tindakan || "Jadwal Operasi"}
                                </p>
                                <p
                                  className={cn(
                                    "mt-0.5 text-xs",
                                    isHighlighted ? "text-white/90" : "text-muted-foreground"
                                  )}
                                >
                                  {item.dokter || "-"} • {item.rumahSakit || "-"}
                                </p>
                              </div>
                              <p className={cn("text-base font-semibold whitespace-nowrap", isHighlighted ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                                {item.jam || "--:--"}
                              </p>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-1 text-[11px] font-semibold",
                                  isHighlighted
                                    ? "bg-white/20 text-white"
                                    : scheduleStatusChipClass[item.status]
                                )}
                              >
                                {item.statusLabel}
                              </span>
                              <span
                                className={cn(
                                  "text-[11px]",
                                  isHighlighted ? "text-white/90" : "text-muted-foreground"
                                )}
                              >
                                {item.tanggalLabel}
                              </span>
                            </div>

                            {assignedProfiles.length ? (
                              <div className="mt-2 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {assignedProfiles.map((profile, index) => (
                                    <button
                                      key={`${item.id}-${profile.name}-${index}`}
                                      type="button"
                                      className={cn(
                                        "inline-flex h-7 max-w-[130px] items-center gap-1 rounded-full pl-1 pr-2 text-[10px] font-medium",
                                        isHighlighted
                                          ? "border border-white/40 bg-white/25 text-white"
                                          : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                      )}
                                      title={`${profile.name} • lihat keterangan`}
                                      onClick={() =>
                                        setSelectedTeamDetail({
                                          member: profile.member,
                                          assignedDoctors: profile.assignedDoctors,
                                        })
                                      }
                                    >
                                      {profile.member.profileUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={profile.member.profileUrl}
                                          alt={`Foto ${profile.name}`}
                                          className="h-5 w-5 rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-semibold">
                                          {getInitials(profile.name)}
                                        </span>
                                      )}
                                      <span className="truncate">{profile.name}</span>
                                    </button>
                                  ))}
                                  {assignedTs.length > 4 ? (
                                    <span className={cn("text-[11px] font-medium", isHighlighted ? "text-white/90" : "text-muted-foreground")}>
                                      +{assignedTs.length - 4}
                                    </span>
                                  ) : null}
                                </div>
                                <p className={cn("text-[10px]", isHighlighted ? "text-white/85" : "text-muted-foreground")}>
                                  Tap profil untuk keterangan
                                </p>
                              </div>
                            ) : (
                              <p className={cn("mt-2 text-[11px]", isHighlighted ? "text-white/85" : "text-muted-foreground")}>
                                TS belum diassign
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
                                  className={cn(
                                    "h-9 min-w-[116px] rounded-lg border px-2 text-xs",
                                    isHighlighted
                                      ? "border-white/35 bg-white/20 text-white"
                                      : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                  )}
                                >
                                  {(Object.keys(scheduleStatusLabel) as ReadonlyScheduleStatus[]).map((statusKey) => (
                                    <option key={statusKey} value={statusKey}>
                                      {scheduleStatusLabel[statusKey]}
                                    </option>
                                  ))}
                                </select>
                              ) : null}
                              <Button
                                type="button"
                                variant={isHighlighted ? "secondary" : "outline"}
                                size="icon"
                                className="h-9 w-9 rounded-xl"
                                onClick={() => void onAssignSchedule?.(item.id)}
                                disabled={!onAssignSchedule}
                                title="Assign TS"
                              >
                                <Users className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant={isHighlighted ? "secondary" : "outline"}
                                size="icon"
                                className={cn("h-9 w-9 rounded-xl", !isHighlighted && "text-blue-700 dark:text-blue-300")}
                                onClick={() => void onEditSchedule?.(item.id)}
                                disabled={!onEditSchedule}
                                title="Edit Jadwal"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant={isHighlighted ? "secondary" : "outline"}
                                size="icon"
                                className={cn("h-9 w-9 rounded-xl", !isHighlighted && "text-rose-700 dark:text-rose-300")}
                                onClick={() => void onDeleteSchedule?.(item.id)}
                                disabled={!onDeleteSchedule}
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {updatingScheduleId === item.id ? (
                                <Loader2 className={cn("h-3.5 w-3.5 animate-spin", isHighlighted ? "text-white" : "text-muted-foreground")} />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="relative flex min-h-[156px] items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/70 px-3 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-950/50">
                    Tidak ada agenda pada {selectedDateLabel}.
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                "hidden overflow-x-auto rounded-xl border border-slate-200 bg-white/20 dark:border-slate-800 dark:bg-slate-900/70 xl:block",
                filteredSchedules.length > 3 && "max-h-[640px] overflow-y-auto"
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
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((item) => (
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
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="border-t border-slate-200/80 px-3 py-10 text-center text-sm text-muted-foreground dark:border-slate-800"
                      >
                        Tidak ada agenda pada {selectedDateLabel}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Pilih Tanggal Agenda</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="date"
                value={selectedDateKey}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  if (!nextDate) return;
                  setSelectedDateKey(nextDate);
                  setWeekStartKey(getWeekStartKey(nextDate));
                }}
              />
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1"
                  onClick={() => {
                    const todayKey = getTodayIsoDate();
                    setSelectedDateKey(todayKey);
                    setWeekStartKey(getWeekStartKey(todayKey));
                    setCalendarOpen(false);
                  }}
                >
                  Hari Ini
                </Button>
                <Button type="button" className="h-10 flex-1" onClick={() => setCalendarOpen(false)}>
                  Gunakan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

      <Dialog
        open={Boolean(selectedTeamDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedTeamDetail(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Staff Asistensi</DialogTitle>
          </DialogHeader>
          {selectedTeamDetail ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                {selectedTeamDetail.member.profileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedTeamDetail.member.profileUrl}
                    alt={`Foto ${selectedTeamDetail.member.nama || "Staff"}`}
                    className="h-12 w-12 rounded-full border object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold">
                    {(selectedTeamDetail.member.nama || "TS")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() || "")
                      .join("")}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{selectedTeamDetail.member.nama || "-"}</p>
                  <p className="text-xs text-muted-foreground">No: {selectedTeamDetail.member.no || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-sm">
                <p>
                  <span className="font-medium">Role:</span>{" "}
                  {getTeamRoleUi(selectedTeamDetail.member.role).label}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {getTeamStatusUi(
                    selectedTeamDetail.member.status,
                    selectedTeamDetail.assignedDoctors.length > 0
                  ).label}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {selectedTeamDetail.member.email || "-"}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {selectedTeamDetail.member.phone || "-"}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">Asistensi Dokter</p>
                {selectedTeamDetail.assignedDoctors.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {selectedTeamDetail.assignedDoctors.map((doctorName) => (
                      <li key={`${selectedTeamDetail.member.no}-${doctorName}`}>{doctorName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ditugaskan.</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="fixed inset-x-0 bottom-3 z-40 px-3 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <button
            type="button"
            className={cn(
              "inline-flex h-11 min-w-[84px] flex-col items-center justify-center rounded-xl px-3 text-[11px] font-medium",
              mobileView === "jadwal"
                ? "text-blue-700 dark:text-blue-300"
                : "text-muted-foreground"
            )}
            onClick={() => setMobileView("jadwal")}
          >
            <Clock3 className="h-4 w-4" />
            Jadwal
          </button>
          {onCreateSchedule ? (
            <Button
              type="button"
              size="icon"
              className="h-14 w-14 rounded-2xl bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-700"
              onClick={() => {
                setCreateStep(1);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          ) : (
            <span className="inline-flex h-14 w-14" />
          )}
          <button
            type="button"
            className={cn(
              "inline-flex h-11 min-w-[84px] flex-col items-center justify-center rounded-xl px-3 text-[11px] font-medium",
              mobileView === "staff"
                ? "text-violet-700 dark:text-violet-300"
                : "text-muted-foreground"
            )}
            onClick={() => setMobileView("staff")}
          >
            <Users className="h-4 w-4" />
            Staff
          </button>
        </div>
      </div>
    </div>
  );
}
