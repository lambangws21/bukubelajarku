// data.ts
// =====================================================
// THR EDUCATION & DECISION SUPPORT (IMAGE-DRIVEN)
// Reference: Fig. 2 – Fig. 6 (uploaded images)
// =====================================================

/* =======================
   BASIC TYPES
======================= */

export type ImageRef = {
  fig: string;                 // "Fig. 3"
  title: string;               // Caption singkat
  imagePaths: string[];        // path ke public/images
};

export type ExplanationBlock = {
  heading: string;
  points: string[];
  clinicalPearl?: string;
};

export type ThrSection = {
  id: string;
  title: string;
  purpose: string;
  imageRefs: ImageRef[];
  explanation: ExplanationBlock[];
};

export type DislocationRisk =
  | "POSTERIOR"
  | "ANTERIOR";

export type StemType =
  | "WAGNER"
  | "ML_TAPER"
  | "CPT";

export type DecisionRule = {
  condition: string;
  explanation: string;
  relatedFigures: string[];
  recommendedAction: string[];
};

/* =======================
   SECTION 1 — CUP ANGLES
   (Fig. 3)
======================= */

export const cupAngleSection: ThrSection = {
  id: "cup-angles",
  title: "Cup Inclination & Radiological Angles",
  purpose:
    "Memahami perbedaan sudut anatomis dan sudut radiologis agar tidak salah interpretasi X-ray.",
  imageRefs: [
    {
      fig: "Fig. 3",
      title: "Cup Inclination (CI) vs Lateral Opening Angle (LOA)",
      imagePaths: [
        "/images/Fig.3.png",
      ],
    },
  ],
  explanation: [
    {
      heading: "Definisi Sudut",
      points: [
        "Cup Inclination (CI) adalah sudut terhadap sumbu longitudinal tubuh pasien.",
        "Lateral Opening Angle (LOA) adalah sudut terhadap inter-teardrop line di X-ray AP.",
        "CI dan LOA tidak identik meskipun saling berkaitan.",
      ],
      clinicalPearl:
        "Kesalahan umum adalah mengoreksi cup hanya berdasarkan LOA tanpa mempertimbangkan posisi pelvis.",
    },
  ],
};

/* =======================
   SECTION 2 — COVERAGE
   (Fig. 4 & Fig. 5)
======================= */

export const coverageSection: ThrSection = {
  id: "coverage",
  title: "Anteversion & Arc of Coverage",
  purpose:
    "Memahami bagaimana perubahan anteversion dan desain cup memengaruhi stabilitas.",
  imageRefs: [
    {
      fig: "Fig. 4",
      title: "Perubahan Anterior & Posterior Coverage akibat Posisi Cup",
      imagePaths: [
        "/images/Fig.4.png",
      ],
    },
    {
      fig: "Fig. 5",
      title: "Perbandingan Arc of Coverage 180° vs 160°",
      imagePaths: [
        "/images/Fig.5.png",
      ],
    },
  ],
  explanation: [
    {
      heading: "Pengaruh Anteversion",
      points: [
        "Cup lebih horizontal meningkatkan anterior-superior coverage (ASC).",
        "Namun posterior-inferior area menjadi lebih uncovered.",
        "Cup lebih anteverted menurunkan ASC tetapi meningkatkan posterior coverage.",
      ],
    },
    {
      heading: "Desain Cup",
      points: [
        "Cup dengan coverage 180° memiliki arc of coverage lebih besar.",
        "Cup 160° lebih sensitif terhadap kesalahan posisi.",
      ],
      clinicalPearl:
        "Cup dengan coverage kecil membutuhkan presisi posisi yang lebih tinggi.",
    },
  ],
};

/* =======================
   SECTION 3 — LLD & HIP CENTER
   (Fig. 6 & Fig. 2)
======================= */

export const lldSection: ThrSection = {
  id: "lld",
  title: "Leg Length Discrepancy & Hip Center",
  purpose:
    "Mencegah salah tafsir posisi cup akibat bias radiologis dan perubahan biomekanik.",
  imageRefs: [
    {
      fig: "Fig. 6",
      title: "FLOA vs RLOA pada LLD",
      imagePaths: [
        "/images/Fig.6.png",
      ],
    },
    {
      fig: "Fig. 2",
      title: "Hip Length & Hip Rotation Center",
      imagePaths: [
        "/images/Fig.2.png",
      ],
    },
  ],
  explanation: [
    {
      heading: "Bias Radiologis",
      points: [
        "Tanpa LLD, functional dan radiological angle adalah sama.",
        "Dengan LLD, cup tampak lebih vertikal di sisi kaki panjang.",
        "Dan tampak lebih horizontal di sisi kaki pendek.",
      ],
    },
    {
      heading: "Hip Center",
      points: [
        "Hip center yang lebih tinggi mengurangi hip length.",
        "Hip length harus dikompensasi untuk menjaga abductor tension.",
      ],
      clinicalPearl:
        "Jangan membandingkan sisi kiri dan kanan cup tanpa mempertimbangkan LLD.",
    },
  ],
};

/* =======================
   DISLOCATION DECISION RULES
   (ALL FIGURES)
======================= */

export const dislocationRules: Record<DislocationRisk, DecisionRule[]> = {
  POSTERIOR: [
    {
      condition: "Cup terlalu horizontal atau retroverted",
      explanation:
        "Posterior-inferior area menjadi uncovered sehingga kepala femur mudah keluar saat fleksi dan rotasi internal.",
      relatedFigures: ["Fig. 4B", "Fig. 5"],
      recommendedAction: [
        "Tambahkan anteversion cup atau stem",
        "Pertimbangkan cup dengan coverage lebih besar",
        "Gunakan head diameter lebih besar",
      ],
    },
    {
      condition: "Combined anteversion terlalu kecil",
      explanation:
        "Kurangnya anteversion total menyebabkan posterior jump.",
      relatedFigures: ["Fig. 4A"],
      recommendedAction: [
        "Tambahkan anteversion stem (Wagner / CPT)",
      ],
    },
  ],

  ANTERIOR: [
    {
      condition: "Cup terlalu anteverted atau terlalu vertikal",
      explanation:
        "Anterior-superior coverage berkurang sehingga terjadi anterior jump saat ekstensi.",
      relatedFigures: ["Fig. 4C"],
      recommendedAction: [
        "Kurangi anteversion atau inclination cup",
        "Kurangi anteversion stem",
      ],
    },
    {
      condition: "Combined anteversion berlebihan",
      explanation:
        "Stem dan cup sama-sama anteverted sehingga coverage anterior tidak mencukupi.",
      relatedFigures: ["Fig. 3", "Fig. 4"],
      recommendedAction: [
        "Reposisi cup",
        "Gunakan stem dengan kontrol anteversion",
      ],
    },
  ],
};

/* =======================
   STEM BEHAVIOR SUMMARY
======================= */

export const stemBehavior: Record<StemType, string[]> = {
  WAGNER: [
    "Anteversion dikontrol operator",
    "Bisa mengoreksi error cup kecil",
    "Risiko over-anteversion bila tidak dikontrol",
  ],
  ML_TAPER: [
    "Anteversion mengikuti femur",
    "Cup harus presisi",
    "Offset sangat menentukan stabilitas",
  ],
  CPT: [
    "Anteversion dikontrol via cement",
    "Forgiving terhadap error kecil",
    "Butuh cement mantle yang baik",
  ],
};

/* =======================
   EXPORT ALL SECTIONS
======================= */

export const thrLearningData: ThrSection[] = [
  cupAngleSection,
  coverageSection,
  lldSection,
];
