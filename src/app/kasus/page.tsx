"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  PlusCircle,
  Search,
  RefreshCw,
  Plus,
  Image as ImageIcon,
  FolderOpen,
  CalendarDays,
  NotebookText,
  Pencil,
  Trash2,
  Save,
  LoaderCircle,
  Tags,
} from "lucide-react";
import ShareButtons from "@/components/buttonShare";
import RichTextEditor from "@/components/ui/RichTextEditor";

type CaseImageRecord = {
  no?: string | number;
  id?: string | number;
  tindakan?: string;
  title?: string;
  note?: string;
  tags?: string[] | string;
  googleDriveId?: string;
  imageUrl?: string | null;
  createdAt?: string;
};

type CasesMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

type CasesSummary = {
  totalCasesAll: number;
  totalCasesFiltered: number;
  totalCasesPage: number;
  totalImagesAll: number;
  totalImagesFiltered: number;
  totalImagesPage: number;
};

type CasesApiResponse = {
  status?: string;
  message?: string;
  data?: CaseImageRecord[];
  availableTags?: string[];
  meta?: Partial<CasesMeta>;
  summary?: Partial<CasesSummary>;
};

type DisplayCase = {
  id: string;
  tindakan: string;
  note: string;
  tags: string[];
  images: string[];
  createdAt?: string;
  rowNo?: string;
};

const stripHtml = (html: string) =>
  String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sanitizeHtml = (html: string) =>
  String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");

const DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{10,}$/;

