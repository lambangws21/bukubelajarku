import { AlignmentContent  } from "./types";

export const alignmentContent: AlignmentContent = {
  topic: "Penentuan Sudut Varus/Valgus & aHKAA (MPTA - LDFA)",
  images: [
    {
      id: "img-1",
      label: "X-ray + garis mekanikal",
      src: "/images/aligment/derajat-valgus.jpg",
    },
    {
      id: "img-2",
      label: "Skema HKAA & aHKAA (MPTA - LDFA)",
      src: "/images/aligment/HKA.jpg",
    },
    {
      id: "img-3",
      label: "X-ray + garis mekanikal",
      src: "/images/aligment/setting-instrument.png ",
    },
  ],


  steps: [
    {
      id: "step-1",
      title: "Hip Center (Head Tip)",
      detail: "Ambil titik pusat kepala femur (hip center / head tip).",
    },
    {
      id: "step-2",
      title: "Mekanikal Axis Femur",
      detail:
        "Tarik garis lurus dari hip center menuju knee center (pusat lutut), lanjutkan melewati femur (lebih panjang).",
    },
    {
      id: "step-3",
      title: "Mekanikal Axis Tibia",
      detail:
        "Tarik garis dari mid-talus (ankle center) menuju knee center, perpanjang hingga memotong garis femur.",
    },
    {
      id: "step-4",
      title: "Baca Sudut Varus/Valgus",
      detail:
        "Sudut perpotongan dua garis mekanikal di knee center adalah sudut varus/valgus pasien.",
    },
    {
      id: "step-5",
      title: "Varus vs Valgus",
      detail:
        "Caranya sama; bedanya arah deviasi: valgus dominan medial, varus dominan lateral.",
    },
  ],

  formula: {
    name: "aHKAA",
    formulaText: "aHKAA = MPTA - LDFA",
    targetDeg: 0,
    acceptableDeviation: { min: -3, max: 3 },
    meaning: {
      MPTA: "Medial Proximal Tibial Angle",
      LDFA: "Lateral Distal Femoral Angle",
    },
  },

  workedExample: {
    MPTA: 90,
    LDFA: 90,
    aHKAA: 0,
    interpretation: "Deviasi di luar batas (lebih kecil dari -3°).",
    riskNote:
      "Risiko: insert lebih cepat tergerus pada sisi overload dan risiko sinking pada sisi yang menanggung beban lebih.",
  },

  patientExamples: [
    {
      id: "example-valgus-18-8",
      label: "Contoh dari gambar: sudut besar",
      hkaAngleDeg: 18.8,
      interpretation: "valgus",
      notes: "Sudut ditunjukkan pada knee center.",
    },
    {
      id: "example-valgus-4-7",
      label: "Contoh dari gambar: sudut ringan",
      hkaAngleDeg: 4.7,
      interpretation: "valgus",
      notes: "Sudut ditunjukkan pada knee center.",
    },
  ],



  qaSteps: [
    {
      id: "side",
      kind: "choice",
      question: "Pasien varus atau valgus?",
      script: [
        {
          id: "s1",
          role: "bot",
          text:
            "Penentuan sudut varus/valgus pasien: mulai dari head tip (hip center), tarik garis lurus ke femur (mekanikal axis) dan lanjutkan melewati femur.",
        },
        {
          id: "s2",
          role: "bot",
          text:
            "Lanjut pada tibia: tarik garis dari mid-talus sampai melewati area tuberositas, lalu perpanjang hingga memotong garis femur. Sudut perpotongannya = sudut pasien.",
        },
        {
          id: "s3",
          role: "bot",
          text:
            "Varus caranya sama. Bedanya letak deviasi: valgus dominan medial, varus dominan lateral.",
        },
        { id: "s4", role: "user", text: "Oke, aku pilih tipe deformitasnya." },
      ],
      choices: [
        { id: "valgus", label: "Valgus", value: "valgus", helper: "Deviasi dominan medial." },
        { id: "varus", label: "Varus", value: "varus", helper: "Deviasi dominan lateral." },
      ],
    },
    {
      id: "measure_hka",
      kind: "number",
      question:
        "Masukkan sudut varus/valgus pasien (HKA/HKAA) yang kamu baca dari perpotongan mekanikal axis femur vs tibia.",
      unit: "°",
      min: 0,
      max: 40,
      placeholder: "contoh: 4.7 atau 18.8",
      hint:
        "Femur: hip center → knee center. Tibia: mid-talus → knee center. Sudut di knee center.",
      script: [
        { id: "h1", role: "bot", text: "Sekarang masukkan angka sudut yang kamu dapat dari gambar." },
        { id: "h2", role: "bot", text: "Angka ini biasanya dipakai untuk setting koreksi varus/valgus pada instrument." },
        { id: "h3", role: "user", text: "Oke, aku input sudutnya." },
      ],
    },
    {
      id: "mpta",
      kind: "number",
      question: "Masukkan nilai MPTA (Medial Proximal Tibial Angle).",
      unit: "°",
      min: 60,
      max: 110,
      placeholder: "contoh: 87",
      hint: "Akan dipakai pada rumus aHKAA = MPTA - LDFA.",
      script: [
        { id: "m1", role: "bot", text: "Sekarang masuk ke rumus stabilisasi implant." },
        { id: "m2", role: "bot", text: "Rumusnya: aHKAA = MPTA - LDFA. Target ideal: 0°." },
      ],
    },
    {
      id: "ldfa",
      kind: "number",
      question: "Masukkan nilai LDFA (Lateral Distal Femoral Angle).",
      unit: "°",
      min: 60,
      max: 110,
      placeholder: "contoh: 91",
      hint: "Setelah ini kita cek apakah deviasi masih dalam batas aman.",
      script: [
        {
          id: "l1",
          role: "bot",
          text:
            "Nilai deviasi maksimal aman adalah -3° sampai +3°. Target stabilisasi implant paling ideal adalah 0°.",
        },
        {
          id: "l2",
          role: "bot",
          text:
            "Contoh: aHKAA = 87 - 91 = -4 → risiko insert lebih cepat tergerus di sisi overload dan risiko sinking pada sisi yang overload.",
        },
      ],
    },
    {
      id: "confirm",
      kind: "confirm",
      question: "Siap dihitung & ditampilkan interpretasinya?",
      hint: "Target 0°, batas aman -3° s/d +3°.",
      script: [
        { id: "c1", role: "bot", text: "Kalau sudah, kita hitung aHKAA dan evaluasi stabilisasi implant." },
        { id: "c2", role: "user", text: "Ya, hitung sekarang." },
      ],
    },
  ],
};


