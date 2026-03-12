"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  BellOff,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  ImageIcon,
  LayoutGrid,
  Maximize2,
  MapPin,
  Minimize2,
  Pencil,
  RotateCw,
  Search,
  Sparkles,
  Stethoscope,
  Table2,
  Timer,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TsScheduleAssignmentPanel from "@/components/public/TsScheduleAssignmentPanel";
import TsSummaryQuickViewDialog, { type TsSummaryQuickViewItem } from "@/components/public/TsSummaryQuickViewDialog";
import { toSafeImageSrc } from "@/lib/googleDriveImage";
import { cn } from "@/lib/utils";

type ScheduleStatus = "jadwal_baru" | "tunda" | "batal" | "reschedule" | "selesai";
type ScheduleStatusFilter = "all" | ScheduleStatus;
type AgendaFocusFilter = "all" | "needs_attention" | "ready";
type AgendaViewMode = "table" | "card";
type SummaryQuickViewKey = "total" | "today" | "needs_attention" | "selesai";

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

const MAX_STORED_IMAGE_CHARS = 22_000;

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

const OPERATION_ACTIVE_WINDOW_MINUTES = 180;

const isOperationHappeningNow = (
  entryDateKey: string,
  entryTime: string,
  currentDateKey: string,
  currentMinutes: number
) => {
  if (!entryDateKey || entryDateKey !== currentDateKey) return false;
  const startMinutes = toMinutes(entryTime);
  if (!Number.isFinite(startMinutes) || startMinutes === Number.MAX_SAFE_INTEGER) return false;
  return currentMinutes >= startMinutes && currentMinutes <= startMinutes + OPERATION_ACTIVE_WINDOW_MINUTES;
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

const formatStatusLabel = (status: ScheduleStatus) => STATUS_CONFIG[status].label;

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

export default function TsSupportAsistensiManager() {
  const [entries, setEntries] = useState<TsSupportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>("all");
  const [agendaFocus, setAgendaFocus] = useState<AgendaFocusFilter>("all");
  const [agendaViewMode, setAgendaViewMode] = useState<AgendaViewMode>("table");
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [form, setForm] = useState<TsSupportForm>(INITIAL_FORM);
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

  const prePreviewUrl = useObjectPreview(preFile);
  const postPreviewUrl = useObjectPreview(postFile);
  const editPreUploadPreviewUrl = useObjectPreview(editPreFile);
  const editPostUploadPreviewUrl = useObjectPreview(editPostFile);

  const editPrePreviewUrl = editPreUploadPreviewUrl || resolveImageUrl(editForm.preXray, editForm.preXrayFileId);
  const editPostPreviewUrl =
    editPostUploadPreviewUrl || resolveImageUrl(editForm.postXray, editForm.postXrayFileId);

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
      setEntries([]);
      if (!silentError) {
        toast.error((err as Error).message || "Gagal memuat data TS Support");
      }
    } finally {
      suppressNextDiffNotificationRef.current = false;
      setLoading(false);
    }
  }, [notifyScheduleChanges]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchEntries({ silentError: true });
    }, 45_000);
    return () => window.clearInterval(intervalId);
  }, [fetchEntries]);

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

  const statusFilteredEntries = useMemo(() => {
    if (statusFilter === "all") return filteredEntries;
    return filteredEntries.filter((entry) => entry.status === statusFilter);
  }, [filteredEntries, statusFilter]);

  const eventCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of statusFilteredEntries) {
      if (!entry.tanggalKey) continue;
      map.set(entry.tanggalKey, (map.get(entry.tanggalKey) || 0) + 1);
    }
    return map;
  }, [statusFilteredEntries]);

  const selectedDayAgendaBase = useMemo(() => {
    return statusFilteredEntries
      .filter((entry) => entry.tanggalKey === selectedDateKey)
      .sort((a, b) => toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi));
  }, [statusFilteredEntries, selectedDateKey]);

  const selectedDayAgenda = useMemo(() => {
    if (agendaFocus === "all") return selectedDayAgendaBase;
    if (agendaFocus === "needs_attention") {
      return selectedDayAgendaBase.filter((entry) => isEntryNeedingAttention(entry));
    }
    return selectedDayAgendaBase.filter((entry) => !isEntryNeedingAttention(entry));
  }, [agendaFocus, selectedDayAgendaBase]);

  const selectedDateSchedules = useMemo(() => {
    return entries
      .filter((entry) => entry.tanggalKey === selectedDateKey)
      .sort((a, b) => toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi));
  }, [entries, selectedDateKey]);

  const tsAssignmentOptions = useMemo(() => {
    const names = new Set<string>();
    for (const entry of entries) {
      entry.tsMembantu
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .forEach((name) => names.add(name));
    }
    return Array.from(names).sort((first, second) => first.localeCompare(second));
  }, [entries]);

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

  const needsAttentionEntries = useMemo(
    () =>
      entries
        .filter((entry) => isEntryNeedingAttention(entry))
        .sort((a, b) => {
          if (a.tanggalKey !== b.tanggalKey) return (b.tanggalKey || "").localeCompare(a.tanggalKey || "");
          return toMinutes(a.jamOperasi) - toMinutes(b.jamOperasi);
        }),
    [entries]
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
        subtitle: "Status tunda/reschedule atau data belum lengkap",
        items: toQuickViewItems(needsAttentionEntries),
      };
    }
    if (summaryQuickViewKey === "selesai") {
      return {
        title: "Jadwal Selesai",
        subtitle: "Daftar operasi yang sudah selesai",
        items: toQuickViewItems(selesaiEntries),
      };
    }
    return {
      title: "Total Jadwal Operasi",
      subtitle: "Semua data jadwal operasi",
      items: toQuickViewItems(totalEntriesSorted),
    };
  }, [
    summaryQuickViewKey,
    currentDateKey,
    todayEntries,
    needsAttentionEntries,
    selesaiEntries,
    totalEntriesSorted,
    toQuickViewItems,
  ]);

  const managementSummary = useMemo(() => {
    let missingTs = 0;
    let missingXray = 0;
    let needsAttention = 0;

    for (const entry of entries) {
      const missingTsValue = isMissingTs(entry.tsMembantu);
      const missingXrayValue =
        !hasXrayAsset(entry.preXray, entry.preXrayFileId) ||
        !hasXrayAsset(entry.postXray, entry.postXrayFileId);
      const needAttention = missingTsValue || missingXrayValue || entry.status === "tunda" || entry.status === "reschedule";
      if (missingTsValue) missingTs += 1;
      if (missingXrayValue) missingXray += 1;
      if (needAttention) needsAttention += 1;
    }

    return { missingTs, missingXray, needsAttention };
  }, [entries]);

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
      filtered: statusFilteredEntries.length,
      todayAgendaTotal: selectedDayAgendaBase.length,
      todayAgendaVisible: selectedDayAgenda.length,
      byStatus,
    };
  }, [entries, selectedDayAgenda.length, selectedDayAgendaBase.length, statusFilteredEntries.length]);

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

  const duplicateToCreateForm = (entry: TsSupportEntry) => {
    setForm({
      tanggalOperasi: entry.tanggalKey || normalizeDateKey(entry.tanggalOperasi),
      jamOperasi: entry.jamOperasi,
      namaDokter: entry.namaDokter,
      jenisTindakan: entry.jenisTindakan,
      rumahSakit: entry.rumahSakit,
      tsMembantu: entry.tsMembantu,
      notes: entry.notes,
    });
    setPreFile(null);
    setPostFile(null);
    setFormOpen(true);
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

  const postAction = async (payload: unknown, failPrefix: string) => {
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

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.namaDokter || !form.jenisTindakan || !form.rumahSakit) {
      toast.error("Lengkapi data wajib: Dokter, Tindakan, dan RS.");
      return;
    }

    const teamTs = parseTeamMembers(form.tsMembantu);
    const normalizedTeamTs = teamTs.length > 0 ? teamTs : [{ name: "TS Belum Diisi" }];

    setSaving(true);
    try {
      const preRaw = await fileToCompressedDataUrl(preFile);
      const postRaw = await fileToCompressedDataUrl(postFile);
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
      const payload = {
        action: "create",
        data: {
          tanggalOperasi: form.tanggalOperasi || toDateKey(new Date()),
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

      await postAction(payload, "Gagal menyimpan");
      toast.success("Data TS Support berhasil disimpan");
      const insertedDateKey = normalizeDateKey(form.tanggalOperasi);
      if (insertedDateKey) setSelectedDateKey(insertedDateKey);
      resetCreateState();
      setFormOpen(false);
      suppressNextDiffNotificationRef.current = true;
      await fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Gagal menyimpan data");
    } finally {
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
    <div className={cn(compactMode ? "space-y-3" : "space-y-5", isSystemDark && "dark")}>
      <Card className="p-4 md:p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-slate-100/50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Manajemen Jadwal Asistensi Dokter</h2>
            <p className="text-sm text-muted-foreground">Input, edit, dan monitor status jadwal operasi.</p>
          </div>

          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button type="button">Tambah Jadwal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Input Jadwal Operasi</DialogTitle>
              </DialogHeader>

              <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div>
                  <label className="text-xs text-muted-foreground">Lokasi Rumah Sakit *</label>
                  <Input value={form.rumahSakit} onChange={(event) => updateForm("rumahSakit", event.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">TS yang Membantu (opsional)</label>
                  <Input
                    value={form.tsMembantu}
                    onChange={(event) => updateForm("tsMembantu", event.target.value)}
                    placeholder="Kosongkan dulu jika belum dibagi"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} rows={3} />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 space-y-2">
                    <label className="text-xs text-muted-foreground">Foto X-ray Pre</label>
                    <Input type="file" accept="image/*" onChange={(event) => setPreFile(event.target.files?.[0] || null)} />
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
                    <Input type="file" accept="image/*" onChange={(event) => setPostFile(event.target.files?.[0] || null)} />
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

                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan Jadwal"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetCreateState}>
                    Reset Form
                  </Button>
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
                  <Button type="submit" disabled={editSaving}>
                    {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetEditState}>
                    Tutup
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="p-4 md:p-5 space-y-4 rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/80 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg">Kalender & Agenda Operasi</h3>
              <p className="text-sm text-muted-foreground">
                {formatDateLabel(selectedDateKey)} • {summary.todayAgendaVisible}/{summary.todayAgendaTotal} agenda
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyAgendaSummary()}
                disabled={selectedDayAgenda.length === 0}
              >
                Copy Ringkasan
              </Button>
              <Button type="button" variant="outline" onClick={exportAgendaCsv} disabled={selectedDayAgenda.length === 0}>
                Export CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => setCompactMode((prev) => !prev)}>
                {compactMode ? (
                  <>
                    <Maximize2 className="mr-1 h-4 w-4" />
                    Normal
                  </>
                ) : (
                  <>
                    <Minimize2 className="mr-1 h-4 w-4" />
                    Compact
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowActionButtons((prev) => !prev)}>
                {showActionButtons ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Sembunyikan Aksi
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Tampilkan Aksi
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => void fetchEntries()}>
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNativeNotificationButton}
                disabled={nativePermission === "unsupported"}
              >
                {nativePermission === "granted" ? (
                  <>
                    <Bell className="mr-1 h-4 w-4" />
                    Notif Aktif
                  </>
                ) : (
                  <>
                    <BellOff className="mr-1 h-4 w-4" />
                    Aktifkan Notif
                  </>
                )}
              </Button>
            </div>
          </div>

          {!compactMode ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSummaryQuickViewKey("total")}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Total Jadwal</p>
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                </div>
                <p className="text-2xl font-semibold mt-1">{summary.total}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Semua jadwal operasi</p>
              </motion.button>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                onClick={() => setSummaryQuickViewKey("today")}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Agenda Hari Ini</p>
                  <CalendarDays className="h-4 w-4 text-sky-500" />
                </div>
                <p className="text-2xl font-semibold mt-1">{todayEntries.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground truncate">{formatDateLabel(currentDateKey)}</p>
              </motion.button>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setSummaryQuickViewKey("needs_attention")}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Butuh Tindakan</p>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-semibold mt-1 text-amber-600">{managementSummary.needsAttention}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Perlu follow-up</p>
              </motion.button>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                onClick={() => setSummaryQuickViewKey("selesai")}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Selesai</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-semibold mt-1 text-emerald-600">{summary.byStatus.selesai}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Jadwal terselesaikan</p>
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border px-2.5 py-1 bg-white/80 dark:bg-slate-900/70">Total: {summary.total}</span>
              <span className="rounded-full border px-2.5 py-1 bg-white/80 dark:bg-slate-900/70">Agenda: {summary.todayAgendaVisible}</span>
              <span className="rounded-full border px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">Need Action: {managementSummary.needsAttention}</span>
              <span className="rounded-full border px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">Selesai: {summary.byStatus.selesai}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari dokter, tindakan, RS, TS, atau status..."
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ScheduleStatusFilter)}
              className="h-10 min-w-[210px] rounded-md border bg-background px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">Semua Status</option>
              {(Object.keys(STATUS_CONFIG) as ScheduleStatus[]).map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {STATUS_CONFIG[statusKey].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              type="button"
              size="sm"
              variant={agendaFocus === "all" ? "default" : "outline"}
              onClick={() => setAgendaFocus("all")}
            >
              Semua Agenda
            </Button>
            <Button
              type="button"
              size="sm"
              variant={agendaFocus === "needs_attention" ? "default" : "outline"}
              onClick={() => setAgendaFocus("needs_attention")}
            >
              Perlu Tindak Lanjut
            </Button>
            <Button
              type="button"
              size="sm"
              variant={agendaFocus === "ready" ? "default" : "outline"}
              onClick={() => setAgendaFocus("ready")}
            >
              Siap Operasi
            </Button>
            <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-muted-foreground">
              TS kosong: {managementSummary.missingTs} • X-ray belum lengkap: {managementSummary.missingXray}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-4">
          <div className={cn(compactMode ? "space-y-3" : "space-y-4")}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/90 via-white to-cyan-50/70 p-3 shadow-sm dark:border-sky-900/50 dark:from-sky-950/30 dark:via-slate-900 dark:to-cyan-950/20"
            >
              <div className="flex items-center gap-2 mb-2 text-sm text-sky-700 dark:text-sky-300">
                <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                Pilih tanggal
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => {
                  if (day) setSelectedDateKey(toDateKey(day));
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
              }))}
              tsOptions={tsAssignmentOptions}
              assigningEntryId={updatingEntryId}
              onAssign={handleAssignTs}
              compactMode={compactMode}
            />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/70 p-3 md:p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20">
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
                <div className="inline-flex items-center rounded-md border bg-white/80 p-0.5 dark:bg-slate-900/70">
                  <Button
                    type="button"
                    size="sm"
                    variant={agendaViewMode === "table" ? "default" : "ghost"}
                    className="h-7 px-2"
                    onClick={() => setAgendaViewMode("table")}
                  >
                    <Table2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={agendaViewMode === "card" ? "default" : "ghost"}
                    className="h-7 px-2"
                    onClick={() => setAgendaViewMode("card")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={cn(
                compactMode ? "space-y-2" : "space-y-3",
                agendaViewMode === "table"
                  ? selectedDayAgenda.length > 10
                    ? "max-h-[620px] overflow-y-auto pr-1"
                    : "max-h-[70vh] overflow-y-auto pr-1"
                  : selectedDayAgenda.length > 3 &&
                    (compactMode
                      ? "max-h-[460px] overflow-y-auto pr-1"
                      : "max-h-[640px] overflow-y-auto pr-1")
              )}
            >
              {agendaViewMode === "table" ? (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-[.8fr,1.1fr,1fr,1fr,1fr,.9fr,1fr] gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <span>Jam</span>
                    <span>Dokter</span>
                    <span>Tindakan</span>
                    <span>Rumah Sakit</span>
                    <span>TS</span>
                    <span>Status</span>
                    <span>X-ray</span>
                  </div>
                  {selectedDayAgenda.map((entry, index) => {
                    const isOngoingNow =
                      entry.status !== "batal" &&
                      entry.status !== "selesai" &&
                      isOperationHappeningNow(entry.tanggalKey, entry.jamOperasi, currentDateKey, currentMinutes);
                    const statusConfig = STATUS_CONFIG[entry.status];
                    const preUrl = resolveImageUrl(entry.preXray, entry.preXrayFileId);
                    const postUrl = resolveImageUrl(entry.postXray, entry.postXrayFileId);
                    const prePreviewModalUrl = resolvePreviewUrl(entry.preXray, entry.preXrayFileId) || preUrl;
                    const postPreviewModalUrl = resolvePreviewUrl(entry.postXray, entry.postXrayFileId) || postUrl;
                    return (
                      <motion.div
                        key={`table-${entry.id}-${entry.jamOperasi}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-[.8fr,1.1fr,1fr,1fr,1fr,.9fr,1fr] gap-2 rounded-xl border px-3 py-2",
                          isOngoingNow
                            ? "border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20"
                            : "border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70"
                        )}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Timer className={cn("h-3.5 w-3.5", isOngoingNow ? "text-rose-600 animate-pulse" : "text-slate-500")} />
                          <span>{entry.jamOperasi || "--:--"}</span>
                          {isOngoingNow ? (
                            <motion.span
                              initial={{ opacity: 0.7 }}
                              animate={{ opacity: 1 }}
                              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                              className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                              </span>
                              Berlangsung
                            </motion.span>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium truncate">{entry.namaDokter || "-"}</div>
                        <div className="text-sm truncate">{entry.jenisTindakan || "-"}</div>
                        <div className="text-sm truncate">{entry.rumahSakit || "-"}</div>
                        <div className="text-sm truncate">{entry.tsMembantu || "-"}</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-xs font-semibold rounded-full px-2 py-0.5", statusConfig.chipClass)}>
                            {statusConfig.label}
                          </span>
                          <div className="inline-flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => openEditModal(entry)} title="Edit jadwal">
                              <Pencil className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => void handleDelete(entry.id)} title="Hapus jadwal">
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                          {!preUrl && !postUrl ? <span className="text-xs text-muted-foreground">-</span> : null}
                        </div>
                      </motion.div>
                    );
                  })}
                  {!loading && selectedDayAgenda.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Tidak ada jadwal pada tanggal / filter ini.
                    </div>
                  ) : null}
                  {loading ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Memuat data agenda...
                    </div>
                  ) : null}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {selectedDayAgenda.map((entry, index) => {
                    const statusConfig = STATUS_CONFIG[entry.status];
                    const preUrl = resolveImageUrl(entry.preXray, entry.preXrayFileId);
                    const postUrl = resolveImageUrl(entry.postXray, entry.postXrayFileId);
                    const missingTs = isMissingTs(entry.tsMembantu);
                    const missingXray =
                      !hasXrayAsset(entry.preXray, entry.preXrayFileId) ||
                      !hasXrayAsset(entry.postXray, entry.postXrayFileId);
                    const requiresAttention = missingTs || missingXray || entry.status === "tunda" || entry.status === "reschedule";
                    const isOngoingNow =
                      entry.status !== "batal" &&
                      entry.status !== "selesai" &&
                      isOperationHappeningNow(entry.tanggalKey, entry.jamOperasi, currentDateKey, currentMinutes);
                    const prePreviewModalUrl = resolvePreviewUrl(entry.preXray, entry.preXrayFileId) || preUrl;
                    const postPreviewModalUrl = resolvePreviewUrl(entry.postXray, entry.postXrayFileId) || postUrl;

                    return (
                      <motion.div
                        key={`${entry.id}-${entry.namaDokter}-${entry.jamOperasi}`}
                        initial={{ opacity: 0, y: 14, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.24) }}
                        layout
                        whileHover={{ y: -2, scale: 1.002 }}
                        className={cn(
                          "relative rounded-xl border overflow-hidden",
                          statusConfig.cardClass,
                          isOngoingNow
                            ? "ring-2 ring-rose-400/80 dark:ring-rose-700/60"
                            : requiresAttention
                            ? "ring-1 ring-amber-300/70 dark:ring-amber-900/50"
                            : "ring-1 ring-emerald-300/60 dark:ring-emerald-900/40"
                        )}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.6, delay: Math.min(index * 0.03, 0.2) }}
                          className={cn(
                            "absolute left-0 top-0 h-0.5",
                            isOngoingNow
                              ? "bg-gradient-to-r from-rose-400 to-red-600"
                              : requiresAttention
                              ? "bg-gradient-to-r from-amber-400 to-orange-500"
                              : "bg-gradient-to-r from-emerald-400 to-cyan-500"
                          )}
                        />
                        <div
                          className={cn(
                            "border-b bg-gradient-to-r",
                            statusConfig.headerClass,
                            compactMode ? "p-2.5 md:p-3" : "p-3 md:p-4"
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  className={cn(
                                    "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1",
                                    isOngoingNow
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  )}
                                >
                                  <Timer className={cn("h-3.5 w-3.5", isOngoingNow ? "text-rose-600 animate-pulse" : "text-slate-500")} />
                                  {entry.jamOperasi || "Jam belum diisi"}
                                </span>
                                <span className={cn("text-xs font-semibold rounded-full px-2.5 py-1", statusConfig.chipClass)}>
                                  {statusConfig.label}
                                </span>
                                {isOngoingNow ? (
                                  <motion.span
                                    initial={{ opacity: 0.7, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1.02 }}
                                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                                    className="text-xs font-semibold rounded-full px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 inline-flex items-center gap-1"
                                  >
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                                    </span>
                                    Sedang Berlangsung
                                  </motion.span>
                                ) : null}
                                {requiresAttention ? (
                                  <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                                    Perlu Follow-up
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 inline-flex items-center gap-1 font-semibold leading-snug text-slate-900 dark:text-slate-50 text-2xl">
                                <Stethoscope className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                {entry.namaDokter || "-"}
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{entry.jenisTindakan || "-"}</p>
                            </div>

                            <div className="flex items-center gap-1 self-end sm:self-start">
                              <Button type="button" variant="ghost" size="sm" title="Duplikat ke jadwal baru" onClick={() => duplicateToCreateForm(entry)}>
                                Duplikat
                              </Button>
                              <Button type="button" variant="ghost" size="icon" title="Edit jadwal" onClick={() => openEditModal(entry)}>
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" title="Hapus jadwal" onClick={() => void handleDelete(entry.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className={cn(compactMode ? "p-2.5 md:p-3 space-y-2" : "p-3 md:p-4 space-y-3")}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg border bg-white/70 dark:bg-slate-950/40 px-3 py-2 flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                              <span className="truncate">RS: {entry.rumahSakit || "-"}</span>
                            </div>
                            <div className="rounded-lg border bg-white/70 dark:bg-slate-950/40 px-3 py-2 flex items-center gap-2">
                              <Users className={cn("h-3.5 w-3.5", missingTs ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300")} />
                              <span className="truncate">TS: {entry.tsMembantu || "-"}</span>
                            </div>
                            <div className="rounded-lg border bg-white/70 dark:bg-slate-950/40 px-3 py-2 flex items-center gap-2">
                              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                              <span className="truncate">{formatDateLabel(entry.tanggalKey)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <motion.span
                              whileHover={{ scale: 1.03 }}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-1",
                                missingTs
                                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                              )}
                            >
                              {missingTs ? <AlertTriangle className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                              {missingTs ? "TS belum diisi" : "TS siap"}
                            </motion.span>
                            <motion.span
                              whileHover={{ scale: 1.03 }}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-1",
                                missingXray
                                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                                  : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200"
                              )}
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              {missingXray ? "X-ray belum lengkap" : "X-ray lengkap"}
                            </motion.span>
                            {entry.notes ? (
                              <motion.span
                                whileHover={{ scale: 1.03 }}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Ada catatan
                              </motion.span>
                            ) : null}
                          </div>

                          {requiresAttention ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                              Perlu tindak lanjut:
                              {missingTs ? " TS belum lengkap." : ""}
                              {missingXray ? " Foto X-ray pre/post belum lengkap." : ""}
                            </div>
                          ) : null}

                          {!compactMode && entry.notes ? (
                            <div className="rounded-lg border bg-white/60 dark:bg-slate-950/30 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Catatan</p>
                              <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{entry.notes}</p>
                            </div>
                          ) : null}

                          {!compactMode && (preUrl || postUrl) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="rounded-lg border bg-white/70 dark:bg-slate-950/40 px-3 py-2 space-y-2">
                                {preUrl ? (
                                  <XrayPreview
                                    src={preUrl}
                                    alt={`Preview pre xray ${entry.namaDokter}`}
                                    heightClass="h-24"
                                    onClick={() => openImagePreview(prePreviewModalUrl, `Pre X-ray - ${entry.namaDokter || "-"}`)}
                                  />
                                ) : null}
                              </div>
                              <div className="rounded-lg border bg-white/70 dark:bg-slate-950/40 px-3 py-2 space-y-2">
                                {postUrl ? (
                                  <XrayPreview
                                    src={postUrl}
                                    alt={`Preview post xray ${entry.namaDokter}`}
                                    heightClass="h-24"
                                    onClick={() => openImagePreview(postPreviewModalUrl, `Post X-ray - ${entry.namaDokter || "-"}`)}
                                  />
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <AnimatePresence initial={false}>
                          {showActionButtons ? (
                            <motion.div
                              key="actions"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div
                                className={cn(
                                  "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap",
                                  compactMode ? "px-2.5 pb-2.5 md:px-3 md:pb-3" : "px-3 pb-3 md:px-4 md:pb-4"
                                )}
                              >
                                <Button type="button" size="sm" variant="outline" disabled={updatingEntryId === entry.id} onClick={() => void updateScheduleStatus(entry, "jadwal_baru")}>
                                  <Clock3 className="mr-1 h-3.5 w-3.5" />
                                  Jadwal Baru
                                </Button>
                                <Button type="button" size="sm" variant="outline" disabled={updatingEntryId === entry.id} onClick={() => void updateScheduleStatus(entry, "tunda")}>
                                  Tunda
                                </Button>
                                <Button type="button" size="sm" variant="outline" disabled={updatingEntryId === entry.id} onClick={() => void updateScheduleStatus(entry, "batal")}>
                                  <XCircle className="mr-1 h-3.5 w-3.5" />
                                  Batal
                                </Button>
                                <Button type="button" size="sm" variant="outline" disabled={updatingEntryId === entry.id} onClick={() => void handleReschedule(entry)}>
                                  <RotateCw className="mr-1 h-3.5 w-3.5" />
                                  Reschedule
                                </Button>
                                <Button type="button" size="sm" variant="outline" disabled={updatingEntryId === entry.id} onClick={() => void updateScheduleStatus(entry, "selesai")}>
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                  Selesai
                                </Button>
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {!loading && selectedDayAgenda.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada jadwal pada tanggal / filter ini.
                    </motion.div>
                  ) : null}

                  {loading ? (
                    <motion.div
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
                    >
                      Memuat data agenda...
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </Card>

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
