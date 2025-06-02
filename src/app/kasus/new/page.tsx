// file: app/cases/new/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";

export default function NewCaseForm() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Handle file selection and generate previews
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    setFiles(selected);
    if (selected) {
      const urls: string[] = [];
      for (let i = 0; i < selected.length; i++) {
        urls.push(URL.createObjectURL(selected[i]));
      }
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
  };

  // Convert a File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip out the "data:*/*;base64," prefix
        const commaIndex = result.indexOf(",");
        resolve(result.slice(commaIndex + 1));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim() || !note.trim() || !files || files.length === 0) {
      setError("Judul, catatan, dan setidaknya satu foto wajib diisi.");
      return;
    }
    setLoading(true);

    try {
      // Convert all selected files to base64
      const base64Images: string[] = [];
      const fileNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const b64 = await fileToBase64(file);
        base64Images.push(b64);
        // Remove extension from original name
        const nameOnly = file.name.replace(/\.[^/.]+$/, "");
        fileNames.push(nameOnly);
      }

      // Kirim data ke API Next.js (yang meneruskan ke Apps Script doPost)
      const payload = {
        title,
        note,
        base64Images,
        fileNames,
        mimeType: "image/jpeg", // atau sesuaikan jika semua file PNG
      };

      const res = await fetch("/api/addCases/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.status === "success") {
        setSuccess("Kasus berhasil ditambahkan!");
        setTitle("");
        setNote("");
        setFiles(null);
        setPreviewUrls([]);
      } else {
        setError(json.message || "Gagal menambahkan kasus");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mengirim data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Tambah Kasus Baru</h2>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-500 text-sm text-center">{success}</p>
        )}

        <div>
          <label className="block text-gray-300 mb-1">Judul Kasus</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded focus:outline-none"
            placeholder="Masukkan judul ..."
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-1">Catatan</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded focus:outline-none resize-none h-24"
            placeholder="Masukkan catatan lengkap ..."
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-1">Foto (bisa pilih banyak)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-gray-100"
            required
          />
        </div>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative w-full h-24 bg-gray-700 rounded overflow-hidden"
              >
                <Image
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Kasus"}
        </button>
      </form>
    </div>
  );
}
