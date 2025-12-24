/* ===============================
   TYPES
   =============================== */

   export type ImplantCase = {
    implant: "Vanguard" | "Persona" | "NexGen";
    caseTitle: string;
    intraOpFinding: string[];
    rootCause: string;
    correction: string[];
    learningPoint: string;
  };
  
  export type DecisionGuide = {
    scenario: string;
    recommendation: string;
    reason: string[];
  };
  
  export type TechSupportModule = {
    phase: "Pre-Op" | "Intra-Op" | "Post-Op";
    focus: string;
    checklist: string[];
    redFlags: string[];
  };
  
  /* ===============================
     DATA (WAJIB export)
     =============================== */
  
  export const implantCases: ImplantCase[] = [
    {
      implant: "Vanguard",
      caseTitle: "Anterior Knee Pain Muncul 3 Bulan Pasca Operasi",
      intraOpFinding: [
        "Patella tracking tampak acceptable intra-op",
        "Tidak dilakukan lateral release",
      ],
      rootCause:
        "Femoral component sedikit internal rotation, tersembunyi oleh desain trochlea Vanguard",
      correction: [
        "Evaluasi ulang rotasi femur",
        "Revisi dengan external rotation femur yang tepat",
      ],
      learningPoint:
        "Vanguard memaafkan kesalahan kecil intra-op, tapi menagihnya belakangan.",
    },
    {
      implant: "Persona",
      caseTitle: "Patella Tilt Langsung Terlihat Saat Trial",
      intraOpFinding: [
        "Patella tidak mau center tanpa tekanan manual",
        "Flexion gap tampak trapezoidal",
      ],
      rootCause: "Internal rotation femur meskipun kecil",
      correction: [
        "Tambah external rotation femur ±2°",
        "Cek ulang flexion gap hingga rectangular",
      ],
      learningPoint:
        "Persona langsung menghukum kesalahan kecil dan memberi feedback real-time.",
    },
    {
      implant: "NexGen",
      caseTitle: "Tracking Jelek & Lutut Terasa Kaku",
      intraOpFinding: [
        "Patella tilt konsisten",
        "Flexion gap tidak simetris",
      ],
      rootCause: "Landmark TEA tidak akurat saat femoral cut",
      correction: [
        "Re-identifikasi TEA",
        "Re-cut posterior femur dengan ER tepat",
      ],
      learningPoint:
        "NexGen tidak menyembunyikan kesalahan—salah langsung terlihat.",
    },
  ];
  
  /* ===============================
     DECISION GUIDE
     =============================== */
  
  export const decisionGuide: DecisionGuide[] = [
    {
      scenario: "Kasus primer standar, surgeon measured resection",
      recommendation: "Vanguard",
      reason: [
        "Desain lebih forgiving",
        "Trochlear groove toleran",
      ],
    },
    {
      scenario: "Pasien aktif, ekspektasi tinggi, gap balancing rapi",
      recommendation: "Persona",
      reason: [
        "Anatomik dan personalized",
        "Patella tracking sangat natural jika presisi",
      ],
    },
    {
      scenario: "Surgeon senior, percaya landmark, ingin sistem proven",
      recommendation: "NexGen",
      reason: [
        "Sistem klasik dan jujur",
        "Hasil jangka panjang sangat stabil",
      ],
    },
    {
      scenario: "Ligament compromise / deformitas berat",
      recommendation: "PS (Persona / Vanguard / NexGen)",
      reason: [
        "Cam-post membantu stabilitas",
        "Lebih forgiving terhadap soft tissue",
      ],
    },
  ];
  
  /* ===============================
     TECH SUPPORT
     =============================== */
  
  export const techSupportModules: TechSupportModule[] = [
    {
      phase: "Pre-Op",
      focus: "Antisipasi Risiko",
      checklist: [
        "Identifikasi deformitas (varus / valgus)",
        "Diskusi implant choice dengan surgeon",
        "Pastikan opsi size dan insert lengkap",
      ],
      redFlags: [
        "Kasus valgus berat",
        "Patella baja atau tracking pre-op buruk",
      ],
    },
    {
      phase: "Intra-Op",
      focus: "Decision Support",
      checklist: [
        "Ingatkan pentingnya rotasi femur",
        "Cek flexion gap bersama surgeon",
        "Perhatikan patella tracking saat trial",
      ],
      redFlags: [
        "Patella perlu ditekan agar center",
        "Flexion gap trapezoidal",
      ],
    },
    {
      phase: "Post-Op",
      focus: "Outcome Awareness",
      checklist: [
        "Catat keluhan anterior knee pain",
        "Review intra-op decision bila ada masalah",
      ],
      redFlags: [
        "Nyeri anterior persisten",
        "Rasa ketarik saat naik tangga",
      ],
    },
  ];
  