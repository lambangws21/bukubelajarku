// data.ts
import { Bone, Lamp, Ruler, Cross, Scissors } from 'lucide-react';

// --- Tipe Data untuk Type Safety ---
interface AnatomyItem {
  icon?: React.ElementType;
  title: string;
  description: string;
  relevance: string;
}

interface SoftTissueItem {
  structure: string;
  location: string;
  relevance: string;
}

interface AxesKinematicsItem {
  icon: React.ElementType;
  concept: string;
  definition: string;
  relevance: string;
}

// --- Data Tulang Utama (Section 1) ---
export const mainBoneData: AnatomyItem[] = [
  {
    icon: Bone,
    title: "Femur (Tulang Paha)",
    description: "Tulang terbesar tubuh. Bagian distal memiliki Kondilus Femoral (medial & lateral) dan Alur Troklear.",
    relevance: "Komponen femoral dipasang di ujung distal. Penting menguasai orientasi rotasi dan fleksi/ekstensi dari pemotongan tulang ini."
  },
  {
    icon: Bone,
    title: "Tibia (Tulang Kering)",
    description: "Tulang utama kaki bawah. Bagian proksimal memiliki Dataran Tibial (Plato Tibial) tempat berartikulasi dengan femur.",
    relevance: "Komponen tibial & polyethylene insert dipasang di dataran proksimal. Penting memahami Tibial Slope (kemiringan) & Rotasi."
  },
  {
    icon: Bone,
    title: "Patella (Tempurung Lutut)",
    description: "Tulang sesamoid kecil di depan sendi, tertanam di tendon. Berfungsi sebagai katrol.",
    relevance: "Kadang-kadang diganti dengan komponen patella (plastik/polyethylene) dalam prosedur TKR."
  },
];

// --- Data Jaringan Lunak (Section 2) ---
export const softTissueData: SoftTissueItem[] = [
  {
    structure: "Ligamen Kolateral Medial (MCL)",
    location: "Sisi dalam lutut. Mencegah lutut menekuk ke dalam (valgus stress).",
    relevance: "Penentu utama **keseimbangan sisi medial**. Dipertimbangkan selama prosedur soft tissue balancing."
  },
  {
    structure: "Ligamen Kolateral Lateral (LCL)",
    location: "Sisi luar lutut. Mencegah lutut menekuk ke luar (varus stress).",
    relevance: "Penentu utama **keseimbangan sisi lateral**."
  },
  {
    structure: "Ligamen Cruciatum (ACL & PCL)",
    location: "Saling menyilang di tengah sendi. PCL mencegah tibia bergerak terlalu jauh ke belakang.",
    relevance: "ACL diangkat. Implan jenis **CR** mempertahankan PCL. Implan jenis **PS** mengorbankan PCL, menggunakan fitur *post-cam*."
  },
  {
    structure: "Kapsul Sendi",
    location: "Kantung yang mengelilingi sendi lutut.",
    relevance: "Titik masuk bedah. Pelepasan kapsul sering diperlukan untuk mendapatkan paparan optimal dan membantu soft tissue balancing."
  },
];

// --- Data Sumbu & Kinematika (Section 3 & 4) ---
export const axesKinematicsData: AxesKinematicsItem[] = [
  {
    icon: Ruler,
    concept: "Sumbu Mekanis (*Mechanical Axis*)",
    definition: "Garis imajiner yang membentang dari pusat kepala femur (panggul) melalui pusat lutut, hingga ke pusat pergelangan kaki.",
    relevance: "Target utama untuk pemasangan implan. Alignment yang salah dapat menyebabkan kegagalan implan dini."
  },
  {
    icon: Ruler,
    concept: "Sumbu Anatomis (*Anatomical Axis*)",
    definition: "Garis yang membentang di sepanjang tulang femur atau tibia. Biasanya membentuk sudut 5-7 derajat dengan Sumbu Mekanis pada femur.",
    relevance: "Digunakan sebagai panduan (referensi) awal dalam banyak sistem instrumen TKR."
  },
  {
    icon: Cross,
    concept: "Varus & Valgus Deformity",
    definition: "Varus (lutut O): melengkung ke luar. Valgus (lutut X): melengkung ke dalam.",
    relevance: "Jenis deformitas awal pasien menentukan strategi soft tissue balancing yang digunakan oleh ahli bedah."
  },
  {
    icon: Scissors,
    concept: "Flexion/Extension Gap",
    definition: "Ruang antara femur dan tibia yang akan diukur dan disesuaikan saat lutut ditekuk (fleksi) dan diluruskan (ekstensi).",
    relevance: "Alat pengukur (*spacer block*) digunakan untuk memastikan kedua ruang ini seimbang dan sesuai dengan ketebalan implan."
  },
  {
    icon: Lamp,
    concept: "Balancing Ligamen",
    definition: "Proses memanipulasi jaringan lunak untuk memastikan lutut buatan memiliki stabilitas yang sama di sisi medial dan lateral.",
    relevance: "Inti dari TKR. Memastikan fungsi lutut optimal baik saat fleksi maupun ekstensi."
  },
];