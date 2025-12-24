/* ================= LANGUAGE ================= */
export type Language = "id" | "en";

/* ================= CONTENT BLOCK ================= */
export interface LearningText {
  id: string[];
  en: string[];
}

/* ================= LEARNING SECTION ================= */
export interface LearningSection {
  /** Urutan materi (untuk progress & next/prev) */
  order: number;

  /** Identifier manusiawi (untuk routing / analytics) */
  slug: string;

  /** Judul bilingual */
  title: {
    id: string;
    en: string;
  };

  /** Isi materi */
  content: LearningText;

  /** Sumber resmi */
  reference: {
    label: string;
    url: string;
  };
}

/* ================= CPT 12/14 LEARNING DATA ================= */
export const CPT1214LearningContent: LearningSection[] = [
  {
    order: 1,
    slug: "design-philosophy",
    title: {
      id: "Filosofi Desain CPT® 12/14",
      en: "CPT® 12/14 Design Philosophy",
    },
    content: {
      id: [
        "Stem CPT® 12/14 menggunakan desain double-taper yang telah digunakan secara klinis selama lebih dari 25 tahun.",
        "Desain taper memanfaatkan gaya kompresi alami tulang untuk menghasilkan stabilitas jangka panjang.",
        "Permukaan stem yang sangat dipoles berfungsi untuk mengurangi stress concentration pada semen."
      ],
      en: [
        "The CPT® 12/14 stem utilizes a double-taper design with more than 25 years of clinical use.",
        "The taper geometry harnesses natural compressive forces of bone to achieve long-term stability.",
        "The highly polished stem surface helps reduce stress concentration within the cement mantle."
      ],
    },
    reference: {
      label: "Zimmer Biomet – CPT® 12/14 Brochure (PDF)",
      url: "https://www.zimmerbiomet.lat/content/dam/zimmer-biomet/medical-professionals/hip/CPT%2012%20-%2014%20Femoral%20System/cpt-12-14-hips-system-brochure.pdf",
    },
  },

  {
    order: 2,
    slug: "key-features",
    title: {
      id: "Fitur Utama & Keunggulan",
      en: "Key Features & Advantages",
    },
    content: {
      id: [
        "Stem tersedia dalam berbagai pilihan offset tanpa mengubah ukuran body stem.",
        "Material cobalt-chromium memberikan kekuatan tinggi untuk desain stem yang ramping.",
        "Distal centralizer membantu menjaga posisi stem tetap sentral di dalam mantel semen."
      ],
      en: [
        "The stem offers multiple offset options without altering the body size.",
        "Cobalt-chromium material provides high strength allowing a slim stem design.",
        "A distal centralizer helps maintain central positioning within the cement mantle."
      ],
    },
    reference: {
      label: "Zimmer Biomet – CPT® 12/14 Brochure (PDF)",
      url: "https://www.zimmerbiomet.lat/content/dam/zimmer-biomet/medical-professionals/hip/CPT%2012%20-%2014%20Femoral%20System/cpt-12-14-hips-system-brochure.pdf",
    },
  },

  {
    order: 3,
    slug: "stem-options",
    title: {
      id: "Pilihan Ukuran & Offset Stem",
      en: "Stem Sizes & Offset Options",
    },
    content: {
      id: [
        "Sistem CPT® 12/14 menyediakan berbagai ukuran stem primer untuk menyesuaikan anatomi pasien.",
        "Pilihan offset standar, extended, dan extra-extended memungkinkan rekonstruksi biomekanik yang akurat.",
        "Stem revisi panjang dan opsi valgus tersedia untuk kasus kompleks."
      ],
      en: [
        "The CPT® 12/14 system provides multiple primary stem sizes to match patient anatomy.",
        "Standard, extended, and extra-extended offsets allow accurate biomechanical reconstruction.",
        "Long revision stems and valgus options are available for complex cases."
      ],
    },
    reference: {
      label: "Zimmer Biomet – CPT® 12/14 Brochure (PDF)",
      url: "https://www.zimmerbiomet.lat/content/dam/zimmer-biomet/medical-professionals/hip/CPT%2012%20-%2014%20Femoral%20System/cpt-12-14-hips-system-brochure.pdf",
    },
  },

  {
    order: 4,
    slug: "clinical-outcomes",
    title: {
      id: "Hasil Klinis & Pengalaman Penggunaan",
      en: "Clinical Outcomes & Experience",
    },
    content: {
      id: [
        "Data klinis menunjukkan tingkat revisi yang rendah pada penggunaan jangka menengah.",
        "Studi multicenter di Inggris melaporkan angka revisi sekitar 1.4% pada follow-up 7 tahun.",
        "Stem ini telah digunakan pada rentang usia pasien yang luas dengan hasil yang konsisten."
      ],
      en: [
        "Clinical data demonstrate low revision rates in mid-term follow-up.",
        "A UK multicenter study reported approximately 1.4% revision at 7 years.",
        "The stem has been used across a wide patient age range with consistent outcomes."
      ],
    },
    reference: {
      label: "Zimmer Biomet – CPT® 12/14 Brochure (PDF)",
      url: "https://www.zimmerbiomet.lat/content/dam/zimmer-biomet/medical-professionals/hip/CPT%2012%20-%2014%20Femoral%20System/cpt-12-14-hips-system-brochure.pdf",
    },
  },
];
