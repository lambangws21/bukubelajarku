// data/vanguardSteps.ts

export interface VanguardStep {
  step: number;
  title: string;
  description: string[];
  note?: string;
  images: string[];
}

export const vanguardSteps: VanguardStep[] = [
  {
    step: 1,
    title: "Perencanaan Praoperasi",
    description: [
      "Lakukan rontgen berdiri dari pinggul ke pergelangan kaki.",
      "Ukur sudut antara sumbu mekanik dan sumbu anatomis.",
      "Gunakan hasil rontgen untuk mengira-ngira ukuran implan."
    ],
    images: ["/vanguard_images/vanguard_step_5.png"]
  },
  {
    step: 2,
    title: "Pilihan Jalur Sayatan",
    description: [
      "Mini medial parapatellar",
      "Mid-vastus",
      "Sub-vastus"
    ],
    images: [
      "/vanguard_images/vanguard_step_7.png",
      "/vanguard_images/vanguard_step_8.png",
      "/vanguard_images/vanguard_step_9.png"
    ]
  },
  {
    step: 3,
    title: "Potong Tulang Paha (Distal Femur)",
    description: [
      "Gunakan bor masuk ke tengah tulang paha.",
      "Atur sudut potong (0–9°).",
      "Tentukan seberapa banyak tulangnya mau dipotong (1–11 mm)."
    ],
    images: [
      "/vanguard_images/vanguard_step_12.png",
      "/vanguard_images/vanguard_step_13.png",
      "/vanguard_images/vanguard_step_14.png",
      "/vanguard_images/vanguard_step_15.png"
    ]
  },
  {
    step: 4,
    title: "Ukur Ukuran Tulang Paha",
    description: [
      "Letakkan alat pengukur di ujung tulang paha.",
      "Pilih rotasi netral atau rotasi keluar 3 derajat."
    ],
    images: [
      "/vanguard_images/vanguard_step_16.png",
      "/vanguard_images/vanguard_step_17.png"
    ]
  },
  {
    step: 5,
    title: "Potong 4 Sisi Femur",
    description: [
      "Gunakan alat 4-in-1 untuk potong bagian depan, belakang, dan chamfer.",
      "Cek adanya risiko notch dan sesuaikan."
    ],
    images: [
      "/vanguard_images/vanguard_step_18.png",
      "/vanguard_images/vanguard_step_19.png"
    ]
  },
  {
    step: 6,
    title: "Siapkan Lubang Kotak untuk PS",
    description: [
      "Gunakan alat kotak atau bor khusus (mill).",
      "Pastikan tidak ada bagian alat yang menonjol."
    ],
    images: [
      "/vanguard_images/vanguard_step_20.png",
      "/vanguard_images/vanguard_step_21.png"
    ]
  },
  {
    step: 7,
    title: "Potong Tibia",
    description: [
      "Gunakan metode extramedullary atau intramedullary.",
      "Atur alat potong sesuai tinggi dan kemiringan."
    ],
    images: [
      "/vanguard_images/vanguard_step_22.png",
      "/vanguard_images/vanguard_step_23.png"
    ]
  },
  {
    step: 8,
    title: "Ukur dan Rotasi Plat Tibia",
    description: [
      "Pilih ukuran plat yang sesuai.",
      "Rotasi plat sesuai anatomi kaki."
    ],
    images: ["/vanguard_images/vanguard_step_26.png"]
  },
  {
    step: 9,
    title: "Lubang Batang Tibia",
    description: [
      "Gunakan teknik punch atau ream-punch.",
      "Pilih alat sesuai batang tibia (I-beam / cruciate)."
    ],
    images: ["/vanguard_images/vanguard_step_27.png"]
  },
  {
    step: 10,
    title: "Uji Coba Komponen",
    description: [
      "Pasang semua bagian tiruan.",
      "Cek gerakan, kekencangan, dan kecocokan."
    ],
    images: ["/vanguard_images/vanguard_step_30.png"]
  },
  {
    step: 11,
    title: "Pasang Implan Tibia",
    description: [
      "Rakit dan pasang plat tibia dan batangnya.",
      "Pastikan terpasang dengan benar dan kokoh."
    ],
    images: ["/vanguard_images/vanguard_step_35.png"]
  },
  {
    step: 12,
    title: "Pasang Implan Femur",
    description: [
      "Masukkan komponen femoral ke tulang paha.",
      "Tekan atau pukul perlahan hingga pas."
    ],
    images: ["/vanguard_images/vanguard_step_35.png"]
  },
  {
    step: 13,
    title: "Pasang Sisipan Polietilena",
    description: [
      "Masukkan sisipan ke plat tibia.",
      "Gunakan alat khusus untuk mengunci dengan aman."
    ],
    images: ["/vanguard_images/vanguard_step_29.png"]
  }
];
