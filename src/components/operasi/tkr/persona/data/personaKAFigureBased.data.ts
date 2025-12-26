/* =====================================================
   PERSONA KA — FIGURE-BASED DATA (PDF ORDER)
   Source: Persona KA Surgical Technique (Zimmer Biomet)
   ===================================================== */

   export type PersonaFigure = {
    figure: number; // Figure number in PDF
    title: string;
    description: string;
    rationale: string;
    techSupportNote: string;
    imagePath: string; // path ke public/images
    stage: number; // untuk auto-group
  };
  
  /* =====================================================
     FIGURE LIST (STRICT PDF ORDER)
     ===================================================== */
  
  export const personaKAFigures: PersonaFigure[] = [
    {
      figure: 1,
      title: "Femoral Component Cross-Section",
      description:
        "Ilustrasi potongan melintang femoral component Persona yang menunjukkan hubungan antara permukaan artikular implant dan tulang femur.",
      rationale:
        "Desain ini memungkinkan restorasi joint line asli pada pendekatan kinematic alignment.",
      techSupportNote:
        "Jelaskan bahwa tujuan KA bukan meluruskan lutut, tetapi mengembalikan anatomi asli.",
      imagePath:
        "/images/persona-ka/Fig-01-femur-cross-section.png",
      stage: 0,
    },
    {
      figure: 2,
      title: "Concept of Kinematic Alignment",
      description:
        "Perbandingan native knee, mechanically aligned TKA, dan kinematically aligned TKA.",
      rationale:
        "KA mempertahankan varus/valgus fisiologis dan laxity alami pasien.",
      techSupportNote:
        "Sedikit varus tidak selalu salah jika stabil.",
      imagePath:
        "/images/persona-ka/Figure-02-ka-concept.png",
      stage: 0,
    },
    {
      figure: 3,
      title: "Preoperative Alignment Assessment",
      description:
        "Evaluasi axis femur dan tibia pada radiograf preoperatif.",
      rationale:
        "Cartilage wear memengaruhi referensi tulang dan harus dikompensasi saat resection.",
      techSupportNote:
        "Ingatkan surgeon bahwa bone terlihat rata belum tentu cartilage masih utuh.",
      imagePath:
        "/images/persona-ka/figures/Figure-03-preop-alignment.png",
      stage: 1,
    },
    {
      figure: 4,
      title: "Intramedullary Rod Placement",
      description:
        "Posisi IM rod pada femur yang sejajar dengan anterior cortex.",
      rationale:
        "Kesalahan IM rod akan berdampak langsung pada distal femoral cut.",
      techSupportNote:
        "IM rod adalah penentu arah, bukan sekadar penyangga.",
      imagePath:
        "/images/persona-ka/figures/Figure-04-im-rod.png",
      stage: 3,
    },
    {
      figure: 5,
      title: "Adjustable Distal Femoral Cutting Guide",
      description:
        "Valgus cutting guide Persona yang dapat disesuaikan dengan anatomi pasien.",
      rationale:
        "KA tidak menggunakan fixed valgus angle seperti MA.",
      techSupportNote:
        "Pastikan guide duduk stabil di condyle sebelum cutting.",
      imagePath:
        "/images/persona-ka/figures/Figure-05-valgus-guide.png",
      stage: 3,
    },
    {
      figure: 6,
      title: "Distal Femoral Resection",
      description:
        "Proses resection distal femur mengikuti joint line alami.",
      rationale:
        "Overcut atau undercut akan mengganggu extension gap.",
      techSupportNote:
        "KA menuntut presisi, bukan agresivitas.",
      imagePath:
        "/images/persona-ka/figures/Figure-06-distal-cut.png",
      stage: 3,
    },
    {
      figure: 7,
      title: "Femoral Sizing",
      description:
        "Penentuan ukuran femoral component berdasarkan dimensi AP.",
      rationale:
        "Oversizing menyebabkan stiffness, undersizing menyebabkan instability.",
      techSupportNote:
        "Perhatikan risiko anterior notching.",
      imagePath:
        "/images/persona-ka/figures/Figure-07-femoral-sizing.png",
      stage: 4,
    },
    {
      figure: 8,
      title: "Femoral Rotation References",
      description:
        "Referensi PCA, TEA, dan Whiteside line untuk rotasi femur.",
      rationale:
        "Rotasi femur adalah faktor utama patella tracking.",
      techSupportNote:
        "Jika patella lari, evaluasi rotasi femur terlebih dahulu.",
      imagePath:
        "/images/persona-ka/figures/Figure-08-femoral-rotation.png",
      stage: 4,
    },
    {
      figure: 9,
      title: "Tibial Resection in KA",
      description:
        "Tibial cut mengikuti native alignment pasien.",
      rationale:
        "Tibia tidak selalu harus dipotong 90° terhadap mechanical axis.",
      techSupportNote:
        "Jangan otomatis memaksa tibia ke posisi netral.",
      imagePath:
        "/images/persona-ka/figures/Figure-09-tibial-cut.png",
      stage: 6,
    },
    {
      figure: 10,
      title: "Trial Reduction and Balance Check",
      description:
        "Evaluasi ROM, gap balance, dan patella tracking menggunakan trial components.",
      rationale:
        "Patella harus tracking secara natural tanpa tekanan manual.",
      techSupportNote:
        "Patella yang harus ditekan menandakan masalah biomekanik.",
      imagePath:
        "/images/persona-ka/figures/Figure-10-trial.png",
      stage: 8,
    },
    {
      figure: 11,
      title: "Contraindications for KA",
      description:
        "Kondisi yang tidak cocok untuk kinematic alignment.",
      rationale:
        "KA tidak dianjurkan pada instabilitas ligament berat atau deformitas ekstrem.",
      techSupportNote:
        "Diskusikan opsi MA atau PS jika red flag ditemukan.",
      imagePath:
        "/images/persona-ka/figures/Figure-11-contraindications.png",
      stage: 9,
    },
  ];
  