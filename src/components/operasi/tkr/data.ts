// data.ts
import { Bone, Lamp, Ruler, Cross, Scissors, Anchor, Zap, Shield, Component, Microscope, Scaling, Gauge } from 'lucide-react';

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

interface PolyDesign {
    title: string;
    acronym: string;
    icon: React.ElementType;
    pcl_status: string;
    femoral_design: string;
    stability_mechanism: string;
    ts_relevance: string;
  }
  
  interface PolyMaterial {
    material: string;
    description: string;
    ts_action: string;
  }
  
  interface PolyComplication {
    problem: string;
    mechanism: string;
    ts_prevention_focus: string;
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
    relevance: "ACL diangkat. Implan jenis CR mempertahankan PCL. Implan jenis **PS** mengorbankan PCL, menggunakan fitur post-cam."
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


export const functionalDesignData: PolyDesign[] = [
    {
      icon: Anchor,
      title: "Cruciate Retaining",
      acronym: "CR",
      pcl_status: "PCL dipertahankan (Retained). PCL harus sehat.",
      femoral_design: "Standar (tanpa cam).",
      stability_mechanism: "Mengandalkan PCL alami pasien untuk 'Femoral Rollback'.",
      ts_relevance: "Memastikan CR femoral dan insert siap. Fokus utama pada balancing MCL/LCL."
    },
    {
      icon: Zap,
      title: "Posterior Stabilized",
      acronym: "PS",
      pcl_status: "PCL diangkat (Sacrificed) atau lemah.",
      femoral_design: "Memiliki Cam (bantalan) yang menonjol di bagian tengah.",
      stability_mechanism: "Menggunakan mekanisme **Post Tibial** (pada insert) yang berinteraksi dengan **Cam Femoral**.",
      ts_relevance: "Harus menyiapkan alat **Femoral Box Cut** dan memverifikasi interaksi Post-Cam saat trial."
    },
    {
      icon: Shield,
      title: "Total Stabilized/Constrained",
      acronym: "TS / CC",
      pcl_status: "PCL diangkat, dan MCL/LCL juga tidak berfungsi optimal.",
      femoral_design: "Revisi (memiliki box yang lebih dalam) atau Hinge Mechanism.",
      stability_mechanism: "Memberikan stabilitas yang sangat tinggi, biasanya digunakan untuk kasus revisi atau deformitas parah.",
      ts_relevance: "Memastikan kompatibilitas dengan sistem revisi dan fiksasi (seringkali cemented/modular)."
    },
  ];
  
  // --- 2. Data Jenis Insert Berdasarkan Material (Pencegahan Keausan) ---
  export const materialData: PolyMaterial[] = [
    {
      material: "Conventional PE",
      description: "Polietilen standar. Paling rentan terhadap keausan (wear) dan osteolisis.",
      ts_action: "Memastikan hanya menggunakan material ini jika ada permintaan khusus atau sistem yang lebih lama. Diutamakan menggunakan material modern."
    },
    {
      material: "Cross-Linked PE (HXLPE)",
      description: "Diberi radiasi untuk meningkatkan ketahanan aus secara signifikan.",
      ts_action: "Memverifikasi bahwa *insert* definitif (terutama pada pasien yang lebih muda/aktif) adalah versi HXLPE terbaru dari merek yang didukung."
    },
    {
      material: "Antioxidant PE",
      description: "HXLPE yang dicampur dengan antioksidan (misalnya Vitamin E) untuk mencegah kerusakan oksidatif jangka panjang.",
      ts_action: "Menguasai penamaan dagang implan jenis ini di sistem Anda dan memprioritaskannya untuk daya tahan maksimum."
    }
  ];
  
  // --- 3. Data Komplikasi & Pencegahan (Fokus TS) ---
  export const complicationData: PolyComplication[] = [
    {
      problem: "Aseptik Loosening (Kelonggaran)",
      mechanism: "Partikel *wear* polietilen menyebabkan respons inflamasi yang melarutkan tulang (*Osteolisis*).",
      ts_prevention_focus: "Memastikan *alignment* implan yang sempurna (dengan instrumen guide) dan memilih material HXLPE untuk meminimalkan partikel *wear*."
    },
    {
      problem: "Post Wear / Cam Jump (PS Insert)",
      mechanism: "Gesekan berulang antara *post* tibial dan *cam* femoral; atau post melompati cam saat fleksi.",
      ts_prevention_focus: "Verifikasi interaksi Post-Cam yang mulus selama *trialing*. Memastikan *Femoral Box Cut* telah dilakukan dengan kedalaman yang tepat untuk mengakomodasi cam."
    },
    {
      problem: "Instabilitas (Longgar)",
      mechanism: "Dipilihnya *insert* yang terlalu tipis, atau kegagalan PCL (pada CR), menyebabkan lutut terasa longgar.",
      ts_prevention_focus: "Selalu siapkan *trial insert* dengan **penambahan 1-2 mm** (minimal *increment*) untuk membantu ahli bedah mencapai *soft tissue balancing* yang presisi dan kencang."
    },
    {
      problem: "Locking Mechanism Failure",
      mechanism: "Kegagalan penguncian *insert* ke *tibial baseplate* karena sisa semen atau orientasi yang salah.",
      ts_prevention_focus: "Wajib memverifikasi **secara visual dan verbal** bahwa *insert* definitif telah *fully seated* dan terkunci ke *baseplate* sebelum penutupan luka."
    }
  ];