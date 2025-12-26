export type PersonaPdfContent = {
  code: string;
  title: string;
  imagePath: string;       // ← path ke public/images
  description: string;
  educationalNote: string;
  pdfReference: string;
};

const PDF_LINK =
  "https://www.zimmerbiomet.com/content/dam/zb-corporate/en/education-resources/surgical-techniques/specialties/knee/persona-the-personalized-knee/persona-the-personalized-knee-surgical-technique1.pdf";

export const personaPdfContents: PersonaPdfContent[] = [
  {
    code: "P-01",
    title: "Pre-Operative Planning & Instrument Overview",
    imagePath: "/images/persona/P-01-preop-planning.jpg",
    description:
      "Overview sistem Persona dan instrument yang digunakan selama prosedur Total Knee Arthroplasty.",
    educationalNote:
      "Berdasarkan Persona Surgical Technique, tahap ini memastikan perencanaan resection sejajar mechanical axis sebelum masuk ke tahapan intra-operatif.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-02",
    title: "Surgical Approach & Exposure",
    imagePath: "/images/persona/P-02-surgical-approach.jpg",
    description:
      "Ilustrasi surgical approach untuk exposure sendi lutut dan identifikasi landmark anatomi.",
    educationalNote:
      "Exposure yang baik diperlukan agar landmark seperti epicondyle dan Whiteside’s line dapat diidentifikasi dengan jelas.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-03",
    title: "Adjustable Distal Femoral Resection System",
    imagePath: "/images/persona/P-03-distal-femur-guide.jpg",
    description:
      "Pemasangan IM rod dan adjustable valgus guide untuk distal femur resection.",
    educationalNote:
      "PDF Persona menekankan bahwa resection distal femur harus tegak lurus terhadap mechanical axis.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-04",
    title: "Distal Femur Resection",
    imagePath: "/images/persona/P-04-distal-femur-cut.jpg",
    description:
      "Proses pemotongan distal femur menggunakan cutting block.",
    educationalNote:
      "Pengaturan valgus angle dan locking system harus diperiksa sebelum melakukan pemotongan.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-05",
    title: "Extramedullary Tibial Alignment Guide",
    imagePath: "/images/persona/P-05-tibia-em-guide.jpg",
    description:
      "Pemasangan EM alignment guide untuk proximal tibia resection.",
    educationalNote:
      "Kesalahan alignment tibia akan memengaruhi keseluruhan balance lutut pasca implantasi.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-06",
    title: "Femoral Sizing & External Rotation",
    imagePath: "/images/persona/P-06-femoral-sizing-er.jpg",
    description:
      "Penentuan ukuran femur dan rotasi eksternal menggunakan femoral sizer.",
    educationalNote:
      "Rotasi femur yang tepat penting untuk flexion gap balance dan patella tracking.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-07",
    title: "Femoral A/P & Chamfer Cuts",
    imagePath: "/images/persona/P-07-ap-chamfer.jpg",
    description:
      "Penyelesaian potongan anterior, posterior, dan chamfer femur.",
    educationalNote:
      "Potongan ini dilakukan setelah sizing dan rotasi femur ditetapkan.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-08",
    title: "Tibial Sizing & Rotation",
    imagePath: "/images/persona/P-08-tibia-rotation.jpg",
    description:
      "Penentuan ukuran dan rotasi tibial component.",
    educationalNote:
      "Rotasi tibia berpengaruh pada kinematika lutut dan patella tracking.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-09",
    title: "Prepare & Resect Patella",
    imagePath: "/images/persona/P-09-patella-resection.jpg",
    description:
      "Tahap persiapan dan pemotongan patella.",
    educationalNote:
      "Ketebalan patella harus dijaga untuk mencegah masalah tracking.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-10",
    title: "Trial Reduction & Balance Check",
    imagePath: "/images/persona/P-10-trial-reduction.jpg",
    description:
      "Pemasangan trial components untuk evaluasi balance.",
    educationalNote:
      "Pastikan patella tracking sentral dan flexion gap simetris sebelum implant final.",
    pdfReference: PDF_LINK,
  },
  {
    code: "P-11",
    title: "Final Implant & Closure",
    imagePath: "/images/persona/P-11-final-implant.jpg",
    description:
      "Pemasangan komponen final dan evaluasi akhir.",
    educationalNote:
      "Evaluasi ROM dan absence of impingement dilakukan sebelum penutupan luka.",
    pdfReference: PDF_LINK,
  },
];
