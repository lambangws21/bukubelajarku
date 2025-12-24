// file: data/totalHipArthroplasty.ts

export interface Section {
    id: string;
    title: string;
    content: string | string[];
    reference?: string;
  }
  
  export const TotalHipArthroplastyData: Section[] = [
    {
      id: "overview",
      title: "Overview",
      content: [
        "Total hip arthroplasty (THA) adalah salah satu operasi ortopedi yang paling efektif secara biaya dan paling konsisten berhasil.",
        "Memberikan hasil yang andal bagi pasien dengan osteoartritis degeneratif panggul stadium akhir berupa pengurangan nyeri, restorasi fungsi, dan peningkatan kualitas hidup.",
        "Artikel ini membahas indikasi, kontraindikasi, teknik operasi, komplikasi, serta peran tim interprofesional dalam perawatan pasien sebelum dan sesudah operasi."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "indications",
      title: "Indications",
      content: [
        "Indikasi paling umum untuk THA adalah osteoartritis simptomatik panggul stadium akhir.",
        "Indikasi lain termasuk osteonekrosis panggul, kelainan kongenital panggul (hip dysplasia), dan kondisi artritis inflamasi."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "contraindications",
      title: "Contraindications",
      content: [
        "Infeksi lokal atau sepsis di sendi panggul.",
        "Infeksi aktif lainnya atau bakteremia.",
        "Disfungsi vaskular berat."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "anatomy",
      title: "Anatomy and Physiology",
      content: [
        "Sendi panggul adalah sendi bola-dan-soket yang stabil melalui interaksi antara komponen tulang dan jaringan lunak.",
        "Komponen tulang termasuk femur proksimal dan acetabulum (ilium, ischium, dan pubic bone).",
        "Ligamen dan labrum berkontribusi pada stabilitas sendi."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "equipment",
      title: "Equipment and Implants",
      content: [
        "Perkembangan desain prostesis sejak 1800-an dengan berbagai jenis bentuk dan material.",
        "Implan modern mencakup stem femoral press-fit, acetabular press-fit, serta kombinasi bearing surfaces seperti metal-on-polyethylene, ceramic-on-polyethylene, dan ceramic-on-ceramic."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "preparation",
      title: "Preoperative Preparation",
      content: [
        "Manajemen praoperatif mencakup evaluasi klinis komprehensif dan pemeriksaan radiologis.",
        "Pemeriksaan fisik dan riwayat medis membantu menentukan kesiapan pasien.",
        "Analisis alignment mekanik dan rentang gerak serta identifikasi faktor risiko tambahan."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "surgicalTechnique",
      title: "Surgical Technique",
      content: [
        "Tiga pendekatan utama THA:",
        "- Posterior: akses terbaik ke acetabulum dan femur, namun risiko dislokasi sedikit lebih tinggi.",
        "- Direct Anterior: populer karena kemungkinan dislokasi lebih rendah dan tanpa melibatkan otot abduktor.",
        "- Anterolateral: kurang digunakan karena mempengaruhi mekanisme otot abduktor.",
        "Langkah teknik meliputi osteotomi leher femur, reaming acetabular, pemasangan komponen prostesis, dan pemeriksaan stabilitas sendi."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "complications",
      title: "Complications",
      content: [
        "Dislokasi pada bulan pertama setelah operasi paling sering terjadi.",
        "Fraktur peri-prostetik dapat terjadi intraoperatif.",
        "Aseptic loosening akibat debris partikel dan osteolisis.",
        "Infeksi prostetik (PJI) membutuhkan pendekatan terapeutik lanjutan.",
        "VTE seperti DVT dan PE dapat terjadi pasca operasi."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    },
    {
      id: "clinicalSignificance",
      title: "Clinical Significance",
      content: [
        "THA adalah salah satu prosedur yang paling andal dan berhasil dalam ortopedi.",
        "Populasi pasien semakin banyak mencakup usia lebih muda.",
        "Peningkatan kualitas hidup dilaporkan baik untuk jangka pendek maupun jangka panjang."
      ],
      reference: "https://www.ncbi.nlm.nih.gov/books/NBK507864/"
    }
  ];
  