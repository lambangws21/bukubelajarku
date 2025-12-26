/* =====================================================
   PERSONA KINEMATICALLY ALIGNED TKA
   SURGICAL GUIDE FOR TECHNICAL SUPPORT
   Source: Zimmer Biomet Persona KA Surgical Technique PDF
   ===================================================== */

   export type SurgicalFigure = {
    figureCode: string;       // Figure internal (bukan nomor PDF)
    title: string;
    imagePath?: string[];        // path ke public/images
    explanation?: string;      // penjelasan edukatif
    techSupportTip: string;   // tips praktis teknikal support
  };
  
  export type SurgicalStage = {
    stage: number;
    stageTitle: string;
    stageGoal: string;
    figures: SurgicalFigure[];
  };
  
  /* =====================================================
     STAGE 0 — CONCEPT & PHILOSOPHY
     ===================================================== */
  
  export const personaKASurgicalStages: SurgicalStage[] = [
    {
      stage: 0,
      stageTitle: "Concept & Implant Philosophy",
      stageGoal:
        "Memahami filosofi kinematic alignment dan desain implant Persona sebelum masuk ke meja operasi.",
      figures: [
        {
          figureCode: "KA-00-01",
          title: "Femoral Component Cross-Section Design",
          imagePath:
            ["/images/persona-ka/Fig-01-femur-cross-section.png",],
          explanation:
            "Ilustrasi potongan femoral component menunjukkan hubungan antara permukaan artikular implant dan ketebalan tulang yang direseksi untuk mempertahankan joint line alami.",
          techSupportTip:
            "Tekankan ke surgeon bahwa tujuan KA adalah mengembalikan anatomi asli, bukan memaksakan alignment lurus.",
        },
        {
          figureCode: "KA-00-02",
          title: "Trochlear Groove & Patellofemoral Mechanics",
          imagePath:
            ["/images/persona-ka/Fig-02-trochlear-design.png",
            "/images/persona-ka/Fig-01-femur-cross-section.png",],
          explanation:
            "Desain trochlear Persona mengikuti jalur anatomik patella sepanjang range of motion.",
          techSupportTip:
            "Jika patella tracking buruk saat trial, evaluasi rotasi femur sebelum mengeksekusi patella.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 1 — PRE-OPERATIVE PLANNING
       ===================================================== */
  
    {
      stage: 1,
      stageTitle: "Pre-Operative Planning",
      stageGoal:
        "Menentukan strategi alignment berdasarkan anatomi dan deformitas pasien.",
      figures: [
        {
          figureCode: "KA-01-01",
          title: "Native Knee Alignment Concept",
          imagePath:
            ["/images/persona-ka/Fig-02-trochlear-design.png",],
          explanation:
            "Kinematic alignment bertujuan mempertahankan joint line dan laxity asli pasien.",
          techSupportTip:
            "Ingatkan bahwa varus atau valgus ringan bisa dipertahankan jika stabil.",
        },
        {
          figureCode: "KA-01-02",
          title: "Cartilage Wear Compensation",
          imagePath:
            ["/images/persona-ka/Fig-02-trochlear-design.png",],
          explanation:
            "Ketebalan resection disesuaikan dengan kehilangan kartilago medial atau lateral.",
          techSupportTip:
            "Jangan menyamaratakan ketebalan potongan femur kiri dan kanan.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 2 — SURGICAL APPROACH & EXPOSURE
       ===================================================== */
  
    {
      stage: 2,
      stageTitle: "Surgical Approach & Exposure",
      stageGoal:
        "Mencapai exposure optimal untuk identifikasi landmark anatomi.",
      figures: [
        {
          figureCode: "KA-02-01",
          title: "Surgical Exposure",
          explanation:
            "Exposure yang adekuat memungkinkan identifikasi epicondyle dan Whiteside’s line.",
          techSupportTip:
            "Exposure buruk sering menyebabkan kesalahan rotasi femur.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 3 — DISTAL FEMUR RESECTION
       ===================================================== */
  
    {
      stage: 3,
      stageTitle: "Distal Femur Resection",
      stageGoal:
        "Melakukan potongan distal femur sesuai anatomi pasien.",
      figures: [
        {
          figureCode: "KA-03-01",
          title: "IM Rod & Adjustable Valgus Guide",
          imagePath:
          [ "/images/persona-ka/Fig-01-native-alignment.png", 
            "/images/persona-ka/Fig-02-native-alignment.png",
            "/images/persona-ka/Fig-02-distal-cut.png",
            "/images/persona-ka/Fig-03-native-aligment.png",
            "/images/persona-ka/Fig-04-native-aligment.png",
           
            
          ],
          explanation:
            "IM rod dipasang sejajar anterior cortex dan dikombinasikan dengan valgus guide adjustable.",
          techSupportTip:
            "Pastikan guide feet kontak stabil di condyle sebelum cutting.",
        },
        {
          figureCode: "KA-03-02",
          title: "Distal Femur Cut",
          imagePath:
            [ "/images/persona-ka/Fig-05-native-aligment.png",
              "/images/persona-ka/femur-distal-cut.png",
              "/images/persona-ka/femur-distal-cut-01.png",
              "/images/persona-ka/femur-distal-cut-02.png",
            ],
          explanation:
            "Reseksi distal femur mengikuti joint line alami, bukan valgus tetap.",
          techSupportTip:
            "Cek ulang locking sebelum gergaji.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 4 — FEMORAL SIZING & ROTATION
       ===================================================== */
  
    {
      stage: 4,
      stageTitle: "Femoral Sizing & Rotation",
      stageGoal:
        "Menentukan ukuran dan rotasi femur yang tepat untuk flexion gap dan patella tracking.",
      figures: [
        {
          figureCode: "KA-04-01",
          title: "Femoral Sizing Guide",
          imagePath:
           [ "/images/persona-ka/Fig-01-sizing.png",
           ],
          explanation:
            "Sizing femur ditentukan tanpa overhang atau notching.",
          techSupportTip:
            "Ingatkan bahwa oversizing dapat menyebabkan stiffness.",
        },
        {
          figureCode: "KA-04-02",
          title: "External Rotation Concept",
          imagePath:
          [ 
            "/images/persona-ka/Fig-02-sizing.png",
            "/images/persona-ka/Fig-03-sizing.png",
           ],
          explanation:
            "Rotasi femur disesuaikan untuk mencapai flexion gap yang seimbang.",
          techSupportTip:
            "Rotasi femur adalah kunci patella tracking.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 5 — FEMORAL A/P & CHAMFER CUTS
       ===================================================== */
  
    {
      stage: 5,
      stageTitle: "Femoral A/P & Chamfer Cuts",
      stageGoal:
        "Menyelesaikan potongan femur sesuai ukuran dan rotasi yang telah ditentukan.",
      figures: [
        {
          figureCode: "KA-05-01",
          title: "Anterior & Posterior Cuts",
          imagePath:
           [ 
            "/images/persona-ka/Fig-01-ap-cuts.png",
            "/images/persona-ka/Fig-02-ap-cuts.png",],
          explanation:
            "Potongan anterior dan posterior mengikuti hasil sizing.",
          techSupportTip:
            "Pastikan tidak ada rocking pada cutting block.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 6 — TIBIAL RESECTION & ROTATION
       ===================================================== */
  
    {
      stage: 6,
      stageTitle: "Tibial Resection & Rotation",
      stageGoal:
        "Menyesuaikan tibial cut dengan anatomi native.",
      figures: [
        {
          figureCode: "KA-06-01",
          title: "Tibial EM Alignment",
          imagePath:
            ["/images/persona-ka/Fig-01-em-guide.png",
            "/images/persona-ka/Fig-02-em-guide.png",
            "/images/persona-ka/Fig-03-em-guide.png",
            "/images/persona-ka/Fig-04-em-guide.png",
            "/images/persona-ka/Fig-05-em-guide.png",

            ],
          explanation:
            "Tibial cut dapat mengikuti varus ringan untuk mempertahankan kinematika.",
          techSupportTip:
            "Jangan otomatis memaksa tibia ke 0°.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 7 — PATELLA PREPARATION
       ===================================================== */
  
    {
      stage: 7,
      stageTitle: "Patella Preparation",
      stageGoal:
        "Menjaga ketebalan patella dan jalur tracking.",
      figures: [
        {
          figureCode: "KA-07-01",
          title: "Patella Resection",
          imagePath:
            [
              "/images/persona-ka/Fig-01-patella-cut.png",
              "/images/persona-ka/Fig-02-patella-cut.png",

  
            ],
          explanation:
            "Reseksi patella dilakukan untuk mempertahankan thickness asli.",
          techSupportTip:
            "Over-resection patella sering menyebabkan nyeri anterior.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 8 — TRIAL REDUCTION & BALANCE
       ===================================================== */
  
    {
      stage: 8,
      stageTitle: "Trial Reduction & Balance",
      stageGoal:
        "Memastikan stabilitas, ROM, dan patella tracking.",
      figures: [
        {
          figureCode: "KA-08-01",
          title: "Trial Components & Patella Tracking",
          explanation:
            "Trial digunakan untuk mengevaluasi gap dan tracking patella.",
          techSupportTip:
            "Patella harus center tanpa tekanan manual.",
        },
      ],
    },
  
    /* =====================================================
       STAGE 9 — WARNINGS & CONTRAINDICATIONS
       ===================================================== */
  
    {
      stage: 9,
      stageTitle: "Warnings & Contraindications",
      stageGoal:
        "Mengenali kondisi yang tidak cocok untuk KA.",
      figures: [
        {
          figureCode: "KA-09-01",
          title: "Contraindications for KA",
          explanation:
            "KA tidak dianjurkan pada instabilitas ligament berat atau deformitas ekstrem.",
          techSupportTip:
            "Diskusikan opsi MA atau PS jika red flag ditemukan.",
        },
      ],
    },
  ];
  