"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Camera,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  FileImage,
  History,
  ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Timer,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import TsScheduleAssignmentPanel from "@/components/public/TsScheduleAssignmentPanel";
import TsReadonlyOpsAndTeamPanel from "@/components/public/TsReadonlyOpsAndTeamPanel";
import { TsConfirmDialog, TsTextDialog } from "@/components/public/TsActionDialogs";
import TsSummaryQuickViewDialog, { type TsSummaryQuickViewItem } from "@/components/public/TsSummaryQuickViewDialog";
import TsTeamRosterPanel, {
  type TeamAvailabilityStatus,
  type TeamMemberRole,
  type TeamRosterViewMode,
  type TsTeamMemberAccountInput,
  type TsTeamMember,
} from "@/components/public/TsTeamRosterPanel";
import { toSafeImageSrc } from "@/lib/googleDriveImage";
import { cn } from "@/lib/utils";

type ScheduleStatus = "jadwal_baru" | "tunda" | "batal" | "reschedule" | "selesai";
type PanelMode = "manage" | "readonly";
type SummaryQuickViewKey = "total" | "today" | "needs_attention" | "selesai";
type ManageMobileTab = "jadwal" | "asistensi" | "tim" | "lainnya";
type CreateScheduleStep = "data" | "team_ts" | "xray";
type AgendaDesktopViewMode = "table" | "card";
type TsSupportAsistensiManagerProps = {
  readonlyOnly?: boolean;
};

type TsSupportEntry = {
  id: string;
  tanggalOperasi: string;
  tanggalKey: string;
  jamOperasi: string;
  namaDokter: string;
  jenisTindakan: string;
  rumahSakit: string;
  tsMembantu: string;
  notes: string;
  preXray: string;
  preXrayFileId: string;
  postXray: string;
  postXrayFileId: string;
  status: ScheduleStatus;
};

type TsSupportForm = {
  tanggalOperasi: string;
  jamOperasi: string;
  namaDokter: string;
  jenisTindakan: string;
  rumahSakit: string;
  tsMembantu: string;
  notes: string;
};

type TsSupportEditForm = TsSupportForm & {
  status: ScheduleStatus;
  preXray: string;
  preXrayFileId: string;
  postXray: string;
  postXrayFileId: string;
};

type PendingReadonlyCreate = {
  clientId: string;
  payload: {
    action: "create";
    data: {
      tanggalOperasi: string;
      hospital: string;
      operator: string;
      teamTs: { name: string }[];
      recipients: string[];
      preXrayUpload: { fileName: string; mimeType: string; dataUrl: string } | null;
      postXrayUpload: { fileName: string; mimeType: string; dataUrl: string } | null;
      preXrayFileId: string;
      postXrayFileId: string;
      preXrayUrl: string;
      postXrayUrl: string;
      keterangan: string;
    };
  };
  optimisticEntry: TsSupportEntry;
  createdAt: string;
};

type TsSupportAuditTimelineItem = {
  id: string;
  createdAt: string;
  action: string;
  entityType: "schedule" | "team";
  entityId: string;
  actor: {
    uid: string;
    email: string;
    name: string;
    username?: string;
    role: string;
  };
  before: unknown;
  after: unknown;
  meta?: {
    comment?: string;
    status?: string;
    source?: string;
    replyTo?: string;
    doctor?: string;
    hospital?: string;
    hasPreXray?: boolean;
    hasPostXray?: boolean;
    deletePreXray?: boolean;
    deletePostXray?: boolean;
    preChanged?: boolean;
    postChanged?: boolean;
    statusChanged?: boolean;
    [key: string]: unknown;
  };
};

type ScheduleAuditSummaryKind = "new" | "status" | "comment" | "upload" | "delete" | "update";

type TsTeamMemberSaveInput = {
  no: string;
  nama: string;
  role: TeamMemberRole;
  email: string;
  phone: string;
  status: TeamAvailabilityStatus;
  profileId: string;
  profileUrl: string;
};

const STATUS_CONFIG: Record<
  ScheduleStatus,
  {
    label: string;
    chipClass: string;
    cardClass: string;
    headerClass: string;
  }
> = {
  jadwal_baru: {
    label: "Jadwal Baru",
    chipClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    cardClass:
      "border-blue-300/85 bg-gradient-to-br from-blue-100/85 via-white to-cyan-100/80 dark:border-blue-800/70 dark:from-blue-950/45 dark:via-slate-900/85 dark:to-cyan-950/30",
    headerClass:
      "from-blue-50/95 to-blue-100/70 border-blue-200/70 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-900/50",
  },
  tunda: {
    label: "Tunda",
    chipClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    cardClass:
      "border-amber-300/85 bg-gradient-to-br from-amber-100/85 via-white to-orange-100/80 dark:border-amber-800/70 dark:from-amber-950/45 dark:via-slate-900/85 dark:to-orange-950/30",
    headerClass:
      "from-amber-50/95 to-amber-100/70 border-amber-200/70 dark:from-amber-950/40 dark:to-amber-900/20 dark:border-amber-900/50",
  },
  batal: {
    label: "Batal",
    chipClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    cardClass:
      "border-rose-300/85 bg-gradient-to-br from-rose-100/85 via-white to-red-100/80 dark:border-rose-800/70 dark:from-rose-950/45 dark:via-slate-900/85 dark:to-red-950/30",
    headerClass:
      "from-rose-50/95 to-rose-100/70 border-rose-200/70 dark:from-rose-950/40 dark:to-rose-900/20 dark:border-rose-900/50",
  },
  reschedule: {
    label: "Reschedule",
    chipClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
    cardClass:
      "border-violet-300/85 bg-gradient-to-br from-violet-100/85 via-white to-fuchsia-100/80 dark:border-violet-800/70 dark:from-violet-950/45 dark:via-slate-900/85 dark:to-fuchsia-950/30",
    headerClass:
      "from-violet-50/95 to-violet-100/70 border-violet-200/70 dark:from-violet-950/40 dark:to-violet-900/20 dark:border-violet-900/50",
  },
  selesai: {
    label: "Selesai",
    chipClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    cardClass:
      "border-emerald-300/85 bg-gradient-to-br from-emerald-100/85 via-white to-teal-100/80 dark:border-emerald-800/70 dark:from-emerald-950/45 dark:via-slate-900/85 dark:to-teal-950/30",
    headerClass:
      "from-emerald-50/95 to-emerald-100/70 border-emerald-200/70 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-900/50",
  },
};

const INITIAL_FORM: TsSupportForm = {
  tanggalOperasi: "",
  jamOperasi: "",
  namaDokter: "",
  jenisTindakan: "",
  rumahSakit: "",
  tsMembantu: "",
  notes: "",
};

const INITIAL_EDIT_FORM: TsSupportEditForm = {
  ...INITIAL_FORM,
  status: "jadwal_baru",
  preXray: "",
  preXrayFileId: "",
  postXray: "",
  postXrayFileId: "",
};

const CREATE_STEP_ORDER: CreateScheduleStep[] = ["data", "team_ts", "xray"];
const CREATE_STEP_LABEL: Record<CreateScheduleStep, string> = {
  data: "Data",
  team_ts: "Team TS",
  xray: "X-ray",
};

const MAX_STORED_IMAGE_CHARS = 22_000;
const ENTRIES_CACHE_KEY = "ts_support_entries_cache_v1";
const TEAM_CACHE_KEY = "ts_support_team_cache_v1";
const PENDING_CREATE_QUEUE_KEY = "ts_support_pending_creates_v1";
const MANAGE_FILTER_KEY = "ts_support_manage_filters_v1";
const MANAGE_CREATE_DRAFT_KEY = "ts_support_manage_create_draft_v1";
const AUDIT_LAST_SEEN_KEY = "ts_support_audit_last_seen_v1";
const ACTIVITY_TOAST_LAST_SEEN_KEY = "ts_support_activity_toast_last_seen_v1";
const AUTO_REFRESH_INTERVAL_MS = 2 * 60_000;
const ACTIVITY_TOAST_ACTIONS = new Set([
  "comment_schedule",
  "create_schedule",
  "delete_schedule",
]);
const TAP_MOTION = {
  whileTap: { scale: 0.96 },
  transition: { type: "spring", stiffness: 480, damping: 30 },
} as const;
const LIST_ITEM_MOTION = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.985 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;
const formatBadgeCount = (count: number) => (count > 99 ? "99+" : String(Math.max(0, count)));

const pickAuditValue = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const directValue = record[key];
    if (directValue !== undefined && directValue !== null && String(directValue).trim() !== "") {
      return String(directValue).trim();
    }
  }

  const normalizedMap = new Map<string, unknown>();
  for (const [recordKey, recordValue] of Object.entries(record)) {
    normalizedMap.set(recordKey.trim().toLowerCase(), recordValue);
  }
  for (const key of keys) {
    const candidate = normalizedMap.get(key.trim().toLowerCase());
    if (candidate !== undefined && candidate !== null && String(candidate).trim() !== "") {
      return String(candidate).trim();
    }
  }

  return "";
};

const parseAuditStatusValue = (value: unknown) => {
  const rawStatus = pickAuditValue(value, ["status", "Status"]);
  if (rawStatus) return normalizeStatus(rawStatus);

  const detailText = pickAuditValue(value, ["Keterangan", "keterangan", "notes", "Notes"]);
  const detailStatus = getDetailValue(detailText, "Status");
  if (detailStatus) return normalizeStatus(detailStatus);

  return "";
};

const parseAuditXraySignature = (value: unknown) => {
  const preXray =
    pickAuditValue(value, [
      "Pre Xray URL",
      "Pre Xray",
      "preXrayUrl",
      "preXray",
      "preXrayFileId",
      "Pre Xray File ID",
    ]) || getDetailValue(pickAuditValue(value, ["Keterangan", "keterangan", "notes", "Notes"]), "Pre Xray");

  const postXray =
    pickAuditValue(value, [
      "Post Xray URL",
      "Post Xray",
      "postXrayUrl",
      "postXray",
      "postXrayFileId",
      "Post Xray File ID",
    ]) || getDetailValue(pickAuditValue(value, ["Keterangan", "keterangan", "notes", "Notes"]), "Post Xray");

  if (!preXray && !postXray) return "";
  return `${preXray}||${postXray}`;
};

const classifyScheduleAuditEntry = (log: TsSupportAuditTimelineItem) => {
  if (log.entityType !== "schedule") return null;
  if (log.action === "create_schedule") return "new" as const;
  if (log.action === "comment_schedule") return "comment" as const;
  if (log.action !== "update_schedule") return null;

  const hasXrayMutation =
    Boolean(log.meta?.preChanged) ||
    Boolean(log.meta?.postChanged) ||
    Boolean(log.meta?.deletePreXray) ||
    Boolean(log.meta?.deletePostXray);
  if (hasXrayMutation) {
    return "upload" as const;
  }

  const commentText = String(log.meta?.comment || "").trim().toLowerCase();
  if (commentText.includes("upload x-ray") || commentText.includes("upload xray")) {
    return "upload" as const;
  }

  const beforeXray = parseAuditXraySignature(log.before);
  const afterXray = parseAuditXraySignature(log.after);
  if (afterXray && beforeXray !== afterXray) {
    return "upload" as const;
  }

  const beforeStatus = parseAuditStatusValue(log.before);
  const metaStatusRaw = String(log.meta?.status || "").trim();
  const metaStatus = metaStatusRaw ? normalizeStatus(metaStatusRaw) : "";
  const afterStatus = parseAuditStatusValue(log.after) || metaStatus;
  if (Boolean(log.meta?.statusChanged) || (beforeStatus && afterStatus && beforeStatus !== afterStatus)) {
    return "status" as const;
  }

  return null;
};

const classifyScheduleAuditSummaryKind = (log: TsSupportAuditTimelineItem): ScheduleAuditSummaryKind | null => {
  if (log.entityType !== "schedule") return null;
  if (log.action === "create_schedule") return "new";
  if (log.action === "delete_schedule") return "delete";
  if (log.action === "comment_schedule") return "comment";
  if (log.action === "update_schedule") {
    return classifyScheduleAuditEntry(log) || "update";
  }
  return null;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toTimestampMs = (value: string) => {
  const parsed = new Date(String(value || "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const isTextEditingElement = (element: Element | null) => {
  if (!element || !(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  const tagName = element.tagName.toLowerCase();
  if (tagName === "textarea" || tagName === "select") return true;
  if (tagName !== "input") return false;

  const input = element as HTMLInputElement;
  const type = String(input.type || "text").toLowerCase();
  const nonTextTypes = new Set([
    "button",
    "checkbox",
    "color",
    "file",
    "hidden",
    "image",
    "radio",
    "range",
    "reset",
    "submit",
  ]);
  return !nonTextTypes.has(type);
};

const parseJsonSafe = (text: string) => {
  const cleaned = text.trim().replace(/^\uFEFF/, "");
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]) as unknown;
    } catch {
      return null;
    }
  }
};

const normalizeDateKey = (raw: string) => {
  const value = raw.trim();
  if (!value) return "";

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) return `${slashMatch[3]}-${pad2(Number(slashMatch[2]))}-${pad2(Number(slashMatch[1]))}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return toDateKey(parsed);
};

const dateFromKey = (key: string) => {
  if (!key) return undefined;
  const parsed = new Date(`${key}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const formatDateLabel = (key: string) => {
  const date = dateFromKey(key);
  if (!date) return key || "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toMinutes = (time: string) => {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.MAX_SAFE_INTEGER;
  return hour * 60 + minute;
};

const sortEntriesByDateTime = (entries: TsSupportEntry[]) =>
  [...entries].sort((first, second) => {
    if (first.tanggalKey !== second.tanggalKey) {
      return String(first.tanggalKey || "").localeCompare(String(second.tanggalKey || ""));
    }
    return toMinutes(first.jamOperasi) - toMinutes(second.jamOperasi);
  });

const isLikelyNetworkError = (error: unknown) => {
  const message = (error as Error)?.message?.toLowerCase?.() || "";
  return (
    error instanceof TypeError ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed")
  );
};

const isDuplicateLoginIdentityError = (error: unknown) => {
  const message = (error as Error)?.message?.toLowerCase?.() || "";
  return (
    message.includes("email/username sudah terdaftar") ||
    message.includes("username sudah terdaftar") ||
    message.includes("email sudah terdaftar") ||
    message.includes("already exists")
  );
};

const canShowOngoingStatus = (status: ScheduleStatus) => status === "jadwal_baru";

const isOperationHappeningNow = (
  entryDateKey: string,
  entryTime: string,
  currentDateKey: string,
  currentMinutes: number
) => {
  if (!entryDateKey || entryDateKey !== currentDateKey) return false;
  const startMinutes = toMinutes(entryTime);
  if (!Number.isFinite(startMinutes) || startMinutes === Number.MAX_SAFE_INTEGER) return false;
  return currentMinutes >= startMinutes;
};

const pickValue = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
};

const getDetailValue = (detail: string, label: string) => {
  const regex = new RegExp(`${label}:\\s*([^|]+)`, "i");
  return detail.match(regex)?.[1]?.trim() || "";
};

const normalizeStatus = (raw: string): ScheduleStatus => {
  const value = raw.trim().toLowerCase();
  if (value.includes("tunda")) return "tunda";
  if (value.includes("batal")) return "batal";
  if (value.includes("resched")) return "reschedule";
  if (value.includes("selesai")) return "selesai";
  return "jadwal_baru";
};

const normalizeTeamStatus = (raw: string): TeamAvailabilityStatus => {
  const value = raw.trim().toLowerCase();
  if (value.includes("sakit")) return "sakit";
  if (value.includes("izin")) return "izin";
  if (value.includes("cuti")) return "cuti";
  if (value.includes("non")) return "non_aktif";
  return "aktif";
};

const normalizeTeamRole = (raw: string): TeamMemberRole => {
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (value.includes("log")) return "logistik";
  if (value.includes("adm")) return "admin";
  if (value.includes("ts")) return "ts";
  if (value.includes("teknikal") || value.includes("technical")) return "ts";
  return "";
};

const formatStatusLabel = (status: ScheduleStatus) => STATUS_CONFIG[status].label;
const formatTeamStatusLabel = (status: TeamAvailabilityStatus) =>
  status === "aktif" ? "aktif" : status === "non_aktif" ? "non aktif" : status;
const formatChatTimeLabel = (value: string) => {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "-";
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};
const formatAuditActionLabel = (value: string) => {
  const map: Record<string, string> = {
    create_schedule: "Create Jadwal",
    update_schedule: "Update Jadwal",
    delete_schedule: "Delete Jadwal",
    comment_schedule: "Komentar Jadwal",
    delete_schedule_comment: "Hapus Komentar Jadwal",
    create_team: "Create Team",
    update_team: "Update Team",
    delete_team: "Delete Team",
    update_team_status: "Update Status Team",
  };
  return map[value] || value;
};

const getAuditCommentText = (item: TsSupportAuditTimelineItem) => {
  const fromMeta = String(item.meta?.comment || "").trim();
  if (fromMeta) return fromMeta;
  const afterObj =
    item.after && typeof item.after === "object" ? (item.after as { comment?: string }) : null;
  const fromAfter = String(afterObj?.comment || "").trim();
  if (fromAfter) return fromAfter;
  return "";
};

const getAuditDoctorHospitalContext = (item: TsSupportAuditTimelineItem) => {
  const doctorFromMeta = String(item.meta?.doctor || "").trim();
  const hospitalFromMeta = String(item.meta?.hospital || "").trim();
  const doctor =
    pickAuditValue(item.after, ["Operator", "operator", "Nama Dokter", "namaDokter"]) ||
    pickAuditValue(item.before, ["Operator", "operator", "Nama Dokter", "namaDokter"]) ||
    doctorFromMeta;
  const hospital =
    pickAuditValue(item.after, ["Hospital", "hospital", "Rumah Sakit", "rumahSakit"]) ||
    pickAuditValue(item.before, ["Hospital", "hospital", "Rumah Sakit", "rumahSakit"]) ||
    hospitalFromMeta;
  return {
    doctor,
    hospital,
    context: [doctor, hospital].filter(Boolean).join(" • "),
  };
};

const isMissingTs = (tsValue: string) => {
  const value = tsValue.trim().toLowerCase();
  return !value || value.includes("belum");
};

const parseTeamMembers = (value: string) =>
  value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

