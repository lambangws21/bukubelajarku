export type PersonaFigureStep = {
    figure: number;
    phase: string;
    title: string;
    details: string[];
    note?: string;
    image: string;
  };
  
  export const personaFigureSteps: PersonaFigureStep[] = [  
    {
      figure: 1,
      phase: "Pre-Operative Planning",
      title: "Preoperative Planning & Surgical Approach",
      details: [
        "Evaluasi radiografi berdiri AP, lateral, dan patella sunrise view.",
        "Identifikasi deformitas varus atau valgus serta cartilage wear.",
        "Tentukan pendekatan bedah: midvastus, subvastus, atau parapatellar medial.",
        "Tentukan apakah patella dievert atau disubluksasi."
      ],
      note:
        "Perencanaan awal menentukan keseimbangan jaringan lunak dan hasil patellofemoral.",
      image: "/persona_images/Figure_01_Preop.png",
    },
    {
      figure: 2,
      phase: "Femoral Preparation",
      title: "Intramedullary Alignment & Distal Femoral Resection",
      details: [
        "Masukkan IM rod sejajar dengan anterior cortex femur.",
        "Atur valgus angle sesuai sisi lutut (kiri/kanan).",
        "Tentukan kedalaman reseksi distal femur (10–14 mm).",
        "Lakukan reseksi distal femur menggunakan cutting guide."
      ],
      note:
        "Kesalahan pada tahap ini akan memengaruhi joint line dan extension gap.",
      image: "/persona_images/Figure_02_Distal_Femur.png",
    },
    {
      figure: 3,
      phase: "Femoral Preparation",
      title: "Femoral Sizing & External Rotation",
      details: [
        "Gunakan anterior referencing femoral sizer.",
        "Tentukan ukuran femur berdasarkan dimensi AP.",
        "Atur rotasi eksternal berdasarkan Whiteside line dan epicondylar axis."
      ],
      note:
        "Rotasi femur adalah faktor utama patella tracking dan flexion gap.",
      image: "/persona_images/Figure_03_Femoral_Rotation.png",
    },
    {
      figure: 4,
      phase: "Tibial Preparation",
      title: "Proximal Tibial Resection",
      details: [
        "Pasang panduan EM alignment dari pergelangan kaki.",
        "Atur posterior slope sesuai tipe insert.",
        "Tentukan level reseksi menggunakan stylus.",
        "Lakukan reseksi tibia secara datar."
      ],
      note:
        "Reseksi tibia yang tidak rata dapat menyebabkan maltracking dan loosening.",
      image: "/persona_images/Figure_04_Tibia_Cut.png",
    },
    {
      figure: 5,
      phase: "Patella Preparation",
      title: "Patellar Resection & Peg Drilling",
      details: [
        "Ukur ketebalan patella sebelum resection.",
        "Lakukan resection patella secara paralel.",
        "Bor lubang peg sesuai ukuran patella prosthesis."
      ],
      note:
        "Minimal sisa tulang patella adalah 10 mm untuk mencegah kegagalan.",
      image: "/persona_images/Figure_05_Patella.png",
    },
    {
      figure: 6,
      phase: "Trial & Closure",
      title: "Trial Reduction & Final Assessment",
      details: [
        "Pasang komponen trial femur, tibia, dan insert.",
        "Evaluasi ROM, stabilitas, dan patella tracking.",
        "Pastikan patella tracking tanpa tekanan manual."
      ],
      note:
        "Patella yang perlu ditekan menandakan masalah rotasi atau gap.",
      image: "/persona_images/Figure_06_Trial.png",
    },
  ];
  