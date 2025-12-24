export type TKALearningImage = {
    src: string;
    caption: string;
  };
  
  export type TKALearningSection = {
    id: string;
    title: string;
    figure: string;
    description: string[];
    bulletPoints?: string[];
    conclusion?: string;
    images: TKALearningImage[];
  };
  
  export const tkaFemoralRotationLearning: TKALearningSection[] = [
    {
      id: "q-angle",
      title: "Increased Q-Angle → Patellar Subluxation",
      figure: "Figure 5-90",
      description: [
        "Garis merah menunjukkan mechanical axis.",
        "Panah hitam menunjukkan arah tarikan quadriceps (Q-angle).",
      ],
      bulletPoints: [
        "Peningkatan Q-angle meningkatkan gaya lateral pada patella",
        "Patella terdorong ke arah lateral",
        "Patella TKA berbentuk dome → resistensi lateral rendah",
        "Risiko patellar subluxation / maltracking meningkat",
      ],
      conclusion:
        "Rotasi femur yang salah meningkatkan Q-angle dan menyebabkan patella mudah lari ke lateral.",
      images: [
        {
          src: "/images/tka/fig-5-90-q-angle.jpg",
          caption: "Hubungan Q-angle dengan gaya lateral patella",
        },
      ],
    },
  
    {
      id: "internal-rotation",
      title: "Internal Rotation Femoral Component",
      figure: "Figure 5-91",
      description: [
        "Femoral component diposisikan terlalu internal rotation.",
      ],
      bulletPoints: [
        "Trochlear groove menghadap ke medial",
        "Flexion gap menjadi trapezoidal (tidak simetris)",
        "Kompartemen medial tight",
        "Kompartemen lateral loose",
      ],
      conclusion:
        "Internal rotation femur adalah penyebab utama patella tilt, instability, stiffness, dan nyeri anterior knee pasca TKA.",
      images: [
        {
          src: "/images/tka/fig-5-91-internal-rotation.jpg",
          caption: "Dampak internal rotation femur pada patella dan flexion gap",
        },
      ],
    },
  
    {
      id: "external-rotation",
      title: "Proper Femoral Component – Slight External Rotation",
      figure: "Figure 5-92",
      description: [
        "Femoral component diposisikan dengan sedikit external rotation.",
      ],
      bulletPoints: [
        "Trochlear groove tepat di bawah patella",
        "Patella tracking berada di tengah (central tracking)",
        "Flexion gap berbentuk rectangular",
        "Sendi stabil dan tidak kaku",
      ],
      conclusion:
        "Slight external rotation adalah posisi femur yang diinginkan pada TKA.",
      images: [
        {
          src: "/images/tka/fig-5-92-external-rotation.jpg",
          caption: "Posisi ideal femoral component dengan external rotation",
        },
      ],
    },
  
    {
      id: "er-logic",
      title: "Kenapa External Rotation 3–5° Diperlukan",
      figure: "Figure 5-93",
      description: [
        "Pada native knee, tibia proximal umumnya varus ±3°.",
        "Pada TKA, tibia dipotong 90° terhadap mechanical axis.",
        "Perubahan ini menyebabkan flexion gap menjadi asimetris.",
      ],
      bulletPoints: [
        "Femur perlu dikompensasi dengan external rotation 3–5°",
        "Flexion gap menjadi rectangular",
        "Patella tracking lebih optimal",
        "Kinematika fleksi lebih natural",
      ],
      conclusion:
        "External rotation femur adalah kompensasi biomekanik akibat tibia cut pada TKA.",
      images: [
        {
          src: "/images/tka/fig-5-93-er-logic.jpg",
          caption: "Logika biomekanik kebutuhan external rotation femur",
        },
      ],
    },
  ];
  