"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Eraser,
  FileText,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  Tags,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface CaseApiResponse {
  status?: string;
  message?: string;
  data?: { imageUrl?: string };
}

interface TagsApiResponse {
  availableTags?: string[];
}

type NoteTemplate = {
  label: string;
  content: string;
};

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    label: "Template Operasi",
    content:
      "<h2>Ringkasan Kasus</h2><p>Tuliskan indikasi, diagnosis, dan target tindakan.</p><h2>Langkah Operasi</h2><ul><li>Insisi dan eksposur</li><li>Evaluasi anatomi</li><li>Tindakan utama</li><li>Penutupan</li></ul><h2>Catatan Penting</h2><p>Tambahkan challenge dan keputusan intra-operatif.</p>",
  },
  {
    label: "Template Follow Up",
    content:
      "<h2>Follow Up</h2><ul><li>Hari ke-1: ...</li><li>Minggu ke-2: ...</li><li>Bulan ke-1: ...</li></ul><h2>Outcome</h2><p>Masukkan progres klinis dan rekomendasi lanjut.</p>",
  },
  {
    label: "Template Komplikasi",
    content:
      "<h2>Komplikasi</h2><p>Jelaskan kejadian dan faktor penyebab.</p><h2>Manajemen</h2><ul><li>Tindakan awal</li><li>Perubahan rencana</li><li>Evaluasi hasil</li></ul><h2>Lesson Learned</h2><p>Apa yang bisa ditingkatkan untuk kasus berikutnya.</p>",
  },
];

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

const normalizeTags = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );

