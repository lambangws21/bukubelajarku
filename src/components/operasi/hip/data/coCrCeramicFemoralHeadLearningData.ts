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

  /** Identifier manusiawi */
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

/* ================= COCR + CERAMIC FEMORAL HEADS DATA ================= */
export const CoCrCeramicFemoralHeadLearningData: LearningSection[] = [
  {
    order: 1,
    slug: "overview",
    title: {
      id: "Gambaran Umum Kepala Femoral CoCr & Keramik",
      en: "Overview of CoCr & Ceramic Femoral Heads",
    },
    content: {
      id: [
        "Kepala femoral CoCr (Cobalt-Chromium) diproduksi dengan berbagai diameter dan konfigurasi leher yang kompatibel dengan taper stem yang sesuai. :contentReference[oaicite:1]{index=1}",
        "Kepala femoral keramik dibuat dari bahan keramik matriks aluminium-oksida sesuai standar ISO 6474-2 dan tersedia dalam desain dengan dan tanpa sleeve. :contentReference[oaicite:2]{index=2}",
        "Kepala non-sleeved hanya boleh digunakan pada stem yang tidak cacat, sedangkan kepala keramik bersleeve dengan adaptor taper harus dipilih untuk kasus revisi. :contentReference[oaicite:3]{index=3}",
      ],
      en: [
        "CoCr (Cobalt-Chromium) femoral heads are manufactured in various diameters and neck configurations compatible with appropriate stem tapers. :contentReference[oaicite:4]{index=4}",
        "Ceramic femoral heads are made from aluminum oxide matrix ceramic according to ISO 6474-2 and are available in both sleeved and non-sleeved designs. :contentReference[oaicite:5]{index=5}",
        "Non-sleeved ceramic heads should only be implanted on undamaged stems, while sleeved ceramic heads require an appropriate taper adapter for revision cases. :contentReference[oaicite:6]{index=6}",
      ],
    },
    reference: {
      label:
        "Zimmer Biomet CoCr & Ceramic Femoral Heads Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/1705.1-GLBL-en%20CoCr%20and%20Ceramic%20Femoral%20Heads%20Surgical%20Technique.pdf",
    },
  },
  {
    order: 2,
    slug: "indications",
    title: {
      id: "Indikasi & Kompatibilitas",
      en: "Indications & Compatibility",
    },
    content: {
      id: [
        "Kepala femoral dimaksudkan untuk digunakan dalam total hip arthroplasty atau hemi-hip arthroplasty pada pasien primer dan revisi. :contentReference[oaicite:7]{index=7}",
        "Pastikan kompatibilitas kepala dengan taper pada stem (contoh: 12/14 atau Type I) sesuai dengan informasi kompatibilitas produk. :contentReference[oaicite:8]{index=8}",
        "Hindari penggunaan ukuran kepala keramik 22.2 mm pada stem CoCr atau stainless steel karena stres mekanik tinggi yang dapat menyebabkan kerusakan. :contentReference[oaicite:9]{index=9}",
      ],
      en: [
        "Femoral heads are intended for use in total hip arthroplasty or hemi-hip arthroplasty in both primary and revision patients. :contentReference[oaicite:10]{index=10}",
        "Ensure compatibility of the chosen head with the stem taper (e.g., 12/14 or Type I) according to product compatibility documentation. :contentReference[oaicite:11]{index=11}",
        "Avoid 22.2 mm ceramic head sizes with CoCr or stainless steel stems due to high mechanical stresses that may lead to damage. :contentReference[oaicite:12]{index=12}",
      ],
    },
    reference: {
      label:
        "Zimmer Biomet CoCr & Ceramic Femoral Heads Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/1705.1-GLBL-en%20CoCr%20and%20Ceramic%20Femoral%20Heads%20Surgical%20Technique.pdf",
    },
  },
  {
    order: 3,
    slug: "preoperative-planning",
    title: {
      id: "Perencanaan Pra-Operasi",
      en: "Preoperative Planning",
    },
    content: {
      id: [
        "Tujuan utama perencanaan pra-operasi adalah menentukan panjang kaki, ukuran komponen acetabular & femoral, offset, dan posisi pusat rotasi sendi. :contentReference[oaicite:13]{index=13}",
        "Gunakan templating radiografik atau digital untuk mengestimasi ukuran kepala dan leher yang sesuai dengan ukuran stem yang dipilih. :contentReference[oaicite:14]{index=14}",
      ],
      en: [
        "The main objectives of preoperative planning are to define leg length, acetabular and femoral component sizes, offset, and joint center of rotation. :contentReference[oaicite:15]{index=15}",
        "Use radiographic or digital templating to estimate appropriate head and neck sizes that match the selected stem. :contentReference[oaicite:16]{index=16}",
      ],
    },
    reference: {
      label:
        "Zimmer Biomet CoCr & Ceramic Femoral Heads Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/1705.1-GLBL-en%20CoCr%20and%20Ceramic%20Femoral%20Heads%20Surgical%20Technique.pdf",
    },
  },
  {
    order: 4,
    slug: "trial-reduction",
    title: {
      id: "Trial Reduction & Evaluasi",
      en: "Trial Reduction & Evaluation",
    },
    content: {
      id: [
        "Lakukan trial reduction setelah memasang provisional head untuk menilai panjang kaki, range of motion, dan stabilitas sendi. :contentReference[oaicite:17]{index=17}",
        "Pastikan osteofit atau jaringan yang menghambat ROM diangkat untuk memaksimalkan stabilitas. :contentReference[oaicite:18]{index=18}",
      ],
      en: [
        "Perform trial reduction after placing the provisional head to assess leg length, range of motion, and joint stability. :contentReference[oaicite:19]{index=19}",
        "Ensure removal of prominent impinging bone or soft tissue to optimize stability and ROM. :contentReference[oaicite:20]{index=20}",
      ],
    },
    reference: {
      label:
        "Zimmer Biomet CoCr & Ceramic Femoral Heads Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/1705.1-GLBL-en%20CoCr%20and%20Ceramic%20Femoral%20Heads%20Surgical%20Technique.pdf",
    },
  },
  {
    order: 5,
    slug: "final-implantation",
    title: {
      id: "Implantasi Akhir Kepala Femoral",
      en: "Final Femoral Head Implantation",
    },
    content: {
      id: [
        "Setelah semua komponen lain telah dipasang dan diuji, pilih kepala femoral akhir sesuai dengan ukuran trial yang optimal. :contentReference[oaicite:21]{index=21}",
        "Tempatkan kepala femoral definitif pada taper stem dengan memastikan seating penuh tanpa goyangan atau gap. :contentReference[oaicite:22]{index=22}",
        "Verifikasi stabilitas akhir sendi, ROM, dan panjang anggota pasca pemasangan kepala femoral. :contentReference[oaicite:23]{index=23}",
      ],
      en: [
        "After all other components are placed and tested, choose the definitive femoral head according to the optimal trial size. :contentReference[oaicite:24]{index=24}",
        "Seat the definitive femoral head onto the stem taper ensuring full seating without wobble or gap. :contentReference[oaicite:25]{index=25}",
        "Verify final joint stability, ROM, and leg length after femoral head implantation. :contentReference[oaicite:26]{index=26}",
      ],
    },
    reference: {
      label:
        "Zimmer Biomet CoCr & Ceramic Femoral Heads Surgical Technique (PDF)",
      url: "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/000-surgical-techniques/hip/1705.1-GLBL-en%20CoCr%20and%20Ceramic%20Femoral%20Heads%20Surgical%20Technique.pdf",
    },
  },
];
