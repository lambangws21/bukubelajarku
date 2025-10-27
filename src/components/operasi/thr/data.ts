// data.ts (Lanjutan)
import { Anchor, Zap, Shield, Split, Replace, Ruler, Brain, Cross, Scale } from 'lucide-react';

// --- Tipe Data untuk Type Safety ---

interface HipProcedure {
  title: string;
  definition: string;
  components: string;
  fixation: string;
  indication: string;
  icon: React.ElementType;
}

interface HipComponent {
  component: string;
  material: string;
  function: string;
}

interface HipAnatomy {
  structure: string;
  location: string;
  relevance: string;
}

// --- Data Prosedur Panggul (Section I & II) ---
export const hipProcedureData: HipProcedure[] = [
  {
    icon: Replace,
    title: "Total Hip Replacement (THR)",
    definition: "Mengganti seluruh sendi panggul yang rusak.",
    components: "Femoral Head, Femoral Stem, Acetabular Cup, Liner (Bantalan)",
    fixation: "Cemented (menggunakan semen) atau Cementless (press-fit/osseointegration).",
    indication: "Osteoarthritis berat, Rheumatoid Arthritis, Avascular Necrosis.",
  },
  {
    icon: Split,
    title: "Hemiarthroplasty (HA)",
    definition: "Mengganti hanya bagian kepala tulang paha (*Femoral Head*). Mangkuk panggul (*Acetabulum*) TIDAK diganti.",
    components: "Hanya Femoral Head (Unipolar atau Bipolar) dan Femoral Stem.",
    fixation: "Umumnya Cemented pada pasien lansia.",
    indication: "Patah Tulang Leher Femur (*Femoral Neck Fracture*) pada pasien lansia dengan aktivitas rendah.",
  },
];

// --- Komponen Implan THR (Lanjutan dari Section I.B) ---
export const thrComponentData: HipComponent[] = [
  {
    component: "Stem Femoral",
    material: "Titanium atau Paduan Cobalt-Chrome",
    function: "Batang yang dimasukkan ke dalam rongga sumsum tulang paha (femur). Titik jangkar utama.",
  },
  {
    component: "Head Femoral",
    material: "Keramik atau Logam",
    function: "Bola yang dipasang di atas stem. Berartikulasi dengan liner.",
  },
  {
    component: "Acetabular Cup",
    material: "Titanium",
    function: "Mangkuk logam yang dipasang di dalam tulang panggul (*acetabulum*).",
  },
  {
    component: "Liner / Bearing",
    material: "Polietilen, Keramik, atau Logam",
    function: "Bantalan yang berada di dalam cup. Tempat head berartikulasi.",
  },
];

// --- Anatomi Panggul Fungsional (Section III) ---
export const hipAnatomyData: HipAnatomy[] = [
  {
    structure: "Femur Proksimal",
    location: "Kepala (*Head*), Leher (*Neck*), Trochanter Mayor/Minor.",
    relevance: "Lokasi kunci untuk pemotongan leher dan pemasangan stem. Trochanter adalah acuan orientasi.",
  },
  {
    structure: "Acetabulum (Mangkuk Panggul)",
    location: "Bagian cekung dari tulang Pelvis tempat Femur Head berartikulasi.",
    relevance: "Titik pemasangan Acetabular Cup (pada THR). Orientasinya sangat kritis untuk stabilitas.",
  },
  {
    structure: "Saraf Sciaticus (Sciatic Nerve)",
    location: "Berjalan di bagian belakang panggul, dekat lokasi bedah posterior.",
    relevance: "Struktur Neurovaskular Kritis. Harus dihindari, kerusakan menyebabkan kelumpuhan kaki. Wajib dikenali TS.",
  },
  {
    structure: "Offset Femoral",
    location: "Jarak horizontal dari pusat kepala ke sumbu stem.",
    relevance: "Memengaruhi **keseimbangan otot panggul** dan harus direplikasi dengan tepat (menggunakan *trial head* dengan leher yang berbeda).",
  },
];

// --- Teknik Pengecekan Stabilitas (Section IV) ---
export const hipStabilityData: HipAnatomy[] = [
  {
    structure: "Range of Motion (ROM) Test",
    location: "Diuji pada Fleksi, Rotasi Internal/Eksternal, Abduksi, dan Adduksi ekstrem.",
    relevance: "Tujuan: Memastikan sendi tidak keluar dari tempatnya (**Dislokasi**) pada gerakan pasien sehari-hari. Jika dislokasi terjadi pada *trial*, segera ganti *head* yang lebih panjang.",
  },
  {
    structure: "Anteversi/Retroversi",
    location: "Orientasi putaran Femoral Stem dan Acetabular Cup.",
    relevance: "Orientasi yang salah adalah penyebab utama dislokasi THR. Alat *alignment guide* sangat vital di sini.",
  },
  {
    structure: "Leg Length Discrepancy (LLD)",
    location: "Perbedaan panjang kaki.",
    relevance: "Pemasangan yang tidak tepat menyebabkan kaki pasien menjadi lebih panjang/pendek. Wajib dicek setelah *trial* dipasang menggunakan pengukuran teknis.",
  },
];