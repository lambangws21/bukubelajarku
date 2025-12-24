/* ===============================
   TYPES
   =============================== */

   export type ChecklistStep = {
    step: number;
    title: string;
    points: string[];
    mindset?: string;
  };
  
  export type PSCRComparison = {
    type: "CR" | "PS";
    characteristics: string[];
    intraOpImplication: string[];
    ruleOfThumb: string;
  };
  
  export type ImplantSystemNote = {
    name: string;
    philosophy: string[];
    intraOpNotes: string[];
    keyMessage: string;
  };
  
  /* ===============================
     A. PRAKTIS DI MEJA OPERASI
     =============================== */
  
  export const intraOpChecklist: ChecklistStep[] = [
    {
      step: 1,
      title: "Setelah Tibia Cut (KUNCI)",
      points: [
        "Tibia dipotong 90° terhadap mechanical axis",
        "Native tibia umumnya varus ±3°",
        "Tanpa kompensasi femur → flexion gap trapezoidal",
      ],
      mindset:
        "Tibia sudah lurus, sekarang femur yang harus menyesuaikan.",
    },
    {
      step: 2,
      title: "Tentukan Rotasi Femur (Jangan Nebak)",
      points: [
        "Gunakan minimal 2 landmark",
        "TEA (Transepicondylar Axis) → paling konsisten",
        "Posterior Condylar Axis (PCA) + external rotation ±3°",
        "Whiteside line sebagai cross-check AP",
        "Target ER femur 3–5° (bukan angka mati)",
      ],
    },
    {
      step: 3,
      title: "Cek Flexion Gap di 90°",
      points: [
        "Gunakan spacer atau tensor",
        "Flexion gap trapezoidal → patella pasti tilt / lari",
        "Flexion gap rectangular → tekanan simetris",
        "Jika belum seimbang: tambah ER femur atau evaluasi posterior cut",
      ],
    },
    {
      step: 4,
      title: "Trial Femur + Insert → Cek Patella",
      points: [
        "Lakukan fleksi–ekstensi sebelum closure",
        "Patella harus tracking center",
        "Tanpa dorongan manual",
        "Hindari lateral release bila tidak perlu",
      ],
    },
  ];
  
  /* ===============================
     B. PS vs CR
     =============================== */
  
  export const psCrComparison: PSCRComparison[] = [
    {
      type: "CR",
      characteristics: [
        "PCL dipertahankan",
        "Mengandalkan balance ligament alami",
        "Sangat sensitif terhadap rotasi femur",
      ],
      intraOpImplication: [
        "Internal rotation sedikit saja → patella maltracking",
        "Flexion gap mudah menjadi tight",
        "External rotation femur harus presisi",
      ],
      ruleOfThumb:
        "Jika ragu antara netral atau sedikit ER → pilih sedikit ER.",
    },
    {
      type: "PS",
      characteristics: [
        "PCL dikorbankan",
        "Menggunakan cam-post mechanism",
        "Lebih forgiving terhadap soft tissue",
      ],
      intraOpImplication: [
        "Internal rotation femur tetap menyebabkan patella problem",
        "Risiko cam-post edge loading",
        "Anterior knee pain bisa muncul walau lutut terasa stabil",
      ],
      ruleOfThumb:
        "PS bukan alasan untuk ceroboh — rotasi tetap nomor satu.",
    },
  ];
  
  /* ===============================
     C. SISTEM IMPLAN
     =============================== */
  
  export const implantSystemNotes: ImplantSystemNote[] = [
    {
      name: "Persona",
      philosophy: [
        "Desain anatomik dan personalized",
        "Banyak opsi ukuran dan medial-lateral fit",
      ],
      intraOpNotes: [
        "Sangat sensitif terhadap rotasi femur",
        "Internal rotation → trochlear groove langsung mengunci patella",
        "External rotation tepat → tracking sangat smooth",
      ],
      keyMessage:
        "Persona memberi reward besar jika presisi, dan hukuman besar jika salah.",
    },
    {
      name: "Vanguard",
      philosophy: [
        "Desain lebih forgiving",
        "Trochlear groove relatif toleran",
      ],
      intraOpNotes: [
        "Masih bisa memaafkan sedikit error",
        "Internal rotation tetap menyebabkan patella tilt",
      ],
      keyMessage:
        "Vanguard toleran, tapi bukan berarti bebas dari aturan rotasi.",
    },
    {
      name: "NexGen",
      philosophy: [
        "Sistem klasik dan terbukti",
        "Digunakan luas untuk CR dan PS",
      ],
      intraOpNotes: [
        "Sangat bergantung pada akurasi landmark",
        "Kesalahan TEA langsung terlihat pada patella",
      ],
      keyMessage:
        "NexGen itu jujur: salah kelihatan, benar tahan lama.",
    },
  ];
  