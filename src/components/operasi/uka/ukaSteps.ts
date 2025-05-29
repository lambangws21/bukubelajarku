// ukaSteps.ts
// Data tahapan prosedur UKA Oxford Partial Knee Microplasty dalam format TypeScript

export interface UkaStep {
  Step: number;
  Tahapan: string;
  Deskripsi: string[];
  Note?: string;
}

export const ukaSteps: UkaStep[] = [
  {
    Step: 1,
    Tahapan: "Insisi dan Eksposur",
    Deskripsi: [
      "Posisi fleksi lutut ±110°",
      "Insisi medial parapatellar",
      "Subluksasi patella (tidak dislokasi)",
      "Eksisi medial meniskus",
      "Konfirmasi ACL utuh"
    ],
    Note: "Pastikan subluksasi dilakukan dengan lembut agar tidak merusak struktur jaringan lunak."
  },
  {
    Step: 2,
    Tahapan: "Eksisi Osteofit",
    Deskripsi: [
      "Bersihkan osteofit dari kondilus femoralis medial",
      "Bersihkan margin notch interkondiler",
      "Bersihkan sekitar MCL (menggunakan pahat 6 mm)",
      "Bersihkan tibia anterior dan superior ACL"
    ],
    Note: "Bersihkan seluruh osteofit untuk menghindari impingement dan memastikan pergerakan bebas, gunakan pahat dan juga knabeltang."
  },
  {
    Step: 3,
    Tahapan: "Sizing dan Penyesuaian Gap",
    Deskripsi: [
      "Gunakan Sizing Spoon (XS/S/M) → pasang G-clamp",
      "Pasang Tibial Saw Guide dengan shim (0 mm atau +2 mm)",
      "Posisi tibial saw guide: mid valgus → pin di medial & lateral"
    ],
    Note: "Gunakan shim +2 mm jika potongan terlalu tebal, jarak spoon antara condile 2-3mm, konfirmasi penggunaan G-clamp (3/4)."
  },
  {
    Step: 4,
    Tahapan: "Reseksi Tibia",
    Deskripsi: [
      "Potong vertikal pakai reciprocating saw sesuai slot shim",
      "Ganti ke slotted shim jika diperlukan",
      "Potong horizontal dengan oscillating saw (12 mm)",
      "Angkat plateau dengan pahat & bersihkan sisa jaringan",
      "Tentukan ukuran tibial trial"
    ],
    Note: "Gunakan oscillating saw dengan hati-hati untuk menghindari kerusakan ke arah posterior tibia."
  },
  {
    Step: 5,
    Tahapan: "Drilling Femur",
    Deskripsi: [
      "Bor lubang intramedular dengan drill 4 mm → awl 5 mm",
      "Posisi: 1 cm anterior dari PCL, 1–2 mm lateral ke arah medial",
      "Masukkan IM rod → lalu pasang femoral drill guide"
    ],
    Note: "Berikan Tibial Nail untuk starter, kemudian perhatikan arah sias untuk guide arahnya, hati-hati saat IM rod pegang pusher dan rod saat memberikan ke operator"
  },
  {
    Step: 6,
    Tahapan: "Femoral Drill Guide & Alignment",
    Deskripsi: [
      "Gunakan IM link → pastikan garis tengah pas",
      "Bor 4 mm & 6,3 mm sesuai guide",
      "Lepas IM link & guide dengan T"
    ],
    Note: "Perhatikan posisi IM Link, sesuaikan dengan Garis mid condile yang sudah dibuat. "
  },
  {
    Step: 7,
    Tahapan: "Reseksi Posterior Femur",
    Deskripsi: [
      "Pasang posterior resection guide",
      "Potong posterior dengan saw blade 0.89 mm",
      "Harus ada sedikit \"bending\" untuk menjangkau penuh",
      "Keluarkan guide dengan Ekstraktor"
    ],
    Note: "Saat melakukan Saw kondisi sawblade bending agar menjangkau penuh bagian posterior"
  },
  {
    Step: 8,
    Tahapan: "Milling Femoral Condyle",
    Deskripsi: [
      "Gunakan Spigot 0 → (fleksibilitas - ekstensi) = Rumus spigot",
      "Gunakan spherical cutter → mill sesuai spigot",
      "Jika perlu, lanjutkan milling bertahap (1, 2, 3...)"
    ],
    Note: "Hindari overmilling karena dapat mengganggu posisi trial dan menyebabkan ketidakstabilan."
  },
  {
    Step: 9,
    Tahapan: "Uji Trial",
    Deskripsi: [
      "Masukkan femoral twin peg trial",
      "Masukkan tibial trial",
      "Cek insert dengan feeler gauge atau lollipop",
      "Pastikan sudut fleksi 110°, ekstensi 20°",
      "Pastikan tidak ada impingement (gunakan anti-impingement guide)"
    ]
  },
  {
    Step: 10,
    Tahapan: "Finalisasi Persiapan Tibia",
    Deskripsi: [
      "Pasang tibial template → pin → buat slot keel",
      "Gunakan groove chisel/cangkul",
      "Gunakan cement curette untuk membersihkan sisa tulang",
      "Masukkan tibial trial kembali dan tes"
    ],
    Note: "Perhatikan Grove, karena istrument kita memiliki cementles dan cemented"
  },
  {
    Step: 11,
    Tahapan: "Trial Komponen Final",
    Deskripsi: [
      "Masukkan femoral trial + tibial trial + insert",
      "Cek kestabilan dan pergerakan",
      "Jika sesuai, lepaskan kembali semua komponen trial"
    ]
  },
  {
    Step: 12,
    Tahapan: "Cementing",
    Deskripsi: [
      "Tibial: oles tipis cement → pasang tibial implant → tekan dari posterior → gunakan impactor → bersihkan cement",
      "Femoral: isi cement → pasang femoral → tekan 45° → pasang feeler gauge saat curing cement"
    ],
    Note: "Perhatikan waktu kerja cement agar pemasangan dilakukan sebelum curing dimulai, pada Twinpeg berikan bagian posterior cement tipis."
  },
  {
    Step: 13,
    Tahapan: "Pemasangan Insert Final",
    Deskripsi: [
      "Pilih bearing sesuai gap terakhir",
      "Snap-in insert",
      "Pastikan tidak ada sisa cement di area posterior"
    ],
    Note: "Konfirmasi Kembali implant yang akan di buka"
  }
];
