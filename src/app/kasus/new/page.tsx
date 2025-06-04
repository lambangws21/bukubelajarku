// file: app/cases/new/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { LoaderCircle, AlertCircle } from "lucide-react";

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

    if (!title.trim() || !note.trim()) {
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg bg-gray-800 rounded-lg shadow-lg p-6 space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Tambah Case Baru</h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Masukkan judul case"
          required
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Masukkan note case"
          rows={4}
          required
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFileChange}
          className="text-gray-200"
          required
        />

        {compressing && (
          <div className="text-center flex justify-center animate-spin">
            <LoaderCircle className="text-indigo-500" size={32} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {previewSrcs.map((src, index) => (
            <div key={index} className="w-32 h-32 relative">
              <Image
                src={src}
                alt={`Preview ${index}`}
                fill
                className="object-cover rounded-md border border-gray-600"
                unoptimized
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || compressing}
          className={`w-full px-4 py-2 rounded-md font-semibold text-white flex items-center justify-center gap-2 ${
            loading || compressing
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {(loading || compressing) && <LoaderCircle className="animate-spin" size={20} />}
          {loading ? "Mengunggah..." : compressing ? "Mengompresi..." : "Tambah Case"}
        </button>
      </form>
    </div>
  );
}
