// file: components/operasi/thr/ThrPlanningData.ts

export interface ThrPlanningStep {
    title: string;
    image: string;
    description: string;
  }
  
  export const ThrPlanningData: ThrPlanningStep[] = [
    {
      title: "Pre Operasi: Evaluasi Deformitas Sendi",
      image: "/procedure/posisihip/img/preop.jpg",
      description:
        "Gambar X-ray pre-operasi digunakan untuk menilai bentuk acetabulum dan kepala femur, serta mengevaluasi apakah terdapat deformitas, osteofit, atau penurunan ruang sendi yang signifikan. Data ini penting untuk menentukan pendekatan dan ukuran implan."
    },
    {
      title: "Post Operasi: Evaluasi Posisi Implan",
      image: "/procedure/posisihip/img/postOp.jpg",
      description:
        "Gambar X-ray post-operasi menunjukkan implan acetabular dan femoral dalam posisi akhir. Evaluasi mencakup posisi cup, offset, serta panjang ekstremitas. Kesalahan posisi dapat meningkatkan risiko dislokasi atau loosening."
    },
    {
      title: "Reaming Acetabulum",
      image: "/procedure/posisihip/img/62_Pr010_i010.png",
      description:
        "Langkah ini dilakukan untuk membentuk acetabulum agar sesuai dengan bentuk implan. Reaming dilakukan bertahap hingga didapatkan press-fit yang optimal untuk stabilitas awal."
    },
    {
      title: "Broaching Femur dan Pemasangan Stem",
      image: "/procedure/posisihip/img/62_Pr010_i020.png",
      description:
        "Kanal femur dibentuk menggunakan broach agar stem implan dapat dipasang sesuai axis anatomis. Trial component dipasang untuk mengevaluasi panjang kaki dan kestabilan sebelum pemasangan final."
    }
  ];
  