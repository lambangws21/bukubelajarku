"use client";

import { useMemo, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import {
  LoaderCircle,
  Sparkles,
  ImagePlus,
  FileText,
} from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface CaseApiResponse {
  status?: string;
  message?: string;
  data?: { imageUrl: string };
}

export default function NewCaseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewSrcs, setPreviewSrcs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const stripHtml = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h1|h2|blockquote)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const notePreview = useMemo(() => stripHtml(note), [note]);
  const sanitizeHtml = (html: string) =>
    String(html || "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      setCompressing(true);
      try {
        const compressedFiles = await Promise.all(
          selectedFiles.map(file =>
            imageCompression(file, {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            })
          )
        );

        const previewPromises = compressedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        });

        const previews = await Promise.all(previewPromises);
        setPreviewSrcs(previews);
        setFiles(compressedFiles);
      } catch {
        alert("Gagal mengompresi gambar.");
      } finally {
        setCompressing(false);
      }
    } else {
      setPreviewSrcs([]);
    }
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !stripHtml(note).trim()) {
      alert("Title dan Note wajib diisi.");
      return;
    }
    if (files.length === 0) {
      alert("Silakan pilih file gambar.");
      return;
    }

    setLoading(true);
    try {
      const base64Files = await Promise.all(files.map(fileToBase64));
      const payload = {
        title: title.trim(),
        note: note.trim(),
        base64Images: base64Files.map(f => f.base64),
        fileNames: base64Files.map(f => f.name),
        mimeType: base64Files[0].mimeType,
      };

      const res = await fetch("/api/addCases/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: CaseApiResponse = await res.json();
      console.log("API response:", json);

      if (res.ok && json?.status === "success") {
        router.push("/kasus");
      } else {
        alert(json?.message ?? "Gagal menambahkan case.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Kesalahan saat upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-emerald-950/50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-300">
                <Sparkles size={14} />
                Case Studio
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Tambah Kasus Baru</h1>
              <p className="mt-1 text-sm text-slate-300">
                Tulis catatan seperti blog: pakai format bold, miring, underline, list, quote, dan link.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 xl:grid-cols-3"
        >
          <div className="space-y-4 xl:col-span-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FileText size={16} />
                Judul Kasus
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-800/40"
                placeholder="Contoh: THR Kompleks - RS XYZ"
                required
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FileText size={16} />
                Catatan Kasus (Rich Text)
              </label>
              <RichTextEditor
                value={note}
                onChange={setNote}
                placeholder="Tulis catatan kasus seperti menulis artikel blog..."
                minHeightClassName="min-h-[240px]"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <ImagePlus size={16} />
                Upload Gambar Kasus
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                required
              />

              {compressing && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">
                  <LoaderCircle className="animate-spin text-cyan-400" size={16} />
                  Mengompresi gambar...
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {previewSrcs.map((src, index) => (
                  <div key={index} className="relative h-28 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                    <Image
                      src={src}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Preview Ringkas</h3>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Judul</p>
              <p className="mt-1 text-sm text-slate-200">{title || "-"}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Catatan</p>
              {notePreview ? (
                <article
                  className="mt-1 max-h-48 overflow-auto text-sm text-slate-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-slate-600 [&_blockquote]:pl-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(note) }}
                />
              ) : (
                <p className="mt-1 text-sm text-slate-300">-</p>
              )}
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Jumlah Gambar</p>
              <p className="mt-1 text-sm text-slate-200">{files.length}</p>
            </div>

            <button
              type="submit"
              disabled={loading || compressing}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                loading || compressing
                  ? "cursor-not-allowed bg-slate-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {(loading || compressing) && <LoaderCircle className="animate-spin" size={16} />}
                {loading ? "Mengunggah..." : compressing ? "Menyiapkan..." : "Publikasikan Kasus"}
              </span>
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
