/* ===============================
   TYPES
   =============================== */

   export type TroubleshootingRow = {
    finding: string;
    cause: string;
    check: string;
    correction: string;
  };
  
  export type IntraOpScenario = {
    id: string;
    title: string;
    steps: string[];
    interpretation: string[];
    actions: string[];
  };
  
  export type ImplantComparison = {
    name: "Medial Pivot" | "Posterior Stabilized (PS)";
    biomechanics: string[];
    intraOpPractical: string[];
    suitableFor: string[];
    risks: string[];
  };
  
  /* ===============================
     1. TROUBLESHOOTING TABLE
     =============================== */
  
  export const troubleshootingTable: TroubleshootingRow[] = [
    {
      finding: "Patella lari ke lateral saat fleksi",
      cause: "Femoral component internal rotation",
      check: "Bandingkan arah trochlear groove dengan posisi patella",
      correction: "Tambah external rotation femur ±1–2°",
    },
    {
      finding: "Patella tilt lateral, AP baik",
      cause: "Flexion gap trapezoidal (medial tight)",
      check: "Spacer test di 90° (medial lebih ketat)",
      correction: "Tambah ER femur / re-balance posterior femur",
    },
    {
      finding: "Patella tidak mau center tanpa ditekan",
      cause: "Q-angle meningkat",
      check: "Cek alignment tibia–femur",
      correction: "Koreksi rotasi femur, bukan patella",
    },
    {
      finding: "Tracking buruk di 60–90°",
      cause: "Femur sizing atau rotasi tidak tepat",
      check: "Trial femur dan insert",
      correction: "Resize femur atau adjust external rotation",
    },
    {
      finding: "Tracking buruk di full extension",
      cause: "Overstuffing patella atau femur",
      check: "Evaluasi thickness patella",
      correction: "Kurangi thickness patella",
    },
    {
      finding: "Patella terasa tertarik lateral",
      cause: "Lateral retinaculum ketat",
      check: "Patella glide test",
      correction: "Lateral release selektif (opsi terakhir)",
    },
    {
      finding: "Nyeri anterior meski tracking center",
      cause: "Trochlea–patella mismatch",
      check: "Trial ukuran femur lain",
      correction: "Ganti ukuran / seri femoral component",
    },
  ];
  
  /* ===============================
     2. INTRA-OP SIMULATION
     =============================== */
  
  export const intraOpScenarios: IntraOpScenario[] = [
    {
      id: "scenario-a",
      title: "Patella lari lateral di 90° fleksi",
      steps: [
        "Lepas tangan → patella lari ke lateral",
        "Ditekan manual → patella bisa center",
      ],
      interpretation: [
        "Bukan patella problem",
        "Masalah utama adalah internal rotation femur",
      ],
      actions: [
        "Tambah external rotation femur ±1–2°",
        "Cek ulang flexion gap harus rectangular",
      ],
    },
    {
      id: "scenario-b",
      title: "Patella center di ekstensi, lari saat fleksi",
      steps: [
        "Tracking baik di ekstensi",
        "Tracking memburuk saat fleksi",
      ],
      interpretation: [
        "Posterior femoral cut atau rotasi femur tidak tepat",
      ],
      actions: [
        "Evaluasi PCA vs TEA",
        "Re-cut posterior femur dengan ER yang benar",
      ],
    },
    {
      id: "scenario-c",
      title: "Patella selalu tilt walau rotasi sudah benar",
      steps: [
        "Rotasi femur sudah dikoreksi",
        "Tracking tetap buruk",
      ],
      interpretation: [
        "Overstuffing patella atau mismatch ukuran",
      ],
      actions: [
        "Kurangi thickness patella",
        "Cek ulang ukuran femoral component",
      ],
    },
    {
      id: "scenario-d",
      title: "Semua balance baik tapi tracking masih jelek",
      steps: [
        "Gap seimbang",
        "Rotasi femur sudah ideal",
      ],
      interpretation: [
        "Masalah soft tissue lateral",
      ],
      actions: [
        "Lateral release selektif",
        "Hindari release agresif",
      ],
    },
  ];
  
  /* ===============================
     3. MEDIAL PIVOT vs PS
     =============================== */
  
  export const implantComparison: ImplantComparison[] = [
    {
      name: "Medial Pivot",
      biomechanics: [
        "Medial compartment stabil (ball-in-socket)",
        "Lateral compartment lebih mobile",
        "Patella tracking lebih natural",
      ],
      intraOpPractical: [
        "Rotasi femur harus sangat presisi",
        "Sedikit internal rotation langsung terasa stiff",
      ],
      suitableFor: [
        "Surgeon rapi di gap balancing",
        "Pasien aktif dengan ekspektasi tinggi",
      ],
      risks: [
        "Tidak toleran terhadap kesalahan kecil",
        "Stiffness jika rotasi salah",
      ],
    },
    {
      name: "Posterior Stabilized (PS)",
      biomechanics: [
        "Cam-post menggantikan fungsi PCL",
        "Lebih forgiving terhadap soft tissue",
      ],
      intraOpPractical: [
        "Tracking patella lebih toleran",
        "Rotasi femur tetap krusial",
      ],
      suitableFor: [
        "Kasus ligament compromise",
        "Deformitas berat",
      ],
      risks: [
        "Anterior knee pain jika rotasi femur salah",
        "Error kecil bisa muncul jangka panjang",
      ],
    },
  ];
  