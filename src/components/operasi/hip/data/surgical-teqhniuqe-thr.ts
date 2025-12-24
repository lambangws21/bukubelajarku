// file: components/operasi/hip/data/thrTechniqueData.ts

export interface ThrTechniqueStep {
    id: string;
    title: string;
    description: string;
    hoverNote: string;
    images?: string [];
  }
  
  export const ThrTechniqueData: ThrTechniqueStep[] = [
    {
      id: "item-1",
      title: "Penempatan Pasien",
      description:
        "Posisi lateral dengan fleksi ekstremitas bawah sisi operasi memberikan akses optimal ke sendi pinggul.",
      hoverNote:
        "Pasien berbaring lateral dengan fleksi pinggul dan lutut 10–15° untuk eksposur optimal.",
      images: ["posisi_hip/img/lateralposisi.jpg"],
    },
    {
      id: "item-2",
      title: "Stabilisasi Tubuh",
      description:
        "Bantalan mencegah pergeseran pelvis selama tindakan bedah.",
      hoverNote:
        "Gunakan support untuk menjaga posisi pelvis dan bahu tetap stabil.",
      images: ["posisi_hip/img/support.jpg", 
        "posisi_hip/img/62_Pr010_i020.png",
      "posisi_hip/img/62_Pr010_i010.png",
    "posisi_hip/img/antesup.webp",],
        
    },
    {
      id: "item-3",
      title: "Penataan Anggota Gerak",
      description:
        "Rotasi kaki sangat membantu untuk eksposur pada kapsul sendi.",
      hoverNote:
        "Abduksi dan rotasi eksternal 10–20° untuk eksposur optimal.",
      images: [
        "posisi_hip/img/62_Pr010_i020.png",
      ],
    },
    {
      id: "item-4",
      title: "Orientasi Acetabulum dan Femur",
      description:
        "Orientasi yang tepat mencegah dislokasi dan memberikan kestabilan jangka panjang.",
      hoverNote:
        "Inklinasi 40–45°, anteversi 10–20° untuk acetabulum dan femur.",
    },
    {
      id: "item-5",
      title: "Pemasangan Implan",
      description:
        "Gunakan alat bantu intraoperatif untuk memastikan sudut dan posisi sesuai rencana.",
      hoverNote:
        "Alat bantu seperti alignment guide penting untuk akurasi.",
    },
    {
      id: "item-6",
      title: "Perlindungan Jaringan Lunak",
      description:
        "Hindari penarikan berlebihan dan gunakan retractors yang tepat selama prosedur.",
      hoverNote:
        "Jaga saraf sciatic dan jaringan sekitar tetap aman.",
    },
    {
      id: "item-7",
      title: "Monitoring Intraoperatif",
      description:
        "Monitoring saraf membantu mencegah komplikasi neurologis pasca operasi.",
      hoverNote:
        "Gunakan monitoring neuromuskular untuk deteksi dini cedera.",
    },
  ];
  
  