export default function NewCaseForm() {
  const DRAFT_KEY = "kasus:new:draft:v1";
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewSrcs, setPreviewSrcs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [mobileMinimalMode, setMobileMinimalMode] = useState(true);
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);

  const plainNote = useMemo(() => stripHtml(note), [note]);
  const tagsPreview = useMemo(() => normalizeTags(tagsInput), [tagsInput]);

  const wordCount = useMemo(() => {
    if (!plainNote) return 0;
    return plainNote.split(/\s+/).filter(Boolean).length;
  }, [plainNote]);

  const readMinutes = useMemo(() => {
    if (wordCount === 0) return 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const draftLabel = useMemo(() => {
    if (!draftSavedAt) return "Draft belum tersimpan";
    const date = new Date(draftSavedAt);
    if (Number.isNaN(date.getTime())) return "Draft tersimpan";
    return `Draft tersimpan ${date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [draftSavedAt]);

  const requiredChecklist = useMemo(
    () => [
      { label: "Judul kasus", done: Boolean(title.trim()) },
      { label: "Catatan tindakan", done: Boolean(plainNote.trim()) },
      { label: "Foto kasus", done: files.length > 0 },
    ],
    [title, plainNote, files.length]
  );

  const completedRequired = useMemo(
    () => requiredChecklist.filter((item) => item.done).length,
    [requiredChecklist]
  );

  const suggestedTagOptions = useMemo(
    () => suggestedTags.filter((tag) => !tagsPreview.includes(tag)).slice(0, 8),
    [suggestedTags, tagsPreview]
  );

  const hideAdvancedOnMobile = mobileMinimalMode && !showAdvancedMobile;

  const persistDraft = useCallback(
    (override?: { title?: string; note?: string; tagsInput?: string }) => {
      try {
        const snapshot = {
          title: override?.title ?? title,
          note: override?.note ?? note,
          tagsInput: override?.tagsInput ?? tagsInput,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
        setDraftSavedAt(snapshot.updatedAt);
      } catch {
        // ignore storage issues
      }
    },
    [DRAFT_KEY, title, note, tagsInput]
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          title?: string;
          note?: string;
          tagsInput?: string;
          updatedAt?: string;
        };
        setTitle(parsed.title || "");
        setNote(parsed.note || "");
        setTagsInput(parsed.tagsInput || "");
        setDraftSavedAt(parsed.updatedAt || "");
      }
    } catch {
      // ignore malformed local draft
    } finally {
      setDraftLoaded(true);
    }
  }, [DRAFT_KEY]);

  useEffect(() => {
    if (!draftLoaded) return;
    persistDraft();
  }, [draftLoaded, title, note, tagsInput, persistDraft]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    const applyModeByWidth = () => {
      const isMobileWidth = mediaQuery.matches;
      setMobileMinimalMode(isMobileWidth);
      if (!isMobileWidth) {
        setShowAdvancedMobile(false);
      }
    };

    applyModeByWidth();
    mediaQuery.addEventListener("change", applyModeByWidth);

    return () => mediaQuery.removeEventListener("change", applyModeByWidth);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSuggestedTags = async () => {
      try {
        const res = await fetch("/api/addCases/getCases?page=1&pageSize=12", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as TagsApiResponse;
        const tags = Array.isArray(json.availableTags)
          ? Array.from(
              new Set(
                json.availableTags
                  .map((tag) => String(tag || "").trim().toLowerCase())
                  .filter(Boolean)
              )
            )
          : [];
        setSuggestedTags(tags);
      } catch {
        // ignore failed suggestion loading
      }
    };

    void loadSuggestedTags();

    return () => controller.abort();
  }, []);

  const processSelectedFiles = useCallback(
    async (selectedFiles: File[], mode: "append" | "replace" = "append") => {
      const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      setCompressing(true);
      try {
        const compressedFiles = await Promise.all(
          imageFiles.map((file) =>
            imageCompression(file, {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            })
          )
        );

        const previews = await Promise.all(
          compressedFiles.map(
            (file) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              })
          )
        );

        if (mode === "replace") {
          setFiles(compressedFiles);
          setPreviewSrcs(previews);
        } else {
          setFiles((prev) => [...prev, ...compressedFiles]);
          setPreviewSrcs((prev) => [...prev, ...previews]);
        }
      } catch {
        alert("Gagal memproses gambar.");
      } finally {
        setCompressing(false);
      }
    },
    []
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const pastedImages: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pastedImages.push(file);
        }
      }

      if (pastedImages.length > 0) {
        void processSelectedFiles(pastedImages, "append");
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processSelectedFiles]);

  useEffect(() => {
    const hasUnsavedContent = Boolean(title.trim() || plainNote.trim() || tagsPreview.length || files.length);
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedContent || loading) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [title, plainNote, tagsPreview.length, files.length, loading]);

  const clearDraft = () => {
    setTitle("");
    setNote("");
    setTagsInput("");
    setFiles([]);
    setPreviewSrcs([]);
    setDraftSavedAt("");
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore storage issues
    }
  };

  const addTag = (tag: string) => {
    const normalized = String(tag || "").trim().toLowerCase();
    if (!normalized) return;
    if (tagsPreview.includes(normalized)) return;
    setTagsInput((prev) => (prev.trim() ? `${prev}, ${normalized}` : normalized));
  };

  const removeImageAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewSrcs((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (template: NoteTemplate) => {
    setNote((prev) => {
      if (!prev.trim()) return template.content;
      return `${prev}<hr><h2>${template.label}</h2>${template.content}`;
    });
  };

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    await processSelectedFiles(selectedFiles, "append");
    e.target.value = "";
  }

  function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; name: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const parts = result.split(",");
        if (parts.length === 2) {
          const mimeMatch = parts[0].match(/data:(.*);base64/);
          const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
          resolve({ base64: parts[1], mimeType, name: file.name });
        } else {
          reject(new Error("Invalid file data"));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });
  }

  const submitCase = useCallback(async () => {
    if (loading || compressing) return;

    if (!title.trim() || !plainNote.trim()) {
      alert("Title dan Note wajib diisi.");
      return;
    }
    if (files.length === 0) {
      alert("Silakan pilih minimal 1 gambar kasus.");
      return;
    }

    setLoading(true);
    try {
      const base64Files = await Promise.all(files.map(fileToBase64));
      const payload = {
        title: title.trim(),
        note: note.trim(),
        tags: tagsPreview,
        base64Images: base64Files.map((f) => f.base64),
        fileNames: base64Files.map((f) => f.name),
        mimeType: base64Files[0].mimeType,
      };

      const res = await fetch("/api/addCases/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: CaseApiResponse = await res.json();

      if (res.ok && json?.status === "success") {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore storage issues
        }
        router.push("/kasus");
      } else {
        alert(json?.message ?? "Gagal menambahkan case.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Kesalahan saat upload.");
    } finally {
      setLoading(false);
    }
  }, [compressing, files, loading, note, plainNote, router, tagsPreview, title, DRAFT_KEY]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void submitCase();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitCase]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submitCase();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                <Sparkles size={14} />
                Case Studio
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Tambah Kasus Baru</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Form dibuat lebih ringkas: isi judul, catatan, tag, lalu upload foto. Shortcut publish: Ctrl/Cmd + S.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Clock3 size={14} />
                {draftLabel}
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMinimalMode((prev) => !prev);
                    setShowAdvancedMobile(false);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {mobileMinimalMode ? "Mode Lengkap" : "Mode Minimal"}
                </button>
                {mobileMinimalMode ? (
                  <button
                    type="button"
                    onClick={() => setShowAdvancedMobile((prev) => !prev)}
                    className="rounded-lg border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                  >
                    {showAdvancedMobile ? "Sembunyikan Opsi" : "Opsi Lanjutan"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FileText size={16} />
                Judul Kasus
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Contoh: THR Kompleks - RS XYZ"
                required
              />
            </section>

            <section
              className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${
                hideAdvancedOnMobile ? "hidden lg:block" : ""
              }`}
            >
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Tags size={16} />
                Tag Kasus
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Contoh: thr, komplikasi, revisi"
              />

              {suggestedTagOptions.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-slate-500">Saran tag:</p>
                  {suggestedTagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}

              {tagsPreview.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagsPreview.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-xs text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {hideAdvancedOnMobile ? null : (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Wand2 size={16} />
                    Template Catatan
                  </p>
                  {NOTE_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              )}

              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FileText size={16} />
                Catatan Kasus (Rich Text)
              </label>
              <RichTextEditor
                value={note}
                onChange={setNote}
                placeholder="Tulis catatan kasus seperti menulis artikel blog..."
                minHeightClassName="min-h-[240px]"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>{wordCount} kata</span>
                <span>{readMinutes} menit baca</span>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ImagePlus size={16} />
                Upload Gambar Kasus
              </label>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  const droppedFiles = Array.from(event.dataTransfer.files);
                  void processSelectedFiles(droppedFiles, "append");
                }}
                className={`rounded-xl border-2 border-dashed p-4 text-center transition ${
                  isDragOver
                    ? "border-cyan-500 bg-cyan-50 dark:border-cyan-500 dark:bg-cyan-950/20"
                    : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                }`}
              >
                <UploadCloud className="mx-auto mb-2 text-slate-500" size={22} />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Drag & drop gambar ke sini, atau paste screenshot langsung (Ctrl/Cmd + V).
                </p>
                <p className="mt-1 text-xs text-slate-500">Gambar akan dikompresi otomatis agar upload lebih cepat.</p>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />

              {compressing ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <LoaderCircle className="animate-spin text-cyan-500" size={16} />
                  Menyiapkan gambar...
                </div>
              ) : null}

              {previewSrcs.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {previewSrcs.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative h-28 overflow-hidden rounded-lg border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
                      <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removeImageAt(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white hover:bg-black/80"
                        aria-label={`Hapus gambar ${index + 1}`}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {mobileMinimalMode ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => persistDraft()}
                    disabled={loading || compressing}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Simpan Draft Sekarang
                  </button>

                  <button
                    type="submit"
                    disabled={loading || compressing}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                      loading || compressing
                        ? "cursor-not-allowed bg-slate-500"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {(loading || compressing) && <LoaderCircle className="animate-spin" size={16} />}
                      {loading ? "Mengunggah..." : compressing ? "Menyiapkan..." : "Publikasikan Kasus"}
                    </span>
                  </button>
                </div>
              </section>
            ) : null}
          </div>

          <aside
            className={`space-y-4 lg:sticky lg:top-4 lg:self-start ${
              hideAdvancedOnMobile ? "hidden lg:block" : ""
            }`}
          >
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Checklist Input</h3>
              <div className="mt-3 space-y-2">
                {requiredChecklist.map((item) => (
                  <p key={item.label} className="inline-flex w-full items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    {item.done ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Circle size={16} className="text-slate-400" />
                    )}
                    {item.label}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {completedRequired}/{requiredChecklist.length} bagian wajib sudah lengkap.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preview Ringkas</h3>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Judul</p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{title || "-"}</p>

              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Tag</p>
              {tagsPreview.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {tagsPreview.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-500">-</p>
              )}

              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Catatan</p>
              {plainNote ? (
                <article
                  className="mt-1 max-h-40 overflow-auto text-sm text-slate-600 dark:text-slate-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-slate-400 [&_blockquote]:pl-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(note) }}
                />
              ) : (
                <p className="mt-1 text-sm text-slate-500">-</p>
              )}

              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Gambar</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{files.length} file</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => persistDraft()}
                  disabled={loading || compressing}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Simpan Draft Sekarang
                </button>

                <button
                  type="button"
                  onClick={clearDraft}
                  disabled={loading || compressing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Eraser size={16} />
                  Hapus Draft
                </button>

                <button
                  type="submit"
                  disabled={loading || compressing}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                    loading || compressing
                      ? "cursor-not-allowed bg-slate-500"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {(loading || compressing) && <LoaderCircle className="animate-spin" size={16} />}
                    {loading ? "Mengunggah..." : compressing ? "Menyiapkan..." : "Publikasikan Kasus"}
                  </span>
                </button>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}
