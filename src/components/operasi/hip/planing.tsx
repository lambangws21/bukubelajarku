"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  CheckSquare,
  ScanLine,
  Layers,
  Ruler,
  AlertCircle,
} from "lucide-react";

/* ================= BASIC CLASSIFICATION ================= */

const classification = [
  {
    id: "cementless",
    title: "Cementless THR",
    color: "emerald",
    description:
      "Stem dan acetabulum dipasang tanpa semen, mengandalkan press-fit dan bone ingrowth.",
    points: [
      "Ideal untuk tulang baik (Dorr A–B)",
      "Pasien relatif muda dan aktif",
      "Risiko awal: subsidence & fracture",
    ],
  },
  {
    id: "cemented",
    title: "Cemented THR",
    color: "blue",
    description:
      "Stem dan/atau cup difiksasi menggunakan bone cement untuk stabilitas langsung.",
    points: [
      "Ideal untuk osteoporosis (Dorr C)",
      "Stabilitas awal sangat baik",
      "Teknik cementing sangat menentukan hasil",
    ],
  },
  {
    id: "hybrid",
    title: "Hybrid THR",
    color: "purple",
    description:
      "Stem cemented dikombinasikan dengan acetabulum cementless.",
    points: [
      "Femur lemah, acetabulum masih baik",
      "Kombinasi paling sering digunakan",
      "Memanfaatkan keunggulan kedua teknik",
    ],
  },
  {
    id: "reverse-hybrid",
    title: "Reverse Hybrid THR",
    color: "amber",
    description:
      "Stem cementless dikombinasikan dengan acetabulum cemented.",
    points: [
      "Jarang digunakan",
      "Kasus acetabulum tertentu",
      "Butuh pertimbangan khusus",
    ],
  },
];

/* ================= DECISION TREE ================= */

const decisionTree = [
  {
    id: "bone-quality",
    question: "Bagaimana kualitas tulang femur?",
    options: [
      {
        label: "Baik (Dorr A / B)",
        result: "Cementless Stem",
        note:
          "Bone ingrowth memberikan stabilitas jangka panjang.",
      },
      {
        label: "Buruk / Osteoporosis (Dorr C)",
        result: "Cemented Stem",
        note:
          "Mengurangi risiko subsidence dan fracture.",
      },
    ],
  },
  {
    id: "age-activity",
    question: "Usia dan tingkat aktivitas pasien?",
    options: [
      {
        label: "< 70 tahun, aktif",
        result: "Cementless Preferred",
        note:
          "Adaptasi tulang lebih baik.",
      },
      {
        label: "≥ 70 tahun, aktivitas rendah",
        result: "Cemented Preferred",
        note:
          "Stabilitas awal lebih dapat diprediksi.",
      },
    ],
  },
  {
    id: "revision",
    question: "Kasus revisi atau femur abnormal?",
    options: [
      {
        label: "Ya",
        result: "Revision / Modular Stem",
        note:
          "Membutuhkan fiksasi distal & fleksibilitas.",
      },
      {
        label: "Tidak",
        result: "Primary Stem",
        note:
          "Stem standar cukup.",
      },
    ],
  },
];

/* ================= PRE-OP CHECKLIST ================= */

const preOpChecklist = [
  {
    id: "xray",
    label:
      "X-ray AP pelvis & lateral tersedia dan layak untuk templating",
  },
  {
    id: "templating",
    label:
      "Ukuran stem, cup, offset, dan panjang leher telah ditentukan",
  },
  {
    id: "acetab-orientation",
    label:
      "Target inklinasi (40–45°) & anteversi (10–20°) telah ditetapkan",
  },
  {
    id: "head-size",
    label:
      "Ukuran kepala femoral (32–36 mm) sesuai liner",
  },
  {
    id: "taper",
    label:
      "Kompatibilitas taper stem & kepala femoral telah diverifikasi",
  },
  {
    id: "backup",
    label:
      "Ukuran implan cadangan & opsi revisi tersedia",
  },
  {
    id: "leg-length",
    label:
      "Target panjang kaki dan offset telah dikonfirmasi",
  },
  {
    id: "cement-plan",
    label:
      "Jika cemented: rencana semen, restrictor & teknik cementing siap",
  },
];

/* ================= COMPONENT ================= */

export const PlaningCard = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">
            Surgical Planning & Decision Framework – <span className="text-green-500 font-bold text-2xl">THR</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-14">
          {/* ================= BASIC CLASSIFICATION ================= */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Layers size={18} />
              Klasifikasi Dasar Total Hip Replacement
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {classification.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border p-4 bg-muted/30 space-y-2"
                >
                  <h4 className={`font-semibold text-${c.color}-700`}>
                    {c.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {c.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm">
              <AlertCircle className="inline mr-1" size={16} />
              Pemilihan tipe THR harus mempertimbangkan kualitas tulang,
              usia, aktivitas pasien, dan pengalaman operator.
            </div>
          </section>

          {/* ================= DECISION TREE ================= */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <GitBranch size={18} />
              Cemented vs Cementless Decision Tree
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {decisionTree.map((node) => (
                <div
                  key={node.id}
                  className="rounded-xl border p-4 bg-muted/30 space-y-3"
                >
                  <h4 className="font-medium">
                    {node.question}
                  </h4>

                  {node.options.map((opt) => (
                    <div
                      key={opt.label}
                      className="rounded-md border p-3 bg-background"
                    >
                      <p className="text-sm font-medium">
                        {opt.label}
                      </p>
                      <Badge className="my-1">
                        {opt.result}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {opt.note}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ================= PRE-OP CHECKLIST ================= */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <CheckSquare size={18} />
              Pre-Operative Checklist
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              {preOpChecklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>
    </motion.section>
  );
};
