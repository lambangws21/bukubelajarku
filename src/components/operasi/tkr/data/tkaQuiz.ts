export type QuizQuestion = {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  
  export const tkaQuiz: QuizQuestion[] = [
    {
      question:
        "Patella tracking tampak baik intra-op pada Vanguard, tapi pasien nyeri 3 bulan kemudian. Penyebab paling mungkin?",
      options: [
        "Patella resurfacing gagal",
        "Internal rotation femur ringan",
        "Rehab terlalu agresif",
        "Infeksi ringan",
      ],
      correctIndex: 1,
      explanation:
        "Desain Vanguard bisa menyembunyikan malrotation kecil yang kemudian muncul sebagai nyeri anterior.",
    },
    {
      question:
        "Pada Persona, patella harus ditekan agar center saat trial. Apa tindakan terbaik?",
      options: [
        "Lateral release langsung",
        "Tambah thickness insert",
        "Tambah external rotation femur",
        "Biarkan karena PS lebih forgiving",
      ],
      correctIndex: 2,
      explanation:
        "Persona sangat sensitif terhadap rotasi femur. Koreksi rotasi harus didahulukan.",
    },
    {
      question:
        "Kenapa NexGen sering disebut implant 'jujur'?",
      options: [
        "Lebih murah",
        "Desain trochlea sempit",
        "Tidak menyembunyikan kesalahan teknik",
        "Selalu pakai PS",
      ],
      correctIndex: 2,
      explanation:
        "NexGen tidak mengarahkan patella secara agresif, sehingga kesalahan rotasi langsung terlihat.",
    },
  ];
  