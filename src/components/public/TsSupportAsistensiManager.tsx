"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  ImageIcon,
  Maximize2,
  Minimize2,
  Pencil,
  RotateCcw,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import TsScheduleAssignmentPanel from "@/components/public/TsScheduleAssignmentPanel";
import TsReadonlyOpsAndTeamPanel from "@/components/public/TsReadonlyOpsAndTeamPanel";
import TsSummaryQuickViewDialog, { type TsSummaryQuickViewItem } from "@/components/public/TsSummaryQuickViewDialog";
import TsTeamRosterPanel, {
  type TeamAvailabilityStatus,
  type TeamMemberRole,
  type TeamRosterViewMode,
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
    cardClass: "border-blue-200/80 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20",
    headerClass:
      "from-blue-50/95 to-blue-100/70 border-blue-200/70 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-900/50",
  },
  tunda: {
    label: "Tunda",
    chipClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    cardClass: "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20",
    headerClass:
      "from-amber-50/95 to-amber-100/70 border-amber-200/70 dark:from-amber-950/40 dark:to-amber-900/20 dark:border-amber-900/50",
  },
  batal: {
    label: "Batal",
    chipClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    cardClass: "border-rose-200/80 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20",
    headerClass:
      "from-rose-50/95 to-rose-100/70 border-rose-200/70 dark:from-rose-950/40 dark:to-rose-900/20 dark:border-rose-900/50",
  },
  reschedule: {
    label: "Reschedule",
    chipClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
    cardClass:
      "border-violet-200/80 bg-violet-50/70 dark:border-violet-900/50 dark:bg-violet-950/20",
    headerClass:
      "from-violet-50/95 to-violet-100/70 border-violet-200/70 dark:from-violet-950/40 dark:to-violet-900/20 dark:border-violet-900/50",
  },
  selesai: {
    label: "Selesai",
    chipClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    cardClass:
      "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20",
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

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

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

const summarizeStatusCounts = (entries: TsSupportEntry[]) => {
  const statusMap = new Map<ScheduleStatus, number>();
  for (const entry of entries) {
    statusMap.set(entry.status, (statusMap.get(entry.status) || 0) + 1);
  }
  return (Object.keys(STATUS_CONFIG) as ScheduleStatus[])
    .filter((status) => (statusMap.get(status) || 0) > 0)
    .map((status) => `${statusMap.get(status)} ${formatStatusLabel(status).toLowerCase()}`);
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
  const [editingOriginalXray, setEditingOriginalXray] = useState({
    preXray: "",
    preXrayFileId: "",
    postXray: "",
    postXrayFileId: "",
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [nowTick, setNowTick] = useState(() => new Date());
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [nativePermission, setNativePermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );
  const previousEntriesRef = useRef<TsSupportEntry[]>([]);
  const hasLoadedOnceRef = useRef(false);
  const suppressNextDiffNotificationRef = useRef(false);
  const jadwalSectionRef = useRef<HTMLDivElement | null>(null);
  const asistensiSectionRef = useRef<HTMLDivElement | null>(null);
  const timSectionRef = useRef<HTMLDivElement | null>(null);
  const lainnyaSectionRef = useRef<HTMLDivElement | null>(null);

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
          hasLoadedOnceRef.current = true;
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
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNativePermission("unsupported");
      return;
    }
    setNativePermission(Notification.permission);
  }, []);

  const pushNativeNotification = useCallback((title: string, message: string) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!message.trim()) return;

    try {
      new Notification(title, {
        body: message,
        icon: "/KBN.png",
        badge: "/KBN.png",
        tag: `ts-support-${Date.now()}`,
      });
    } catch (error) {
      console.error("Gagal menampilkan native notification", error);
    }
  }, []);

  const requestNativePermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser tidak mendukung native notification.");
      setNativePermission("unsupported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNativePermission(permission);
      if (permission === "granted") {
        toast.success("Native notification aktif.");
        pushNativeNotification("TS Support Aktif", "Anda akan menerima notifikasi update jadwal.");
      } else if (permission === "denied") {
        toast.error("Native notification diblokir. Ubah di pengaturan browser.");
      } else {
        toast.message("Permintaan notifikasi ditutup.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal meminta izin native notification.");
    }
  }, [pushNativeNotification]);

  const handleNativeNotificationButton = useCallback(() => {
    if (nativePermission === "unsupported") {
      toast.error("Browser tidak mendukung native notification.");
      return;
    }
    if (nativePermission === "granted") {
      pushNativeNotification("Tes Notifikasi Jadwal", "Native notification berjalan normal.");
      toast.success("Notifikasi tes dikirim.");
      return;
    }
    if (nativePermission === "denied") {
      toast.error("Native notification diblokir. Aktifkan dari setting browser.");
      return;
    }
    void requestNativePermission();
  }, [nativePermission, pushNativeNotification, requestNativePermission]);

  const notifyScheduleChanges = useCallback((previousEntries: TsSupportEntry[], nextEntries: TsSupportEntry[]) => {
    if (previousEntries.length === 0 || nextEntries.length === 0) return;

    const previousMap = new Map(previousEntries.map((entry) => [entry.id, entry]));
    const nextMap = new Map(nextEntries.map((entry) => [entry.id, entry]));

    const newEntries = nextEntries.filter((entry) => !previousMap.has(entry.id));
    const deletedEntries = previousEntries.filter((entry) => !nextMap.has(entry.id));
    const statusChangedEntries = nextEntries.filter((entry) => {
      const previous = previousMap.get(entry.id);
      return Boolean(previous && previous.status !== entry.status);
    });
    const scheduleUpdatedEntries = nextEntries.filter((entry) => {
      const previous = previousMap.get(entry.id);
      if (!previous) return false;
      if (previous.status !== entry.status) return false;
      return previous.tanggalKey !== entry.tanggalKey || previous.jamOperasi !== entry.jamOperasi;
    });

    const notifications: string[] = [];
    if (newEntries.length > 0) {
      notifications.push(`jadwal baru ${newEntries.length}`);
    }
    const statusSummary = summarizeStatusCounts(statusChangedEntries);
    if (statusSummary.length > 0) {
      notifications.push(...statusSummary);
    }
    if (scheduleUpdatedEntries.length > 0) {
      notifications.push(`jadwal diubah ${scheduleUpdatedEntries.length}`);
    }
    if (deletedEntries.length > 0) {
      notifications.push(`jadwal dihapus ${deletedEntries.length}`);
    }

    if (notifications.length > 0) {
      const message = notifications.join(" • ");
      toast.success(`Notifikasi jadwal: ${message}`);
      pushNativeNotification("Update Jadwal Operasi", message);
    }
  }, [pushNativeNotification]);

  const fetchEntries = useCallback(async (options?: { silentError?: boolean }) => {
    const silentError = options?.silentError ?? false;
    const suppressDiff = suppressNextDiffNotificationRef.current;
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
      if (hasLoadedOnceRef.current && !suppressDiff) {
        notifyScheduleChanges(previousEntriesRef.current, normalizedEntries);
      }
      previousEntriesRef.current = normalizedEntries;
      hasLoadedOnceRef.current = true;
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
  }, [notifyScheduleChanges]);

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

  useEffect(() => {
    void fetchEntries();
    void fetchTeamMembers();
  }, [fetchEntries, fetchTeamMembers]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchEntries({ silentError: true });
      void fetchTeamMembers({ silentError: true });
    }, 45_000);
    return () => window.clearInterval(intervalId);
  }, [fetchEntries, fetchTeamMembers]);

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

  const selectedDateSchedules = useMemo(() => {
    return manageScopedEntries
      .filter((entry) => entry.tanggalKey === selectedDateKey)
      .sort((a, b) => toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi));
  }, [manageScopedEntries, selectedDateKey]);

  const tsAssignmentOptions = useMemo(() => {
    const map = new Map<string, TeamAvailabilityStatus>();
    for (const member of teamMembers) {
      const canAssist = member.role === "ts" || member.role === "";
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
            selesai: summary.byStatus.selesai,
          },
    [
      isReadonlyMode,
      managementSummary.needsAttention,
      summary.byStatus.selesai,
      summary.total,
      todayEntries.length,
      todayNeedsAttentionEntries.length,
      todaySelesaiEntries.length,
    ]
  );

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
      void processPendingCreates();
    }, 45_000);
    return () => window.clearInterval(intervalId);
  }, [processPendingCreates]);

  const handleCreateTeamMember = async (input: TsTeamMemberSaveInput, file: File | null) => {
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
      toast.success("Team TS berhasil ditambahkan.");
      await fetchTeamMembers();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal menambah Team TS");
    } finally {
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

  const handleDeleteTeamMember = async (memberNo: string) => {
    if (!memberNo) return;
    if (!confirm(`Hapus Team TS No ${memberNo}?`)) return;
    setTeamSaving(true);
    try {
      await postAction({ action: "deleteTeamTs", data: { no: memberNo } }, "Gagal menghapus Team TS");
      toast.success("Team TS berhasil dihapus.");
      await fetchTeamMembers();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Gagal menghapus Team TS");
    } finally {
      setTeamSaving(false);
    }
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

  const handleDelete = async (entryId: string) => {
    if (!entryId) return;
    if (!confirm("Hapus jadwal ini?")) return;

    try {
      await postAction({ action: "delete", data: { submissionId: entryId } }, "Gagal hapus data");
      toast.success("Jadwal berhasil dihapus");
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Gagal menghapus data");
    }
  };

  const updateScheduleStatus = async (
    entry: TsSupportEntry,
    status: ScheduleStatus,
    overrides?: { tanggalOperasi?: string; jamOperasi?: string; tsMembantu?: string; successMessage?: string }
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

  const handleReschedule = async (entry: TsSupportEntry) => {
    const nextDate = prompt(
      "Masukkan tanggal baru (format YYYY-MM-DD):",
      entry.tanggalKey || toDateKey(new Date())
    );
    if (!nextDate) return;
    const cleanedDate = nextDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedDate)) {
      toast.error("Format tanggal harus YYYY-MM-DD.");
      return;
    }

    const nextTime = prompt("Masukkan jam baru opsional (format HH:mm):", entry.jamOperasi || "");
    const cleanedTime = (nextTime || "").trim();
    if (cleanedTime && !/^\d{2}:\d{2}$/.test(cleanedTime)) {
      toast.error("Format jam harus HH:mm.");
      return;
    }

    await updateScheduleStatus(entry, "reschedule", {
      tanggalOperasi: cleanedDate,
      jamOperasi: cleanedTime || entry.jamOperasi,
    });
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

  return (
    <div
      className={cn(
        compactMode ? "mx-auto w-full max-w-[1200px] space-y-3" : "mx-auto w-full max-w-[1200px] space-y-5",
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
                        <Input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(event) => setPreFile(event.target.files?.[0] || null)}
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
                        <Input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(event) => setPostFile(event.target.files?.[0] || null)}
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Edit Jadwal Operasi</DialogTitle>
              </DialogHeader>

              <form onSubmit={onEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div>
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

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 space-y-2">
                    <label className="text-xs text-muted-foreground">Foto X-ray Pre</label>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => handleEditFileChange("preXray", event.target.files?.[0] || null)}
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
                      Hapus Foto
                    </Button>
                  </div>

                  <div className="rounded-lg border p-3 space-y-2">
                    <label className="text-xs text-muted-foreground">Foto X-ray Post</label>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => handleEditFileChange("postXray", event.target.files?.[0] || null)}
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
                      Hapus Foto
                    </Button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(event) => updateEditForm("notes", event.target.value)}
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <Button type="submit" className="h-11 px-4" disabled={editSaving}>
                    {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                  <Button type="button" variant="outline" className="h-11 px-4" onClick={resetEditState}>
                    Tutup
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
      ) : null}

      <Card className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 sm:max-w-none md:p-5">
        <div ref={lainnyaSectionRef} className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-lg">Kalender & Agenda Operasi</h3>
              <p className="text-sm text-muted-foreground">
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
                  className="h-9 w-9 border-transparent"
                  onClick={handleNativeNotificationButton}
                  disabled={nativePermission === "unsupported"}
                  title={nativePermission === "granted" ? "Notifikasi aktif" : "Aktifkan notifikasi"}
                >
                  {nativePermission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              </motion.div>
              </div>
              {!readonlyOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  className="hidden h-9 px-3 text-xs md:inline-flex"
                  onClick={() => setPanelMode((prev) => (prev === "manage" ? "readonly" : "manage"))}
                >
                  {panelMode === "manage" ? "Mode Lihat Saja" : "Mode Manajemen"}
                </Button>
              ) : null}
            </div>
          </div>

          {!compactMode ? (
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
                  {isReadonlyMode ? formatDateLabel(currentDateKey) : "Jadwal terselesaikan"}
                </p>
              </motion.button>
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
          </div>
        </div>

        {isReadonlyMode ? (
          <TsReadonlyOpsAndTeamPanel
            schedules={readOnlySchedules}
            teamMembers={teamMembers}
            loadingSchedules={loading}
            loadingTeam={teamLoading}
            updatingScheduleId={updatingEntryId}
            onCreateSchedule={handleReadonlyCreateSchedule}
            onAssignSchedule={async (entryId) => {
              const target = entries.find((item) => item.id === entryId);
              if (!target) return;
              const nextTs = prompt(
                "Masukkan nama TS yang membantu (pisahkan koma jika lebih dari satu):",
                target.tsMembantu || ""
              );
              if (nextTs === null) return;
              await handleAssignTs(entryId, nextTs);
            }}
            onEditSchedule={async (entryId) => {
              const target = entries.find((item) => item.id === entryId);
              if (!target) return;
              if (readonlyOnly) {
                await handleReschedule(target);
                return;
              }
              openEditModal(target);
            }}
            onDeleteSchedule={async (entryId) => {
              await handleDelete(entryId);
            }}
            onScheduleStatusChange={async (entryId, status) => {
              const entry = entries.find((item) => item.id === entryId);
              if (!entry) return;
              await updateScheduleStatus(entry, status);
            }}
          />
        ) : (
          <div className={cn(compactMode ? "space-y-3" : "space-y-4")}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,minmax(0,1fr),420px] xl:grid-cols-[300px,minmax(0,1fr),460px]">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/20 via-white to-cyan-50/70 p-3 shadow-sm dark:border-sky-900/50 dark:from-sky-950/30 dark:via-slate-900 dark:to-cyan-950/20"
            >
              <div className="flex items-center gap-2 mb-2 text-sm text-sky-700 dark:text-sky-300">
                <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                Pilih tanggal
              </div>
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
                    "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-sky-500",
                }}
                className="w-full"
              />
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
                  <div
                    className={cn(
                      "overflow-x-auto rounded-xl border border-emerald-200 bg-white/20 dark:border-emerald-900/50 dark:bg-slate-900/70",
                      agendaDesktopViewMode === "card" && "md:hidden"
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
                          const preUrl = resolveImageUrl(entry.preXray, entry.preXrayFileId);
                          const postUrl = resolveImageUrl(entry.postXray, entry.postXrayFileId);
                          const prePreviewModalUrl = resolvePreviewUrl(entry.preXray, entry.preXrayFileId) || preUrl;
                          const postPreviewModalUrl = resolvePreviewUrl(entry.postXray, entry.postXrayFileId) || postUrl;
                          return (
                            <tr
                              key={`table-${entry.id}-${entry.jamOperasi}`}
                              className={cn(
                                "border-t border-slate-200/80 dark:border-slate-800",
                                rowBgClass
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
                                    onClick={() => {
                                      const nextTs = prompt(
                                        "Masukkan nama TS yang membantu (pisahkan koma jika lebih dari satu):",
                                        entry.tsMembantu || ""
                                      );
                                      if (nextTs === null) return;
                                      void handleAssignTs(entry.id, nextTs);
                                    }}
                                  >
                                    Assign
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEditModal(entry)} title="Edit jadwal">
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
                        const statusConfig = STATUS_CONFIG[entry.status];
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
                            className={cn(
                              "rounded-xl border px-3 py-2.5 shadow-sm",
                              statusConfig.cardClass
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

                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-[11px]"
                                onClick={() => {
                                  const nextTs = prompt(
                                    "Masukkan nama TS yang membantu (pisahkan koma jika lebih dari satu):",
                                    entry.tsMembantu || ""
                                  );
                                  if (nextTs === null) return;
                                  void handleAssignTs(entry.id, nextTs);
                                }}
                              >
                                Assign
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-[11px]"
                                onClick={() => openEditModal(entry)}
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5 text-blue-500" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-[11px]"
                                onClick={() => void handleDelete(entry.id)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
                                Hapus
                              </Button>
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
          <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-3 md:hidden">
            <Button
              type="button"
              className="h-12 w-full max-w-md rounded-full shadow-lg shadow-emerald-900/20"
              onClick={() => {
                setCreateStep("data");
                setFormOpen(true);
              }}
            >
              + Tambah Jadwal
            </Button>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
            <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
              <Button
                type="button"
                variant={manageMobileTab === "jadwal" ? "default" : "ghost"}
                className="h-11 px-2 text-xs"
                onClick={() => scrollToManageSection("jadwal")}
              >
                Jadwal
              </Button>
              <Button
                type="button"
                variant={manageMobileTab === "asistensi" ? "default" : "ghost"}
                className="h-11 px-2 text-xs"
                onClick={() => scrollToManageSection("asistensi")}
              >
                Asistensi
              </Button>
              <Button
                type="button"
                variant={manageMobileTab === "tim" ? "default" : "ghost"}
                className="h-11 px-2 text-xs"
                onClick={() => scrollToManageSection("tim")}
              >
                Tim
              </Button>
              <Button
                type="button"
                variant={manageMobileTab === "lainnya" ? "default" : "ghost"}
                className="h-11 px-2 text-xs"
                onClick={() => scrollToManageSection("lainnya")}
              >
                Lainnya
              </Button>
            </div>
          </div>
        </>
      ) : null}

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
