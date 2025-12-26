export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const tkaQuiz: QuizQuestion[] = [
  {
    question:
      "Patella tracking tampak baik intra-op pada Vanguard, tapi pasien nyeri anterior 3 bulan kemudian. Penyebab paling mungkin?",
    options: [
      "Patella resurfacing gagal",
      "Internal rotation femur ringan",
      "Rehabilitasi terlalu agresif",
      "Infeksi derajat ringan",
    ],
    correctIndex: 1,
    explanation:
      "Desain trochlea Vanguard relatif forgiving sehingga malrotation kecil bisa tersembunyi intra-op dan muncul sebagai nyeri anterior pasca operasi.",
  },

  {
    question:
      "Pada Persona, patella harus ditekan manual agar tetap center saat trial. Tindakan terbaik?",
    options: [
      "Lateral release langsung",
      "Menambah ketebalan insert",
      "Menambah external rotation femur",
      "Dibiarkan karena desain PS lebih forgiving",
    ],
    correctIndex: 2,
    explanation:
      "Persona sangat sensitif terhadap rotasi femur. Koreksi rotasi femur harus menjadi prioritas sebelum tindakan soft tissue.",
  },

  {
    question: "Kenapa NexGen sering disebut implant yang 'jujur'?",
    options: [
      "Karena desainnya murah",
      "Trochlea lebih sempit",
      "Tidak menyembunyikan kesalahan teknik",
      "Selalu menggunakan desain PS",
    ],
    correctIndex: 2,
    explanation:
      "NexGen tidak memaksa tracking patella, sehingga kesalahan rotasi atau balancing langsung terlihat saat trial.",
  },

  {
    question:
      "Pada TKA Persona CR, terjadi tight di flexion tapi extension balance baik. Koreksi paling tepat?",
    options: [
      "Release MCL",
      "Menambah thickness insert",
      "Kurangi posterior femoral resection",
      "Naikkan tibial slope",
    ],
    correctIndex: 2,
    explanation:
      "Tight di flexion biasanya akibat over-resection posterior femur atau ukuran femur terlalu besar.",
  },

  {
    question:
      "Pada Vanguard PS, flexion gap longgar namun extension gap baik. Tindakan terbaik?",
    options: [
      "Tambahkan ketebalan insert",
      "Turunkan tibial cut",
      "Gunakan femur size lebih kecil",
      "Lakukan posterior capsular release",
    ],
    correctIndex: 0,
    explanation:
      "Pada PS design, flexion gap sangat dipengaruhi oleh insert thickness. Menambah insert adalah solusi paling rasional.",
  },

  {
    question:
      "Persona dikatakan cocok untuk pendekatan kinematic alignment karena?",
    options: [
      "Trochlea lebih agresif",
      "Pilihan ukuran sangat terbatas",
      "Modularitas dan anatomic geometry",
      "Selalu menggunakan PS",
    ],
    correctIndex: 2,
    explanation:
      "Persona memiliki variasi ukuran dan geometri yang mendukung restorasi anatomi pasien secara individual.",
  },

  {
    question:
      "Jika setelah trial TKA patella cenderung lateral tanpa resurfacing, langkah pertama yang dianjurkan?",
    options: [
      "Resurface patella",
      "Lateral retinacular release",
      "Evaluasi rotasi femur",
      "Ganti implant PS",
    ],
    correctIndex: 2,
    explanation:
      "Masalah patella hampir selalu berakar pada rotasi femur, bukan langsung pada patella atau soft tissue.",
  },

  {
    question:
      "Perbedaan utama filosofi Vanguard dibanding Persona dalam hal patella tracking?",
    options: [
      "Vanguard lebih agresif mengarahkan patella",
      "Persona lebih forgiving terhadap rotasi",
      "Vanguard menyembunyikan error teknik",
      "Persona selalu membutuhkan lateral release",
    ],
    correctIndex: 2,
    explanation:
      "Vanguard memiliki desain trochlea yang dapat menyamarkan kesalahan kecil pada rotasi femur.",
  },

  {
    question:
      "Pada TKA CR Zimmer, kapan sebaiknya konversi ke PS?",
    options: [
      "Jika flexion gap selalu longgar",
      "Jika PCL tidak kompeten",
      "Jika patella tracking buruk",
      "Jika tibial slope kurang",
    ],
    correctIndex: 1,
    explanation:
      "CR bergantung pada PCL yang fungsional. Jika PCL tidak kompeten, stabilitas flexion terganggu.",
  },

  {
    question:
      "Mengapa Zimmer menekankan trialing yang detail pada Persona?",
    options: [
      "Karena implant sulit dipasang",
      "Karena toleransi kesalahan kecil",
      "Karena Persona sensitif terhadap alignment",
      "Karena semua Persona harus KA",
    ],
    correctIndex: 2,
    explanation:
      "Persona sangat presisi dan sensitif terhadap alignment, sehingga trialing menjadi fase krusial.",
  },
];
