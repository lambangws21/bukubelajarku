/* ================= LANGUAGE ================= */
export type Language = "id" | "en";

/* ================= SECTION ================= */
export interface TrilogyITSection {
  /** Urutan materi */
  order: number;

  /** Identifier manusiawi */
  slug: string;

  /** Judul bilingual */
  title: {
    id: string;
    en: string;
  };

  /** Konten edukasi */
  content: {
    id: string[];
    en: string[];
  };

  /** Referensi resmi */
  reference: {
    label: string;
    url: string;
  };
}

/* ================= TRILOGY IT DATA ================= */
export const TrilogyITLearningContent: TrilogyITSection[] = [
  {
    order: 1,
    slug: "system-overview",
    title: {
      id: "Gambaran Umum Sistem Trilogy® IT",
      en: "Trilogy® IT System Overview",
    },
    content: {
      id: [
        "Trilogy® IT Acetabular System dirancang untuk fiksasi tanpa semen pada total hip arthroplasty.",
        "Cangkir acetabular berbentuk hemisfer dengan permukaan Fiber Metal titanium untuk mendukung pertumbuhan tulang.",
        "Sistem ini kompatibel dengan liner polyethylene netral dan elevated dengan mekanisme anti-rotasi."
      ],
      en: [
        "The Trilogy® IT Acetabular System is designed for cementless fixation in total hip arthroplasty.",
        "The hemispherical acetabular shell features a Fiber Metal titanium surface to promote bone ongrowth.",
        "The system accepts neutral and elevated polyethylene liners with anti-rotation locking mechanisms."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },

  {
    order: 2,
    slug: "indications",
    title: {
      id: "Indikasi dan Penggunaan Klinis",
      en: "Indications and Clinical Use",
    },
    content: {
      id: [
        "Digunakan pada pasien dewasa dengan penyakit sendi panggul degeneratif.",
        "Indikasi termasuk osteoarthritis, avascular necrosis, dan arthritis pasca trauma.",
        "Dapat digunakan pada prosedur primer maupun revisi."
      ],
      en: [
        "Indicated for skeletally mature patients with degenerative hip joint disease.",
        "Indications include osteoarthritis, avascular necrosis, and post-traumatic arthritis.",
        "Suitable for both primary and revision procedures."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },

  {
    order: 3,
    slug: "preoperative-planning",
    title: {
      id: "Perencanaan Pra-operatif",
      en: "Preoperative Planning",
    },
    content: {
      id: [
        "Templating radiografik dilakukan untuk memperkirakan ukuran cangkir dan posisi ideal.",
        "Orientasi awal yang direkomendasikan adalah sekitar 40–45° abduksi dan 15–20° anteversi.",
        "Evaluasi kualitas tulang acetabular penting untuk menentukan strategi fiksasi."
      ],
      en: [
        "Radiographic templating is performed to estimate cup size and ideal positioning.",
        "Recommended initial orientation is approximately 40–45° of abduction and 15–20° of anteversion.",
        "Assessment of acetabular bone quality is critical for fixation strategy."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },

  {
    order: 4,
    slug: "acetabular-preparation",
    title: {
      id: "Persiapan Acetabulum dan Reaming",
      en: "Acetabular Preparation and Reaming",
    },
    content: {
      id: [
        "Labrum acetabular dan osteofit perifer diangkat untuk mengekspos lantai acetabulum.",
        "Reaming dilakukan bertahap hingga mencapai tulang spons yang berdarah.",
        "Reamer harus dijaga tetap sentral untuk mencegah reaming eksentrik."
      ],
      en: [
        "The acetabular labrum and peripheral osteophytes are removed to expose the true acetabular floor.",
        "Reaming is performed incrementally until bleeding cancellous bone is achieved.",
        "The reamer must remain centered to avoid eccentric reaming."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },

  {
    order: 5,
    slug: "shell-insertion",
    title: {
      id: "Pemasangan Cangkir Acetabular",
      en: "Acetabular Shell Insertion",
    },
    content: {
      id: [
        "Cangkir acetabular dimasukkan menggunakan inserter sesuai ukuran terakhir reamer.",
        "Orientasi harus dikontrol menggunakan alignment guide.",
        "Fiksasi tambahan dapat dilakukan menggunakan sekrup acetabular bila diperlukan."
      ],
      en: [
        "The acetabular shell is inserted using an inserter matching the final reamer size.",
        "Orientation is controlled using alignment guides.",
        "Additional fixation may be achieved with acetabular screws if required."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },

  {
    order: 6,
    slug: "liner-insertion",
    title: {
      id: "Pemasangan Liner Polyethylene",
      en: "Polyethylene Liner Insertion",
    },
    content: {
      id: [
        "Liner polyethylene dipasang setelah posisi cangkir dikonfirmasi.",
        "Pastikan mekanisme penguncian liner terpasang sempurna.",
        "Pilih liner netral atau elevated sesuai kebutuhan stabilitas."
      ],
      en: [
        "The polyethylene liner is inserted after confirming shell position.",
        "Ensure the liner locking mechanism is fully engaged.",
        "Select neutral or elevated liners based on stability requirements."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },

  {
    order: 7,
    slug: "trial-reduction",
    title: {
      id: "Trial Reduction dan Evaluasi ROM",
      en: "Trial Reduction and ROM Evaluation",
    },
    content: {
      id: [
        "Dilakukan trial reduction untuk menilai stabilitas dan rentang gerak sendi.",
        "Periksa potensi impingement dan kecenderungan dislokasi.",
        "Lakukan penyesuaian bila diperlukan sebelum implantasi final."
      ],
      en: [
        "Trial reduction is performed to assess joint stability and range of motion.",
        "Evaluate for impingement and dislocation risk.",
        "Make adjustments as necessary before final implantation."
      ],
    },
    reference: {
      label: "Zimmer Biomet – Trilogy® IT Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/zimmer-trilogy-it-acetabular-system-surgical-technique.pdf",
    },
  },
];
