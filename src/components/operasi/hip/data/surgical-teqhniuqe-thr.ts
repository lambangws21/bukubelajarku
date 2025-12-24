export interface ThrTechniqueStep {
  id: string;
  title: string;
  description: string;
  hoverNote: string;

  /** Fokus teknis utama pada langkah ini */
  focus: string;

  /** Peringatan / reminder klinis penting */
  reminder?: string;

  /** Dokumentasi visual (opsional) */
  images?: string[];
}

export const ThrTechniqueData: ThrTechniqueStep[] = [
  {
    id: "positioning",
    title: "Penempatan Pasien (Positioning)",
    description:
      "Pasien diposisikan lateral decubitus untuk memberikan akses optimal ke sendi panggul dan memudahkan orientasi acetabulum serta femur.",
    hoverNote:
      "Pastikan pelvis tegak lurus terhadap meja operasi untuk menghindari kesalahan orientasi komponen.",
    focus:
      "Menjaga posisi pelvis stabil dan sejajar sebagai referensi orientasi cup dan stem.",
    reminder:
      "Pelvis yang tidak stabil dapat menyebabkan kesalahan inklinasi dan anteversi acetabulum.",
    images: ["posisi_hip/img/lateralposisi.jpg"],
  },

  {
    id: "stabilization",
    title: "Stabilisasi Tubuh Pasien",
    description:
      "Bantalan dan support digunakan untuk mencegah pergeseran pelvis dan torso selama manipulasi ekstremitas bawah.",
    hoverNote:
      "Gunakan pelvic support anterior dan posterior dengan aman namun tidak berlebihan.",
    focus:
      "Mencegah rotasi pelvis selama preparasi acetabulum dan femur.",
    reminder:
      "Pergeseran pelvis intraoperatif akan mengubah orientasi acetabulum secara signifikan.",
    images: [
      "posisi_hip/img/support.jpg",
      "posisi_hip/img/62_Pr010_i020.png",
      "posisi_hip/img/62_Pr010_i010.png",
    ],
  },

  {
    id: "limb-positioning",
    title: "Penataan Anggota Gerak",
    description:
      "Penempatan dan manipulasi ekstremitas bawah membantu eksposur kapsul sendi dan akses ke femur proksimal.",
    hoverNote:
      "Abduksi dan rotasi eksternal sekitar 10–20° memudahkan eksposur.",
    focus:
      "Eksposur optimal kapsul sendi dan femur tanpa menimbulkan ketegangan jaringan lunak.",
    reminder:
      "Manipulasi ekstremitas yang berlebihan dapat meningkatkan risiko cedera saraf.",
    images: ["posisi_hip/img/antesup.webp"],
  },

  {
    id: "acetabular-orientation",
    title: "Orientasi & Preparasi Acetabulum",
    description:
      "Acetabulum dipreparasi dengan memperhatikan orientasi ideal untuk mencegah dislokasi dan impingement.",
    hoverNote:
      "Target inklinasi 40–45° dan anteversi 10–20°.",
    focus:
      "Mencapai orientasi acetabulum dalam safe zone biomekanik.",
    reminder:
      "Inklinasi atau anteversi yang berlebihan meningkatkan risiko keausan liner dan dislokasi.",
  },

  {
    id: "femoral-preparation",
    title: "Preparasi Femur & Pemasangan Stem",
    description:
      "Femur dipreparasi sesuai tipe stem (cemented atau cementless) dengan memperhatikan offset dan panjang kaki.",
    hoverNote:
      "Pastikan broaching mengikuti axis femur dan ukuran bertahap.",
    focus:
      "Stabilitas awal stem dan rekonstruksi biomekanik femur.",
    reminder:
      "Malalignment femur dapat menyebabkan subsidence atau nyeri pasca operasi.",
  },

  {
    id: "trial-reduction",
    title: "Trial Reduction & Evaluasi",
    description:
      "Trial dilakukan untuk mengevaluasi stabilitas sendi, range of motion, dan keseimbangan panjang kaki.",
    hoverNote:
      "Evaluasi dislokasi pada fleksi, ekstensi, dan rotasi.",
    focus:
      "Menilai stabilitas, ROM, dan panjang ekstremitas sebelum implantasi final.",
    reminder:
      "Jangan lanjut ke implantasi final sebelum stabilitas sendi optimal tercapai.",
  },

  {
    id: "final-implantation",
    title: "Implantasi Final & Reduksi Sendi",
    description:
      "Komponen definitif dipasang setelah trial optimal, diikuti dengan reduksi sendi akhir.",
    hoverNote:
      "Pastikan seating penuh kepala femoral pada taper stem.",
    focus:
      "Implantasi komponen definitif dengan stabilitas maksimal.",
    reminder:
      "Kepala femoral yang tidak seated sempurna dapat menyebabkan kegagalan dini.",
  },

  {
    id: "soft-tissue-protection",
    title: "Perlindungan Jaringan Lunak",
    description:
      "Retraktor dan manipulasi jaringan lunak harus dilakukan dengan hati-hati selama seluruh prosedur.",
    hoverNote:
      "Perhatikan posisi saraf sciatic sepanjang prosedur.",
    focus:
      "Mencegah cedera saraf dan jaringan lunak.",
    reminder:
      "Cedera saraf dapat menyebabkan defisit neurologis pasca operasi.",
  },

  {
    id: "intraoperative-monitoring",
    title: "Monitoring Intraoperatif & Evaluasi Akhir",
    description:
      "Evaluasi akhir dilakukan sebelum penutupan luka untuk memastikan stabilitas dan hemostasis.",
    hoverNote:
      "Pastikan tidak ada ketegangan berlebih pada jaringan lunak.",
    focus:
      "Konfirmasi akhir stabilitas sendi dan keamanan jaringan.",
    reminder:
      "Kesalahan kecil pada tahap akhir dapat berdampak besar pasca operasi.",
  },
];
