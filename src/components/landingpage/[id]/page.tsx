// file: app/cases/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft } from "lucide-react";

interface CaseEntry {
  id: string;
  title: string;
  note: string;
}

const DUMMY_CASES: CaseEntry[] = [
  {
    id: "1696118400000",
    title: "Kasus #1 RSSA",
    note: `Slop Tibia kurang perhatikan bagian posterior Tibial.
Rangkap 2 pada tray rongeur.
Perhatikan alignment Humerus.`,
  },
  {
    id: "1698796800000",
    title: "Kasus #2 RSUD XYZ",
    note: `Koagulopati ringan terdeteksi pasca‐operasi.
Ganti dressing tiap 2 hari.
Monitor range gerak sendi rutinnya.`,
  },
  {
    id: "1701475200000",
    title: "Kasus #3 Klinik ABC",
    note: `Pemasangan plate gagal posisinya sedikit varus.
Lakukan revisi osteotomi hari ke‐5.
Perhatikan distribusi beban gait training.`,
  },
  {
    id: "1704067200000",
    title: "Kasus #4 RS PQR",
    note: `Trauma kompartemen tidak terantisipasi.
Elevasi kompartemen segera.
Periksa neurovaskular post‐op.`,
  },
  {
    id: "1706745600000",
    title: "Kasus #5 RS Global",
    note: `Infeksi jaringan lunak ringan terjadi pasca‐operasi kedua.
Kultur jaringan diambil hari ke‐3.
Terapi antibiotik IV hingga terbukti negatif.`,
  },
];

export default function CaseDetailPage() {
  // Hooks tanpa kondisi
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseEntry | null>(null);

  // Derive `id`
  let id: string | null = null;
  if (params && typeof params.id === "string") {
    id = params.id;
  }

  useEffect(() => {
    if (!id) {
      setCaseData(null);
      return;
    }
    const found = DUMMY_CASES.find((c) => c.id === id);
    setCaseData(found ?? null);
  }, [id]);

  if (!id || !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <p className="text-gray-500 dark:text-gray-400">Data kasus tidak ditemukan.</p>
      </div>
    );
  }

  const formattedDate = new Date(Number(caseData.id)).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      {/* Tombol Kembali */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-800 dark:text-gray-200 mb-6 hover:text-gray-600 dark:hover:text-gray-400"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        <span className="text-sm font-medium">Kembali</span>
      </button>

      {/* Card Detail */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-md overflow-hidden"
      >
        {/* Header Card */}
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 px-5 py-3">
          <BookOpen className="w-6 h-6 text-gray-800 dark:text-gray-100" />
          <h1 className="ml-3 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {caseData.title}
          </h1>
          <span className="ml-auto text-sm text-gray-800 dark:text-gray-200">
            {formattedDate}
          </span>
        </div>

        {/* Isi Note */}
        <div className="p-6">
          <h2 className="text-md sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
            Catatan Lengkap:
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm sm:text-base leading-relaxed">
            {caseData.note}
          </p>
        </div>

        {/* Footer Card */}
        <div className="bg-gray-200 dark:bg-gray-700 px-6 py-4 text-right">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            • Detail diambil dari data sampel
          </span>
        </div>
      </motion.div>
    </div>
  );
}
