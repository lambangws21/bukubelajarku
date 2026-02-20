// src/lib/implantMaterials.ts

export type ImplantCategory = "TKR" | "THR" | "BIPOLAR" | "BEARING" | "STEM";

export type ImplantMaterialItem = {
  id: string;
  name: string;
  category: ImplantCategory;
  summary: string; // 1 paragraf super singkat
  tags: string[];
};

export const IMPLANT_MATERIALS: ImplantMaterialItem[] = [
  {
    id: "tkr-nexgen",
    name: "TKR NexGen",
    category: "TKR",
    summary:
      "Zimmer NexGen Knee System adalah sistem total knee replacement yang sudah lama terbukti secara klinis, menyediakan pilihan CR, PS hingga constrained dengan ukuran yang lengkap sehingga memudahkan penyesuaian anatomi pasien serta memberikan stabilitas dan presisi pemotongan yang baik di kamar operasi.",
    tags: ["zimmer", "nexgen", "knee", "cr", "ps", "constrained"],
  },
  {
    id: "tkr-vanguard",
    name: "TKR Vanguard",
    category: "TKR",
    summary:
      "Vanguard Knee System merupakan sistem TKR yang fleksibel karena memungkinkan perubahan intraoperatif dari CR ke PS dalam satu platform implant, sehingga memberikan keleluasaan bagi dokter dalam pengambilan keputusan tanpa perlu mengganti sistem saat operasi berlangsung.",
    tags: ["vanguard", "knee", "cr", "ps", "flexible"],
  },
  {
    id: "tkr-lcck",
    name: "TKR LCCK",
    category: "TKR",
    summary:
      "TKR LCCK adalah sistem knee dengan tingkat constraint lebih tinggi yang digunakan pada kasus instabilitas ligament, deformitas berat, atau revisi, dirancang untuk memberikan stabilitas tambahan tanpa menggunakan hinge penuh serta tetap menjaga kontrol gerak sendi.",
    tags: ["lcck", "constrained", "revision", "instability"],
  },
  {
    id: "tkr-persona",
    name: "TKR Persona",
    category: "TKR",
    summary:
      "TKR Persona adalah sistem total knee replacement yang dirancang berdasarkan konsep anatomi individual pasien, dengan variasi ukuran femoral dan tibial yang lebih spesifik untuk meningkatkan kesesuaian implant, stabilitas sendi, dan potensi fungsi lutut yang lebih natural pascaoperasi.",
    tags: ["persona", "personalized", "knee", "anatomy"],
  },

  {
    id: "thr-trilogy-it",
    name: "THR Trilogy IT",
    category: "THR",
    summary:
      "Trilogy IT Acetabular System adalah cup acetabulum modular untuk total hip replacement yang kompatibel dengan berbagai pilihan liner dan bearing, memberikan stabilitas yang baik serta fleksibilitas penggunaan baik pada kasus primer maupun kasus kompleks.",
    tags: ["trilogy", "acetabular", "cup", "modular"],
  },
  {
    id: "thr-mop",
    name: "THR MOP (Metal on Polyethylene)",
    category: "BEARING",
    summary:
      "THR Metal on Polyethylene merupakan kombinasi bearing yang paling umum digunakan karena memiliki teknik yang familiar, stabilitas yang baik, serta keandalan jangka panjang dengan tingkat keausan yang dapat dikontrol.",
    tags: ["mop", "bearing", "hip", "polyethylene"],
  },
  {
    id: "thr-cop",
    name: "THR COP (Ceramic on Polyethylene)",
    category: "BEARING",
    summary:
      "THR Ceramic on Polyethylene mengombinasikan head ceramic dengan liner polyethylene untuk menurunkan tingkat keausan dibanding MOP, sehingga cocok untuk pasien aktif dengan kebutuhan durabilitas lebih baik.",
    tags: ["cop", "bearing", "ceramic", "polyethylene"],
  },
  {
    id: "thr-hybrid",
    name: "THR Hybrid",
    category: "THR",
    summary:
      "THR Hybrid adalah kombinasi teknik pemasangan di mana komponen femoral menggunakan cemented stem sementara acetabular cup bersifat cementless, bertujuan mengoptimalkan fiksasi berdasarkan kondisi tulang pasien.",
    tags: ["hybrid", "cemented", "cementless", "hip"],
  },

  {
    id: "bipolar-ringloc",
    name: "Bipolar RingLoc",
    category: "BIPOLAR",
    summary:
      "Bipolar RingLoc adalah sistem kepala ganda yang umum digunakan pada hemiarthroplasty, dirancang untuk meningkatkan stabilitas sendi dan mengurangi gesekan pada acetabulum melalui mekanisme penguncian yang aman dan ukuran yang bervariasi.",
    tags: ["bipolar", "ringloc", "hemiarthroplasty"],
  },
  {
    id: "bipolar-multipolar",
    name: "Multipolar",
    category: "BIPOLAR",
    summary:
      "Multipolar hip system merupakan pengembangan konsep kepala ganda dengan variasi ukuran dan konfigurasi yang lebih luas, bertujuan meningkatkan rentang gerak, stabilitas, dan kenyamanan pasien terutama pada kasus fraktur panggul.",
    tags: ["multipolar", "bipolar", "range-of-motion", "stability"],
  },

  {
    id: "stem-wagner",
    name: "Wagner Stem",
    category: "STEM",
    summary:
      "Wagner femoral stem adalah stem dengan fiksasi distal yang kuat dan umumnya digunakan pada kasus revisi, memberikan stabilitas optimal pada kondisi tulang proksimal yang sudah tidak memadai.",
    tags: ["wagner", "stem", "revision", "distal-fixation"],
  },
  {
    id: "stem-ml-taper",
    name: "M/L Taper Stem",
    category: "STEM",
    summary:
      "M/L Taper stem adalah stem cementless dengan desain tapered wedge yang mengandalkan fiksasi metafisis, bersifat bone preserving, dan sering digunakan pada kasus total hip replacement primer dengan kualitas tulang yang baik.",
    tags: ["ml-taper", "cementless", "metaphyseal", "bone-preserving"],
  },
  {
    id: "stem-cpt",
    name: "CPT",
    category: "STEM",
    summary:
      "CPT adalah stem cemented dengan desain taper klasik yang banyak digunakan pada pasien usia lanjut atau kualitas tulang rendah, dengan keberhasilan pemasangan sangat bergantung pada teknik cementing yang baik.",
    tags: ["cpt", "cemented", "taper", "hip"],
  },
  {
    id: "bipolar-wagner",
    name: "Bipolar Wagner",
    category: "BIPOLAR",
    summary:
      "Bipolar Wagner adalah kombinasi sistem bipolar head dengan Wagner stem yang umumnya digunakan pada kasus fraktur atau kondisi tulang proksimal yang kurang baik, memberikan stabilitas kuat melalui fiksasi distal stem.",
    tags: ["bipolar", "wagner", "fracture", "distal-fixation"],
  },
  {
    id: "bipolar-cpt-longstem",
    name: "Bipolar CPT Long Stem",
    category: "BIPOLAR",
    summary:
      "Bipolar CPT long stem merupakan stem cemented panjang yang dikombinasikan dengan kepala bipolar, digunakan pada kasus fraktur dengan kualitas tulang rendah atau kebutuhan stabilitas tambahan di femur distal.",
    tags: ["bipolar", "cpt", "long-stem", "cemented"],
  },

  {
    id: "head-ceramic",
    name: "Head Ceramic",
    category: "BEARING",
    summary:
      "Head ceramic adalah komponen kepala femoral dengan tingkat keausan sangat rendah dan biokompatibilitas tinggi, sering digunakan pada total hip replacement untuk mengurangi debris partikel serta meningkatkan daya tahan implant jangka panjang.",
    tags: ["ceramic", "head", "wear", "biocompatible"],
  },
];
