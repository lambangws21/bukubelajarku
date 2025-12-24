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

/* ================= CONTINUUM ACETABULAR LEARNING DATA ================= */
export const ContinuumAcetabularLearningData: LearningSection[] = [
  {
    order: 1,
    slug: "overview",
    title: {
      id: "Gambaran Umum Continuum® Acetabular System",
      en: "Overview of Continuum® Acetabular System",
    },
    content: {
      id: [
        "Continuum® Acetabular System adalah sistem acetabular modular yang dirancang untuk arthroplasty panggul primer dan revisi, menawarkan berbagai opsi lubang shell untuk fiksasi yang fleksibel. :contentReference[oaicite:1]{index=1}",
        "Cangkir tersedia dalam opsi uni-hole, cluster hole, dan multi-hole dengan rentang ukuran yang sesuai untuk berbagai anatomi. :contentReference[oaicite:2]{index=2}",
        "Sistem ini memungkinkan kombinasi dengan liner polyethylene dan berbagai pilihan kepala femoral sesuai kebutuhan klinis. :contentReference[oaicite:3]{index=3}",
      ],
      en: [
        "The Continuum® Acetabular System is a modular acetabular system designed for primary and revision hip arthroplasty, offering flexible shell hole options for fixation. :contentReference[oaicite:4]{index=4}",
        "The shells are available in uni-hole, cluster-hole, and multi-hole configurations with a range of sizes to accommodate different anatomies. :contentReference[oaicite:5]{index=5}",
        "This system allows combination with polyethylene liners and various femoral head options as needed for clinical scenarios. :contentReference[oaicite:6]{index=6}",
      ],
    },
    reference: {
      label: "Zimmer Biomet – Continuum® Acetabular System Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/continuum-acetabular-system-surgical-technique.pdf",
    },
  },
  {
    order: 2,
    slug: "indications",
    title: {
      id: "Indikasi & Penggunaan Klinis",
      en: "Indications & Clinical Use",
    },
    content: {
      id: [
        "Continuum® Acetabular System ditujukan untuk arthroplasty panggul primer maupun revisi pada pasien dewasa dengan penyakit degeneratif sendi panggul. :contentReference[oaicite:7]{index=7}",
        "Keputusan akhir tentang ukuran cangkir dan orientasi pemasangan dibuat berdasarkan templating dan penilaian intraoperatif ahli bedah. :contentReference[oaicite:8]{index=8}",
      ],
      en: [
        "The Continuum® Acetabular System is indicated for primary and revision hip arthroplasty in skeletally mature patients with degenerative joint disease. :contentReference[oaicite:9]{index=9}",
        "Final decisions on shell size and orientation should be based on templating and intraoperative surgeon assessment. :contentReference[oaicite:10]{index=10}",
      ],
    },
    reference: {
      label: "Zimmer Biomet – Continuum® Acetabular System Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/continuum-acetabular-system-surgical-technique.pdf",
    },
  },
  {
    order: 3,
    slug: "preoperative-planning",
    title: {
      id: "Perencanaan Pra Operasi",
      en: "Preoperative Planning",
    },
    content: {
      id: [
        "Perencanaan radiografis dilakukan untuk memperkirakan ukuran shell acetabular dan orientasi pemasangan yang diinginkan. :contentReference[oaicite:11]{index=11}",
        "Sudut abduksi dan anteversi awal yang direkomendasikan sering diatur sekitar 40–45° abduksi dan 15–20° anteversi untuk hasil klinis optimal. :contentReference[oaicite:12]{index=12}",
      ],
      en: [
        "Radiographic planning is performed to estimate the acetabular shell size and desired placement orientation. :contentReference[oaicite:13]{index=13}",
        "Initial recommended abduction and anteversion angles are often set around 40–45° of abduction and 15–20° of anteversion for optimal clinical outcomes. :contentReference[oaicite:14]{index=14}",
      ],
    },
    reference: {
      label: "Zimmer Biomet – Continuum® Acetabular System Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/continuum-acetabular-system-surgical-technique.pdf",
    },
  },
  {
    order: 4,
    slug: "acetabular-preparation",
    title: {
      id: "Persiapan Acetabulum & Reaming",
      en: "Acetabular Preparation & Reaming",
    },
    content: {
      id: [
        "Akibat jaringan lunak di sekitar acetabulum diangkat, acetabulum di-ream secara bertahap untuk mencapai tulang spons berdarah. :contentReference[oaicite:15]{index=15}",
        "Reaming dilakukan dengan hati-hati untuk menghindari reaming eksentrik dan memaksimalkan stabilitas shell akhir. :contentReference[oaicite:16]{index=16}",
      ],
      en: [
        "After soft tissue removal around the acetabulum, progressive reaming is performed to reach bleeding cancellous bone. :contentReference[oaicite:17]{index=17}",
        "Reaming should be performed carefully to avoid eccentric reaming and maximize final shell stability. :contentReference[oaicite:18]{index=18}",
      ],
    },
    reference: {
      label: "Zimmer Biomet – Continuum® Acetabular System Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/continuum-acetabular-system-surgical-technique.pdf",
    },
  },
  {
    order: 5,
    slug: "shell-insertion",
    title: {
      id: "Pemasangan Shell Acetabular",
      en: "Acetabular Shell Insertion",
    },
    content: {
      id: [
        "Shell acetabular dimasukkan ke dalam acetabulum yang sudah di-ream sesuai templating dan orientasi yang diinginkan. :contentReference[oaicite:19]{index=19}",
        "Instrumen pemasangan dan alignment guide digunakan untuk memastikan posisi pemasangan shell yang tepat. :contentReference[oaicite:20]{index=20}",
      ],
      en: [
        "The acetabular shell is inserted into the reamed acetabulum per templating and desired orientation. :contentReference[oaicite:21]{index=21}",
        "Insertion instruments and alignment guides are used to ensure accurate shell placement. :contentReference[oaicite:22]{index=22}",
      ],
    },
    reference: {
      label: "Zimmer Biomet – Continuum® Acetabular System Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/continuum-acetabular-system-surgical-technique.pdf",
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
        "Liner polyethylene dipilih dan dipasang ke dalam shell acetabular setelah pemasangan shell selesai. :contentReference[oaicite:23]{index=23}",
        "Pastikan mekanisme penguncian liner terpasang sempurna untuk stabilitas jangka panjang. :contentReference[oaicite:24]{index=24}",
      ],
      en: [
        "The polyethylene liner is selected and inserted into the acetabular shell after shell placement. :contentReference[oaicite:25]{index=25}",
        "Ensure the liner locking mechanism is fully engaged for long-term stability. :contentReference[oaicite:26]{index=26}",
      ],
    },
    reference: {
      label: "Zimmer Biomet – Continuum® Acetabular System Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/continuum-acetabular-system-surgical-technique.pdf",
    },
  },
];
