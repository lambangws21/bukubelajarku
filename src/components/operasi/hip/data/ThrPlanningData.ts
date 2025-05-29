// file: components/operasi/hip/data/thrPlanningData.ts

export interface ThrPlanningStep {
    title: string;
    description: string;
    image: string;
  }
  
  export const ThrPlanningData: ThrPlanningStep[] = [
    {
      title: "Pre Operasi: Evaluasi Deformitas Sendi",
      description: "X-ray pre-operasi digunakan untuk menilai deformitas dan menentukan pendekatan serta ukuran implan.",
      image: "/posisi_hip/img/preop.jpg"
    },
    {
      title: "Post Operasi: Evaluasi Posisi Implan",
      description: "X-ray post-operasi menunjukkan posisi akhir implan dan mengevaluasi kestabilan serta panjang ekstremitas.",
      image: "/posisi_hip/img/postOp.jpg"
    },
    {
      title: "Reaming Acetabulum",
      description: "Acetabulum dibentuk menggunakan reamer untuk menciptakan press-fit optimal bagi implan cup.",
      image: "/posisi_hip/img/62_Pr010_i010.png"
    },
    {
      title: "Broaching Femur dan Pemasangan Stem",
      description: "Kanal femur dibentuk dengan broach dan trial component dipasang untuk evaluasi stabilitas dan panjang ekstremitas.",
      image: "/posisi_hip/img/62_Pr010_i020.png"
    }
  ];
  