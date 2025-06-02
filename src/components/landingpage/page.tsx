// file: app/cases/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Eye } from "lucide-react";

interface CaseEntry {
  id: string;
  title: string;
  note: string;
}

// Dummy data “kasus” (mocked)
const DUMMY_CASES: CaseEntry[] = [
  {
    id: "1696118400000", // 1 Oktober 2023
    title: "Kasus #1 RSSA",
    note: `Slop Tibia kurang perhatikan bagian posterior Tibial.
Rangkap 2 pada tray rongeur.
Perhatikan alignment Humerus.
Pastikan pin berada di axis yang tepat.`,
  },
  {
    id: "1698796800000", // 1 November 2023
    title: "Kasus #2 RSUD XYZ",
    note: `Koagulopati ringan terdeteksi pasca‐operasi.
Ganti dressing tiap 2 hari.
Monitor range gerak sendi rutinnya.
Lanjutkan terapi fisik sesuai protokol.`,
  },
  {
    id: "1701475200000", // 1 Desember 2023
    title: "Kasus #3 Klinik ABC",
    note: `Pemasangan plate gagal posisinya sedikit varus.
Lakukan revisi osteotomi hari ke‐5.
Perhatikan distribusi beban gait training.
Koordinasikan dengan tim rehabilitasi.`,
  },
  {
    id: "1704067200000", // 1 Januari 2024
    title: "Kasus #4 RS PQR",
    note: `Trauma kompartemen tidak terantisipasi.
Elevasi kompartemen segera.
Periksa neurovaskular post‐op.
Pantau tanda‐tanda infeksi lokal.`,
  },
  {
    id: "1706745600000", // 1 Februari 2024
    title: "Kasus #5 RS Global",
    note: `Infeksi jaringan lunak ringan terjadi pasca‐operasi kedua.
Kultur jaringan diambil hari ke‐3.
Terapi antibiotik IV hingga terbukti negatif.
Periksa ulang parameter laboratorium.`,
  },
];

export default function CasesGridPage() {
  const [cases] = useState<CaseEntry[]>(DUMMY_CASES);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header: terang=abu-abu tua, gelap=abu-abu lebih gelap */}
      <div className="bg-gray-100 dark:bg-gray-800 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center">
          📋 Daftar Kasus Operasi
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mt-2 px-4 sm:px-0">
          Catatan lengkap untuk setiap kasus
        </p>
      </div>

      {/* Container Utama */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {cases.map((cs, idx) => (
            <Link key={cs.id} href={`/cases/${cs.id}`} className="group">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0px 6px 18px rgba(0,0,0,0.4)",
                }}
                className="relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg cursor-pointer flex flex-col transition-transform duration-200"
              >
                {/* Header Card: Ikon & Tanggal */}
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 px-4 py-2">
                  <BookOpen className="w-5 h-5 text-gray-800 dark:text-gray-100" />
                  <span className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {new Date(Number(cs.id)).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Konten Card */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {cs.title}
                  </h3>
                  {/* Batasi tinggi note agar seragam */}
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm sm:text-base leading-relaxed flex-1 overflow-hidden">
                    <p className="line-clamp-3">{cs.note}</p>
                  </div>
                </div>

                {/* Footer Card: Ikon “Lihat detail” */}
                <div className="bg-gray-200 dark:bg-gray-700 px-5 py-3 text-right">
                  <Eye
                    className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 inline-block"
                    aria-label="Lihat detail"
                  />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