const parseDriveIds = (value: string): string[] => {
  const raw = decodeURIComponent(String(value || "").trim());
  if (!raw) return [];

  // Non-URL input can already be "id1,id2,id3".
  if (!/^https?:\/\//i.test(raw)) {
    return raw
      .split(",")
      .map((part) => part.trim())
      .filter((part) => DRIVE_ID_REGEX.test(part));
  }

  // URL input: support both /file/d/{id} and ?id={id1,id2,...}
  const byPath = raw.match(/\/d\/([^/?#]+)/)?.[1];
  if (byPath && DRIVE_ID_REGEX.test(byPath)) return [byPath];

  const byQuery = raw.match(/[?&]id=([^&]+)/)?.[1];
  if (byQuery) {
    return byQuery
      .split(",")
      .map((part) => part.trim())
      .filter((part) => DRIVE_ID_REGEX.test(part));
  }

  return [];
};

const toDriveViewUrl = (id: string) => `https://drive.google.com/uc?export=view&id=${id}`;
const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }
  const raw = String(value || "").trim();
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const formatCreatedAt = (value?: string) => {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const normalizeCase = (item: CaseImageRecord, index: number): DisplayCase => {
  const title = (item.tindakan || item.title || "Kasus Tanpa Judul").trim();
  const note = (item.note || "-").trim();
  const tags = normalizeTags(item.tags);
  const rawRowNo = item.no ?? item.id;
  const rowNo =
    rawRowNo === undefined || rawRowNo === null || String(rawRowNo).trim() === ""
      ? undefined
      : String(rawRowNo);

  const idsFromField = String(item.googleDriveId || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const idsFromImageUrl = item.imageUrl ? parseDriveIds(item.imageUrl) : [];
  const allIds = [...idsFromField, ...idsFromImageUrl];
  const uniqueIds = Array.from(new Set(allIds.filter((id) => DRIVE_ID_REGEX.test(id))));
  const imageUrls = uniqueIds.map(toDriveViewUrl);

  return {
    id: `${title}-${index}`,
    tindakan: title,
    note,
    tags,
    images: imageUrls.length > 0 ? imageUrls : ["/no-image.png"],
    createdAt: item.createdAt,
    rowNo,
  };
};

export default function InteractiveCasesWithPreview() {
  const defaultMeta: CasesMeta = {
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  };

  const defaultSummary: CasesSummary = {
    totalCasesAll: 0,
    totalCasesFiltered: 0,
    totalCasesPage: 0,
    totalImagesAll: 0,
    totalImagesFiltered: 0,
    totalImagesPage: 0,
  };

  const [cases, setCases] = useState<DisplayCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [meta, setMeta] = useState<CasesMeta>(defaultMeta);
  const [summary, setSummary] = useState<CasesSummary>(defaultSummary);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCase, setDeletingCase] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    setError("");
    try {
      if (dateFrom && dateTo && dateFrom > dateTo) {
        throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      }

      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (activeTag !== "all") params.set("tag", activeTag);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const query = params.toString();
      const endpoint = query ? `/api/addCases/getCases?${query}` : "/api/addCases/getCases";
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Gagal memuat data kasus.");
      }
      const json = (await res.json()) as CasesApiResponse;
      if (json?.status === "error") {
        throw new Error(json.message || "Gagal memuat data kasus.");
      }

      const rows = Array.isArray(json?.data) ? (json.data as CaseImageRecord[]) : [];
      const normalizedRows = rows.map(normalizeCase);
      setCases(normalizedRows);

      const nextMeta = {
        ...defaultMeta,
        ...json.meta,
      };
      const nextSummary = {
        ...defaultSummary,
        ...json.summary,
      };
      setMeta(nextMeta);
      setSummary(nextSummary);

      setAvailableTags(Array.isArray(json?.availableTags) ? json.availableTags : []);
      setSelectedIdx(null);
      setSlideIdx(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
      setCases([]);
      setMeta(defaultMeta);
      setSummary(defaultSummary);
      setSelectedIdx(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    void loadCases();
  }, [page, pageSize, activeTag, dateFrom, dateTo, searchQuery]);

  const selectedCase = selectedIdx !== null ? cases[selectedIdx] : null;

  const pageNumbers = useMemo(() => {
    const total = Math.max(meta.totalPages, 1);
    const current = Math.min(Math.max(meta.page, 1), total);
    const size = 5;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + size - 1);

    if (end - start + 1 < size) {
      start = Math.max(1, end - size + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [meta.page, meta.totalPages]);

  useEffect(() => {
    if (!selectedCase) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIdx(null);
      if (event.key === "ArrowLeft") {
        setSlideIdx((prev) => (prev === 0 ? selectedCase.images.length - 1 : prev - 1));
      }
      if (event.key === "ArrowRight") {
        setSlideIdx((prev) => (prev === selectedCase.images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCase]);

  const openDetail = (idx: number) => {
    const target = cases[idx];
    setSelectedIdx(idx);
    setSlideIdx(0);
    setZoom(1);
    setIsEditing(false);
    setEditTitle(target?.tindakan ?? "");
    setEditNote(target?.note ?? "");
    setEditTagsInput((target?.tags || []).join(", "));
  };

  const closeDetail = () => {
    setSelectedIdx(null);
    setIsEditing(false);
  };

  const canMutateSelectedCase = Boolean(selectedCase?.rowNo);

  const startEditSelectedCase = () => {
    if (!selectedCase) return;
    if (!selectedCase.rowNo) {
      alert("ID data kasus tidak ditemukan. Pastikan data memiliki kolom no/id di Google Sheet.");
      return;
    }
    setEditTitle(selectedCase.tindakan);
    setEditNote(selectedCase.note);
    setEditTagsInput((selectedCase.tags || []).join(", "));
    setIsEditing(true);
  };

  const saveSelectedCase = async () => {
    if (!selectedCase?.rowNo) {
      alert("ID data kasus tidak ditemukan.");
      return;
    }
    if (!editTitle.trim() || !stripHtml(editNote).trim()) {
      alert("Judul dan catatan kasus wajib diisi.");
      return;
    }
    const tags = normalizeTags(editTagsInput);

    setSavingEdit(true);
    try {
      const res = await fetch("/api/addCases/cases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no: selectedCase.rowNo,
          title: editTitle.trim(),
          tindakan: editTitle.trim(),
          note: editNote.trim(),
          tags,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === "error") {
        throw new Error(json?.message || "Gagal memperbarui data kasus.");
      }

      alert("Kasus berhasil diperbarui.");
      setIsEditing(false);
      await loadCases();
      setSelectedIdx(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui data kasus.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteSelectedCase = async () => {
    if (!selectedCase?.rowNo) {
      alert("ID data kasus tidak ditemukan.");
      return;
    }
    const confirmed = window.confirm("Hapus kasus ini? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;

    setDeletingCase(true);
    try {
      const res = await fetch("/api/addCases/cases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no: selectedCase.rowNo,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === "error") {
        throw new Error(json?.message || "Gagal menghapus data kasus.");
      }

      alert("Kasus berhasil dihapus.");
      await loadCases();
      setSelectedIdx(null);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus data kasus.");
    } finally {
      setDeletingCase(false);
    }
  };

  const prevSlide = () => {
    if (!selectedCase) return;
    setSlideIdx((prev) => (prev === 0 ? selectedCase.images.length - 1 : prev - 1));
    setZoom(1);
  };

  const nextSlide = () => {
    if (!selectedCase) return;
    setSlideIdx((prev) => (prev === selectedCase.images.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 1));

  const zoomStyle: CSSProperties = {
    transform: `scale(${zoom})`,
    transition: "transform 0.2s",
    cursor: zoom > 1 ? "grab" : "auto",
    transformOrigin: "center",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-300">
        <p>Memuat data kasus...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-red-300 bg-red-50 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">Gagal memuat kasus</p>
          <p className="mt-1 text-sm">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadCases()}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Coba Lagi
            </button>
            <Link
              href="/kasus/new"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Tambah Kasus Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Daftar Kasus</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Klik kartu untuk melihat detail foto, catatan tindakan, dan berbagi link kasus.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadCases()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <Link
                href="/kasus/new"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={16} />
                Tambah Kasus Baru
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Kasus</p>
            <p className="mt-1 text-2xl font-bold">{summary.totalCasesAll}</p>
            <p className="mt-1 text-xs text-slate-500">Semua data tersimpan</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Gambar</p>
            <p className="mt-1 text-2xl font-bold">{summary.totalImagesFiltered}</p>
            <p className="mt-1 text-xs text-slate-500">Hasil sesuai filter</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tampil Saat Ini</p>
            <p className="mt-1 text-2xl font-bold">{summary.totalCasesPage}</p>
            <p className="mt-1 text-xs text-slate-500">Halaman {meta.page}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari tindakan, catatan, atau tag..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Dari
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Sampai
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Baris
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full bg-transparent outline-none"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDateFrom("");
                setDateTo("");
                setActiveTag("all");
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reset Filter
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setActiveTag("all");
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeTag === "all"
                ? "bg-cyan-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Semua Tag
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setActiveTag(tag);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeTag === tag
                  ? "bg-cyan-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {cases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-semibold">Belum ada kasus yang cocok</p>
            <p className="mt-1 text-sm text-slate-500">
              Coba ubah filter/tag/tanggal, atau tambahkan kasus baru.
            </p>
            <div className="mt-4">
              <Link
                href="/kasus/new"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={16} />
                Tambah Kasus Baru
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((item, idx) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => openDetail(idx)}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                whileHover={{ y: -2 }}
              >
                <div className="relative h-56 w-full bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={item.images[0]}
                    alt={item.tindakan}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/no-image.png";
                    }}
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-lg font-semibold">{item.tindakan}</p>
                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                      {item.images.length} foto
                    </span>
                  </div>
                  <article
                    className="max-h-20 overflow-hidden text-sm text-slate-600 dark:text-slate-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-slate-500 [&_blockquote]:pl-2"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.note) }}
                  />
                  {item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <CalendarDays size={13} />
                    {formatCreatedAt(item.createdAt)}
                  </p>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                    Klik untuk lihat detail
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Menampilkan {(meta.page - 1) * meta.pageSize + (cases.length > 0 ? 1 : 0)}-
            {(meta.page - 1) * meta.pageSize + cases.length} dari {meta.totalItems} data
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!meta.hasPrev || loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Prev
            </button>

            {pageNumbers.map((pageNo) => (
              <button
                key={pageNo}
                type="button"
                onClick={() => setPage(pageNo)}
                disabled={loading}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  pageNo === meta.page
                    ? "bg-cyan-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {pageNo}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(meta.totalPages, 1)))}
              disabled={!meta.hasNext || loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedCase && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-h-[95vh] w-full max-w-6xl overflow-auto rounded-xl bg-white dark:bg-slate-900"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
                onClick={closeDetail}
                aria-label="Tutup detail kasus"
              >
                <X size={22} />
              </button>

              <div className="relative h-64 w-full bg-slate-100 sm:h-80 md:h-[460px] dark:bg-slate-800">
                <motion.div
                  style={zoomStyle}
                  className="relative h-full w-full overflow-auto"
                  drag={zoom > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                >
                  <Image
                    src={selectedCase.images[slideIdx]}
                    alt={`${selectedCase.tindakan} - ${slideIdx + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 960px"
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/no-image.png";
                    }}
                  />
                </motion.div>

                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                  <button
                    className="rounded-full bg-white/90 p-2 text-slate-900 hover:bg-white"
                    onClick={zoomOut}
                    aria-label="Zoom out"
                  >
                    <MinusCircle size={18} />
                  </button>
                  <button
                    className="rounded-full bg-white/90 p-2 text-slate-900 hover:bg-white"
                    onClick={zoomIn}
                    aria-label="Zoom in"
                  >
                    <PlusCircle size={18} />
                  </button>
                </div>

                {selectedCase.images.length > 1 ? (
                  <>
                    <button
                      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 hover:bg-white"
                      onClick={prevSlide}
                      aria-label="Gambar sebelumnya"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 hover:bg-white"
                      onClick={nextSlide}
                      aria-label="Gambar selanjutnya"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                ) : null}
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[260px,1fr]">
                <aside className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Info Kasus
                    </p>
                    <div className="mt-2 space-y-2">
                      <p className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <FolderOpen size={14} />
                        {selectedCase.tindakan}
                      </p>
                      <p className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        <ImageIcon size={14} />
                        {slideIdx + 1}/{selectedCase.images.length}
                      </p>
                      <p className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        <CalendarDays size={14} />
                        {formatCreatedAt(selectedCase.createdAt)}
                      </p>
                      {selectedCase.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedCase.tags.map((tag) => (
                            <p
                              key={`${selectedCase.id}-${tag}`}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            >
                              <Tags size={12} />
                              #{tag}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Aksi Kasus
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={startEditSelectedCase}
                        disabled={!canMutateSelectedCase || savingEdit || deletingCase}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300"
                      >
                        {savingEdit ? <LoaderCircle size={14} className="animate-spin" /> : <Pencil size={14} />}
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSelectedCase()}
                        disabled={!canMutateSelectedCase || savingEdit || deletingCase}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                      >
                        {deletingCase ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Hapus
                      </button>
                    </div>
                    {!canMutateSelectedCase ? (
                      <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-300">
                        Data ini belum punya `no/id`, jadi edit/delete belum bisa dijalankan.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                    Tips: gunakan tombol panah kiri/kanan untuk ganti gambar, dan `Esc` untuk menutup.
                  </div>

                  <ShareButtons />
                </aside>

                <div className="space-y-4">
                  <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <NotebookText size={14} />
                      {isEditing ? "Edit Kasus" : "Catatan Kasus"}
                    </p>
                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Judul Kasus
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                            placeholder="Judul kasus"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Tag Kasus
                          </label>
                          <input
                            type="text"
                            value={editTagsInput}
                            onChange={(e) => setEditTagsInput(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                            placeholder="thr, tkr, revisi"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Catatan Kasus
                          </label>
                          <RichTextEditor
                            value={editNote}
                            onChange={setEditNote}
                            placeholder="Perbarui catatan kasus..."
                            minHeightClassName="min-h-[200px]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void saveSelectedCase()}
                            disabled={savingEdit || deletingCase}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingEdit ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Simpan Perubahan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setEditTitle(selectedCase.tindakan);
                              setEditNote(selectedCase.note);
                              setEditTagsInput((selectedCase.tags || []).join(", "));
                            }}
                            disabled={savingEdit || deletingCase}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <article
                        className="prose prose-slate mt-3 max-w-3xl text-sm leading-7 dark:prose-invert [&_img]:mx-auto [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-[220px] [&_img]:rounded-md [&_img]:border [&_img]:border-slate-700 [&_img]:object-cover"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedCase.note) }}
                      />
                    )}
                  </section>

                  {selectedCase.images.length > 1 ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Galeri Gambar
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selectedCase.images.map((url, imageIdx) => (
                          <button
                            key={`${selectedCase.id}-thumb-${imageIdx}`}
                            type="button"
                            onClick={() => {
                              setSlideIdx(imageIdx);
                              setZoom(1);
                            }}
                            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                              imageIdx === slideIdx
                                ? "border-indigo-600 dark:border-indigo-400"
                                : "border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            <Image
                              src={url}
                              alt={`Thumbnail ${imageIdx + 1}`}
                              fill
                              sizes="96px"
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/no-image.png";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
