export type Language = "id" | "en";

export interface MLTaperLearningSection {
  id: string;
  title: {
    id: string;
    en: string;
  };
  content: {
    id: string[];
    en: string[];
  };
  reference: string;
}

export const MLTaperLearningData: MLTaperLearningSection[] = [
  {
    id: "intro",
    title: {
      id: "Pendahuluan Sistem M/L Taper",
      en: "M/L Taper System Introduction",
    },
    content: {
      id: [
        "Zimmer® M/L Taper Hip Prosthesis adalah stem femoral tanpa semen (cementless) dengan desain tapered wedge yang konservatif terhadap tulang.",
        "Stem ini dirancang untuk memberikan fiksasi primer melalui kontak mediolateral dan stabilitas rotasional.",
        "Digunakan terutama pada Total Hip Arthroplasty (THA) primer dengan kualitas tulang femoral yang adekuat."
      ],
      en: [
        "The Zimmer® M/L Taper Hip Prosthesis is a cementless femoral stem featuring a bone-conserving tapered wedge design.",
        "It is designed to achieve primary fixation through mediolateral contact and rotational stability.",
        "Primarily indicated for primary total hip arthroplasty in patients with adequate femoral bone quality."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/hip/ml-taper-hip-system/zimmer-m-l-taper-hip-prosthesis-brochure.pdf",
  },
  {
    id: "design",
    title: {
      id: "Desain & Karakteristik Stem",
      en: "Stem Design & Characteristics",
    },
    content: {
      id: [
        "Desain tapered wedge memberikan stabilitas mediolateral yang baik dan mengurangi subsidence.",
        "Profil A/P yang ramping membantu konservasi tulang dan memudahkan implantasi melalui insisi minimal.",
        "Permukaan plasma-sprayed mendukung osseointegrasi jangka panjang."
      ],
      en: [
        "The tapered wedge design provides excellent mediolateral stability and helps reduce subsidence.",
        "A slim anterior-posterior profile aids bone conservation and facilitates minimally invasive approaches.",
        "A plasma-sprayed surface promotes long-term osseointegration."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/hip/ml-taper-hip-system/zimmer-m-l-taper-hip-prosthesis-brochure.pdf",
  },
  {
    id: "sizes",
    title: {
      id: "Ukuran & Offset",
      en: "Sizes & Offsets",
    },
    content: {
      id: [
        "Tersedia dalam berbagai ukuran (± 4.0 hingga 22.5) untuk menyesuaikan anatomi pasien.",
        "Pilihan offset standar dan extended membantu restorasi biomekanik panggul.",
        "Penyesuaian offset yang tepat penting untuk stabilitas dan fungsi otot abduktor."
      ],
      en: [
        "Available in a wide range of sizes (approximately 4.0 to 22.5) to match patient anatomy.",
        "Standard and extended offset options assist in restoring hip biomechanics.",
        "Proper offset restoration is critical for joint stability and abductor muscle function."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/hip/ml-taper-hip-system/zimmer-m-l-taper-hip-prosthesis-brochure.pdf",
  },
  {
    id: "planning",
    title: {
      id: "Perencanaan Pra Operasi",
      en: "Preoperative Planning",
    },
    content: {
      id: [
        "Templating radiografik sangat penting untuk menentukan ukuran stem dan offset yang sesuai.",
        "Stem harus mengisi kanal femur secara mediolateral tanpa tekanan berlebih.",
        "Perencanaan juga mencakup evaluasi panjang tungkai dan versi femoral."
      ],
      en: [
        "Radiographic templating is essential to determine appropriate stem size and offset.",
        "The stem should achieve mediolateral fill without excessive cortical stress.",
        "Planning also includes assessment of leg length and femoral version."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/hip/ml-taper-hip-system/zimmer-m-l-taper-hip-prosthesis-brochure.pdf",
  },
  {
    id: "implantation",
    title: {
      id: "Prinsip Implantasi",
      en: "Implantation Principles",
    },
    content: {
      id: [
        "Implantasi dilakukan dengan prinsip press-fit tanpa semen.",
        "Stabilitas primer dicapai melalui kontak mediolateral, bukan fiksasi distal.",
        "Trial reduction dilakukan untuk memastikan panjang tungkai, offset, dan stabilitas sendi."
      ],
      en: [
        "Implantation follows cementless press-fit principles.",
        "Primary stability is achieved through mediolateral contact rather than distal fixation.",
        "Trial reduction ensures appropriate leg length, offset, and joint stability."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/hip/ml-taper-hip-system/zimmer-m-l-taper-hip-prosthesis-brochure.pdf",
  },
  {
    id: "clinical",
    title: {
      id: "Ringkasan Klinis",
      en: "Clinical Summary",
    },
    content: {
      id: [
        "M/L Taper merupakan stem yang sederhana, bone-conserving, dan terbukti secara klinis.",
        "Sangat cocok untuk THA primer dengan tulang femur yang baik.",
        "Pemilihan ukuran dan teknik yang tepat sangat menentukan keberhasilan jangka panjang."
      ],
      en: [
        "The M/L Taper stem is a simple, bone-conserving, and clinically proven design.",
        "Well suited for primary THA in patients with good femoral bone quality.",
        "Proper sizing and surgical technique are critical for long-term success."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zimmer-biomet/medical-professionals/hip/ml-taper-hip-system/zimmer-m-l-taper-hip-prosthesis-brochure.pdf",
  },
];
