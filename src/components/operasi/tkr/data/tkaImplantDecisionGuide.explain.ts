/* =====================================================
   EXPLANATION FOR IMPLANT CASES
   ===================================================== */

   export const implantCaseExplanation: Record<
   number,
   {
     rationale: string[];
     evidence: string[];
     references: string[];
   }
 > = {
   0: {
     // Vanguard
     rationale: [
       "Desain trochlear Vanguard relatif lebar sehingga patella masih dapat tracking meski ada internal rotation kecil",
       "Internal rotation meningkatkan lateral patellar contact pressure tanpa harus terjadi subluxation",
     ],
     evidence: [
       "Anterior knee pain sering muncul terlambat pada kasus malrotation ringan",
     ],
     references: [
       "Berger RA et al. CORR – Femoral component rotation & patellar tracking",
       "Barrack RL JBJS – Patellar complications in TKA",
     ],
   },
 
   1: {
     // Persona
     rationale: [
       "Trochlear groove Persona lebih anatomik dan mengarahkan jalur patella secara ketat",
       "Kesalahan rotasi kecil langsung memicu patella tilt dan flexion gap imbalance",
     ],
     evidence: [
       "Implant dengan anatomical trochlea lebih sensitif terhadap femoral malrotation",
     ],
     references: [
       "Barrack RL JBJS – Patellar complications of TKA",
       "Berger RA – Rotational alignment of femoral component",
     ],
   },
 
   2: {
     // NexGen
     rationale: [
       "NexGen sangat bergantung pada akurasi landmark (TEA)",
       "Kesalahan identifikasi TEA menyebabkan flexion gap tidak seimbang",
     ],
     evidence: [
       "Kesalahan rotasi femur berkorelasi dengan stiffness dan patella maltracking",
     ],
     references: [
       "Victor J et al. CORR – Accuracy of transepicondylar axis",
     ],
   },
 };
 
 /* =====================================================
    DECISION GUIDE RATIONALE
    ===================================================== */
 
 export const decisionGuideRationale: Record<
   number,
   {
     explanation: string;
     biomechanicalReason: string[];
     riskNote: string;
   }
 > = {
   0: {
     explanation:
       "Vanguard cocok untuk pendekatan measured resection dengan toleransi error kecil.",
     biomechanicalReason: [
       "Trochlear groove lebih forgiving",
       "Patella tidak langsung sublux pada rotasi kecil",
     ],
     riskNote:
       "Kesalahan kecil bisa muncul sebagai nyeri anterior jangka menengah.",
   },
 
   1: {
     explanation:
       "Persona optimal untuk pasien aktif dengan gap balancing presisi.",
     biomechanicalReason: [
       "Trochlea anatomik memandu patella secara natural",
       "External rotation yang tepat menghasilkan tracking optimal",
     ],
     riskNote:
       "Sedikit internal rotation langsung menyebabkan stiffness atau tilt.",
   },
 
   2: {
     explanation:
       "NexGen cocok untuk surgeon yang percaya landmark dan teknik klasik.",
     biomechanicalReason: [
       "Tidak menyembunyikan kesalahan rotasi",
       "Flexion gap imbalance langsung terasa",
     ],
     riskNote:
       "Kesalahan TEA langsung berdampak pada tracking dan ROM.",
   },
 
   3: {
     explanation:
       "PS dipilih saat stabilitas ligament tidak dapat diandalkan.",
     biomechanicalReason: [
       "Cam-post membantu rollback",
       "Lebih toleran terhadap soft tissue imbalance",
     ],
     riskNote:
       "Rotasi femur tetap krusial untuk patella tracking.",
   },
 };
 
 /* =====================================================
    TECH SUPPORT EXPLANATION
    ===================================================== */
 
 export const techSupportExplanation: Record<
   "Pre-Op" | "Intra-Op" | "Post-Op",
   {
     whyImportant: string;
     biomechanicalBasis: string[];
     impactIfIgnored: string;
   }
 > = {
   "Pre-Op": {
     whyImportant:
       "Keputusan awal menentukan risiko patella problem pasca operasi.",
     biomechanicalBasis: [
       "Deformitas mengubah referensi rotasi femur",
       "Implant berbeda bereaksi berbeda terhadap error rotasi",
     ],
     impactIfIgnored:
       "Risiko nyeri anterior meningkat meskipun operasi tampak sukses.",
   },
 
   "Intra-Op": {
     whyImportant:
       "Rotasi femur tidak dapat dikoreksi setelah cementing.",
     biomechanicalBasis: [
       "Internal rotation meningkatkan Q-angle",
       "Flexion gap trapezoidal mengganggu patella tracking",
     ],
     impactIfIgnored:
       "Patella maltracking dan stiffness dini.",
   },
 
   "Post-Op": {
     whyImportant:
       "Keluhan pasien sering mencerminkan keputusan intra-op.",
     biomechanicalBasis: [
       "Tekanan lateral patella kronis menimbulkan nyeri fungsional",
     ],
     impactIfIgnored:
       "Masalah biomekanik tidak terdeteksi hingga revisi diperlukan.",
   },
 };
 