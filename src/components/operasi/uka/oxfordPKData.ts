/* ================= TYPES ================= */
export type OxfordPKPhase =
  | "overview"
  | "planning"
  | "surgical"
  | "cementing"
  | "postop";

export interface OxfordPKStep {
  id: string;
  phase: OxfordPKPhase;
  title: string;
  content: string[];
  image?: string;
  note?: string;
}

/* ================= DATA ================= */
export const OxfordPKLearningData: OxfordPKStep[] = [
  {
    id: "exposure",
    phase: "surgical",
    title: "Insisi dan Eksposur",
    content: [
      "Posisi fleksi lutut ±110°",
      "Insisi medial parapatellar",
      "Subluksasi patella (tidak dislokasi)",
      "Eksisi medial meniskus",
      "Konfirmasi ACL utuh",
    ],
    note:
      "Pastikan subluksasi dilakukan dengan lembut agar tidak merusak struktur jaringan lunak.",
  },

  {
    id: "osteophyte-removal",
    phase: "surgical",
    title: "Eksisi Osteofit",
    content: [
      "Bersihkan osteofit dari kondilus femoralis medial",
      "Bersihkan margin notch interkondiler",
      "Bersihkan sekitar MCL menggunakan pahat 6 mm",
      "Bersihkan tibia anterior dan superior ACL",
    ],
    note:
      "Bersihkan seluruh osteofit untuk menghindari impingement dan memastikan pergerakan bebas.",
  },

  {
    id: "gap-sizing",
    phase: "surgical",
    title: "Sizing dan Penyesuaian Gap",
    content: [
      "Gunakan Sizing Spoon (XS/S/M) lalu pasang G-clamp",
      "Pasang Tibial Saw Guide dengan shim 0 mm atau +2 mm",
      "Posisi guide mid-valgus lalu pin medial & lateral",
    ],
    note:
      "Gunakan shim +2 mm jika potongan terlalu tebal. Jarak spoon ideal 2–3 mm.",
  },

  {
    id: "tibial-resection",
    phase: "surgical",
    title: "Reseksi Tibia",
    content: [
      "Potong vertikal menggunakan reciprocating saw",
      "Gunakan slotted shim jika diperlukan",
      "Potong horizontal dengan oscillating saw ±12 mm",
      "Angkat plateau tibia dan bersihkan sisa jaringan",
      "Tentukan ukuran tibial trial",
    ],
    note:
      "Gunakan oscillating saw dengan hati-hati untuk menghindari cedera posterior tibia.",
  },

  {
    id: "femoral-drilling",
    phase: "surgical",
    title: "Drilling Femur",
    content: [
      "Bor intramedular dengan drill 4 mm lalu awl 5 mm",
      "Posisi 1 cm anterior dari PCL dan 1–2 mm lateral",
      "Masukkan IM rod dan pasang femoral drill guide",
    ],
    note:
      "Perhatikan arah guide sesuai sumbu femur, pegang IM rod dengan stabil.",
  },

  {
    id: "femoral-alignment",
    phase: "surgical",
    title: "Femoral Drill Guide & Alignment",
    content: [
      "Gunakan IM link dan pastikan garis tengah tepat",
      "Bor 4 mm dan 6,3 mm sesuai guide",
      "Lepas IM link dan guide dengan T-handle",
    ],
    note:
      "Sesuaikan IM link dengan garis mid-condyle yang telah dibuat.",
  },

  {
    id: "posterior-resection",
    phase: "surgical",
    title: "Reseksi Posterior Femur",
    content: [
      "Pasang posterior resection guide",
      "Potong posterior dengan saw blade 0.89 mm",
      "Lakukan sedikit bending saw untuk menjangkau penuh",
      "Keluarkan guide menggunakan ekstraktor",
    ],
    note:
      "Bending saw blade diperlukan agar reseksi posterior optimal.",
  },

  {
    id: "femoral-milling",
    phase: "surgical",
    title: "Milling Femoral Condyle",
    content: [
      "Gunakan spigot awal (0) sesuai perhitungan flexion-extension gap",
      "Gunakan spherical cutter untuk milling femur",
      "Lanjutkan milling bertahap bila diperlukan (1, 2, 3)",
    ],
    note:
      "Hindari overmilling karena dapat menyebabkan instabilitas.",
  },

  {
    id: "trial-evaluation",
    phase: "surgical",
    title: "Uji Trial",
    content: [
      "Masukkan femoral twin peg trial",
      "Masukkan tibial trial",
      "Cek insert dengan feeler gauge atau lollipop",
      "Evaluasi fleksi 110° dan ekstensi ±20°",
      "Pastikan tidak ada impingement",
    ],
  },

  {
    id: "tibial-preparation",
    phase: "surgical",
    title: "Finalisasi Persiapan Tibia",
    content: [
      "Pasang tibial template dan lakukan pinning",
      "Buat slot keel dengan groove chisel",
      "Bersihkan sisa tulang menggunakan cement curette",
      "Masukkan tibial trial kembali dan evaluasi",
    ],
    note:
      "Perhatikan perbedaan teknik antara implant cemented dan cementless.",
  },

  {
    id: "final-trial",
    phase: "surgical",
    title: "Trial Komponen Final",
    content: [
      "Masukkan femoral trial, tibial trial, dan insert",
      "Cek stabilitas dan range of motion",
      "Jika sesuai, lepaskan semua komponen trial",
    ],
  },

  {
    id: "cementing",
    phase: "cementing",
    title: "Cementing",
    content: [
      "Tibial: oles tipis cement lalu pasang tibial implant",
      "Tekan dari posterior dan gunakan impactor",
      "Femoral: isi cement lalu pasang femoral implant",
      "Tekan ±45° dan pasang feeler gauge saat curing",
    ],
    note:
      "Perhatikan waktu kerja cement agar pemasangan selesai sebelum curing.",
  },

  {
    id: "final-insert",
    phase: "postop",
    title: "Pemasangan Insert Final",
    content: [
      "Pilih bearing sesuai gap akhir",
      "Snap-in insert",
      "Pastikan tidak ada sisa cement posterior",
    ],
    note:
      "Konfirmasi ulang implant sebelum dibuka dan dipasang.",
  },
];
