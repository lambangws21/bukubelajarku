"use client";

import { useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Banknote, X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export interface FormBiayaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    tanggal?: string;
    jenisBiaya?: string;
    keterangan?: string;
    jumlah?: number;
    klaimOleh?: string;
  };
}

export default function FormBiayaModal({
  isOpen,
  onClose,
  onSuccess,
  initialData
}: FormBiayaModalProps) {
  const [tanggal, setTanggal] = useState(initialData?.tanggal || "");
  const [jenisBiaya, setJenisBiaya] = useState(initialData?.jenisBiaya || "");
  const [keterangan, setKeterangan] = useState(initialData?.keterangan || "");
  const [jumlah, setJumlah] = useState<number | "">(initialData?.jumlah || "");
  const [klaimOleh, setKlaimOleh] = useState(initialData?.klaimOleh || "");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setTanggal("");
    setJenisBiaya("");
    setKeterangan("");
    setJumlah("");
    setKlaimOleh("");
    setFile(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !jenisBiaya || !keterangan || !jumlah || !klaimOleh) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    setIsLoading(true);
    try {
      let fileBase64 = "";
      let fileName = "";
      let mimeType = "";

      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            fileBase64 = base64;
            fileName = file.name;
            mimeType = file.type;
            resolve(true);
          };
        });
      }

      const res = await fetch("/api/advance/biayaPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: tanggal,
          jenisBiaya,
          keterangan,
          jumlah,
          klaimOleh,
          fileName,
          fileBase64,
          mimeType
        })
      });

      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "Gagal menyimpan data");
      }

      toast.success("Data berhasil disimpan!");
      onSuccess();
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error("Gagal: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 text-black dark:text-white border dark:border-gray-700 rounded-xl w-full max-w-md p-6 relative shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              {initialData ? "Edit Biaya Operasional" : "Tambah Biaya Operasional"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Tanggal */}
              <div>
                <label className="block mb-1 font-medium">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              {/* Jenis Biaya */}
              <div>
                <label className="block mb-1 font-medium">Jenis Biaya</label>
                <input
                  type="text"
                  value={jenisBiaya}
                  onChange={(e) => setJenisBiaya(e.target.value)}
                  placeholder="Contoh: Transport, ATK"
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block mb-1 font-medium">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Penjelasan detail biaya"
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block mb-1 font-medium">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  placeholder="Nominal"
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              {/* Klaim Oleh */}
              <div>
                <label className="block mb-1 font-medium">Klaim Oleh</label>
                <input
                  type="text"
                  value={klaimOleh}
                  onChange={(e) => setKlaimOleh(e.target.value)}
                  placeholder="Nama pengklaim"
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              {/* Upload File */}
              <div>
                <label className="block mb-1 font-medium">Upload File (opsional)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="w-full text-sm"
                />
              </div>

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 rounded-md text-white font-semibold transition ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
