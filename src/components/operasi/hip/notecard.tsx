"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ================= GUIDELINE DATA ================= */

const guidelineGroups = [
  {
    group: "Acetabulum Orientation",
    color: "emerald",
    items: [
      {
        id: "acetab-inclination",
        title: "Inklinasi Acetabulum",
        value: "40–45°",
        description:
          "Kemiringan cup acetabulum terhadap bidang frontal untuk menurunkan risiko impingement dan dislokasi.",
      },
      {
        id: "acetab-version",
        title: "Anteversi Acetabulum",
        value: "10–20°",
        description:
          "Rotasi anterior cup untuk menjaga stabilitas dan meningkatkan ROM yang aman.",
      },
    ],
  },
  {
    group: "Femoral & Stem Orientation",
    color: "blue",
    items: [
      {
        id: "femoral-anteversion",
        title: "Anteversi Femoral",
        value: "10–15°",
        description:
          "Menjaga keselarasan dengan acetabulum dan mengurangi dislokasi posterior.",
      },
      {
        id: "external-rotation",
        title: "Rotasi Eksternal",
        value: "5–10°",
        description:
          "Membantu orientasi stem dan mencegah varus/valgus malalignment.",
      },
    ],
  },
  {
    group: "Femoral Head & Articulation",
    color: "purple",
    items: [
      {
        id: "head-size",
        title: "Ukuran Kepala Femoral",
        value: "32–36 mm",
        description:
          "Diameter lebih besar meningkatkan stabilitas dengan tetap mempertimbangkan liner.",
      },
      {
        id: "taper-compatibility",
        title: "Kompatibilitas Taper",
        value: "12/14 atau sesuai stem",
        description:
          "Ketidaksesuaian taper dapat menyebabkan micromotion dan kerusakan taper.",
      },
    ],
  },
];

/* ================= PITFALLS ================= */

const clinicalPitfalls = [
  {
    id: "excessive-inclination",
    title: "Inklinasi Cup Terlalu Curam",
    description:
      "Inklinasi >50° meningkatkan keausan liner dan risiko dislokasi superior.",
  },
  {
    id: "low-anteversion",
    title: "Anteversi Terlalu Rendah",
    description:
      "Meningkatkan risiko impingement posterior dan dislokasi posterior.",
  },
  {
    id: "taper-damage",
    title: "Kerusakan Taper Stem",
    description:
      "Menggunakan kepala keramik tanpa sleeve pada taper yang rusak dapat menyebabkan fraktur kepala.",
  },
  {
    id: "leg-length",
    title: "Ketidakseimbangan Panjang Kaki",
    description:
      "Kesalahan offset atau panjang leher dapat menyebabkan nyeri punggung dan ketidakpuasan pasien.",
  },
];

/* ================= DO & DONT ================= */

const doList = [
  "Pastikan kompatibilitas taper antara stem dan kepala femoral",
  "Lakukan trial reduction untuk mengevaluasi stabilitas dan ROM",
  "Periksa posisi cup dan stem pada dua bidang (AP & lateral)",
  "Bersihkan taper sebelum pemasangan kepala femoral definitif",
];

const dontList = [
  "Jangan memasang kepala keramik pada taper yang rusak",
  "Jangan mengabaikan pengaruh offset terhadap panjang kaki",
  "Jangan menggunakan sudut ekstrem di luar safe zone",
  "Jangan mengunci kepala femoral sebelum evaluasi stabilitas akhir",
];

/* ================= COMPONENT ================= */

const NoteCard = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Clinical Notes, Pitfalls & Surgical Checklist
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-12">
          {/* ================= GUIDELINES ================= */}
          {guidelineGroups.map((group) => (
            <div key={group.group} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">
                  {group.group}
                </h3>
                <Badge
                  className={`bg-${group.color}-100 text-${group.color}-700`}
                >
                  Guideline
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg border p-4 bg-muted/30"
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">
                        {item.title}
                      </h4>
                      <Badge variant="secondary">
                        {item.value}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {/* ================= PITFALLS ================= */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-600">
              <AlertTriangle size={18} />
              Clinical Pitfalls
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {clinicalPitfalls.map((pitfall) => (
                <div
                  key={pitfall.id}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                >
                  <h4 className="font-medium">
                    {pitfall.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {pitfall.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ================= DO & DONT ================= */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* DO */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-emerald-600">
                <CheckCircle2 size={18} />
                Do
              </h3>
              <ul className="space-y-2 text-sm">
                {doList.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-emerald-600 mt-0.5"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* DONT */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600">
                <XCircle size={18} />
                Don’t
              </h3>
              <ul className="space-y-2 text-sm">
                {dontList.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2"
                  >
                    <XCircle
                      size={16}
                      className="text-red-600 mt-0.5"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default NoteCard;
