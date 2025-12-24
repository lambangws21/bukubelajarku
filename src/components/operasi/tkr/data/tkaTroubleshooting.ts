/* ===============================
   TKA Knowledge Base
   =============================== */

   export type TroubleshootingItem = {
    problem: string;
    cause: string;
    check: string;
    solution: string;
  };
  
  export type SimulationCase = {
    title: string;
    scenario: string;
    meaning: string;
    action: string[];
  };
  
  export type ImplantComparison = {
    type: "Medial Pivot" | "Posterior Stabilized (PS)";
    biomechanics: string[];
    intraOpNotes: string[];
    advantages: string[];
    risks: string[];
  };
  
  /* ===============================
     1. TROUBLESHOOTING TABLE
     =============================== */
  
  export const troubleshootingTable: TroubleshootingItem[] = [
    {
      problem: "Patella lari ke lateral saat fleksi",
      cause: "Femoral component internal rotation",
      check: "Cek alignment trochlear groove terhadap patella",
      solution: "Tambah external rotation femur ±1–2°",
    },
    {
      problem: "Patella tilt lateral",
      cause: "Flexion gap trapezoidal (medial tight)",
      check: "Spacer test di 90°",
      solution: "Koreksi external rotation femur dan posterior cut",
    },
    {
      problem: "Patella tidak center tanpa ditekan",
      cause: "Q-angle meningkat",
      check: "Lepas tekanan manual pada patella",
      solution: "Evaluasi ulang rotasi femur (bukan patella)",
    },
    {
      problem: "Tracking buruk di 60–90°",
      cause: "Femur sizing atau rotasi tidak tepat",
      check: "Trial femur + insert",
      solution: "Resize femur atau adjust rotasi",
    },
    {
      problem: "Tracking buruk di ekstensi",
      cause: "Overstuffing patella",
      check: "Cek ketebalan patella",
      solution: "Kurangi thickness patella",
    },
    {
      problem: "Patella masih bermasalah setelah balancing",
      cause: "Lateral retinaculum tight",
      check: "Patella glide test",
      solution: "Lateral release selektif (opsi terakhir)",
    },
  ];
  
  /* ===============================
     2. INTRA-OP SIMULATION
     =============================== */
  
  export const intraOpSimulations: SimulationCase[] = [
    {
      title: "Patella lari lateral di 90° fleksi",
      scenario:
        "Saat fleksi 90°, patella lari ke lateral dan bisa dikoreksi dengan tekanan manual",
      meaning:
        "Masalah utama adalah internal rotation femur, bukan patella",
      action: [
        "Tambah external rotation femur ±1–2°",
        "Cek ulang flexion gap harus rectangular",
      ],
    },
    {
      title: "Patella center di ekstensi, lari saat fleksi",
      scenario:
        "Tracking baik di ekstensi, memburuk saat fleksi",
      meaning:
        "Posterior femoral cut atau rotasi femur tidak tepat",
      action: [
        "Evaluasi PCA vs TEA",
        "Lakukan re-cut posterior femur dengan ER yang benar",
      ],
    },
    {
      title: "Patella selalu tilt walau rotasi sudah benar",
      scenario:
        "Tracking tidak membaik meskipun rotasi femur sudah dikoreksi",
      meaning:
        "Overstuffing patella atau mismatch femur-patella",
      action: [
        "Kurangi thickness patella",
        "Evaluasi ulang ukuran femoral component",
      ],
    },
    {
      title: "Semua balance baik tapi tracking masih buruk",
      scenario:
        "Gap balance dan rotasi sudah optimal",
      meaning:
        "Masalah soft tissue lateral",
      action: [
        "Pertimbangkan lateral release selektif",
        "Hindari release agresif",
      ],
    },
  ];
  
  /* ===============================
     3. MEDIAL PIVOT vs PS
     =============================== */
  
  export const implantComparison: ImplantComparison[] = [
    {
      type: "Medial Pivot",
      biomechanics: [
        "Medial stabil (ball-in-socket)",
        "Lateral compartment lebih mobile",
        "Patella tracking lebih natural",
      ],
      intraOpNotes: [
        "Rotasi femur harus sangat presisi",
        "Sedikit internal rotation langsung terasa stiff",
      ],
      advantages: [
        "Rasa lutut lebih natural",
        "Stabilitas tinggi saat aktivitas",
      ],
      risks: [
        "Tidak toleran terhadap kesalahan rotasi",
        "Stiffness jika gap tidak seimbang",
      ],
    },
    {
      type: "Posterior Stabilized (PS)",
      biomechanics: [
        "Cam-post menggantikan fungsi PCL",
        "Lebih forgiving terhadap soft tissue",
      ],
      intraOpNotes: [
        "Tracking patella lebih toleran",
        "Rotasi femur tetap krusial",
      ],
      advantages: [
        "Lebih mudah balancing",
        "Cocok untuk kasus ligament compromise",
      ],
      risks: [
        "Anterior knee pain jika rotasi femur salah",
        "Error kecil bisa muncul jangka panjang",
      ],
    },
  ];
  