const toStoredImageValue = (raw: string, fallback = "") => {
  const source = raw.trim();
  if (!source) return "";
  if (source.startsWith("blob:")) return fallback;
  if (source.startsWith("data:image/")) {
    return source.length <= MAX_STORED_IMAGE_CHARS ? source : fallback;
  }
  if (/^https?:\/\//i.test(source) || source.startsWith("/")) return source;
  if (source.length <= 255) return source;
  return fallback || source.slice(0, 255);
};

const hasXrayAsset = (value: string, fileId = "") =>
  Boolean(getGoogleDriveFileId(fileId) || getGoogleDriveFileId(value) || toStoredImageValue(value));

const isEntryNeedingAttention = (entry: TsSupportEntry) => {
  const missingTs = isMissingTs(entry.tsMembantu);
  const missingXray =
    !hasXrayAsset(entry.preXray, entry.preXrayFileId) ||
    !hasXrayAsset(entry.postXray, entry.postXrayFileId);
  const delayedStatus = entry.status === "tunda" || entry.status === "reschedule";
  return missingTs || missingXray || delayedStatus;
};

const escapeCsv = (value: string | number) => {
  const text = String(value ?? "");
  if (/[,"\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const ensureStorableImageValue = (raw: string, label: string) => {
  const value = toStoredImageValue(raw);
  if (!value && raw.trim().startsWith("data:image/")) {
    throw new Error(`Foto ${label} terlalu besar. Coba foto resolusi lebih kecil.`);
  }
  return value;
};

const toKeteranganImageValue = (raw: string) => {
  const value = toStoredImageValue(raw);
  if (!value) return "";
  if (value.startsWith("data:image/")) return "";
  if (value.startsWith("blob:")) return "";
  if (getGoogleDriveFileId(value) === value) return "";
  return value;
};

const buildKeterangan = (entry: {
  status: ScheduleStatus;
  jenisTindakan: string;
  notes: string;
  preXray: string;
  postXray: string;
  jamOperasi: string;
}) => {
  const preXrayValue = toKeteranganImageValue(entry.preXray);
  const postXrayValue = toKeteranganImageValue(entry.postXray);
  const parts = [
    `Status: ${formatStatusLabel(entry.status)}`,
    entry.jamOperasi ? `Jam: ${entry.jamOperasi}` : "",
    `Tindakan: ${entry.jenisTindakan || "-"}`,
    entry.notes ? `Notes: ${entry.notes}` : "",
    preXrayValue ? `Pre Xray: ${preXrayValue}` : "",
    postXrayValue ? `Post Xray: ${postXrayValue}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
};

const getGoogleDriveFileId = (raw: string) => {
  const source = raw.trim();
  if (!source) return "";
  if (/^[a-zA-Z0-9_-]{20,}$/.test(source)) return source;

  const filePathMatch = source.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (filePathMatch?.[1]) return filePathMatch[1];

  const directPathMatch = source.match(/\/d\/([a-zA-Z0-9_-]{20,})(?:[/?=&]|$)/);
  if (directPathMatch?.[1]) return directPathMatch[1];

  const ucMatch = source.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (ucMatch?.[1]) return ucMatch[1];

  return "";
};

const buildDriveThumbnailUrl = (fileId: string) =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;

const buildDriveViewUrl = (fileId: string) =>
  `https://drive.google.com/uc?export=view&id=${fileId}`;

const toDriveReferenceUrl = (value: string, fileId = "") => {
  const normalizedId = getGoogleDriveFileId(fileId) || getGoogleDriveFileId(value);
  if (normalizedId) return buildDriveViewUrl(normalizedId);
  return toStoredImageValue(value);
};

const toDirectImageUrl = (raw: string) => {
  const source = raw.trim();
  if (!source) return "";
  if (source.includes("drive.google.com")) {
    const fileId = getGoogleDriveFileId(source);
    if (!fileId) return "";
    return buildDriveThumbnailUrl(fileId);
  }
  return source;
};

const resolveImageUrl = (value: string, fileId = "") => {
  const id = getGoogleDriveFileId(fileId);
  if (id) return toSafeImageSrc(id);

  const source = value.trim();
  if (!source) return "";
  if (source.startsWith("data:image/")) return source;
  if (source.startsWith("blob:")) return source;
  if (source.startsWith("/")) return source;

  const sourceId = getGoogleDriveFileId(source);
  if (sourceId) return toSafeImageSrc(sourceId);
  if (/^https?:\/\//i.test(source)) return toSafeImageSrc(toDirectImageUrl(source));
  return "";
};

const resolvePreviewUrl = (value: string, fileId = "") => {
  const id = getGoogleDriveFileId(fileId) || getGoogleDriveFileId(value);
  if (id) return toSafeImageSrc(buildDriveViewUrl(id));

  const source = value.trim();
  if (!source) return "";
  if (source.startsWith("data:image/")) return source;
  if (source.startsWith("blob:")) return source;
  if (source.startsWith("/")) return source;
  return toSafeImageSrc(source);
};

const fileToDataUrl = async (file: File | null) => {
  if (!file) return "";
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.readAsDataURL(file);
  });
};

const fileToCompressedDataUrl = async (file: File | null) => {
  const dataUrl = await fileToDataUrl(file);
  if (!dataUrl || typeof window === "undefined") return dataUrl;

  return new Promise<string>((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      const maxInitialSide = 900;
      const ratio = Math.min(1, maxInitialSide / Math.max(image.width, image.height));
      let width = Math.max(1, Math.round(image.width * ratio));
      let height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      let best = dataUrl;
      const qualities = [0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.26];

      for (let attempt = 0; attempt < 8; attempt += 1) {
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        for (const quality of qualities) {
          const candidate = canvas.toDataURL("image/jpeg", quality);
          if (candidate.length < best.length) best = candidate;
          if (candidate.length <= MAX_STORED_IMAGE_CHARS) {
            resolve(candidate);
            return;
          }
        }

        width = Math.max(120, Math.round(width * 0.82));
        height = Math.max(120, Math.round(height * 0.82));
        if (width <= 120 || height <= 120) break;
      }

      resolve(best);
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
};

const XrayPreview = ({
  src,
  alt,
  heightClass,
  onClick,
}: {
  src: string;
  alt: string;
  heightClass: string;
  onClick?: () => void;
}) => (
  <div
    className={cn("w-full overflow-hidden rounded-md border", heightClass, onClick && "cursor-zoom-in")}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (!onClick) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
  </div>
);

const XraySourcePicker = ({
  onSelect,
  disabled = false,
}: {
  onSelect: (file: File | null, source: "file" | "camera") => void;
  disabled?: boolean;
}) => (
  <div className="grid grid-cols-2 gap-2">
    <label
      className={cn(
        "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <FileImage className="h-3.5 w-3.5" />
      File
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          onSelect(file, "file");
          event.currentTarget.value = "";
        }}
      />
    </label>
    <label
      className={cn(
        "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-sky-300 bg-sky-50 px-2 text-[11px] font-medium text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <Camera className="h-3.5 w-3.5" />
      Kamera
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          onSelect(file, "camera");
          event.currentTarget.value = "";
        }}
      />
    </label>
  </div>
);

const normalizeRows = (raw: unknown): TsSupportEntry[] => {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : [];

  return list
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map((row, index) => {
      const tanggalOperasi = pickValue(row, ["Tanggal Operasi", "tanggalOperasi", "tanggal", "date"]);
      const detailText = pickValue(row, ["Keterangan", "keterangan", "notes", "Notes"]);

      const jenisFromDetail = getDetailValue(detailText, "Tindakan");
      const notesFromDetail = getDetailValue(detailText, "Notes");
      const preFromDetail = getDetailValue(detailText, "Pre Xray");
      const postFromDetail = getDetailValue(detailText, "Post Xray");
      const jamFromDetail = getDetailValue(detailText, "Jam");
      const statusFromDetail = getDetailValue(detailText, "Status");
      const preXrayFileId = pickValue(row, ["preXrayFileId", "Pre Xray File ID", "Pre Xray FileId"]);
      const postXrayFileId = pickValue(row, ["postXrayFileId", "Post Xray File ID", "Post Xray FileId"]);
      const preXrayRaw =
        pickValue(row, ["preXrayUrl", "Pre Xray URL", "Pre Xray Drive URL", "preXray", "Pre Xray"]) ||
        preFromDetail;
      const postXrayRaw =
        pickValue(row, ["postXrayUrl", "Post Xray URL", "Post Xray Drive URL", "postXray", "Post Xray"]) ||
        postFromDetail;
      const normalizedPreFileId = preXrayFileId || getGoogleDriveFileId(preXrayRaw);
      const normalizedPostFileId = postXrayFileId || getGoogleDriveFileId(postXrayRaw);

      return {
        id:
          pickValue(row, ["Submission ID", "submissionId", "id", "ID", "no", "No"]) ||
          `${index + 1}`,
        tanggalOperasi,
        tanggalKey: normalizeDateKey(tanggalOperasi),
        jamOperasi: pickValue(row, ["Jam Operasi", "jamOperasi", "jam", "waktu"]) || jamFromDetail,
        namaDokter: pickValue(row, ["Operator", "namaDokter", "Nama Dokter", "dokter"]),
        jenisTindakan:
          pickValue(row, ["jenisTindakan", "Jenis Tindakan", "Tindakan Operasi"]) || jenisFromDetail,
        rumahSakit: pickValue(row, [
          "Hospital",
          "Rumah Sakit",
          "hospital",
          "rumahSakit",
          "Lokasi Rumah Sakit",
        ]),
        tsMembantu: pickValue(row, ["Team TS", "TS yang Membantu", "tsMembantu", "ts"]),
        notes: notesFromDetail || detailText,
        preXray: normalizedPreFileId || toStoredImageValue(preXrayRaw),
        preXrayFileId: normalizedPreFileId,
        postXray: normalizedPostFileId || toStoredImageValue(postXrayRaw),
        postXrayFileId: normalizedPostFileId,
        status: normalizeStatus(statusFromDetail),
      };
    });
};

const normalizeTeamRows = (raw: unknown): TsTeamMember[] => {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : [];

  return list
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map((row, index) => {
      const no = pickValue(row, ["No", "no", "ID", "id"]) || String(index + 1);
      const nama = pickValue(row, ["Nama", "nama", "Name", "name"]);
      const rawRole = pickValue(row, ["Role", "role", "Jabatan", "jabatan"]);
      const hasRoleField =
        Object.prototype.hasOwnProperty.call(row, "Role") ||
        Object.prototype.hasOwnProperty.call(row, "role") ||
        Object.prototype.hasOwnProperty.call(row, "Jabatan") ||
        Object.prototype.hasOwnProperty.call(row, "jabatan");
      const role = normalizeTeamRole(hasRoleField ? rawRole : "ts");
      const email = pickValue(row, ["Email", "email"]);
      const phone = pickValue(row, ["Phone", "phone", "No HP", "Telp", "telp"]);
      const profileId = pickValue(row, ["Profile Id", "Profile ID", "profileId", "ProfileId"]);
      const profileUrlRaw = pickValue(row, ["Profile URL", "profileUrl", "Photo URL", "Foto URL"]);
      const normalizedProfileId = profileId || getGoogleDriveFileId(profileUrlRaw);
      const profileUrl = normalizedProfileId
        ? resolveImageUrl(normalizedProfileId, normalizedProfileId)
        : toStoredImageValue(profileUrlRaw);
      const status = normalizeTeamStatus(pickValue(row, ["Status", "status"]) || "aktif");

      return {
        no,
        nama,
        role,
        email,
        phone,
        status,
        profileId: normalizedProfileId,
        profileUrl,
      };
    })
    .sort((first, second) => {
      const noA = Number(first.no || "");
      const noB = Number(second.no || "");
      if (Number.isFinite(noA) && Number.isFinite(noB)) return noA - noB;
      if (Number.isFinite(noA)) return -1;
      if (Number.isFinite(noB)) return 1;
      return first.nama.localeCompare(second.nama, "id");
    });
};

const useObjectPreview = (file: File | null) => {
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return previewUrl;
};

export default function TsSupportAsistensiManager({
  readonlyOnly = false,
}: TsSupportAsistensiManagerProps) {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<TsSupportEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TsTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [syncingOfflineQueue, setSyncingOfflineQueue] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateScheduleStep>("data");
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [manageMobileTab, setManageMobileTab] = useState<ManageMobileTab>("jadwal");
  const [agendaDesktopViewMode, setAgendaDesktopViewMode] = useState<AgendaDesktopViewMode>("table");
  const [staffDesktopViewMode, setStaffDesktopViewMode] = useState<TeamRosterViewMode>("table");
  const [panelMode, setPanelMode] = useState<PanelMode>(readonlyOnly ? "readonly" : "manage");
  const [form, setForm] = useState<TsSupportForm>(INITIAL_FORM);
  const [createUploadProgress, setCreateUploadProgress] = useState(0);
  const [editForm, setEditForm] = useState<TsSupportEditForm>(INITIAL_EDIT_FORM);
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [editPreFile, setEditPreFile] = useState<File | null>(null);
  const [editPostFile, setEditPostFile] = useState<File | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [summaryQuickViewKey, setSummaryQuickViewKey] = useState<SummaryQuickViewKey | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditTargetEntryId, setAuditTargetEntryId] = useState("");
  const [auditLogs, setAuditLogs] = useState<TsSupportAuditTimelineItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [scheduleCommentsOpen, setScheduleCommentsOpen] = useState(false);
  const [scheduleCommentsLoading, setScheduleCommentsLoading] = useState(false);
  const [scheduleCommentsError, setScheduleCommentsError] = useState<string | null>(null);
  const [scheduleCommentCountByEntryId, setScheduleCommentCountByEntryId] = useState<Record<string, number>>({});
  const [scheduleCommentEntryId, setScheduleCommentEntryId] = useState("");
  const [scheduleComments, setScheduleComments] = useState<TsSupportAuditTimelineItem[]>([]);
  const [scheduleCommentDraft, setScheduleCommentDraft] = useState("");
  const [scheduleCommentReplyToId, setScheduleCommentReplyToId] = useState("");
  const [scheduleCommentSaving, setScheduleCommentSaving] = useState(false);
  const [scheduleCommentDeletingId, setScheduleCommentDeletingId] = useState("");
  const [sessionActor, setSessionActor] = useState({
    email: "",
    username: "",
    role: "",
    name: "",
  });
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [notificationCenterLoading, setNotificationCenterLoading] = useState(false);
  const [notificationCenterError, setNotificationCenterError] = useState<string | null>(null);
  const [notificationCenterLogs, setNotificationCenterLogs] = useState<TsSupportAuditTimelineItem[]>([]);
  const [notificationCenterUnreadCount, setNotificationCenterUnreadCount] = useState(0);
  const [focusedScheduleId, setFocusedScheduleId] = useState("");
  const [focusedScheduleSignal, setFocusedScheduleSignal] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogLoading, setConfirmDialogLoading] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogDescription, setConfirmDialogDescription] = useState("");
  const [confirmDialogConfirmText, setConfirmDialogConfirmText] = useState("Lanjutkan");
  const [confirmDialogDestructive, setConfirmDialogDestructive] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<null | (() => Promise<void> | void)>(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textDialogLoading, setTextDialogLoading] = useState(false);
  const [textDialogTitle, setTextDialogTitle] = useState("");
  const [textDialogDescription, setTextDialogDescription] = useState("");
  const [textDialogLabel, setTextDialogLabel] = useState("Input");
  const [textDialogPlaceholder, setTextDialogPlaceholder] = useState("");
  const [textDialogSubmitText, setTextDialogSubmitText] = useState("Simpan");
  const [textDialogMultiline, setTextDialogMultiline] = useState(false);
  const [textDialogValue, setTextDialogValue] = useState("");
  const [textDialogAction, setTextDialogAction] = useState<null | ((value: string) => Promise<void> | void)>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDialogSaving, setRescheduleDialogSaving] = useState(false);
  const [rescheduleTargetEntry, setRescheduleTargetEntry] = useState<TsSupportEntry | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [mobileAgendaExpandedId, setMobileAgendaExpandedId] = useState<string | null>(null);
  const [editingOriginalXray, setEditingOriginalXray] = useState({
    preXray: "",
    preXrayFileId: "",
    postXray: "",
    postXrayFileId: "",
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [nowTick, setNowTick] = useState(() => new Date());
  const [isSystemDark, setIsSystemDark] = useState(false);
  const previousEntriesRef = useRef<TsSupportEntry[]>([]);
  const suppressNextDiffNotificationRef = useRef(false);
  const jadwalSectionRef = useRef<HTMLDivElement | null>(null);
  const asistensiSectionRef = useRef<HTMLDivElement | null>(null);
  const timSectionRef = useRef<HTMLDivElement | null>(null);
  const lainnyaSectionRef = useRef<HTMLDivElement | null>(null);
  const activityToastPollingRef = useRef(false);
  const focusedScheduleClearTimerRef = useRef<number | null>(null);
  const deepLinkHandledScheduleIdRef = useRef("");

  const deepLinkScheduleId = useMemo(
    () => String(searchParams.get("scheduleId") || "").trim(),
    [searchParams]
  );

  const prePreviewUrl = useObjectPreview(preFile);
  const postPreviewUrl = useObjectPreview(postFile);
  const editPreUploadPreviewUrl = useObjectPreview(editPreFile);
  const editPostUploadPreviewUrl = useObjectPreview(editPostFile);

  const editPrePreviewUrl = editPreUploadPreviewUrl || resolveImageUrl(editForm.preXray, editForm.preXrayFileId);
  const editPostPreviewUrl =
    editPostUploadPreviewUrl || resolveImageUrl(editForm.postXray, editForm.postXrayFileId);
  const isReadonlyMode = readonlyOnly || panelMode === "readonly";

  const readPendingCreatesFromStorage = useCallback((): PendingReadonlyCreate[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(PENDING_CREATE_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as PendingReadonlyCreate[]) : [];
    } catch {
      return [];
    }
  }, []);

  const writePendingCreatesToStorage = useCallback((items: PendingReadonlyCreate[]) => {
    if (typeof window === "undefined") return;
    if (!items.length) {
      window.localStorage.removeItem(PENDING_CREATE_QUEUE_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_CREATE_QUEUE_KEY, JSON.stringify(items));
  }, []);

  const enqueuePendingCreate = useCallback(
    (item: PendingReadonlyCreate) => {
      const current = readPendingCreatesFromStorage();
      writePendingCreatesToStorage([...current, item]);
    },
    [readPendingCreatesFromStorage, writePendingCreatesToStorage]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawEntries = window.localStorage.getItem(ENTRIES_CACHE_KEY);
      if (rawEntries) {
        const parsed = JSON.parse(rawEntries) as unknown;
        const normalized = normalizeRows(parsed);
        if (normalized.length > 0) {
          setEntries(normalized);
          previousEntriesRef.current = normalized;
        }
      }

      const rawTeam = window.localStorage.getItem(TEAM_CACHE_KEY);
      if (rawTeam) {
        const parsedTeam = JSON.parse(rawTeam) as unknown;
        const normalizedTeam = normalizeTeamRows(parsedTeam);
        if (normalizedTeam.length > 0) setTeamMembers(normalizedTeam);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TEAM_CACHE_KEY, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawFilters = window.localStorage.getItem(MANAGE_FILTER_KEY);
      if (rawFilters) {
        const parsed = JSON.parse(rawFilters) as {
          selectedDateKey?: string;
          agendaDesktopViewMode?: AgendaDesktopViewMode;
          staffDesktopViewMode?: TeamRosterViewMode;
        };
        if (parsed.selectedDateKey) setSelectedDateKey(parsed.selectedDateKey);
        if (parsed.agendaDesktopViewMode === "card" || parsed.agendaDesktopViewMode === "table") {
          setAgendaDesktopViewMode(parsed.agendaDesktopViewMode);
        }
        if (parsed.staffDesktopViewMode === "card" || parsed.staffDesktopViewMode === "table") {
          setStaffDesktopViewMode(parsed.staffDesktopViewMode);
        }
      }

      const rawDraft = window.localStorage.getItem(MANAGE_CREATE_DRAFT_KEY);
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft) as Partial<TsSupportForm>;
        setForm((prev) => ({
          ...prev,
          tanggalOperasi: parsedDraft.tanggalOperasi || prev.tanggalOperasi,
          jamOperasi: parsedDraft.jamOperasi || "",
          namaDokter: parsedDraft.namaDokter || "",
          jenisTindakan: parsedDraft.jenisTindakan || "",
          rumahSakit: parsedDraft.rumahSakit || "",
          tsMembantu: parsedDraft.tsMembantu || "",
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
      MANAGE_FILTER_KEY,
      JSON.stringify({
        selectedDateKey,
        agendaDesktopViewMode,
        staffDesktopViewMode,
      })
    );
  }, [selectedDateKey, agendaDesktopViewMode, staffDesktopViewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MANAGE_CREATE_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  const openImagePreview = (url: string, title: string) => {
    if (!url) return;
    setImagePreview({ url, title });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateMode = () => setIsSystemDark(media.matches);
    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(new Date());
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(
    () => () => {
      if (focusedScheduleClearTimerRef.current) {
        window.clearTimeout(focusedScheduleClearTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    const loadSessionActor = async () => {
      try {
        const res = await fetch("/api/ts-support-auth/session", { cache: "no-store" });
        const parsed = (await res.json()) as {
          status?: string;
          user?: { email?: string; username?: string; role?: string; name?: string };
        };
        if (!active || !res.ok || parsed?.status !== "success" || !parsed.user) return;
        const email = String(parsed.user.email || "").trim().toLowerCase();
        const fallbackUsername =
          email.split("@")[0] ||
          String(parsed.user.name || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ".");
        setSessionActor({
          email,
          username: String(parsed.user.username || fallbackUsername || "").trim().toLowerCase(),
          role: String(parsed.user.role || "").trim().toLowerCase(),
          name: String(parsed.user.name || "").trim(),
        });
      } catch (error) {
        console.error("[TS_SUPPORT_SESSION_ACTOR_ERROR]", error);
      }
    };
    void loadSessionActor();
    return () => {
      active = false;
    };
  }, []);

  const fetchActivityLogsFromGas = useCallback(
    async (params: {
      limit?: number;
      sinceMs?: number;
      dateKey?: string;
      entityType?: "schedule" | "team";
      entityId?: string;
      auditAction?: string;
    }) => {
      const searchParams = new URLSearchParams({
        action: "getActivities",
        limit: String(params.limit || 120),
      });
      if (params.sinceMs && Number.isFinite(params.sinceMs)) {
        searchParams.set("sinceMs", String(params.sinceMs));
      }
      if (params.dateKey) searchParams.set("dateKey", params.dateKey);
      if (params.entityType) searchParams.set("entityType", params.entityType);
      if (params.entityId) searchParams.set("entityId", params.entityId);
      if (params.auditAction) searchParams.set("auditAction", params.auditAction);

      const res = await fetch(`/api/asistensi/ts-support?${searchParams.toString()}`, {
        cache: "no-store",
      });
      const text = await res.text();
      const parsed = parseJsonSafe(text) as { status?: string; message?: string; data?: unknown } | null;

      if (!res.ok) {
        throw new Error(parsed?.message || `Gagal memuat aktivitas (${res.status})`);
      }
      if (!parsed || parsed.status === "error") {
        throw new Error(parsed?.message || "Data aktivitas tidak valid.");
      }

      return Array.isArray(parsed.data) ? (parsed.data as TsSupportAuditTimelineItem[]) : [];
    },
    []
  );

  const fetchScheduleCommentCounts = useCallback(
    async (silentError = true) => {
      try {
        const logs = await fetchActivityLogsFromGas({
          entityType: "schedule",
          auditAction: "comment_schedule",
          limit: 1000,
        });

        const countMap: Record<string, number> = {};
        logs.forEach((item) => {
          const entryId = String(item.entityId || "").trim();
          if (!entryId) return;
          countMap[entryId] = (countMap[entryId] || 0) + 1;
        });

        setScheduleCommentCountByEntryId(countMap);
      } catch (error) {
        console.error("[TS_SUPPORT_COMMENT_BADGE_ERROR]", error);
        if (!silentError) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat jumlah komentar."
          );
        }
      }
    },
    [fetchActivityLogsFromGas]
  );

  const fetchNotificationCenter = useCallback(async (silentError = false) => {
    setNotificationCenterLoading(true);
    setNotificationCenterError(null);

    try {
      const logs = await fetchActivityLogsFromGas({
        limit: 200,
        entityType: "schedule",
      });
      setNotificationCenterLogs(logs);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUDIT_LAST_SEEN_KEY, String(logs[0]?.createdAt || new Date().toISOString()));
        setNotificationCenterUnreadCount(0);
      }
    } catch (error) {
      console.error("[TS_SUPPORT_NOTIFICATION_CENTER_ERROR]", error);
      const message = (error as Error)?.message || "Gagal memuat ringkasan notifikasi.";
      setNotificationCenterError(message);
      if (!silentError) toast.error(message);
    } finally {
      setNotificationCenterLoading(false);
    }
  }, [fetchActivityLogsFromGas]);

  const openNotificationCenter = useCallback(async () => {
    setNotificationCenterOpen(true);
    await fetchNotificationCenter(false);
  }, [fetchNotificationCenter]);

  const refreshNotificationCenterUnreadCount = useCallback(async () => {
    if (typeof window === "undefined") return;

    const rawLastSeen = String(window.localStorage.getItem(AUDIT_LAST_SEEN_KEY) || "").trim();
    if (!rawLastSeen) {
      window.localStorage.setItem(AUDIT_LAST_SEEN_KEY, new Date().toISOString());
      setNotificationCenterUnreadCount(0);
      return;
    }

    const sinceMs = toTimestampMs(rawLastSeen);
    if (!sinceMs) {
      window.localStorage.setItem(AUDIT_LAST_SEEN_KEY, new Date().toISOString());
      setNotificationCenterUnreadCount(0);
      return;
    }

    try {
      const logs = await fetchActivityLogsFromGas({
        entityType: "schedule",
        sinceMs,
        limit: 500,
      });
      setNotificationCenterUnreadCount(logs.length);
    } catch (error) {
      console.error("[TS_SUPPORT_UNREAD_ACTIVITY_BADGE_ERROR]", error);
    }
  }, [fetchActivityLogsFromGas]);

  const fetchEntries = useCallback(async (options?: { silentError?: boolean }) => {
    const silentError = options?.silentError ?? false;
    setLoading(true);
    try {
      const res = await fetch("/api/asistensi/ts-support", { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        const errorJson = parseJsonSafe(text) as { message?: string; error?: string } | null;
        throw new Error(errorJson?.message || errorJson?.error || `Gagal mengambil data (${res.status})`);
      }

      const json = parseJsonSafe(text);
      if (!json) {
        throw new Error(`Response bukan JSON valid: ${text.slice(0, 120)}`);
      }

      const obj = json as { status?: string; message?: string; data?: unknown };
      if (obj.status === "error") {
        throw new Error(obj.message || "App Script mengembalikan error");
      }
      const normalizedEntries = normalizeRows(obj.data ?? json);
      previousEntriesRef.current = normalizedEntries;
      setEntries(normalizedEntries);
    } catch (err) {
      console.error(err);
      if (!silentError) {
        toast.error((err as Error).message || "Gagal memuat data TS Support");
      }
    } finally {
      suppressNextDiffNotificationRef.current = false;
      setLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async (options?: { silentError?: boolean }) => {
    const silentError = options?.silentError ?? false;
    setTeamLoading(true);
    try {
      const res = await fetch("/api/asistensi/ts-support?action=getTeamTs", { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) {
        const errorJson = parseJsonSafe(text) as { message?: string; error?: string } | null;
        throw new Error(errorJson?.message || errorJson?.error || `Gagal mengambil data Team TS (${res.status})`);
      }
      const json = parseJsonSafe(text);
      if (!json) throw new Error(`Response Team TS bukan JSON valid: ${text.slice(0, 120)}`);
      const obj = json as { status?: string; message?: string; data?: unknown };
      if (obj.status === "error") throw new Error(obj.message || "App Script error saat mengambil Team TS");
      setTeamMembers(normalizeTeamRows(obj.data ?? json));
    } catch (error) {
      console.error(error);
      if (!silentError) {
        toast.error((error as Error).message || "Gagal memuat data Team TS");
      }
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const isAutoRefreshPaused = useCallback(() => {
    if (typeof document === "undefined") return false;
    if (
      saving ||
      editSaving ||
      teamSaving ||
      syncingOfflineQueue ||
      scheduleCommentSaving ||
      scheduleCommentDeletingId !== "" ||
      rescheduleDialogSaving
    ) {
      return true;
    }

    const activeElement = document.activeElement;
    return isTextEditingElement(activeElement);
  }, [
    editSaving,
    rescheduleDialogSaving,
    saving,
    scheduleCommentDeletingId,
    scheduleCommentSaving,
    syncingOfflineQueue,
    teamSaving,
  ]);

  useEffect(() => {
    void fetchEntries();
    void fetchTeamMembers();
  }, [fetchEntries, fetchTeamMembers]);

  useEffect(() => {
    void fetchScheduleCommentCounts(true);
  }, [fetchScheduleCommentCounts]);

  useEffect(() => {
    if (!notificationCenterOpen) return;
    const intervalId = window.setInterval(() => {
      if (isAutoRefreshPaused()) return;
      void fetchNotificationCenter(true);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchNotificationCenter, isAutoRefreshPaused, notificationCenterOpen]);

  useEffect(() => {
    if (notificationCenterOpen) {
      setNotificationCenterUnreadCount(0);
      return;
    }

    void refreshNotificationCenterUnreadCount();
    const intervalId = window.setInterval(() => {
      if (isAutoRefreshPaused()) return;
      void refreshNotificationCenterUnreadCount();
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshPaused, notificationCenterOpen, refreshNotificationCenterUnreadCount]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isAutoRefreshPaused()) return;
      void fetchEntries({ silentError: true });
      void fetchTeamMembers({ silentError: true });
      void fetchScheduleCommentCounts(true);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchEntries, fetchScheduleCommentCounts, fetchTeamMembers, isAutoRefreshPaused]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      return (
        entry.namaDokter.toLowerCase().includes(q) ||
        entry.jenisTindakan.toLowerCase().includes(q) ||
        entry.rumahSakit.toLowerCase().includes(q) ||
        entry.tsMembantu.toLowerCase().includes(q) ||
        formatStatusLabel(entry.status).toLowerCase().includes(q)
      );
    });
  }, [entries, query]);

  const manageScopedEntries = useMemo(() => filteredEntries, [filteredEntries]);

  const teamStatusByName = useMemo(() => {
    const map = new Map<string, TeamAvailabilityStatus>();
    for (const member of teamMembers) {
      const key = member.nama.trim().toLowerCase();
      if (!key) continue;
      map.set(key, member.status);
    }
    return map;
  }, [teamMembers]);

  const hasUnavailableAssignedTs = useCallback(
    (tsNames: string) =>
      tsNames
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean)
        .some((name) => {
          const status = teamStatusByName.get(name);
          return Boolean(status && status !== "aktif");
        }),
    [teamStatusByName]
  );

  const eventCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of manageScopedEntries) {
      if (!entry.tanggalKey) continue;
      map.set(entry.tanggalKey, (map.get(entry.tanggalKey) || 0) + 1);
    }
    return map;
  }, [manageScopedEntries]);

  const selectedDayAgendaBase = useMemo(() => {
    const scopedByDate = manageScopedEntries.filter((entry) => entry.tanggalKey === selectedDateKey);

    return scopedByDate.sort((first, second) => {
      if (first.tanggalKey !== second.tanggalKey) return (first.tanggalKey || "").localeCompare(second.tanggalKey || "");
      return toMinutes(first.jamOperasi) - toMinutes(second.jamOperasi);
    });
  }, [manageScopedEntries, selectedDateKey]);

  const selectedDayAgenda = useMemo(() => selectedDayAgendaBase, [selectedDayAgendaBase]);

  useEffect(() => {
    if (selectedDayAgenda.length === 0) {
      setMobileAgendaExpandedId(null);
      return;
    }
    const hasExpanded = selectedDayAgenda.some((item) => item.id === mobileAgendaExpandedId);
    if (!hasExpanded) {
      setMobileAgendaExpandedId(selectedDayAgenda[0]?.id || null);
    }
  }, [mobileAgendaExpandedId, selectedDayAgenda]);

  const selectedDateSchedules = useMemo(() => {
    return manageScopedEntries
      .filter((entry) => entry.tanggalKey === selectedDateKey)
      .sort((a, b) => toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi));
  }, [manageScopedEntries, selectedDateKey]);

  const tsAssignmentOptions = useMemo(() => {
    const map = new Map<string, TeamAvailabilityStatus>();
    for (const member of teamMembers) {
      const canAssist =
        member.role === "ts" || member.role === "admin" || member.role === "logistik";
      if (!canAssist) continue;
      const name = member.nama.trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, member.status);
    }
    return Array.from(map.entries())
      .map(([name, status]) => ({ name, status }))
      .sort((first, second) => first.name.localeCompare(second.name, "id"));
  }, [teamMembers]);

  const eventDays = useMemo(
    () =>
      Array.from(eventCountByDate.keys())
        .map((key) => dateFromKey(key))
        .filter((value): value is Date => Boolean(value)),
    [eventCountByDate]
  );

  const selectedDate = useMemo(() => dateFromKey(selectedDateKey), [selectedDateKey]);
  const currentDateKey = useMemo(() => toDateKey(nowTick), [nowTick]);
  const currentMinutes = useMemo(() => nowTick.getHours() * 60 + nowTick.getMinutes(), [nowTick]);
  const mobileWeekDateItems = useMemo(() => {
    const baseDate = selectedDate || new Date(`${selectedDateKey}T00:00:00`);
    if (Number.isNaN(baseDate.getTime())) return [];

    const start = new Date(baseDate);
    const offsetToMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offsetToMonday);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDateKey(date);
      const dayLabel = new Intl.DateTimeFormat("id-ID", { weekday: "short" })
        .format(date)
        .replace(".", "")
        .slice(0, 3)
        .toUpperCase();

      return {
        key,
        dayLabel,
        dateNumber: date.getDate(),
        count: eventCountByDate.get(key) || 0,
        isToday: key === currentDateKey,
      };
    });
  }, [currentDateKey, eventCountByDate, selectedDate, selectedDateKey]);

  const totalEntriesSorted = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (a.tanggalKey !== b.tanggalKey) return (b.tanggalKey || "").localeCompare(a.tanggalKey || "");
        return toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi);
      }),
    [entries]
  );

  const todayEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.tanggalKey === currentDateKey)
        .sort((a, b) => toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi)),
    [entries, currentDateKey]
  );

  const todayNeedsAttentionEntries = useMemo(
    () =>
      todayEntries.filter(
        (entry) => isEntryNeedingAttention(entry) || hasUnavailableAssignedTs(entry.tsMembantu)
      ),
    [hasUnavailableAssignedTs, todayEntries]
  );

  const todaySelesaiEntries = useMemo(
    () => todayEntries.filter((entry) => entry.status === "selesai"),
    [todayEntries]
  );

  const needsAttentionEntries = useMemo(
    () =>
      entries
        .filter((entry) => isEntryNeedingAttention(entry) || hasUnavailableAssignedTs(entry.tsMembantu))
        .sort((a, b) => {
          if (a.tanggalKey !== b.tanggalKey) return (b.tanggalKey || "").localeCompare(a.tanggalKey || "");
          return toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi);
        }),
    [entries, hasUnavailableAssignedTs]
  );

  const selesaiEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.status === "selesai")
        .sort((a, b) => {
          if (a.tanggalKey !== b.tanggalKey) return (b.tanggalKey || "").localeCompare(a.tanggalKey || "");
          return toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi);
        }),
    [entries]
  );

  const toQuickViewItems = useCallback(
    (sourceEntries: TsSupportEntry[]): TsSummaryQuickViewItem[] =>
      sourceEntries.map((entry) => ({
        id: entry.id,
        dokter: entry.namaDokter,
        tindakan: entry.jenisTindakan,
        rumahSakit: entry.rumahSakit,
        jam: entry.jamOperasi,
        tanggalLabel: formatDateLabel(entry.tanggalKey),
        tsMembantu: entry.tsMembantu || "TS Belum Diisi",
        statusLabel: formatStatusLabel(entry.status),
        notes: entry.notes,
      })),
    []
  );

  const summaryQuickViewData = useMemo(() => {
    if (!summaryQuickViewKey) return null;
    const quickViewTotalEntries = isReadonlyMode ? todayEntries : totalEntriesSorted;
    const quickViewNeedsAttentionEntries = isReadonlyMode ? todayNeedsAttentionEntries : needsAttentionEntries;
    const quickViewSelesaiEntries = isReadonlyMode ? todaySelesaiEntries : selesaiEntries;

    if (summaryQuickViewKey === "today") {
      return {
        title: "Agenda Hari Ini",
        subtitle: formatDateLabel(currentDateKey),
        items: toQuickViewItems(todayEntries),
      };
    }
    if (summaryQuickViewKey === "needs_attention") {
      return {
        title: "Jadwal Butuh Tindakan",
        subtitle: isReadonlyMode
          ? `Tanggal ${formatDateLabel(currentDateKey)}`
          : "Status tunda/reschedule atau data belum lengkap",
        items: toQuickViewItems(quickViewNeedsAttentionEntries),
      };
    }
    if (summaryQuickViewKey === "selesai") {
      return {
        title: "Jadwal Selesai",
        subtitle: isReadonlyMode ? `Tanggal ${formatDateLabel(currentDateKey)}` : "Daftar operasi yang sudah selesai",
        items: toQuickViewItems(quickViewSelesaiEntries),
      };
    }
    return {
      title: "Total Jadwal Operasi",
      subtitle: isReadonlyMode ? `Tanggal ${formatDateLabel(currentDateKey)}` : "Semua data jadwal operasi",
      items: toQuickViewItems(quickViewTotalEntries),
    };
  }, [
    isReadonlyMode,
    summaryQuickViewKey,
    currentDateKey,
    todayEntries,
    todayNeedsAttentionEntries,
    todaySelesaiEntries,
    needsAttentionEntries,
    selesaiEntries,
    totalEntriesSorted,
    toQuickViewItems,
  ]);

  const managementSummary = useMemo(() => {
    let missingTs = 0;
    let missingXray = 0;
    let needsAttention = 0;
    let unavailableTs = 0;

    for (const entry of entries) {
      const missingTsValue = isMissingTs(entry.tsMembantu);
      const missingXrayValue =
        !hasXrayAsset(entry.preXray, entry.preXrayFileId) ||
        !hasXrayAsset(entry.postXray, entry.postXrayFileId);
      const unavailableTsValue = hasUnavailableAssignedTs(entry.tsMembantu);
      const needAttention =
        missingTsValue ||
        missingXrayValue ||
        unavailableTsValue ||
        entry.status === "tunda" ||
        entry.status === "reschedule";
      if (missingTsValue) missingTs += 1;
      if (missingXrayValue) missingXray += 1;
      if (unavailableTsValue) unavailableTs += 1;
      if (needAttention) needsAttention += 1;
    }

    return { missingTs, missingXray, unavailableTs, needsAttention };
  }, [entries, hasUnavailableAssignedTs]);

  const readOnlySchedules = useMemo(
    () =>
      sortEntriesByDateTime(entries)
        .map((entry) => ({
          id: entry.id,
          tanggalKey: entry.tanggalKey,
          tanggalLabel: formatDateLabel(entry.tanggalKey),
          jam: entry.jamOperasi,
          dokter: entry.namaDokter,
          tindakan: entry.jenisTindakan,
          rumahSakit: entry.rumahSakit,
          tsMembantu: entry.tsMembantu,
          status: entry.status,
          statusLabel: formatStatusLabel(entry.status),
          preXrayUrl: resolveImageUrl(entry.preXray, entry.preXrayFileId),
          postXrayUrl: resolveImageUrl(entry.postXray, entry.postXrayFileId),
          preXrayPreviewUrl:
            resolvePreviewUrl(entry.preXray, entry.preXrayFileId) ||
            resolveImageUrl(entry.preXray, entry.preXrayFileId),
          postXrayPreviewUrl:
            resolvePreviewUrl(entry.postXray, entry.postXrayFileId) ||
            resolveImageUrl(entry.postXray, entry.postXrayFileId),
          isOngoingNow:
            canShowOngoingStatus(entry.status) &&
            isOperationHappeningNow(entry.tanggalKey, entry.jamOperasi, currentDateKey, currentMinutes),
        })),
    [currentDateKey, currentMinutes, entries]
  );

  const summary = useMemo(() => {
    const byStatus: Record<ScheduleStatus, number> = {
      jadwal_baru: 0,
      tunda: 0,
      batal: 0,
      reschedule: 0,
      selesai: 0,
    };

    for (const entry of entries) byStatus[entry.status] += 1;

    return {
      total: entries.length,
      filtered: manageScopedEntries.length,
      todayAgendaTotal: selectedDayAgendaBase.length,
      todayAgendaVisible: selectedDayAgenda.length,
      byStatus,
    };
  }, [entries, manageScopedEntries.length, selectedDayAgenda.length, selectedDayAgendaBase.length]);

  const selectedDateSelesaiCount = useMemo(
    () => selectedDayAgendaBase.filter((entry) => entry.status === "selesai").length,
    [selectedDayAgendaBase]
  );

  const selectedDateCommentSummary = useMemo(() => {
    const agendaWithComments = selectedDayAgendaBase.filter(
      (entry) => Number(scheduleCommentCountByEntryId[entry.id] || 0) > 0
    );
    const totalComments = agendaWithComments.reduce(
      (sum, entry) => sum + Number(scheduleCommentCountByEntryId[entry.id] || 0),
      0
    );
    return {
      agendaCount: agendaWithComments.length,
      totalComments,
    };
  }, [scheduleCommentCountByEntryId, selectedDayAgendaBase]);

  const summaryCards = useMemo(
    () =>
      isReadonlyMode
        ? {
            total: todayEntries.length,
            today: todayEntries.length,
            needsAttention: todayNeedsAttentionEntries.length,
            selesai: todaySelesaiEntries.length,
          }
        : {
            total: summary.total,
            today: todayEntries.length,
            needsAttention: managementSummary.needsAttention,
            selesai: selectedDateSelesaiCount,
          },
    [
      isReadonlyMode,
      managementSummary.needsAttention,
      summary.total,
      selectedDateSelesaiCount,
      todayEntries.length,
      todayNeedsAttentionEntries.length,
      todaySelesaiEntries.length,
    ]
  );

  const notificationScheduleLogs = useMemo(
    () => notificationCenterLogs.filter((item) => item.entityType === "schedule"),
    [notificationCenterLogs]
  );

  const notificationCenterItems = useMemo(
    () => notificationScheduleLogs.slice(0, 50),
    [notificationScheduleLogs]
  );
  const sessionActorIdentity = useMemo(
    () => String(sessionActor.email || sessionActor.username || "").trim().toLowerCase(),
    [sessionActor.email, sessionActor.username]
  );
  const scheduleEntryById = useMemo(() => {
    const map = new Map<string, TsSupportEntry>();
    entries.forEach((entry) => {
      const key = String(entry.id || "").trim();
      if (!key) return;
      map.set(key, entry);
    });
    return map;
  }, [entries]);

  const getNotificationItemMeta = useCallback((item: TsSupportAuditTimelineItem) => {
    const kind = classifyScheduleAuditSummaryKind(item) || "update";
    const commentText = getAuditCommentText(item);
    const beforeStatus = parseAuditStatusValue(item.before);
    const afterStatus = parseAuditStatusValue(item.after);
    const { context } = getAuditDoctorHospitalContext(item);

    if (kind === "new") {
      return {
        label: "Jadwal baru ditambahkan",
        detail: context,
        dotClass: "bg-emerald-500 dark:bg-emerald-300",
      };
    }
    if (kind === "delete") {
      return {
        label: "Jadwal dihapus",
        detail: context || `ID: ${item.entityId}`,
        dotClass: "bg-rose-500 dark:bg-rose-300",
      };
    }
    if (kind === "status") {
      const fromStatus =
        beforeStatus && beforeStatus in STATUS_CONFIG
          ? formatStatusLabel(beforeStatus as ScheduleStatus)
          : "-";
      const toStatus =
        afterStatus && afterStatus in STATUS_CONFIG
          ? formatStatusLabel(afterStatus as ScheduleStatus)
          : "-";
      return {
        label: "Status jadwal diubah",
        detail: `${fromStatus} → ${toStatus}${context ? ` • ${context}` : ""}`,
        dotClass: "bg-amber-500 dark:bg-amber-300",
      };
    }
    if (kind === "comment") {
      return {
        label: "Komentar baru ditambahkan",
        detail: commentText || context || "-",
        dotClass: "bg-indigo-500 dark:bg-indigo-300",
      };
    }
    if (kind === "upload") {
      return {
        label: "Foto X-ray diperbarui",
        detail: commentText || context || "-",
        dotClass: "bg-cyan-500 dark:bg-cyan-300",
      };
    }

    return {
      label: "Data jadwal diperbarui",
      detail: commentText || context || "-",
      dotClass: "bg-slate-500 dark:bg-slate-300",
    };
  }, []);

  const getNotificationAgendaMeta = useCallback(
    (item: TsSupportAuditTimelineItem) => {
      const entry = scheduleEntryById.get(String(item.entityId || "").trim());
      if (!entry) {
        return {
          agendaLabel: "",
          agendaDateLabel: "",
        };
      }
      return {
        agendaLabel: String(entry.jenisTindakan || "").trim(),
        agendaDateLabel: formatDateLabel(entry.tanggalKey),
      };
    },
    [scheduleEntryById]
  );

  const setFocusedScheduleWithTimeout = useCallback((scheduleId: string) => {
    const normalizedId = String(scheduleId || "").trim();
    if (!normalizedId) return;
    setFocusedScheduleId(normalizedId);
    setFocusedScheduleSignal(Date.now());
    if (focusedScheduleClearTimerRef.current) {
      window.clearTimeout(focusedScheduleClearTimerRef.current);
    }
    focusedScheduleClearTimerRef.current = window.setTimeout(() => {
      setFocusedScheduleId("");
      focusedScheduleClearTimerRef.current = null;
    }, 5000);
  }, []);

  const scrollToManageScheduleCard = useCallback((scheduleId: string) => {
    if (typeof document === "undefined") return;
    const normalizedId = String(scheduleId || "").trim();
    if (!normalizedId) return;
    const selectorId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(normalizedId)
        : normalizedId.replace(/"/g, '\\"');
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-schedule-entry-id="${selectorId}"]`)
    );
    if (!candidates.length) return;
    const visibleTarget = candidates.find((element) => element.offsetParent !== null) || candidates[0];
    visibleTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleNotificationItemClick = useCallback(
    (item: TsSupportAuditTimelineItem) => {
      const scheduleId = String(item.entityId || "").trim();
      if (!scheduleId) return;

      const targetEntry = scheduleEntryById.get(scheduleId);
      if (targetEntry) {
        setSelectedDateKey(targetEntry.tanggalKey);
        setMobileAgendaExpandedId(scheduleId);
      }
      setFocusedScheduleWithTimeout(scheduleId);
      setNotificationCenterOpen(false);

      if (isReadonlyMode) return;
      window.setTimeout(() => {
        scrollToManageScheduleCard(scheduleId);
      }, 180);
    },
    [isReadonlyMode, scheduleEntryById, scrollToManageScheduleCard, setFocusedScheduleWithTimeout]
  );

  useEffect(() => {
    if (!deepLinkScheduleId) {
      deepLinkHandledScheduleIdRef.current = "";
      return;
    }
    if (deepLinkHandledScheduleIdRef.current === deepLinkScheduleId) return;

    const targetEntry = scheduleEntryById.get(deepLinkScheduleId);
    if (!targetEntry) return;

    if (targetEntry.tanggalKey && targetEntry.tanggalKey !== selectedDateKey) {
      setSelectedDateKey(targetEntry.tanggalKey);
    }
    setMobileAgendaExpandedId(deepLinkScheduleId);
    setFocusedScheduleWithTimeout(deepLinkScheduleId);
    deepLinkHandledScheduleIdRef.current = deepLinkScheduleId;

    if (isReadonlyMode) return;

    const scrollNow = () => {
      scrollToManageScheduleCard(deepLinkScheduleId);
    };
    const firstTimer = window.setTimeout(scrollNow, 220);
    const secondTimer = window.setTimeout(scrollNow, 700);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [
    deepLinkScheduleId,
    isReadonlyMode,
    scheduleEntryById,
    scrollToManageScheduleCard,
    selectedDateKey,
    setFocusedScheduleWithTimeout,
  ]);

  const scheduleCommentById = useMemo(() => {
    const map = new Map<string, TsSupportAuditTimelineItem>();
    scheduleComments.forEach((item) => {
      const key = String(item.id || "").trim();
      if (!key) return;
      map.set(key, item);
    });
    return map;
  }, [scheduleComments]);

  const scheduleCommentsChronological = useMemo(
    () =>
      [...scheduleComments].sort(
        (first, second) =>
          new Date(String(first.createdAt || "")).getTime() -
          new Date(String(second.createdAt || "")).getTime()
      ),
    [scheduleComments]
  );

  const scheduleCommentReplyTarget = useMemo(
    () =>
      scheduleComments.find((item) => item.id === scheduleCommentReplyToId) || null,
    [scheduleCommentReplyToId, scheduleComments]
  );

  const scheduleCommentEntry = useMemo(
    () => entries.find((entry) => entry.id === scheduleCommentEntryId) || null,
    [entries, scheduleCommentEntryId]
  );

  const scheduleCommentReplyTargetLabel = useMemo(() => {
    if (!scheduleCommentReplyTarget) return "";
    const actorName =
      String(scheduleCommentReplyTarget.actor?.name || "").trim() ||
      String(scheduleCommentReplyTarget.actor?.username || "").trim() ||
      String(scheduleCommentReplyTarget.actor?.email || "").trim() ||
      "User";
    return actorName;
  }, [scheduleCommentReplyTarget]);

  const isOwnScheduleComment = useCallback(
    (item: TsSupportAuditTimelineItem) => {
      const actorEmail = String(item.actor?.email || "").trim().toLowerCase();
      const actorUsername = String(item.actor?.username || "").trim().toLowerCase();
      if (sessionActor.email && actorEmail && sessionActor.email === actorEmail) return true;
      if (sessionActor.username && actorUsername && sessionActor.username === actorUsername) return true;
      return false;
    },
    [sessionActor.email, sessionActor.username]
  );

  const canDeleteScheduleComment = useCallback(
    (item: TsSupportAuditTimelineItem) => {
      if (!item || !item.id) return false;
      if (sessionActor.role === "admin") return true;
      return isOwnScheduleComment(item);
    },
    [isOwnScheduleComment, sessionActor.role]
  );

  const notifyLiveActivityToasts = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!sessionActorIdentity || activityToastPollingRef.current) return;
    if (isAutoRefreshPaused()) return;

    const storageKey = `${ACTIVITY_TOAST_LAST_SEEN_KEY}:${sessionActorIdentity}`;
    const defaultSeen = new Date().toISOString();
    const rawLastSeen =
      window.localStorage.getItem(storageKey) ||
      window.localStorage.getItem(AUDIT_LAST_SEEN_KEY) ||
      "";

    if (!rawLastSeen) {
      window.localStorage.setItem(storageKey, defaultSeen);
      return;
    }

    const sinceMs = toTimestampMs(rawLastSeen);
    if (!sinceMs) {
      window.localStorage.setItem(storageKey, defaultSeen);
      return;
    }

    activityToastPollingRef.current = true;
    try {
      const logs = await fetchActivityLogsFromGas({
        entityType: "schedule",
        sinceMs,
        limit: 200,
      });
      if (!logs.length) return;

      const orderedLogs = [...logs].sort(
        (first, second) => toTimestampMs(first.createdAt) - toTimestampMs(second.createdAt)
      );
      let newestSeenMs = sinceMs;
      let newestSeenIso = rawLastSeen;

      orderedLogs.forEach((item) => {
        const createdAtMs = toTimestampMs(item.createdAt);
        if (createdAtMs > newestSeenMs) {
          newestSeenMs = createdAtMs;
          newestSeenIso = item.createdAt;
        }
        if (!ACTIVITY_TOAST_ACTIONS.has(item.action)) return;
        if (isOwnScheduleComment(item)) return;

        const actorLabel =
          String(item.actor?.name || "").trim() ||
          String(item.actor?.username || "").trim() ||
          String(item.actor?.email || "").trim() ||
          "User";
        const { context } = getAuditDoctorHospitalContext(item);
        const contextLabel = context ? ` • ${context}` : "";

        if (item.action === "comment_schedule") {
          toast.message(`${actorLabel} menambahkan komentar${contextLabel}`, {
            duration: 5000,
          });
          return;
        }
        if (item.action === "create_schedule") {
          toast.success(`${actorLabel} membuat jadwal baru${contextLabel}`, {
            duration: 5000,
          });
          return;
        }
        if (item.action === "delete_schedule") {
          toast.message(`${actorLabel} menghapus agenda${contextLabel}`, {
            duration: 5000,
          });
        }
      });

      if (newestSeenIso) {
        window.localStorage.setItem(storageKey, newestSeenIso);
      }
    } catch (error) {
      console.error("[TS_SUPPORT_ACTIVITY_TOAST_ERROR]", error);
    } finally {
      activityToastPollingRef.current = false;
    }
  }, [fetchActivityLogsFromGas, isAutoRefreshPaused, isOwnScheduleComment, sessionActorIdentity]);

  useEffect(() => {
    if (!sessionActorIdentity) return;

    void notifyLiveActivityToasts();
    const intervalId = window.setInterval(() => {
      void notifyLiveActivityToasts();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [notifyLiveActivityToasts, sessionActorIdentity]);

  const closeScheduleCommentsDialog = useCallback(() => {
    setScheduleCommentsOpen(false);
    setScheduleCommentsError(null);
    setScheduleCommentEntryId("");
    setScheduleComments([]);
    setScheduleCommentDraft("");
    setScheduleCommentReplyToId("");
    setScheduleCommentSaving(false);
    setScheduleCommentDeletingId("");
  }, []);

  const submitScheduleCommentFromModal = async () => {
    const targetId = String(scheduleCommentEntryId || "").trim();
    const comment = String(scheduleCommentDraft || "").trim();
    if (!targetId) return;
    if (!comment) {
      toast.error("Komentar tidak boleh kosong.");
      return;
    }
    setScheduleCommentSaving(true);
    try {
      await submitScheduleComment(targetId, comment, {
        replyTo: scheduleCommentReplyToId,
      });
      setScheduleCommentDraft("");
      setScheduleCommentReplyToId("");
    } finally {
      setScheduleCommentSaving(false);
    }
  };

  const updateForm = (field: keyof TsSupportForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditForm = (field: keyof TsSupportEditForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetCreateState = () => {
    setForm(INITIAL_FORM);
    setPreFile(null);
    setPostFile(null);
    setCreateUploadProgress(0);
    setCreateStep("data");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MANAGE_CREATE_DRAFT_KEY);
    }
  };

  const isCreateStepValid = (step: CreateScheduleStep) => {
    if (step === "data") {
      return Boolean(form.namaDokter.trim() && form.jenisTindakan.trim() && form.rumahSakit.trim());
    }
    return true;
  };

  const handleCreateStepNext = () => {
    if (!isCreateStepValid(createStep)) {
      toast.error("Lengkapi Dokter, Tindakan, dan Rumah Sakit terlebih dulu.");
      return;
    }
    const currentIndex = CREATE_STEP_ORDER.indexOf(createStep);
    const nextStep = CREATE_STEP_ORDER[currentIndex + 1];
    if (nextStep) setCreateStep(nextStep);
  };

  const scrollToManageSection = (tab: ManageMobileTab) => {
    setManageMobileTab(tab);
    const sectionRef =
      tab === "jadwal"
        ? jadwalSectionRef
        : tab === "asistensi"
          ? asistensiSectionRef
          : tab === "tim"
            ? timSectionRef
            : lainnyaSectionRef;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetEditState = () => {
    setEditOpen(false);
    setEditingEntryId(null);
    setEditForm(INITIAL_EDIT_FORM);
    setEditPreFile(null);
    setEditPostFile(null);
    setEditingOriginalXray({ preXray: "", preXrayFileId: "", postXray: "", postXrayFileId: "" });
  };

  const handleEditFileChange = (target: "preXray" | "postXray", file: File | null) => {
    if (target === "preXray") {
      setEditPreFile(file);
      if (file) updateEditForm("preXrayFileId", "");
    }
    if (target === "postXray") {
      setEditPostFile(file);
      if (file) updateEditForm("postXrayFileId", "");
    }
  };

  const clearEditFile = (target: "preXray" | "postXray") => {
    if (target === "preXray") {
      setEditPreFile(null);
      updateEditForm("preXray", "");
      updateEditForm("preXrayFileId", "");
      return;
    }
    setEditPostFile(null);
    updateEditForm("postXray", "");
    updateEditForm("postXrayFileId", "");
  };

  const openEditModal = (entry: TsSupportEntry) => {
    const originalPreXray = toStoredImageValue(entry.preXray);
    const originalPostXray = toStoredImageValue(entry.postXray);
    const originalPreXrayFileId = entry.preXrayFileId || getGoogleDriveFileId(originalPreXray);
    const originalPostXrayFileId = entry.postXrayFileId || getGoogleDriveFileId(originalPostXray);
    setEditingEntryId(entry.id);
    setEditForm({
      tanggalOperasi: entry.tanggalKey || normalizeDateKey(entry.tanggalOperasi),
      jamOperasi: entry.jamOperasi,
      namaDokter: entry.namaDokter,
      jenisTindakan: entry.jenisTindakan,
      rumahSakit: entry.rumahSakit,
      tsMembantu: entry.tsMembantu,
      notes: entry.notes,
      status: entry.status,
      preXray: originalPreXray,
      preXrayFileId: originalPreXrayFileId,
      postXray: originalPostXray,
      postXrayFileId: originalPostXrayFileId,
    });
    setEditingOriginalXray({
      preXray: originalPreXray,
      preXrayFileId: originalPreXrayFileId,
      postXray: originalPostXray,
      postXrayFileId: originalPostXrayFileId,
    });
    setEditPreFile(null);
    setEditPostFile(null);
    setEditOpen(true);
  };

  const openConfirmDialog = useCallback(
    (config: {
      title: string;
      description: string;
      confirmText?: string;
      destructive?: boolean;
      action: () => Promise<void> | void;
    }) => {
      setConfirmDialogTitle(config.title);
      setConfirmDialogDescription(config.description);
      setConfirmDialogConfirmText(config.confirmText || "Lanjutkan");
      setConfirmDialogDestructive(Boolean(config.destructive));
      setConfirmDialogAction(() => config.action);
      setConfirmDialogOpen(true);
    },
    []
  );

  const closeConfirmDialog = useCallback(() => {
    if (confirmDialogLoading) return;
    setConfirmDialogOpen(false);
    setConfirmDialogAction(null);
    setConfirmDialogTitle("");
    setConfirmDialogDescription("");
    setConfirmDialogConfirmText("Lanjutkan");
    setConfirmDialogDestructive(false);
  }, [confirmDialogLoading]);

  const executeConfirmDialog = useCallback(async () => {
    if (!confirmDialogAction) return;
    setConfirmDialogLoading(true);
    try {
      await confirmDialogAction();
      closeConfirmDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmDialogLoading(false);
    }
  }, [closeConfirmDialog, confirmDialogAction]);

  const openTextDialog = useCallback(
    (config: {
      title: string;
      description: string;
      label?: string;
      placeholder?: string;
      submitText?: string;
      multiline?: boolean;
      initialValue?: string;
      action: (value: string) => Promise<void> | void;
    }) => {
      setTextDialogTitle(config.title);
      setTextDialogDescription(config.description);
      setTextDialogLabel(config.label || "Input");
      setTextDialogPlaceholder(config.placeholder || "");
      setTextDialogSubmitText(config.submitText || "Simpan");
      setTextDialogMultiline(Boolean(config.multiline));
      setTextDialogValue(config.initialValue || "");
      setTextDialogAction(() => config.action);
      setTextDialogOpen(true);
    },
    []
  );

  const closeTextDialog = useCallback(() => {
    if (textDialogLoading) return;
    setTextDialogOpen(false);
    setTextDialogAction(null);
    setTextDialogTitle("");
    setTextDialogDescription("");
    setTextDialogLabel("Input");
    setTextDialogPlaceholder("");
    setTextDialogSubmitText("Simpan");
    setTextDialogMultiline(false);
    setTextDialogValue("");
  }, [textDialogLoading]);

  const executeTextDialog = useCallback(async () => {
    if (!textDialogAction) return;
    setTextDialogLoading(true);
    try {
      await textDialogAction(textDialogValue);
      closeTextDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setTextDialogLoading(false);
    }
  }, [closeTextDialog, textDialogAction, textDialogValue]);

  const openRescheduleDialog = useCallback((entry: TsSupportEntry) => {
    setRescheduleTargetEntry(entry);
    setRescheduleDate(entry.tanggalKey || toDateKey(new Date()));
    setRescheduleTime(entry.jamOperasi || "");
    setRescheduleDialogOpen(true);
  }, []);

  const closeRescheduleDialog = useCallback(() => {
    if (rescheduleDialogSaving) return;
    setRescheduleDialogOpen(false);
    setRescheduleTargetEntry(null);
    setRescheduleDate("");
    setRescheduleTime("");
  }, [rescheduleDialogSaving]);

  const confirmAndOpenEditModal = (entry: TsSupportEntry) => {
    if (!entry?.id) return;
    openConfirmDialog({
      title: "Edit Jadwal",
      description: "Yakin ingin membuka form edit jadwal ini?",
      confirmText: "Buka Edit",
      action: () => {
        openEditModal(entry);
      },
    });
  };

  const copyAgendaSummary = useCallback(async () => {
    if (selectedDayAgenda.length === 0) {
      toast.error("Tidak ada agenda yang bisa disalin.");
      return;
    }

    const lines = [
      `Ringkasan Agenda Operasi - ${formatDateLabel(selectedDateKey)}`,
      `Total: ${selectedDayAgenda.length} jadwal`,
      "",
      ...selectedDayAgenda.map((entry, index) => {
        const ts = entry.tsMembantu || "-";
        const status = formatStatusLabel(entry.status);
        return `${index + 1}. ${entry.jamOperasi || "--:--"} | ${entry.namaDokter || "-"} | ${
          entry.jenisTindakan || "-"
        } | ${entry.rumahSakit || "-"} | TS: ${ts} | ${status}`;
      }),
    ];
    const text = lines.join("\n");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      toast.success("Ringkasan agenda berhasil disalin.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyalin ringkasan agenda.");
    }
  }, [selectedDateKey, selectedDayAgenda]);

  const exportAgendaCsv = useCallback(() => {
    if (selectedDayAgenda.length === 0) {
      toast.error("Tidak ada agenda yang bisa di-export.");
      return;
    }

    const headers = ["Tanggal", "Jam", "Dokter", "Tindakan", "Rumah Sakit", "TS", "Status"];
    const rows = selectedDayAgenda.map((entry) =>
      [
        formatDateLabel(entry.tanggalKey),
        entry.jamOperasi,
        entry.namaDokter,
        entry.jenisTindakan,
        entry.rumahSakit,
        entry.tsMembantu,
        formatStatusLabel(entry.status),
      ]
        .map((value) => escapeCsv(value))
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenda_operasi_${selectedDateKey}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Agenda berhasil di-export.");
  }, [selectedDateKey, selectedDayAgenda]);

  const postAction = useCallback(async (payload: unknown, failPrefix: string) => {
    const res = await fetch("/api/asistensi/ts-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const json = parseJsonSafe(text) as { status?: string; message?: string } | null;
    if (!res.ok) {
      throw new Error(json?.message || `${failPrefix} (${res.status})`);
    }
    if (json && json.status === "error") {
      throw new Error(json?.message || `${failPrefix} (${res.status})`);
    }
    if (!json && text.trim() && !/^(ok|success|berhasil)$/i.test(text.trim())) {
      throw new Error(`${failPrefix}: respons tidak valid`);
    }
  }, []);

  const processPendingCreates = useCallback(async () => {
    if (syncingOfflineQueue) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const pendingItems = readPendingCreatesFromStorage();
    if (pendingItems.length === 0) return;

    setSyncingOfflineQueue(true);
    let syncedCount = 0;
    const remaining: PendingReadonlyCreate[] = [];

    for (let index = 0; index < pendingItems.length; index += 1) {
      const item = pendingItems[index];
      try {
        await postAction(item.payload, "Gagal sinkronisasi jadwal offline");
        syncedCount += 1;
      } catch (error) {
        if (isLikelyNetworkError(error)) {
          remaining.push(item, ...pendingItems.slice(index + 1));
          break;
        }
        remaining.push(item);
      }
    }

    writePendingCreatesToStorage(remaining);
    setSyncingOfflineQueue(false);

    if (syncedCount > 0) {
      toast.success(`${syncedCount} draft offline berhasil disinkronkan.`);
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries({ silentError: true });
    }
  }, [fetchEntries, postAction, readPendingCreatesFromStorage, syncingOfflineQueue, writePendingCreatesToStorage]);

  useEffect(() => {
    void processPendingCreates();
  }, [processPendingCreates]);

  useEffect(() => {
    const handleOnline = () => {
      void processPendingCreates();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processPendingCreates]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isAutoRefreshPaused()) return;
      void processPendingCreates();
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshPaused, processPendingCreates]);

  const handleCreateStaffAccount = async (
    input: TsTeamMemberSaveInput,
    account: TsTeamMemberAccountInput
  ) => {
    const mappedRole =
      input.role === "admin"
        ? "admin"
        : input.role === "logistik"
          ? "logistik"
          : input.role === "ts"
            ? "ts"
            : "sales";

    const response = await fetch("/api/ts-support-auth/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.nama,
        username: account.username,
        password: account.password,
        role: mappedRole,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { status?: string; message?: string; warning?: string }
      | null;

    if (!response.ok || result?.status === "error") {
      throw new Error(result?.message || "Gagal membuat akun login staff.");
    }

    return result;
  };

  const handleCreateTeamMember = async (
    input: TsTeamMemberSaveInput,
    file: File | null,
    account?: TsTeamMemberAccountInput
  ) => {
    setTeamSaving(true);
    let accountCreated = false;
    let accountResult: { warning?: string } | null = null;
    try {
      const profileRaw = file ? await fileToCompressedDataUrl(file) : "";
      const profileUpload = file
        ? {
            fileName: file.name || `team-${Date.now()}.jpg`,
            mimeType: file.type || "image/jpeg",
            dataUrl: profileRaw,
          }
        : null;

      if (account) {
        accountResult = await handleCreateStaffAccount(input, account);
        accountCreated = true;
      }

      await postAction(
        {
          action: "createTeamTs",
          data: {
            no: input.no,
            nama: input.nama,
            role: input.role,
            Role: input.role,
            jabatan: input.role,
            email: input.email,
            phone: input.phone,
            status: input.status,
            profileUpload,
          },
        },
        "Gagal menambah Team TS"
      );

      if (account) {
        if (accountResult?.warning) {
          toast.warning(accountResult.warning);
        }
        toast.success("Staff + akun login berhasil ditambahkan.");
      } else {
        toast.success("Team TS berhasil ditambahkan.");
      }
    } catch (error) {
      console.error(error);
      const message = (error as Error).message || "Gagal menambah Team TS";
      const duplicateLoginIdentity = account ? isDuplicateLoginIdentityError(error) : false;

      if (accountCreated && !duplicateLoginIdentity) {
        toast.error(`Akun login sudah dibuat, tetapi data staff gagal disimpan: ${message}`);
      } else if (!duplicateLoginIdentity) {
        toast.error(message);
      }

      if (duplicateLoginIdentity) {
        throw new Error("Email/username sudah terdaftar.");
      }
      throw error instanceof Error ? error : new Error(message);
    } finally {
      await fetchTeamMembers({ silentError: true });
      setTeamSaving(false);
    }
  };

  const handleUpdateTeamMember = async (
    originalNo: string,
    input: TsTeamMemberSaveInput,
    file: File | null,
    deleteProfile: boolean
  ) => {
    setTeamSaving(true);
    try {
      const profileRaw = file ? await fileToCompressedDataUrl(file) : "";
      const profileUpload = file
        ? {
            fileName: file.name || `team-${Date.now()}.jpg`,
            mimeType: file.type || "image/jpeg",
            dataUrl: profileRaw,
          }
        : null;

      await postAction(
        {
          action: "updateTeamTs",
          data: {
            no: input.no || originalNo,
            oldNo: originalNo,
            nama: input.nama,
            role: input.role,
            Role: input.role,
            jabatan: input.role,
            email: input.email,
            phone: input.phone,
            status: input.status,
            profileId: input.profileId,
            profileUrl: input.profileUrl,
            deleteProfile,
            profileUpload,
          },
        },
        "Gagal memperbarui Team TS"
      );
      toast.success("Data Team TS berhasil diperbarui.");
      await fetchTeamMembers();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal memperbarui Team TS");
    } finally {
      setTeamSaving(false);
    }
  };

  const handleDeleteTeamMemberConfirmed = async (memberNo: string) => {
    if (!memberNo) return;
    setTeamSaving(true);
    try {
      await postAction({ action: "deleteTeamTs", data: { no: memberNo } }, "Gagal menghapus Team TS");
      toast.success("Team TS berhasil dihapus.");
      await fetchTeamMembers();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal menghapus Team TS");
      throw error;
    } finally {
      setTeamSaving(false);
    }
  };

  const handleDeleteTeamMember = async (memberNo: string) => {
    if (!memberNo) return;
    openConfirmDialog({
      title: "Hapus Team TS",
      description: `Yakin ingin menghapus Team TS No ${memberNo}?`,
      confirmText: "Hapus",
      destructive: true,
      action: () => handleDeleteTeamMemberConfirmed(memberNo),
    });
  };

  const handleQuickTeamStatusChange = async (memberNo: string, status: TeamAvailabilityStatus) => {
    if (!memberNo) return;
    try {
      await postAction(
        { action: "updateTeamTsStatus", data: { no: memberNo, status } },
        "Gagal mengubah status Team TS"
      );
      toast.success(`Status Team TS diubah ke ${formatTeamStatusLabel(status)}`);
      await fetchTeamMembers({ silentError: true });
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal mengubah status Team TS");
    }
  };

  const handleDeleteConfirmed = async (entryId: string) => {
    if (!entryId) return;

    try {
      await postAction({ action: "delete", data: { submissionId: entryId } }, "Gagal hapus data");
      toast.success("Jadwal berhasil dihapus");
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Gagal menghapus data");
      throw err;
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!entryId) return;
    openConfirmDialog({
      title: "Hapus Jadwal",
      description: "Yakin ingin menghapus jadwal ini?",
      confirmText: "Hapus",
      destructive: true,
      action: () => handleDeleteConfirmed(entryId),
    });
  };

  const updateScheduleStatus = async (
    entry: TsSupportEntry,
    status: ScheduleStatus,
    overrides?: {
      tanggalOperasi?: string;
      jamOperasi?: string;
      tsMembantu?: string;
      successMessage?: string;
      comment?: string;
    }
  ) => {
    if (!entry.id) return;
    setUpdatingEntryId(entry.id);
    try {
      const tanggalOperasi = overrides?.tanggalOperasi || entry.tanggalOperasi || toDateKey(new Date());
      const jamOperasi = overrides?.jamOperasi ?? entry.jamOperasi;
      const tsMembantu = overrides?.tsMembantu ?? entry.tsMembantu;
      const teamTs = parseTeamMembers(tsMembantu);
      const existingPreXray = toStoredImageValue(entry.preXray);
      const existingPostXray = toStoredImageValue(entry.postXray);
      const existingPreXrayFileId = entry.preXrayFileId || getGoogleDriveFileId(existingPreXray);
      const existingPostXrayFileId = entry.postXrayFileId || getGoogleDriveFileId(existingPostXray);
      const existingPreXrayUrl = toDriveReferenceUrl(existingPreXray, existingPreXrayFileId);
      const existingPostXrayUrl = toDriveReferenceUrl(existingPostXray, existingPostXrayFileId);

      const payload = {
        action: "update",
        data: {
          submissionId: entry.id,
          tanggalOperasi,
          hospital: entry.rumahSakit,
          operator: entry.namaDokter,
          teamTs: teamTs.length ? teamTs : [{ name: "TS Belum Diisi" }],
          preXrayUrl: existingPreXrayUrl,
          postXrayUrl: existingPostXrayUrl,
          preXrayFileId: existingPreXrayFileId,
          postXrayFileId: existingPostXrayFileId,
          oldPreXrayFileId: existingPreXrayFileId,
          oldPostXrayFileId: existingPostXrayFileId,
          deletePreXray: false,
          deletePostXray: false,
          status,
          comment: String(overrides?.comment || "").trim(),
          keterangan: buildKeterangan({
            status,
            jenisTindakan: entry.jenisTindakan,
            notes: entry.notes,
            preXray: existingPreXrayUrl,
            postXray: existingPostXrayUrl,
            jamOperasi,
          }),
        },
      };

      await postAction(payload, "Gagal update status");
      toast.success(overrides?.successMessage || `Status jadwal diubah ke ${formatStatusLabel(status)}`);
      const updatedDateKey = normalizeDateKey(tanggalOperasi);
      if (updatedDateKey) setSelectedDateKey(updatedDateKey);
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Gagal mengubah status jadwal");
    } finally {
      setUpdatingEntryId(null);
    }
  };

  const submitRescheduleDialog = async () => {
    if (!rescheduleTargetEntry) return;
    const cleanedDate = rescheduleDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedDate)) {
      toast.error("Format tanggal harus YYYY-MM-DD.");
      return;
    }

    const cleanedTime = rescheduleTime.trim();
    if (cleanedTime && !/^\d{2}:\d{2}$/.test(cleanedTime)) {
      toast.error("Format jam harus HH:mm.");
      return;
    }

    setRescheduleDialogSaving(true);
    try {
      await updateScheduleStatus(rescheduleTargetEntry, "reschedule", {
        tanggalOperasi: cleanedDate,
        jamOperasi: cleanedTime || rescheduleTargetEntry.jamOperasi,
      });
      closeRescheduleDialog();
    } finally {
      setRescheduleDialogSaving(false);
    }
  };

  const handleReschedule = (entry: TsSupportEntry) => {
    openRescheduleDialog(entry);
  };

  const handleAssignTs = async (entryId: string, tsNames: string) => {
    const target = entries.find((item) => item.id === entryId);
    if (!target) {
      toast.error("Jadwal tidak ditemukan.");
      return;
    }
    await updateScheduleStatus(target, target.status, {
      tsMembantu: tsNames,
      successMessage: "TS pendamping berhasil diperbarui",
    });
  };

  const openAssignTsDialog = (entryId: string, initialTs: string) => {
    const targetId = String(entryId || "").trim();
    if (!targetId) return;
    openTextDialog({
      title: "Assign TS Pendamping",
      description: "Masukkan nama TS, pisahkan dengan koma jika lebih dari satu.",
      label: "Nama TS",
      placeholder: "Contoh: hasan, jhonny",
      submitText: "Simpan Assign",
      initialValue: initialTs || "",
      action: async (value) => {
        const cleaned = value.trim();
        if (!cleaned) {
          toast.error("Isi minimal 1 nama TS.");
          throw new Error("Isi minimal 1 nama TS.");
        }
        await handleAssignTs(targetId, cleaned);
      },
    });
  };

  const handleQuickXrayUpload = async (
    entry: TsSupportEntry,
    target: "pre" | "post",
    file: File | null,
    source: "file" | "camera"
  ) => {
    if (!entry.id || !file) return;

    setUpdatingEntryId(entry.id);
    try {
      const raw = await fileToCompressedDataUrl(file);
      const imageData = ensureStorableImageValue(raw, target === "pre" ? "Pre-Op" : "Post-Op");
      const teamTs = parseTeamMembers(entry.tsMembantu);
      const existingPreXray = toStoredImageValue(entry.preXray);
      const existingPostXray = toStoredImageValue(entry.postXray);
      const existingPreXrayFileId = entry.preXrayFileId || getGoogleDriveFileId(existingPreXray);
      const existingPostXrayFileId = entry.postXrayFileId || getGoogleDriveFileId(existingPostXray);
      const existingPreXrayUrl = toDriveReferenceUrl(existingPreXray, existingPreXrayFileId);
      const existingPostXrayUrl = toDriveReferenceUrl(existingPostXray, existingPostXrayFileId);

      const preXrayUpload =
        target === "pre"
          ? {
              fileName: file.name || `pre-${Date.now()}.jpg`,
              mimeType: file.type || "image/jpeg",
              dataUrl: imageData,
            }
          : null;
      const postXrayUpload =
        target === "post"
          ? {
              fileName: file.name || `post-${Date.now()}.jpg`,
              mimeType: file.type || "image/jpeg",
              dataUrl: imageData,
            }
          : null;

      await postAction(
        {
          action: "update",
          data: {
            submissionId: entry.id,
            tanggalOperasi: entry.tanggalOperasi || toDateKey(new Date()),
            hospital: entry.rumahSakit,
            operator: entry.namaDokter,
            teamTs: teamTs.length ? teamTs : [{ name: "TS Belum Diisi" }],
            preXrayUpload,
            postXrayUpload,
            oldPreXrayUrl: existingPreXray,
            oldPostXrayUrl: existingPostXray,
            oldPreXrayFileId: existingPreXrayFileId,
            oldPostXrayFileId: existingPostXrayFileId,
            preXrayUrl: target === "pre" ? "" : existingPreXrayUrl,
            postXrayUrl: target === "post" ? "" : existingPostXrayUrl,
            preXrayFileId: target === "pre" ? "" : existingPreXrayFileId,
            postXrayFileId: target === "post" ? "" : existingPostXrayFileId,
            deletePreXray: false,
            deletePostXray: false,
            status: entry.status,
            comment: `Upload X-ray ${target === "pre" ? "Pre" : "Post"} via ${source}`,
            keterangan: buildKeterangan({
              status: entry.status,
              jenisTindakan: entry.jenisTindakan,
              notes: entry.notes,
              preXray: target === "pre" ? "" : existingPreXrayUrl,
              postXray: target === "post" ? "" : existingPostXrayUrl,
              jamOperasi: entry.jamOperasi,
            }),
          },
        },
        "Gagal upload foto X-ray"
      );

      toast.success(
        `X-ray ${target === "pre" ? "Pre" : "Post"} berhasil diupload (${source === "camera" ? "kamera" : "file"})`
      );
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal upload foto X-ray");
    } finally {
      setUpdatingEntryId(null);
    }
  };

  const loadScheduleComments = useCallback(
    async (entryId: string) => {
      const targetId = String(entryId || "").trim();
      if (!targetId) return;
      setScheduleCommentsLoading(true);
      setScheduleCommentsError(null);
      try {
        const rows = await fetchActivityLogsFromGas({
          entityType: "schedule",
          entityId: targetId,
          auditAction: "comment_schedule",
          limit: 300,
        });
        const comments = rows.filter(
          (item) =>
            item.entityType === "schedule" &&
            item.entityId === targetId &&
            item.action === "comment_schedule"
        );
        setScheduleComments(comments);
      } catch (error) {
        setScheduleCommentsError(
          error instanceof Error ? error.message : "Gagal memuat komentar jadwal."
        );
      } finally {
        setScheduleCommentsLoading(false);
      }
    },
    [fetchActivityLogsFromGas]
  );

  const submitScheduleComment = async (
    entryId: string,
    commentText: string,
    options?: { replyTo?: string }
  ) => {
    const targetId = String(entryId || "").trim();
    if (!targetId) return;
    const comment = String(commentText || "").trim();
    const replyTo = String(options?.replyTo || "").trim();
    if (!comment) {
      toast.error("Komentar tidak boleh kosong.");
      throw new Error("Komentar tidak boleh kosong.");
    }

    try {
      await postAction(
        {
          action: "commentSchedule",
          data: {
            submissionId: targetId,
            comment,
            replyTo: replyTo,
          },
        },
        "Gagal menyimpan komentar"
      );
      toast.success("Komentar tersimpan di timeline.");
      setScheduleCommentCountByEntryId((prev) => ({
        ...prev,
        [targetId]: Number(prev[targetId] || 0) + 1,
      }));
      if (auditDialogOpen && auditTargetEntryId === targetId) {
        await openScheduleTimeline(targetId);
      }
      if (scheduleCommentsOpen && scheduleCommentEntryId === targetId) {
        await loadScheduleComments(targetId);
      }
      await fetchEntries({ silentError: true });
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal menyimpan komentar.");
      throw error;
    }
  };

  const openScheduleCommentsDialog = useCallback(
    async (entryId: string) => {
      const targetId = String(entryId || "").trim();
      if (!targetId) return;
      setScheduleCommentEntryId(targetId);
      setScheduleCommentDraft("");
      setScheduleCommentReplyToId("");
      setScheduleCommentDeletingId("");
      setScheduleComments([]);
      setScheduleCommentsError(null);
      setScheduleCommentsOpen(true);
      await loadScheduleComments(targetId);
    },
    [loadScheduleComments]
  );

  const handleAddScheduleComment = async (entryId: string) => {
    const targetId = String(entryId || "").trim();
    if (!targetId) return;
    await openScheduleCommentsDialog(targetId);
  };

  const requestDeleteScheduleComment = useCallback(
    (item: TsSupportAuditTimelineItem) => {
      const targetId = String(scheduleCommentEntryId || "").trim();
      const commentId = String(item.id || "").trim();
      if (!targetId || !commentId) return;
      const actorName =
        String(item.actor?.name || "").trim() ||
        String(item.actor?.username || "").trim() ||
        String(item.actor?.email || "").trim() ||
        "User";
      const commentPreview = getAuditCommentText(item) || "-";

      openConfirmDialog({
        title: "Hapus pesan komentar?",
        description: `Pesan dari ${actorName}: "${commentPreview.slice(0, 120)}"${commentPreview.length > 120 ? "..." : ""}`,
        confirmText: "Hapus",
        destructive: true,
        action: async () => {
          setScheduleCommentDeletingId(commentId);
          try {
            await postAction(
              {
                action: "deleteScheduleComment",
                data: {
                  submissionId: targetId,
                  commentId,
                },
              },
              "Gagal menghapus komentar"
            );
            toast.success("Komentar berhasil dihapus.");
            if (scheduleCommentReplyToId === commentId) {
              setScheduleCommentReplyToId("");
            }
            await loadScheduleComments(targetId);
            await fetchScheduleCommentCounts(true);
            await fetchEntries({ silentError: true });
          } finally {
            setScheduleCommentDeletingId("");
          }
        },
      });
    },
    [
      fetchEntries,
      fetchScheduleCommentCounts,
      loadScheduleComments,
      openConfirmDialog,
      postAction,
      scheduleCommentEntryId,
      scheduleCommentReplyToId,
    ]
  );

  const openScheduleTimeline = useCallback(async (entryId: string) => {
    const targetId = String(entryId || "").trim();
    if (!targetId) return;

    setAuditTargetEntryId(targetId);
    setAuditDialogOpen(true);
    setAuditLoading(true);
    setAuditError(null);
    setAuditLogs([]);

    try {
      const rows = await fetchActivityLogsFromGas({
        entityType: "schedule",
        entityId: targetId,
        limit: 120,
      });
      const scheduleLogs = rows.filter(
        (item) => item.entityType === "schedule" && item.entityId === targetId
      );
      setAuditLogs(scheduleLogs);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat timeline jadwal.";
      setAuditError(message);
    } finally {
      setAuditLoading(false);
    }
  }, [fetchActivityLogsFromGas]);

  const handleReadonlyCreateSchedule = async (input: {
    tanggalOperasi: string;
    jamOperasi: string;
    namaDokter: string;
    jenisTindakan: string;
    rumahSakit: string;
    notes: string;
    preXrayFile: File | null;
    postXrayFile: File | null;
    onProgress?: (value: number) => void;
  }) => {
    const queuedDate = input.tanggalOperasi || toDateKey(new Date());
    const queuedDateKey = normalizeDateKey(queuedDate);
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    input.onProgress?.(18);
    const preRaw = await fileToCompressedDataUrl(input.preXrayFile);
    input.onProgress?.(36);
    const postRaw = await fileToCompressedDataUrl(input.postXrayFile);
    input.onProgress?.(52);
    const preXrayValue = input.preXrayFile ? ensureStorableImageValue(preRaw, "Pre-Op") : "";
    const postXrayValue = input.postXrayFile ? ensureStorableImageValue(postRaw, "Post-Op") : "";
    const preXrayUpload = input.preXrayFile
      ? {
          fileName: input.preXrayFile.name || `pre-${Date.now()}.jpg`,
          mimeType: input.preXrayFile.type || "image/jpeg",
          dataUrl: preXrayValue,
        }
      : null;
    const postXrayUpload = input.postXrayFile
      ? {
          fileName: input.postXrayFile.name || `post-${Date.now()}.jpg`,
          mimeType: input.postXrayFile.type || "image/jpeg",
          dataUrl: postXrayValue,
        }
      : null;

    const payload: PendingReadonlyCreate["payload"] = {
      action: "create",
      data: {
        tanggalOperasi: queuedDate,
        hospital: input.rumahSakit,
        operator: input.namaDokter,
        teamTs: [],
        recipients: [],
        preXrayUpload,
        postXrayUpload,
        preXrayFileId: "",
        postXrayFileId: "",
        preXrayUrl: "",
        postXrayUrl: "",
        keterangan: buildKeterangan({
          status: "jadwal_baru",
          jenisTindakan: input.jenisTindakan,
          notes: input.notes,
          preXray: "",
          postXray: "",
          jamOperasi: input.jamOperasi,
        }),
      },
    };

    const optimisticEntry: TsSupportEntry = {
      id: clientId,
      tanggalOperasi: queuedDate,
      tanggalKey: queuedDateKey,
      jamOperasi: input.jamOperasi,
      namaDokter: input.namaDokter,
      jenisTindakan: input.jenisTindakan,
      rumahSakit: input.rumahSakit,
      tsMembantu: "",
      notes: input.notes,
      preXray: preXrayValue,
      preXrayFileId: "",
      postXray: postXrayValue,
      postXrayFileId: "",
      status: "jadwal_baru",
    };

    setEntries((prev) => sortEntriesByDateTime([...prev, optimisticEntry]));
    input.onProgress?.(70);

    const queueAndKeepOptimistic = async () => {
      enqueuePendingCreate({
        clientId,
        payload,
        optimisticEntry,
        createdAt: new Date().toISOString(),
      });
      if (queuedDateKey) setSelectedDateKey(queuedDateKey);
      input.onProgress?.(100);
      toast.message("Mode offline: jadwal disimpan sebagai draft dan akan sinkron otomatis.");
      await processPendingCreates();
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueAndKeepOptimistic();
      return;
    }

    try {
      await postAction(payload, "Gagal menambah jadwal");
      input.onProgress?.(100);
      if (queuedDateKey) setSelectedDateKey(queuedDateKey);
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
      toast.success("Jadwal operasi berhasil ditambahkan.");
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        await queueAndKeepOptimistic();
        return;
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== clientId));
      console.error(error);
      toast.error((error as Error).message || "Gagal menambah jadwal operasi.");
      throw error;
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.namaDokter || !form.jenisTindakan || !form.rumahSakit) {
      toast.error("Lengkapi data wajib: Dokter, Tindakan, dan RS.");
      return;
    }

    const teamTs = parseTeamMembers(form.tsMembantu);
    const normalizedTeamTs = teamTs.length > 0 ? teamTs : [{ name: "TS Belum Diisi" }];
    const queuedDate = form.tanggalOperasi || toDateKey(new Date());
    const queuedDateKey = normalizeDateKey(queuedDate);
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setSaving(true);
    setCreateUploadProgress(8);
    try {
      const preRaw = await fileToCompressedDataUrl(preFile);
      setCreateUploadProgress(28);
      const postRaw = await fileToCompressedDataUrl(postFile);
      setCreateUploadProgress(48);
      const preXrayValue = preFile ? ensureStorableImageValue(preRaw, "Pre-Op") : "";
      const postXrayValue = postFile ? ensureStorableImageValue(postRaw, "Post-Op") : "";
      const preXrayUpload = preFile
        ? {
            fileName: preFile.name || `pre-${Date.now()}.jpg`,
            mimeType: preFile.type || "image/jpeg",
            dataUrl: preXrayValue,
          }
        : null;
      const postXrayUpload = postFile
        ? {
            fileName: postFile.name || `post-${Date.now()}.jpg`,
            mimeType: postFile.type || "image/jpeg",
            dataUrl: postXrayValue,
          }
        : null;
      const payload: PendingReadonlyCreate["payload"] = {
        action: "create",
        data: {
          tanggalOperasi: queuedDate,
          hospital: form.rumahSakit,
          operator: form.namaDokter,
          teamTs: normalizedTeamTs,
          recipients: [],
          preXrayUpload,
          postXrayUpload,
          preXrayFileId: "",
          postXrayFileId: "",
          preXrayUrl: "",
          postXrayUrl: "",
          keterangan: buildKeterangan({
            status: "jadwal_baru",
            jenisTindakan: form.jenisTindakan,
            notes: form.notes,
            preXray: "",
            postXray: "",
            jamOperasi: form.jamOperasi,
          }),
        },
      };

      const optimisticEntry: TsSupportEntry = {
        id: clientId,
        tanggalOperasi: queuedDate,
        tanggalKey: queuedDateKey,
        jamOperasi: form.jamOperasi,
        namaDokter: form.namaDokter,
        jenisTindakan: form.jenisTindakan,
        rumahSakit: form.rumahSakit,
        tsMembantu: form.tsMembantu,
        notes: form.notes,
        preXray: preXrayValue,
        preXrayFileId: "",
        postXray: postXrayValue,
        postXrayFileId: "",
        status: "jadwal_baru",
      };

      setEntries((prev) => sortEntriesByDateTime([...prev, optimisticEntry]));
      setCreateUploadProgress(70);

      const finalizeSaved = (toastMessage: string) => {
        if (queuedDateKey) setSelectedDateKey(queuedDateKey);
        setFormOpen(false);
        resetCreateState();
        toast.success(toastMessage);
      };

      const queueAndKeepOptimistic = async () => {
        enqueuePendingCreate({
          clientId,
          payload,
          optimisticEntry,
          createdAt: new Date().toISOString(),
        });
        setCreateUploadProgress(100);
        finalizeSaved("Mode offline: draft jadwal tersimpan, akan sinkron otomatis.");
        await processPendingCreates();
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueAndKeepOptimistic();
        return;
      }

      await postAction(payload, "Gagal menyimpan");
      setCreateUploadProgress(100);
      finalizeSaved("Data TS Support berhasil disimpan");
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (err) {
      if (isLikelyNetworkError(err)) {
        try {
          enqueuePendingCreate({
            clientId,
            payload: {
              action: "create",
              data: {
                tanggalOperasi: queuedDate,
                hospital: form.rumahSakit,
                operator: form.namaDokter,
                teamTs: normalizedTeamTs,
                recipients: [],
                preXrayUpload: preFile
                  ? {
                      fileName: preFile.name || `pre-${Date.now()}.jpg`,
                      mimeType: preFile.type || "image/jpeg",
                      dataUrl: preFile ? ensureStorableImageValue(await fileToCompressedDataUrl(preFile), "Pre-Op") : "",
                    }
                  : null,
                postXrayUpload: postFile
                  ? {
                      fileName: postFile.name || `post-${Date.now()}.jpg`,
                      mimeType: postFile.type || "image/jpeg",
                      dataUrl: postFile ? ensureStorableImageValue(await fileToCompressedDataUrl(postFile), "Post-Op") : "",
                    }
                  : null,
                preXrayFileId: "",
                postXrayFileId: "",
                preXrayUrl: "",
                postXrayUrl: "",
                keterangan: buildKeterangan({
                  status: "jadwal_baru",
                  jenisTindakan: form.jenisTindakan,
                  notes: form.notes,
                  preXray: "",
                  postXray: "",
                  jamOperasi: form.jamOperasi,
                }),
              },
            },
            optimisticEntry: {
              id: clientId,
              tanggalOperasi: queuedDate,
              tanggalKey: queuedDateKey,
              jamOperasi: form.jamOperasi,
              namaDokter: form.namaDokter,
              jenisTindakan: form.jenisTindakan,
              rumahSakit: form.rumahSakit,
              tsMembantu: form.tsMembantu,
              notes: form.notes,
              preXray: "",
              preXrayFileId: "",
              postXray: "",
              postXrayFileId: "",
              status: "jadwal_baru",
            },
            createdAt: new Date().toISOString(),
          });
          if (queuedDateKey) setSelectedDateKey(queuedDateKey);
          setFormOpen(false);
          resetCreateState();
          toast.message("Mode offline: draft jadwal tersimpan, akan sinkron otomatis.");
          return;
        } catch {
          // fall through to generic error handler
        }
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== clientId));
      console.error(err);
      toast.error((err as Error).message || "Gagal menyimpan data");
    } finally {
      setCreateUploadProgress(0);
      setSaving(false);
    }
  };

  const onEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEntryId) {
      toast.error("Data jadwal yang diedit tidak ditemukan.");
      return;
    }
    if (
      !editForm.namaDokter ||
      !editForm.jenisTindakan ||
      !editForm.rumahSakit ||
      !editForm.tsMembantu
    ) {
      toast.error("Lengkapi data wajib: Dokter, Tindakan, RS, dan TS.");
      return;
    }

    const teamTs = parseTeamMembers(editForm.tsMembantu);
    if (teamTs.length === 0) {
      toast.error("Isi minimal 1 nama TS.");
      return;
    }
    setEditSaving(true);
    try {
      const preRaw = editPreFile ? await fileToCompressedDataUrl(editPreFile) : editForm.preXray;
      const postRaw = editPostFile ? await fileToCompressedDataUrl(editPostFile) : editForm.postXray;
      const oldPreXray = toStoredImageValue(editingOriginalXray.preXray);
      const oldPostXray = toStoredImageValue(editingOriginalXray.postXray);
      const oldPreXrayFileId = editingOriginalXray.preXrayFileId || getGoogleDriveFileId(oldPreXray);
      const oldPostXrayFileId = editingOriginalXray.postXrayFileId || getGoogleDriveFileId(oldPostXray);
      const existingPreXray = toStoredImageValue(editForm.preXray);
      const existingPostXray = toStoredImageValue(editForm.postXray);
      const existingPreXrayFileId = editForm.preXrayFileId || getGoogleDriveFileId(existingPreXray);
      const existingPostXrayFileId = editForm.postXrayFileId || getGoogleDriveFileId(existingPostXray);
      const preXrayValue = editPreFile
        ? ensureStorableImageValue(preRaw, "Pre-Op")
        : existingPreXray;
      const postXrayValue = editPostFile
        ? ensureStorableImageValue(postRaw, "Post-Op")
        : existingPostXray;
      const preXrayUpload = editPreFile
        ? {
            fileName: editPreFile.name || `pre-${Date.now()}.jpg`,
            mimeType: editPreFile.type || "image/jpeg",
            dataUrl: preXrayValue,
          }
        : null;
      const postXrayUpload = editPostFile
        ? {
            fileName: editPostFile.name || `post-${Date.now()}.jpg`,
            mimeType: editPostFile.type || "image/jpeg",
            dataUrl: postXrayValue,
          }
        : null;
      const payload = {
        action: "update",
        data: {
          submissionId: editingEntryId,
          tanggalOperasi: editForm.tanggalOperasi || toDateKey(new Date()),
          hospital: editForm.rumahSakit,
          operator: editForm.namaDokter,
          teamTs,
          preXrayUpload,
          postXrayUpload,
          oldPreXrayUrl: oldPreXray,
          oldPostXrayUrl: oldPostXray,
          oldPreXrayFileId,
          oldPostXrayFileId,
          preXrayUrl: editPreFile ? "" : toDriveReferenceUrl(existingPreXray, existingPreXrayFileId),
          postXrayUrl: editPostFile ? "" : toDriveReferenceUrl(existingPostXray, existingPostXrayFileId),
          preXrayFileId: editPreFile ? "" : existingPreXrayFileId,
          postXrayFileId: editPostFile ? "" : existingPostXrayFileId,
          deletePreXray: !editPreFile && !existingPreXray && !existingPreXrayFileId && Boolean(oldPreXray || oldPreXrayFileId),
          deletePostXray:
            !editPostFile && !existingPostXray && !existingPostXrayFileId && Boolean(oldPostXray || oldPostXrayFileId),
          keterangan: buildKeterangan({
            status: editForm.status,
            jenisTindakan: editForm.jenisTindakan,
            notes: editForm.notes,
            preXray: editPreFile ? "" : existingPreXray,
            postXray: editPostFile ? "" : existingPostXray,
            jamOperasi: editForm.jamOperasi,
          }),
        },
      };

      await postAction(payload, "Gagal update jadwal");
      toast.success("Jadwal berhasil diperbarui");
      const updatedDateKey = normalizeDateKey(editForm.tanggalOperasi);
      if (updatedDateKey) setSelectedDateKey(updatedDateKey);
      resetEditState();
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Gagal memperbarui jadwal");
    } finally {
      setEditSaving(false);
    }
  };

  const renderScheduleCommentMessage = (item: TsSupportAuditTimelineItem): JSX.Element => {
    const actorName =
      String(item.actor?.name || "").trim() ||
      String(item.actor?.username || "").trim() ||
      String(item.actor?.email || "").trim() ||
      "User";
    const actorTag = item.actor?.username
      ? `@${item.actor.username}`
      : item.actor?.email || actorName;
    const commentText = getAuditCommentText(item) || "-";
    const isOwn = isOwnScheduleComment(item);
    const isActiveReply = scheduleCommentReplyToId === item.id;
    const canDelete = canDeleteScheduleComment(item);
    const replyTo = String(item.meta?.replyTo || "").trim();
    const replyTarget = replyTo ? scheduleCommentById.get(replyTo) || null : null;
    const replyActorName = replyTarget
      ? String(replyTarget.actor?.name || "").trim() ||
        String(replyTarget.actor?.username || "").trim() ||
        String(replyTarget.actor?.email || "").trim() ||
        "User"
      : "";
    const replyCommentText = replyTarget ? getAuditCommentText(replyTarget) || "-" : "";
    const createdAtLabel = formatChatTimeLabel(item.createdAt);

    return (
      <div key={item.id} className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[90%] sm:max-w-[78%]", isOwn ? "text-right" : "text-left")}>
          {!isOwn ? (
            <p className="mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {actorName} <span className="text-muted-foreground">({actorTag})</span>
            </p>
          ) : null}

          <div
            className={cn(
              "rounded-2xl px-3 py-2 shadow-sm",
              isOwn
                ? "bg-violet-500 text-white dark:bg-violet-600"
                : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            )}
          >
            {replyTo ? (
              <button
                type="button"
                className={cn(
                  "mb-2 w-full rounded-md border px-2 py-1 text-left text-[11px]",
                  isOwn
                    ? "border-white/35 bg-white/15 text-white/90"
                    : "border-slate-300 bg-white/70 text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
                )}
                onClick={() => {
                  setScheduleCommentReplyToId(replyTo);
                }}
                title="Lihat balasan ke komentar ini"
              >
                {replyTarget
                  ? `↪ Membalas ${replyActorName}: ${replyCommentText}`
                  : "↪ Membalas komentar yang sudah dihapus"}
              </button>
            ) : null}

            <p className={cn("whitespace-pre-wrap text-sm", isOwn ? "text-white" : "text-slate-900 dark:text-slate-100")}>
              {commentText}
            </p>
          </div>

          <div
            className={cn(
              "mt-1 flex items-center gap-2 px-1 text-[11px] text-muted-foreground",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span>{createdAtLabel}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[11px]"
              disabled={scheduleCommentSaving || Boolean(scheduleCommentDeletingId)}
              onClick={() => {
                setScheduleCommentReplyToId((prev) => (prev === item.id ? "" : item.id));
              }}
            >
              {isActiveReply ? "Batal Balas" : "Balas"}
            </Button>
            {canDelete ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] text-rose-600 dark:text-rose-300"
                disabled={scheduleCommentSaving || scheduleCommentDeletingId === item.id}
                onClick={() => requestDeleteScheduleComment(item)}
              >
                {scheduleCommentDeletingId === item.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-3 w-3" />
                )}
                Hapus
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        compactMode ? "mx-auto w-full max-w-[1600px] space-y-3" : "mx-auto w-full max-w-[1600px] space-y-5",
        !isReadonlyMode && "pb-36 md:pb-0",
        isSystemDark && "dark"
      )}
    >
      {!readonlyOnly ? (
      <Card className="p-4 md:p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-slate-100/50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Manajemen Jadwal Asistensi Dokter</h2>
            <p className="text-sm text-muted-foreground">Input, edit, dan monitor status jadwal operasi.</p>
          </div>

          <Dialog
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (open) setCreateStep("data");
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                className="h-11 px-4"
                onClick={() => {
                  setCreateStep("data");
                }}
              >
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Input Jadwal Operasi</DialogTitle>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {CREATE_STEP_ORDER.map((step) => {
                    const isActive = createStep === step;
                    const isDone = CREATE_STEP_ORDER.indexOf(createStep) > CREATE_STEP_ORDER.indexOf(step);
                    return (
                      <div
                        key={step}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-center text-xs font-medium",
                          isActive
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-200"
                            : isDone
                              ? "border-emerald-300 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200"
                              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        )}
                      >
                        {CREATE_STEP_LABEL[step]}
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Langkah {CREATE_STEP_ORDER.indexOf(createStep) + 1} dari 3 • {CREATE_STEP_LABEL[createStep]}
                </p>

                {createStep === "data" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Tanggal Operasi</label>
                      <Input
                        type="date"
                        value={form.tanggalOperasi}
                        onChange={(event) => updateForm("tanggalOperasi", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Jam Operasi</label>
                      <Input
                        type="time"
                        value={form.jamOperasi}
                        onChange={(event) => updateForm("jamOperasi", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Nama Dokter *</label>
                      <Input value={form.namaDokter} onChange={(event) => updateForm("namaDokter", event.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Jenis Tindakan *</label>
                      <Input
                        value={form.jenisTindakan}
                        onChange={(event) => updateForm("jenisTindakan", event.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Lokasi Rumah Sakit *</label>
                      <Input value={form.rumahSakit} onChange={(event) => updateForm("rumahSakit", event.target.value)} />
                    </div>
                  </div>
                ) : null}

                {createStep === "team_ts" ? (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Team TS yang Membantu</label>
                      <Input
                        value={form.tsMembantu}
                        onChange={(event) => updateForm("tsMembantu", event.target.value)}
                        placeholder="Pisahkan dengan koma jika lebih dari satu"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Kosongkan bila pembagian TS belum dilakukan.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Notes</label>
                      <Textarea
                        value={form.notes}
                        onChange={(event) => updateForm("notes", event.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                ) : null}

                {createStep === "xray" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border p-3 space-y-2">
                        <label className="text-xs text-muted-foreground">Foto X-ray Pre</label>
                        <XraySourcePicker
                          onSelect={(file) => setPreFile(file)}
                          disabled={saving}
                        />
                        {preFile ? <p className="text-[11px] text-muted-foreground">{preFile.name}</p> : null}
                        {prePreviewUrl ? (
                          <XrayPreview
                            src={prePreviewUrl}
                            alt="Preview X-ray pre"
                            heightClass="h-28"
                            onClick={() => openImagePreview(prePreviewUrl, "Preview X-ray Pre")}
                          />
                        ) : null}
                      </div>

                      <div className="rounded-lg border p-3 space-y-2">
                        <label className="text-xs text-muted-foreground">Foto X-ray Post</label>
                        <XraySourcePicker
                          onSelect={(file) => setPostFile(file)}
                          disabled={saving}
                        />
                        {postFile ? <p className="text-[11px] text-muted-foreground">{postFile.name}</p> : null}
                        {postPreviewUrl ? (
                          <XrayPreview
                            src={postPreviewUrl}
                            alt="Preview X-ray post"
                            heightClass="h-28"
                            onClick={() => openImagePreview(postPreviewUrl, "Preview X-ray Post")}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-emerald-600 transition-[width] duration-300"
                          style={{ width: `${createUploadProgress || 0}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Kompres otomatis aktif. Progress upload: {createUploadProgress || 0}%
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {createStep !== "data" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-4"
                      onClick={() => {
                        const currentIndex = CREATE_STEP_ORDER.indexOf(createStep);
                        const previousStep = CREATE_STEP_ORDER[currentIndex - 1];
                        if (previousStep) setCreateStep(previousStep);
                      }}
                    >
                      Kembali
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" className="h-11 px-4" onClick={resetCreateState}>
                    Reset Form
                  </Button>
                  {createStep !== "xray" ? (
                    <Button type="button" className="ml-auto h-11 px-4" onClick={handleCreateStepNext}>
                      Lanjut
                    </Button>
                  ) : (
                    <Button type="submit" className="ml-auto h-11 px-4" disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan Jadwal"}
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              if (!open) resetEditState();
              if (open) setEditOpen(true);
            }}
          >
            <DialogContent className="max-h-[92vh] w-[calc(100vw-0.75rem)] max-w-3xl overflow-y-auto p-0 sm:w-full sm:p-6">
              <DialogHeader>
                <DialogTitle>Edit Jadwal Operasi</DialogTitle>
              </DialogHeader>

              <form onSubmit={onEditSubmit} className="space-y-3 p-4 sm:p-0">
                <div className="rounded-xl border p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Data Operasi
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Tanggal Operasi</label>
                      <Input
                        type="date"
                        value={editForm.tanggalOperasi}
                        onChange={(event) => updateEditForm("tanggalOperasi", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Jam Operasi</label>
                      <Input
                        type="time"
                        value={editForm.jamOperasi}
                        onChange={(event) => updateEditForm("jamOperasi", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Nama Dokter *</label>
                      <Input
                        value={editForm.namaDokter}
                        onChange={(event) => updateEditForm("namaDokter", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Jenis Tindakan *</label>
                      <Input
                        value={editForm.jenisTindakan}
                        onChange={(event) => updateEditForm("jenisTindakan", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Lokasi Rumah Sakit *</label>
                      <Input
                        value={editForm.rumahSakit}
                        onChange={(event) => updateEditForm("rumahSakit", event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">TS yang Membantu *</label>
                      <Input
                        value={editForm.tsMembantu}
                        onChange={(event) => updateEditForm("tsMembantu", event.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Status Jadwal</label>
                      <select
                        value={editForm.status}
                        onChange={(event) => updateEditForm("status", event.target.value as ScheduleStatus)}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-3 space-y-2">
                    <label className="text-xs text-muted-foreground">X-ray Pre</label>
                    <XraySourcePicker
                      onSelect={(file) => handleEditFileChange("preXray", file)}
                      disabled={editSaving}
                    />
                    {editPrePreviewUrl ? (
                      <XrayPreview
                        src={editPrePreviewUrl}
                        alt="Preview X-ray pre edit"
                        heightClass="h-28"
                        onClick={() => openImagePreview(editPrePreviewUrl, "Preview X-ray Pre (Edit)")}
                      />
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearEditFile("preXray")}
                      disabled={!editForm.preXray && !editPreFile}
                    >
                      Hapus Foto Pre
                    </Button>
                  </div>

                  <div className="rounded-xl border p-3 space-y-2">
                    <label className="text-xs text-muted-foreground">X-ray Post</label>
                    <XraySourcePicker
                      onSelect={(file) => handleEditFileChange("postXray", file)}
                      disabled={editSaving}
                    />
                    {editPostPreviewUrl ? (
                      <XrayPreview
                        src={editPostPreviewUrl}
                        alt="Preview X-ray post edit"
                        heightClass="h-28"
                        onClick={() => openImagePreview(editPostPreviewUrl, "Preview X-ray Post (Edit)")}
                      />
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearEditFile("postXray")}
                      disabled={!editForm.postXray && !editPostFile}
                    >
                      Hapus Foto Post
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <label className="text-xs text-muted-foreground">Catatan</label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(event) => updateEditForm("notes", event.target.value)}
                    rows={3}
                  />
                </div>

                <div className="sticky bottom-0 -mx-4 mt-1 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="h-11 flex-1" onClick={resetEditState}>
                      Tutup
                    </Button>
                    <Button type="submit" className="h-11 flex-1" disabled={editSaving}>
                      {editSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
      ) : null}

      <Card className="mx-auto w-full max-w-md space-y-4 rounded-[30px] border border-[#e7e8f2] bg-[#f7f8fc] p-3 shadow-[0_10px_30px_rgba(15,23,42,0.09)] dark:border-slate-800 dark:bg-slate-950 sm:max-w-none md:rounded-2xl md:border-slate-200/70 md:bg-gradient-to-b md:from-white md:to-slate-50/80 md:p-5 md:shadow-sm md:dark:from-slate-950 md:dark:to-slate-900">
        <div ref={lainnyaSectionRef} className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-lg tracking-tight md:tracking-normal">Kalender & Agenda Operasi</h3>
              <p className="text-sm text-muted-foreground md:text-sm">
                {formatDateLabel(selectedDateKey)} • {summary.todayAgendaVisible}/{summary.todayAgendaTotal} agenda
              </p>
            </div>
            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
              <div className="inline-flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white/70 p-1 dark:border-slate-700 dark:bg-slate-900/60 md:flex-initial md:overflow-visible">
              <motion.div {...TAP_MOTION}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-transparent"
                  onClick={() => void copyAgendaSummary()}
                  disabled={selectedDayAgenda.length === 0}
                  title="Copy ringkasan"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div {...TAP_MOTION}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-transparent"
                  onClick={exportAgendaCsv}
                  disabled={selectedDayAgenda.length === 0}
                  title="Export CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div {...TAP_MOTION}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-transparent"
                  onClick={() => setCompactMode((prev) => !prev)}
                  title={compactMode ? "Mode normal" : "Mode compact"}
                >
                  {compactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              </motion.div>
              <motion.div {...TAP_MOTION}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-transparent"
                  onClick={() => void fetchEntries()}
                  title="Refresh data"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div {...TAP_MOTION}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9 border-transparent"
                  onClick={() => void openNotificationCenter()}
                  title="Riwayat timeline aktivitas"
                >
                  <History className="h-4 w-4" />
                  {notificationCenterUnreadCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white shadow">
                      {formatBadgeCount(notificationCenterUnreadCount)}
                    </span>
                  ) : null}
                </Button>
              </motion.div>
              </div>
              {!readonlyOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3 text-xs"
                  onClick={() => setPanelMode((prev) => (prev === "manage" ? "readonly" : "manage"))}
                >
                  {panelMode === "manage" ? "Mode Lihat Saja" : "Mode Manajemen"}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-2 dark:border-slate-700 dark:bg-slate-900/55 md:hidden">
            <div className="mb-1 flex items-center justify-between px-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                Week View
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selectedDayAgenda.length} agenda
              </p>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {mobileWeekDateItems.map((item) => {
                const isSelected = item.key === selectedDateKey;
                return (
                  <button
                    key={`manage-mobile-week-${item.key}`}
                    type="button"
                    onClick={() => setSelectedDateKey(item.key)}
                    className={cn(
                      "rounded-xl border px-1 py-1.5 text-center transition",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/35 dark:text-blue-200"
                        : "border-slate-200 bg-slate-50/90 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
                      item.isToday && !isSelected && "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                    )}
                  >
                    <p className="text-[9px] font-medium uppercase leading-none">{item.dayLabel}</p>
                    <p className="mt-1 text-sm font-semibold leading-none">{item.dateNumber}</p>
                    <p className="mt-1 text-[9px] leading-none text-muted-foreground">
                      {item.count}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {!compactMode ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSummaryQuickViewKey("total")}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Total Jadwal</p>
                    <Sparkles className="h-4 w-4 text-cyan-500" />
                  </div>
                  <p className="mt-1 text-xl font-semibold md:text-2xl">{summaryCards.total}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isReadonlyMode ? formatDateLabel(currentDateKey) : "Semua jadwal operasi"}
                  </p>
                </motion.button>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSummaryQuickViewKey("today")}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Agenda Hari Ini</p>
                    <CalendarDays className="h-4 w-4 text-sky-500" />
                  </div>
                  <p className="mt-1 text-xl font-semibold md:text-2xl">{summaryCards.today}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground truncate">{formatDateLabel(currentDateKey)}</p>
                </motion.button>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSummaryQuickViewKey("needs_attention")}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Butuh Tindakan</p>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="mt-1 text-xl font-semibold text-amber-600 md:text-2xl">{summaryCards.needsAttention}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isReadonlyMode ? formatDateLabel(currentDateKey) : "Perlu follow-up"}
                  </p>
                </motion.button>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSummaryQuickViewKey("selesai")}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Selesai</p>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-1 text-xl font-semibold text-emerald-600 md:text-2xl">{summaryCards.selesai}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isReadonlyMode
                      ? formatDateLabel(currentDateKey)
                      : `Tanggal ${formatDateLabel(selectedDateKey)}`}
                  </p>
                </motion.button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs md:hidden">
                <span className="rounded-full border px-2.5 py-1 bg-white/85 dark:bg-slate-900/70">
                  Total: {summaryCards.total}
                </span>
                <span className="rounded-full border px-2.5 py-1 bg-white/85 dark:bg-slate-900/70">
                  Agenda: {summaryCards.today}
                </span>
                <span className="rounded-full border px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  Action: {summaryCards.needsAttention}
                </span>
                <span className="rounded-full border px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  Selesai: {summaryCards.selesai}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border px-2.5 py-1 bg-white/80 dark:bg-slate-900/70">Total: {summaryCards.total}</span>
              <span className="rounded-full border px-2.5 py-1 bg-white/80 dark:bg-slate-900/70">Agenda: {summaryCards.today}</span>
              <span className="rounded-full border px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">Need Action: {summaryCards.needsAttention}</span>
              <span className="rounded-full border px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">Selesai: {summaryCards.selesai}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari dokter, tindakan, RS, TS..."
                  className="h-9 rounded-lg bg-background/90 pl-9"
                />
              </div>
              <span className="inline-flex h-9 shrink-0 items-center self-end rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] text-muted-foreground dark:border-slate-700 dark:bg-slate-900 sm:self-auto">
                {manageScopedEntries.length} data
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="inline-flex w-full items-center rounded-xl border border-slate-300 bg-white/80 px-2.5 py-1 text-[11px] leading-relaxed text-muted-foreground dark:border-slate-700 dark:bg-slate-900/70 sm:w-auto sm:rounded-full">
              Asistensi kosong: {managementSummary.missingTs} • TS tidak tersedia: {managementSummary.unavailableTs} • X-ray belum lengkap: {managementSummary.missingXray}
            </span>
            {selectedDateCommentSummary.agendaCount > 0 ? (
              <span className="inline-flex items-center rounded-xl border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:rounded-full">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                Komentar: {selectedDateCommentSummary.agendaCount} agenda ({selectedDateCommentSummary.totalComments})
              </span>
            ) : null}
          </div>
        </div>

        {isReadonlyMode ? (
          <div className="w-full min-w-0 overflow-hidden">
            <TsReadonlyOpsAndTeamPanel
              schedules={readOnlySchedules}
              teamMembers={teamMembers}
              loadingSchedules={loading}
              loadingTeam={teamLoading}
              updatingScheduleId={updatingEntryId}
              commentCountByScheduleId={scheduleCommentCountByEntryId}
              onCreateSchedule={handleReadonlyCreateSchedule}
              onAssignSchedule={async (entryId) => {
                const target = entries.find((item) => item.id === entryId);
                if (!target) return;
                openAssignTsDialog(entryId, target.tsMembantu || "");
              }}
              onEditSchedule={async (entryId) => {
                const target = entries.find((item) => item.id === entryId);
                if (!target) return;
                if (readonlyOnly) {
                  handleReschedule(target);
                  return;
                }
                confirmAndOpenEditModal(target);
              }}
              onDeleteSchedule={async (entryId) => {
                await handleDelete(entryId);
              }}
              onScheduleStatusChange={async (entryId, status) => {
                const entry = entries.find((item) => item.id === entryId);
                if (!entry) return;
                await updateScheduleStatus(entry, status);
              }}
              onUploadScheduleXray={async (entryId, target, file, source) => {
                const entry = entries.find((item) => item.id === entryId);
                if (!entry) return;
                await handleQuickXrayUpload(entry, target, file, source);
              }}
              onCommentSchedule={async (entryId) => {
                await handleAddScheduleComment(entryId);
              }}
              focusScheduleId={focusedScheduleId}
              focusScheduleSignal={focusedScheduleSignal}
            />
          </div>
        ) : (
          <div className={cn(compactMode ? "space-y-3" : "space-y-4")}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,minmax(0,1fr),420px] xl:grid-cols-[300px,minmax(0,1fr),460px]">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[28px] border border-sky-200/80 bg-gradient-to-b from-sky-50/40 via-white to-cyan-50/80 p-4 shadow-[0_18px_40px_rgba(14,116,144,0.12)] dark:border-sky-900/60 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/30 md:p-5"
            >
              <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
                <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                Pilih tanggal
              </div>
              <div className="mx-auto w-full max-w-[330px] rounded-2xl border border-sky-200/70 bg-white/80 p-2.5 shadow-inner shadow-sky-100/40 dark:border-sky-900/50 dark:bg-slate-950/45 dark:shadow-sky-950/30">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (day) {
                      setSelectedDateKey(toDateKey(day));
                    }
                  }}
                  modifiers={{ hasEvent: eventDays }}
                  modifiersClassNames={{
                    hasEvent:
                      "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-sky-500",
                  }}
                  className="mx-auto w-full"
                  classNames={{
                    months: "flex w-full justify-center",
                    month: "w-full space-y-3",
                    caption: "relative flex h-10 items-center justify-center",
                    caption_label: "text-base font-semibold tracking-wide text-slate-900 dark:text-slate-100",
                    nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1",
                    nav_button:
                      "h-8 w-8 rounded-xl border border-sky-200/70 bg-white/85 text-sky-700 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-sky-950/40",
                    table: "w-full border-collapse",
                    head_row: "grid grid-cols-7",
                    head_cell: "text-center text-xs font-medium text-slate-500 dark:text-slate-400",
                    row: "mt-1 grid grid-cols-7",
                    cell: "p-0 text-center",
                    day:
                      "mx-auto h-9 w-9 rounded-xl text-sm font-medium transition-colors hover:bg-sky-100/80 dark:hover:bg-sky-900/40",
                    day_selected:
                      "bg-sky-500 text-white hover:bg-sky-500 focus:bg-sky-500 dark:bg-sky-500 dark:text-white",
                    day_today: "border border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-200",
                    day_outside: "text-slate-400/60 dark:text-slate-500/70",
                  }}
                />
              </div>
              <div className="mt-3 text-xs text-sky-700/80 dark:text-sky-200/80">
                Jadwal: Baru {summary.byStatus.jadwal_baru} • Tunda {summary.byStatus.tunda} • Batal{" "}
                {summary.byStatus.batal} • Reschedule {summary.byStatus.reschedule}
              </div>
            </motion.div>

            <div ref={asistensiSectionRef}>
              <TsScheduleAssignmentPanel
                dateLabel={formatDateLabel(selectedDateKey)}
                schedules={selectedDateSchedules.map((entry) => ({
                  id: entry.id,
                  tanggal: formatDateLabel(entry.tanggalKey),
                  jam: entry.jamOperasi,
                  dokter: entry.namaDokter,
                  tindakan: entry.jenisTindakan,
                  rumahSakit: entry.rumahSakit,
                  tsMembantu: entry.tsMembantu,
                  status: entry.status,
                  statusLabel: formatStatusLabel(entry.status),
                  isOngoingNow:
                    canShowOngoingStatus(entry.status) &&
                    isOperationHappeningNow(entry.tanggalKey, entry.jamOperasi, currentDateKey, currentMinutes),
                }))}
                tsOptions={tsAssignmentOptions}
                assigningEntryId={updatingEntryId}
                onAssign={handleAssignTs}
                compactMode={compactMode}
              />
            </div>

            <div ref={timSectionRef}>
              <TsTeamRosterPanel
                members={teamMembers}
                loading={teamLoading}
                saving={teamSaving}
                viewMode={staffDesktopViewMode}
                onViewModeChange={setStaffDesktopViewMode}
                onCreate={handleCreateTeamMember}
                onUpdate={handleUpdateTeamMember}
                onDelete={handleDeleteTeamMember}
                onQuickStatusChange={handleQuickTeamStatusChange}
              />
            </div>
          </div>

          <div
            ref={jadwalSectionRef}
            className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/20 via-white to-teal-50/70 p-3 md:p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  Agenda Harian
                </p>
                <h4 className="font-semibold text-base md:text-lg">
                  {formatDateLabel(selectedDateKey)} ({selectedDayAgenda.length}/{selectedDayAgendaBase.length})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ scale: 0.92, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {selectedDayAgenda.length} tampil
                </motion.span>
                <div className="hidden items-center rounded-full border border-emerald-200/70 bg-white/75 p-1 dark:border-emerald-900/60 dark:bg-slate-900/75 md:inline-flex">
                  <Button
                    type="button"
                    size="sm"
                    variant={agendaDesktopViewMode === "table" ? "default" : "ghost"}
                    className="h-8 rounded-full px-3 text-[11px]"
                    onClick={() => setAgendaDesktopViewMode("table")}
                  >
                    Tabel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={agendaDesktopViewMode === "card" ? "default" : "ghost"}
                    className="h-8 rounded-full px-3 text-[11px]"
                    onClick={() => setAgendaDesktopViewMode("card")}
                  >
                    Card
                  </Button>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 md:hidden">
                  Mode tabel
                </span>
              </div>
            </div>

            <div
              className={cn(
                compactMode ? "space-y-2" : "space-y-3",
                selectedDayAgenda.length > 3
                  ? "max-h-[620px] overflow-y-auto pr-1"
                  : "max-h-[70vh] overflow-y-auto pr-1"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${selectedDateKey}-${agendaDesktopViewMode}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-2"
                >
                  <div className="space-y-1.5 md:hidden">
                    {selectedDayAgenda.map((entry) => {
                      const isExpanded = mobileAgendaExpandedId === entry.id;
                      const statusConfig = STATUS_CONFIG[entry.status];
                      const hasUnavailableTs = hasUnavailableAssignedTs(entry.tsMembantu);
                      const isEntryUpdating = updatingEntryId === entry.id;
                      const commentCount = Number(scheduleCommentCountByEntryId[entry.id] || 0);
                      const commentCountLabel = formatBadgeCount(commentCount);
                      const preUrl = resolveImageUrl(entry.preXray, entry.preXrayFileId);
                      const postUrl = resolveImageUrl(entry.postXray, entry.postXrayFileId);
                      const prePreviewModalUrl = resolvePreviewUrl(entry.preXray, entry.preXrayFileId) || preUrl;
                      const postPreviewModalUrl = resolvePreviewUrl(entry.postXray, entry.postXrayFileId) || postUrl;

                      return (
                        <div
                          key={`mobile-accordion-${entry.id}`}
                          data-schedule-entry-id={entry.id}
                          className={cn(
                            "rounded-xl border shadow-sm",
                            statusConfig.cardClass,
                            commentCount > 0 && "ring-1 ring-rose-300/80 dark:ring-rose-800/60",
                            focusedScheduleId === entry.id && "ring-2 ring-cyan-400 dark:ring-cyan-500"
                          )}
                        >
                          <motion.button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left"
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: "spring", stiffness: 420, damping: 22 }}
                            onClick={() =>
                              setMobileAgendaExpandedId((prev) =>
                                prev === entry.id ? null : entry.id
                              )
                            }
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Operasi
                              </p>
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {entry.jenisTindakan || "-"}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {entry.jamOperasi || "--:--"}
                            </span>
                          </motion.button>

                          <AnimatePresence initial={false}>
                            {isExpanded ? (
                              <motion.div
                                key={`agenda-expanded-${entry.id}`}
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 460, damping: 24, mass: 0.7 }}
                                className="space-y-2 border-t border-slate-200/80 px-3 pb-3 pt-2 text-xs dark:border-slate-800"
                              >
                                <div className="grid grid-cols-[84px,1fr] gap-1.5">
                                  <p className="font-semibold text-slate-600 dark:text-slate-300">Dokter</p>
                                  <p className="truncate text-slate-800 dark:text-slate-100">{entry.namaDokter || "-"}</p>
                                  <p className="font-semibold text-slate-600 dark:text-slate-300">Operasi</p>
                                  <p className="truncate text-slate-800 dark:text-slate-100">{entry.jenisTindakan || "-"}</p>
                                  <p className="font-semibold text-slate-600 dark:text-slate-300">Lokasi</p>
                                  <p className="truncate text-slate-800 dark:text-slate-100">{entry.rumahSakit || "-"}</p>
                                  <p className="font-semibold text-slate-600 dark:text-slate-300">Status</p>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusConfig.chipClass)}>
                                      {statusConfig.label}
                                    </span>
                                    {hasUnavailableTs ? (
                                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                        TS tidak tersedia
                                      </span>
                                    ) : null}
                                    {commentCount > 0 ? (
                                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                                        <MessageSquare className="mr-1 h-3 w-3" />
                                        {commentCountLabel} komentar
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="font-semibold text-slate-600 dark:text-slate-300">Ganti Status</p>
                                  <select
                                    value={entry.status}
                                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] dark:border-slate-700 dark:bg-slate-900"
                                    onChange={(event) => void updateScheduleStatus(entry, event.target.value as ScheduleStatus)}
                                    disabled={isEntryUpdating}
                                  >
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                      <option key={`${entry.id}-mobile-status-${key}`} value={key}>
                                        {config.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              {(preUrl || postUrl) ? (
                                <div className="flex items-center gap-1.5">
                                  {preUrl ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() => openImagePreview(prePreviewModalUrl, `Pre X-ray - ${entry.namaDokter || "-"}`)}
                                    >
                                      <ImageIcon className="mr-1 h-3.5 w-3.5" />
                                      Pre
                                    </Button>
                                  ) : null}
                                  {postUrl ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() => openImagePreview(postPreviewModalUrl, `Post X-ray - ${entry.namaDokter || "-"}`)}
                                    >
                                      <ImageIcon className="mr-1 h-3.5 w-3.5" />
                                      Post
                                    </Button>
                                  ) : null}
                                </div>
                              ) : null}

                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    Geser untuk melihat semua aksi
                                  </p>
                                  <div className="-mx-1 overflow-x-auto pb-1">
                                    <div className="flex min-w-max items-center gap-1.5 px-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => openAssignTsDialog(entry.id, entry.tsMembantu || "")}
                                        disabled={isEntryUpdating}
                                      >
                                        Assign
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => confirmAndOpenEditModal(entry)}
                                        disabled={isEntryUpdating}
                                      >
                                        <Pencil className="mr-1 h-3.5 w-3.5" />
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px] text-rose-700 dark:text-rose-300"
                                        onClick={() => void handleDelete(entry.id)}
                                        disabled={isEntryUpdating}
                                      >
                                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                                        Hapus
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => void handleAddScheduleComment(entry.id)}
                                        disabled={isEntryUpdating}
                                      >
                                        <span className="relative mr-1 inline-flex h-3.5 w-3.5 items-center justify-center">
                                          <MessageSquare className="h-3.5 w-3.5" />
                                          {commentCount > 0 ? (
                                            <span className="absolute -right-2 -top-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold leading-none text-white">
                                              {commentCountLabel}
                                            </span>
                                          ) : null}
                                        </span>
                                        Komentar
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => void openScheduleTimeline(entry.id)}
                                        disabled={isEntryUpdating}
                                      >
                                        <History className="mr-1 h-3.5 w-3.5" />
                                        Timeline
                                      </Button>

                                      <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        <FileImage className="h-3.5 w-3.5" />
                                        Pre File
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          disabled={isEntryUpdating}
                                          onChange={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            void handleQuickXrayUpload(entry, "pre", file, "file");
                                            event.currentTarget.value = "";
                                          }}
                                        />
                                      </label>
                                      <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 text-[11px] font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                                        <Camera className="h-3.5 w-3.5" />
                                        Pre Cam
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          className="hidden"
                                          disabled={isEntryUpdating}
                                          onChange={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            void handleQuickXrayUpload(entry, "pre", file, "camera");
                                            event.currentTarget.value = "";
                                          }}
                                        />
                                      </label>
                                      <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        <FileImage className="h-3.5 w-3.5" />
                                        Post File
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          disabled={isEntryUpdating}
                                          onChange={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            void handleQuickXrayUpload(entry, "post", file, "file");
                                            event.currentTarget.value = "";
                                          }}
                                        />
                                      </label>
                                      <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 text-[11px] font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                                        <Camera className="h-3.5 w-3.5" />
                                        Post Cam
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          className="hidden"
                                          disabled={isEntryUpdating}
                                          onChange={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            void handleQuickXrayUpload(entry, "post", file, "camera");
                                            event.currentTarget.value = "";
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className={cn(
                      "hidden overflow-x-auto rounded-xl border border-emerald-200 bg-white/20 dark:border-emerald-900/50 dark:bg-slate-900/70 md:block",
                      agendaDesktopViewMode === "card" ? "md:hidden" : "md:block"
                    )}
                  >
                    <table className="w-full min-w-[1360px] table-fixed text-xs">
                      <thead className="bg-emerald-50/20 dark:bg-emerald-950/30">
                        <tr className="text-left text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          <th className="sticky left-0 z-40 w-[80px] min-w-[80px] overflow-hidden border-r border-emerald-200 bg-emerald-50/95 px-2 py-2 text-emerald-700/70 shadow-[2px_0_0_rgba(16,185,129,0.15)] dark:border-emerald-900/60 dark:bg-emerald-950/95 dark:text-emerald-200/70">
                            Jam
                          </th>
                          <th className="sticky left-[80px] z-30 w-[170px] min-w-[170px] max-w-[170px] overflow-hidden border-r border-emerald-200 bg-emerald-50/95 px-3 py-2 text-emerald-700/70 shadow-[2px_0_0_rgba(16,185,129,0.15)] dark:border-emerald-900/60 dark:bg-emerald-950/95 dark:text-emerald-200/70">
                            Dokter
                          </th>
                          <th className="px-3 py-2">Tindakan</th>
                          <th className="px-3 py-2">Rumah Sakit</th>
                          <th className="px-3 py-2">TS</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="min-w-[170px] px-3 py-2">X-ray</th>
                          <th className="min-w-[220px] px-3 py-2">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDayAgenda.map((entry) => {
                          const isOngoingNow =
                            canShowOngoingStatus(entry.status) &&
                            isOperationHappeningNow(entry.tanggalKey, entry.jamOperasi, currentDateKey, currentMinutes);
                          const hasUnavailableTs = hasUnavailableAssignedTs(entry.tsMembantu);
                          const rowBgClass = isOngoingNow
                            ? "bg-rose-50/30 dark:bg-rose-950/20"
                            : hasUnavailableTs
                              ? "bg-amber-50/70 dark:bg-amber-950/20"
                              : "bg-white/20 dark:bg-slate-900/40";
                          const jamStickyBgClass = isOngoingNow
                            ? "bg-rose-100/45 dark:bg-rose-950/20"
                            : hasUnavailableTs
                              ? "bg-amber-100/45 dark:bg-amber-950/20"
                              : "bg-white/45 dark:bg-slate-900/45";
                          const doctorStickyBgClass = isOngoingNow
                            ? "bg-rose-100/45 dark:bg-rose-950/20"
                            : hasUnavailableTs
                              ? "bg-amber-100/45 dark:bg-amber-950/20"
                              : "bg-white/45 dark:bg-slate-900/35";
                          const statusConfig = STATUS_CONFIG[entry.status];
                          const commentCount = Number(scheduleCommentCountByEntryId[entry.id] || 0);
                          const commentCountLabel = formatBadgeCount(commentCount);
                          const preUrl = resolveImageUrl(entry.preXray, entry.preXrayFileId);
                          const postUrl = resolveImageUrl(entry.postXray, entry.postXrayFileId);
                          const prePreviewModalUrl = resolvePreviewUrl(entry.preXray, entry.preXrayFileId) || preUrl;
                          const postPreviewModalUrl = resolvePreviewUrl(entry.postXray, entry.postXrayFileId) || postUrl;
                          return (
                            <tr
                              key={`table-${entry.id}-${entry.jamOperasi}`}
                              data-schedule-entry-id={entry.id}
                              className={cn(
                                "border-t border-slate-200/80 dark:border-slate-800",
                                rowBgClass,
                                commentCount > 0 && "ring-1 ring-inset ring-rose-200/70 dark:ring-rose-900/40",
                                focusedScheduleId === entry.id && "ring-2 ring-inset ring-cyan-400/90 dark:ring-cyan-500"
                              )}
                            >
                              <td
                                className={cn(
                                  "sticky left-0 z-30 w-[80px] min-w-[80px] overflow-hidden whitespace-nowrap border-r border-slate-200/80 px-2 py-2 shadow-[2px_0_0_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-[2px_0_0_rgba(2,6,23,0.55)]",
                                  jamStickyBgClass
                                )}
                              >
                                <div className="inline-flex items-center gap-1.5 text-slate-900/70 dark:text-slate-100/70">
                                  <Timer className={cn("h-3.5 w-3.5", isOngoingNow ? "text-rose-600 animate-pulse" : "text-slate-500")} />
                                  {entry.jamOperasi || "--:--"}
                                </div>
                              </td>
                              <td
                                className={cn(
                                  "sticky left-[80px] z-20 w-[170px] min-w-[170px] max-w-[170px] overflow-hidden border-r border-slate-200/80 px-3 py-2 font-medium shadow-[2px_0_0_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-[2px_0_0_rgba(2,6,23,0.55)]",
                                  doctorStickyBgClass
                                )}
                              >
                                <span className="block max-w-[160px] truncate text-slate-900/70 dark:text-slate-100/70">
                                  {entry.namaDokter || "-"}
                                </span>
                              </td>
                              <td className="px-3 py-2">{entry.jenisTindakan || "-"}</td>
                              <td className="px-3 py-2">{entry.rumahSakit || "-"}</td>
                              <td className="px-3 py-2">{entry.tsMembantu || "-"}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusConfig.chipClass)}>
                                    {statusConfig.label}
                                  </span>
                                  {hasUnavailableTs ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                      TS tidak tersedia
                                    </span>
                                  ) : null}
                                  {commentCount > 0 ? (
                                    <span className="absolute -right-2 -top-[7px] inline-flex min-w-[12px] items-center justify-center rounded-full w-2 h-3 bg-rose-500 px-0 text-[7px] font-semibold leading-none text-white">
                                      <MessageSquare className="mr-1 h-3 w-3" />
                                      {commentCountLabel}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="min-w-[170px] px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  {preUrl ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-9 px-2 text-[11px]"
                                      onClick={() => openImagePreview(prePreviewModalUrl, `Pre X-ray - ${entry.namaDokter || "-"}`)}
                                    >
                                      <ImageIcon className="mr-1 h-3.5 w-3.5" />
                                      Pre
                                    </Button>
                                  ) : null}
                                  {postUrl ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-9 px-2 text-[11px]"
                                      onClick={() => openImagePreview(postPreviewModalUrl, `Post X-ray - ${entry.namaDokter || "-"}`)}
                                    >
                                      <ImageIcon className="mr-1 h-3.5 w-3.5" />
                                      Post
                                    </Button>
                                  ) : null}
                                  {!preUrl && !postUrl ? <span className="text-xs text-muted-foreground">-</span> : null}
                                </div>
                              </td>
                              <td className="relative z-50 min-w-[220px] px-3 py-2">
                                <div className="inline-flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-2 text-[11px]"
                                    onClick={() => openAssignTsDialog(entry.id, entry.tsMembantu || "")}
                                  >
                                    Assign
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => void handleAddScheduleComment(entry.id)}
                                    title={`Komentar timeline${commentCount > 0 ? ` (${commentCountLabel})` : ""}`}
                                  >
                                    <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                                      {commentCount > 0 ? (
                                        <span className="absolute -right-2 -top-[7px] inline-flex min-w-[12px] items-center justify-center rounded-full w-2 h-3 bg-rose-500 px-0 text-[7px] font-semibold leading-none text-white">
                                          {commentCountLabel}
                                        </span>
                                      ) : null}
                                    </span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => void openScheduleTimeline(entry.id)}
                                    title="Timeline perubahan"
                                  >
                                    <History className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => confirmAndOpenEditModal(entry)} title="Edit jadwal">
                                    <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => void handleDelete(entry.id)} title="Hapus jadwal">
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div
                    className={cn(
                      "hidden grid-cols-1 gap-2.5 md:grid xl:grid-cols-2",
                      agendaDesktopViewMode === "card" ? "md:grid" : "md:hidden"
                    )}
                  >
                    <AnimatePresence initial={false}>
                      {selectedDayAgenda.map((entry) => {
                        const isOngoingNow =
                          canShowOngoingStatus(entry.status) &&
                          isOperationHappeningNow(entry.tanggalKey, entry.jamOperasi, currentDateKey, currentMinutes);
                        const hasUnavailableTs = hasUnavailableAssignedTs(entry.tsMembantu);
                        const isEntryUpdating = updatingEntryId === entry.id;
                        const statusConfig = STATUS_CONFIG[entry.status];
                        const commentCount = Number(scheduleCommentCountByEntryId[entry.id] || 0);
                        const commentCountLabel = formatBadgeCount(commentCount);
                        const preUrl = resolveImageUrl(entry.preXray, entry.preXrayFileId);
                        const postUrl = resolveImageUrl(entry.postXray, entry.postXrayFileId);
                        const prePreviewModalUrl = resolvePreviewUrl(entry.preXray, entry.preXrayFileId) || preUrl;
                        const postPreviewModalUrl = resolvePreviewUrl(entry.postXray, entry.postXrayFileId) || postUrl;
                        return (
                          <motion.div
                            layout
                            key={`card-${entry.id}-${entry.jamOperasi}`}
                            {...LIST_ITEM_MOTION}
                            whileTap={{ scale: 0.992 }}
                            data-schedule-entry-id={entry.id}
                            className={cn(
                              "rounded-xl border px-3 py-2.5 shadow-sm",
                              statusConfig.cardClass,
                              commentCount > 0 && "ring-1 ring-rose-300/80 dark:ring-rose-800/60",
                              focusedScheduleId === entry.id && "ring-2 ring-cyan-400 dark:ring-cyan-500"
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                  <Timer className={cn("h-3.5 w-3.5", isOngoingNow ? "animate-pulse text-rose-600" : "text-emerald-600")} />
                                  {entry.jamOperasi || "--:--"}
                                </p>
                                <p className="text-sm font-semibold">{entry.namaDokter || "-"}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusConfig.chipClass)}>
                                  {statusConfig.label}
                                </span>
                                {hasUnavailableTs ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                    TS tidak tersedia
                                  </span>
                                ) : null}
                                {commentCount > 0 ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                                    <MessageSquare className="mr-1 h-3 w-3" />
                                    {commentCountLabel} komentar
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tindakan</p>
                                <p className="truncate font-medium">{entry.jenisTindakan || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rumah Sakit</p>
                                <p className="truncate font-medium">{entry.rumahSakit || "-"}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">TS Membantu</p>
                                <p className="truncate font-medium">{entry.tsMembantu || "-"}</p>
                              </div>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {preUrl ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-[11px]"
                                  onClick={() => openImagePreview(prePreviewModalUrl, `Pre X-ray - ${entry.namaDokter || "-"}`)}
                                >
                                  <ImageIcon className="mr-1 h-3.5 w-3.5" />
                                  Pre
                                </Button>
                              ) : null}
                              {postUrl ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-[11px]"
                                  onClick={() => openImagePreview(postPreviewModalUrl, `Post X-ray - ${entry.namaDokter || "-"}`)}
                                >
                                  <ImageIcon className="mr-1 h-3.5 w-3.5" />
                                  Post
                                </Button>
                              ) : null}
                              {!preUrl && !postUrl ? <span className="text-xs text-muted-foreground">X-ray belum tersedia</span> : null}
                            </div>

                            <div className="mt-2.5 space-y-1">
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                Slide aksi card
                              </p>
                              <div className="-mx-1 overflow-x-auto pb-1">
                                <div className="flex min-w-max items-center gap-1.5 px-1">
                                  <select
                                    value={entry.status}
                                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] dark:border-slate-700 dark:bg-slate-900"
                                    onChange={(event) => void updateScheduleStatus(entry, event.target.value as ScheduleStatus)}
                                    disabled={isEntryUpdating}
                                  >
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                      <option key={`${entry.id}-card-status-${key}`} value={key}>
                                        {config.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-[11px]"
                                    onClick={() => openAssignTsDialog(entry.id, entry.tsMembantu || "")}
                                    disabled={isEntryUpdating}
                                  >
                                    Assign
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-[11px]"
                                    onClick={() => confirmAndOpenEditModal(entry)}
                                    disabled={isEntryUpdating}
                                  >
                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-[11px] text-rose-700 dark:text-rose-300"
                                    onClick={() => void handleDelete(entry.id)}
                                    disabled={isEntryUpdating}
                                  >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    Hapus
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-[11px]"
                                    onClick={() => void handleAddScheduleComment(entry.id)}
                                    disabled={isEntryUpdating}
                                  >
                                    <span className="relative mr-1 inline-flex h-3.5 w-3.5 items-center justify-center">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      {commentCount > 0 ? (
                                        <span className="absolute -right-2 -top-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold leading-none text-white">
                                          {commentCountLabel}
                                        </span>
                                      ) : null}
                                    </span>
                                    Komentar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-[11px]"
                                    onClick={() => void openScheduleTimeline(entry.id)}
                                    disabled={isEntryUpdating}
                                  >
                                    <History className="mr-1 h-3.5 w-3.5" />
                                    Timeline
                                  </Button>

                                  <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <FileImage className="h-3.5 w-3.5" />
                                    Pre File
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isEntryUpdating}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0] || null;
                                        void handleQuickXrayUpload(entry, "pre", file, "file");
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                  <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 text-[11px] font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                                    <Camera className="h-3.5 w-3.5" />
                                    Pre Cam
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      disabled={isEntryUpdating}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0] || null;
                                        void handleQuickXrayUpload(entry, "pre", file, "camera");
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                  <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <FileImage className="h-3.5 w-3.5" />
                                    Post File
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isEntryUpdating}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0] || null;
                                        void handleQuickXrayUpload(entry, "post", file, "file");
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                  <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 text-[11px] font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                                    <Camera className="h-3.5 w-3.5" />
                                    Post Cam
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      disabled={isEntryUpdating}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0] || null;
                                        void handleQuickXrayUpload(entry, "post", file, "camera");
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  {!loading && selectedDayAgenda.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Tidak ada jadwal pada tanggal / filter ini.
                    </div>
                  ) : null}
                  {loading ? (
                    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-4/5" />
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </Card>

      {!isReadonlyMode ? (
        <>
          <div className="fixed inset-x-0 bottom-16 z-50 flex justify-center md:hidden">
            <Button
              type="button"
              size="icon"
              className="h-16 w-16 rounded-full border border-blue-400/30 bg-blue-600 text-white shadow-[0_16px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500"
              onClick={() => {
                setCreateStep("data");
                setFormOpen(true);
              }}
              aria-label="Tambah Jadwal"
            >
              <Plus className="h-7 w-7" />
            </Button>
          </div>

          <div className="fixed inset-x-3 bottom-3 z-40 rounded-full border border-slate-300/30 bg-slate-950/90 p-2 shadow-[0_16px_32px_rgba(2,6,23,0.45)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/95 md:hidden">
            <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
              {(
                [
                  { key: "jadwal", label: "Jadwal", icon: CalendarDays },
                  { key: "asistensi", label: "Asistensi", icon: Sparkles },
                  { key: "tim", label: "Tim", icon: Users },
                  { key: "lainnya", label: "Lainnya", icon: History },
                ] as const
              ).map((tab) => {
                const isActive = manageMobileTab === tab.key;
                const Icon = tab.icon;

                return (
                  <Button
                    key={tab.key}
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-full px-1 text-[11px] transition-all duration-200",
                      isActive
                        ? "!bg-white !text-slate-900 shadow-[0_6px_18px_rgba(255,255,255,0.25)] hover:!bg-white hover:!text-slate-900"
                        : "text-slate-100/90 hover:bg-white/10 hover:text-white"
                    )}
                    onClick={() => scrollToManageSection(tab.key)}
                  >
                    <span
                      className={cn(
                        "flex flex-col items-center gap-0.5",
                        isActive ? "text-slate-900" : "text-inherit"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-current")} />
                      {tab.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <TsConfirmDialog
        open={confirmDialogOpen}
        title={confirmDialogTitle}
        description={confirmDialogDescription}
        confirmText={confirmDialogConfirmText}
        destructive={confirmDialogDestructive}
        loading={confirmDialogLoading}
        onOpenChange={(open) => {
          if (!open) closeConfirmDialog();
        }}
        onConfirm={executeConfirmDialog}
      />

      <TsTextDialog
        open={textDialogOpen}
        title={textDialogTitle}
        description={textDialogDescription}
        label={textDialogLabel}
        placeholder={textDialogPlaceholder}
        submitText={textDialogSubmitText}
        multiline={textDialogMultiline}
        value={textDialogValue}
        loading={textDialogLoading}
        onOpenChange={(open) => {
          if (!open) closeTextDialog();
        }}
        onValueChange={setTextDialogValue}
        onSubmit={executeTextDialog}
      />

      <Dialog
        open={rescheduleDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeRescheduleDialog();
        }}
      >
        <DialogContent className="max-h-[92vh] w-[calc(100vw-0.75rem)] max-w-3xl overflow-y-auto p-0 sm:w-full sm:p-6">
          <DialogHeader>
            <DialogTitle>Reschedule Jadwal</DialogTitle>
            <DialogDescription>
              Ubah tanggal dan jam operasi untuk jadwal ini.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3 p-4 sm:p-0"
            onSubmit={(event) => {
              event.preventDefault();
              void submitRescheduleDialog();
            }}
          >
            <div className="rounded-xl border p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Data Reschedule
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Tanggal Operasi</label>
                  <Input
                    type="date"
                    value={rescheduleDate}
                    onChange={(event) => setRescheduleDate(event.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Jam Operasi (opsional)</label>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(event) => setRescheduleTime(event.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-4 mt-1 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={closeRescheduleDialog}
                  disabled={rescheduleDialogSaving}
                >
                  Tutup
                </Button>
                <Button type="submit" className="h-11 flex-1" disabled={rescheduleDialogSaving}>
                  {rescheduleDialogSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Simpan Reschedule
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <TsSummaryQuickViewDialog
        open={Boolean(summaryQuickViewData)}
        onOpenChange={(open) => {
          if (!open) setSummaryQuickViewKey(null);
        }}
        title={summaryQuickViewData?.title || "Ringkasan Jadwal"}
        subtitle={summaryQuickViewData?.subtitle || ""}
        items={summaryQuickViewData?.items || []}
      />

      <Dialog
        open={scheduleCommentsOpen}
        onOpenChange={(open) => {
          if (open) {
            setScheduleCommentsOpen(true);
            return;
          }
          closeScheduleCommentsDialog();
        }}
      >
        <DialogContent className="max-w-[calc(100vw-0.75rem)] overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b bg-slate-50 px-4 py-3 dark:bg-slate-900/70 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                {String(scheduleCommentEntry?.namaDokter || "TS")
                  .trim()
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() || "")
                  .join("") || "TS"}
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-left">
                  {scheduleCommentEntry?.namaDokter || scheduleCommentEntryId || "Komentar Agenda"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-left">
                  {scheduleCommentEntry
                    ? `${formatDateLabel(scheduleCommentEntry.tanggalOperasi)} • ${scheduleCommentEntry.jenisTindakan} • ${scheduleCommentEntry.rumahSakit}`
                    : "Riwayat percakapan komentar agenda operasi"}
                </DialogDescription>
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-300">
                  ● Timeline komentar aktif ({scheduleComments.length})
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex max-h-[82vh] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-3 py-4 dark:bg-slate-950/40 sm:px-5">
              {scheduleCommentsLoading && scheduleComments.length === 0 ? (
                <div className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : null}

              {scheduleCommentsLoading && scheduleComments.length > 0 ? (
                <p className="text-xs text-muted-foreground">Memperbarui komentar...</p>
              ) : null}

              {!scheduleCommentsLoading && scheduleCommentsError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                  {scheduleCommentsError}
                </div>
              ) : null}

              {!scheduleCommentsLoading && !scheduleCommentsError && scheduleCommentsChronological.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Belum ada komentar untuk agenda ini.
                </div>
              ) : null}

              {!scheduleCommentsLoading && !scheduleCommentsError
                ? scheduleCommentsChronological.map((item) => renderScheduleCommentMessage(item))
                : null}
            </div>

            <div className="border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-5">
              {scheduleCommentReplyToId ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-2 text-xs text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                  <span className="truncate">
                    Membalas komentar: <span className="font-semibold">{scheduleCommentReplyTargetLabel || "-"}</span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setScheduleCommentReplyToId("")}
                    disabled={scheduleCommentSaving}
                  >
                    Batal
                  </Button>
                </div>
              ) : null}

              <label className="text-xs font-medium text-muted-foreground">Tulis pesan komentar</label>
              <Textarea
                value={scheduleCommentDraft}
                onChange={(event) => setScheduleCommentDraft(event.target.value)}
                placeholder={
                  scheduleCommentReplyToId
                    ? "Tulis balasan komentar..."
                    : "Tulis komentar untuk update agenda ini..."
                }
                className="mt-1 min-h-[72px] text-sm"
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void submitScheduleCommentFromModal();
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {scheduleComments.length} pesan • Ctrl/Cmd + Enter untuk kirim cepat
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3"
                    onClick={closeScheduleCommentsDialog}
                    disabled={scheduleCommentSaving}
                  >
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    className="h-9 px-3"
                    onClick={() => void submitScheduleCommentFromModal()}
                    disabled={scheduleCommentSaving || Boolean(scheduleCommentDeletingId) || !scheduleCommentDraft.trim()}
                  >
                    {scheduleCommentSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationCenterOpen} onOpenChange={setNotificationCenterOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Riwayat Timeline Aktivitas</DialogTitle>
            <DialogDescription>
              Timeline aktivitas user langsung dari ActivityLog.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
            {notificationCenterLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : null}

            {!notificationCenterLoading && notificationCenterError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                {notificationCenterError}
              </div>
            ) : null}

            {!notificationCenterLoading && !notificationCenterError && notificationCenterItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Belum ada riwayat aktivitas dari ActivityLog.
              </div>
            ) : null}

            {!notificationCenterLoading && !notificationCenterError
              ? (
                <div className="relative space-y-2.5 pl-5">
                  {notificationCenterItems.length > 0 ? (
                    <span className="pointer-events-none absolute bottom-0 left-1.5 top-0 w-[2px] rounded-full bg-slate-200 dark:bg-slate-700" />
                  ) : null}
                  {notificationCenterItems.map((item) => {
                    const meta = getNotificationItemMeta(item);
                    const agendaMeta = getNotificationAgendaMeta(item);
                    const actorLabel =
                      item.actor?.username
                        ? `@${item.actor.username}`
                        : item.actor?.name || item.actor?.email || "-";
                    const actorName = item.actor?.name || actorLabel;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className="relative w-full rounded-xl border border-slate-200 bg-white/80 p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-cyan-700/70 dark:hover:bg-cyan-950/20"
                        onClick={() => handleNotificationItemClick(item)}
                      >
                        <span
                          className={cn(
                            "absolute -left-[18px] top-5 inline-flex h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-950",
                            meta.dotClass
                          )}
                        />
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {actorName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{actorLabel}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm">
                          <span className="font-medium">{meta.label}</span>
                          {meta.detail ? ` • ${meta.detail}` : ""}
                        </p>
                        {agendaMeta.agendaLabel ? (
                          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                            Agenda: <span className="font-medium">{agendaMeta.agendaLabel}</span>
                            {agendaMeta.agendaDateLabel ? ` • ${agendaMeta.agendaDateLabel}` : ""}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatAuditActionLabel(item.action)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )
              : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Timeline Jadwal • {auditTargetEntryId || "-"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
            {auditLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ) : null}
            {!auditLoading && auditError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                {auditError}
              </div>
            ) : null}
            {!auditLoading && !auditError && auditLogs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Belum ada riwayat perubahan untuk jadwal ini.
              </div>
            ) : null}
            {!auditLoading && !auditError
              ? auditLogs.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                            item.action.includes("delete")
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                              : item.action.includes("update")
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          )}
                        >
                          {formatAuditActionLabel(item.action)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Oleh:{" "}
                        <span className="font-medium">
                          {item.actor?.username
                            ? `@${item.actor.username}`
                            : item.actor?.name || "-"}
                        </span>{" "}
                        ({item.actor?.name || "-"} • {item.actor?.email || "-"})
                      </p>
                    </div>
                    {getAuditCommentText(item) ? (
                      <div className="mb-2 rounded-md border border-indigo-200 bg-indigo-50/70 px-2.5 py-2 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                        <span className="font-semibold">Komentar:</span>{" "}
                        {getAuditCommentText(item)}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Before
                        </p>
                        <pre className="max-h-44 overflow-auto rounded-md bg-slate-100 p-2 text-[11px] leading-relaxed dark:bg-slate-950">
                          {item.before ? JSON.stringify(item.before, null, 2) : "-"}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          After
                        </p>
                        <pre className="max-h-44 overflow-auto rounded-md bg-slate-100 p-2 text-[11px] leading-relaxed dark:bg-slate-950">
                          {item.after ? JSON.stringify(item.after, null, 2) : "-"}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(imagePreview)}
        onOpenChange={(open) => {
          if (!open) setImagePreview(null);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{imagePreview?.title || "Preview Foto"}</DialogTitle>
          </DialogHeader>
          {imagePreview ? (
            <div className="max-h-[80vh] overflow-auto rounded-md border bg-black/5 p-2 dark:bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview.url}
                alt={imagePreview.title}
                className="mx-auto h-auto max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
