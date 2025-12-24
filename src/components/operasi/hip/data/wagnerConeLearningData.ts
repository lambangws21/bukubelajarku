export type Language = "id" | "en";

export interface WagnerLearningSection {
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

export const WagnerConeLearningData: WagnerLearningSection[] = [
  {
    id: "intro",
    title: {
      id: "Pendahuluan & Tujuan Penggunaan",
      en: "Introduction & Intended Purpose",
    },
    content: {
      id: [
        "Wagner Cone Prosthesis® adalah stem femoral tanpa semen (cementless) yang dirancang untuk memberikan fiksasi primer yang stabil melalui press-fit konikal.",
        "Digunakan pada Total Hip Arthroplasty (THA) primer maupun kasus revisi dengan kualitas tulang yang masih memadai.",
        "Tujuan utama adalah mengurangi nyeri, mengembalikan fungsi sendi panggul, dan mencapai osseointegrasi jangka panjang."
      ],
      en: [
        "The Wagner Cone Prosthesis® is a cementless femoral stem designed to achieve primary stability through conical press-fit fixation.",
        "It is intended for use in primary THA and selected revision cases with sufficient bone stock.",
        "The primary goal is pain relief, restoration of hip function, and long-term osseointegration."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zb-corporate/en/education-resources/surgical-techniques/specialties/hip/wagner-sl-revision-hip-system/2647.2-GLBL-en-Wagner-Cone-Prosthesis-Stem-Surg-Tech-A4-DIGITAL.pdf",
  },
  {
    id: "design",
    title: {
      id: "Desain & Karakteristik Implan",
      en: "Implant Design & Features",
    },
    content: {
      id: [
        "Terbuat dari paduan titanium Ti-6Al-4V dengan permukaan blasted untuk mendukung osseointegrasi.",
        "Bentuk konikal sirkular dengan delapan rusuk longitudinal memberikan stabilitas rotasional.",
        "Tersedia pilihan CCD angle 125° dan 135° untuk membantu rekonstruksi offset dan panjang tungkai."
      ],
      en: [
        "Manufactured from Ti-6Al-4V titanium alloy with a blasted surface to promote osseointegration.",
        "Circular conical geometry with eight longitudinal ribs provides rotational stability.",
        "Available in 125° and 135° CCD angles to assist in restoring offset and leg length."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zb-corporate/en/education-resources/surgical-techniques/specialties/hip/wagner-sl-revision-hip-system/2647.2-GLBL-en-Wagner-Cone-Prosthesis-Stem-Surg-Tech-A4-DIGITAL.pdf",
  },
  {
    id: "planning",
    title: {
      id: "Perencanaan Pra Operasi",
      en: "Preoperative Planning",
    },
    content: {
      id: [
        "Templating radiografik sangat penting untuk menentukan ukuran stem dan kedalaman implantasi.",
        "Stem yang dipilih harus menumpang sekitar 1 mm pada korteks medial dan lateral di sepertiga tengah femur.",
        "Perencanaan meliputi evaluasi panjang tungkai, pusat rotasi, dan versi femoral."
      ],
      en: [
        "Radiographic templating is essential to determine stem size and implantation depth.",
        "The selected stem should overlap the inner cortex by approximately 1 mm in the middle third of the femur.",
        "Planning includes assessment of leg length, center of rotation, and femoral version."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zb-corporate/en/education-resources/surgical-techniques/specialties/hip/wagner-sl-revision-hip-system/2647.2-GLBL-en-Wagner-Cone-Prosthesis-Stem-Surg-Tech-A4-DIGITAL.pdf",
  },
  {
    id: "canal",
    title: {
      id: "Persiapan Kanal Femur",
      en: "Femoral Canal Preparation",
    },
    content: {
      id: [
        "Kanal femur dipersiapkan secara bertahap menggunakan reamer konikal.",
        "Reaming dilakukan hingga tercapai resistensi yang menunjukkan kontak tulang yang adekuat.",
        "Orientasi reamer harus mengikuti sumbu anatomis femur."
      ],
      en: [
        "The femoral canal is prepared gradually using conical reamers.",
        "Reaming continues until resistance indicates adequate bone contact.",
        "The reamer orientation should follow the anatomical axis of the femur."
      ],
    },
    reference:
      "https://www.zimmerbiomet.com/content/dam/zb-corporate/en/education-resources/surgical-techniques/specialties/hip/wagner-sl-revision-hip-system/2647.2-GLBL-en-Wagner-Cone-Prosthesis-Stem-Surg-Tech-A4-DIGITAL.pdf",
  },
];
