export type Language = "id" | "en";

export interface ZCAAllPolyLearningSection {
  order: number;
  slug: string;
  title: {
    id: string;
    en: string;
  };
  content: {
    id: string[];
    en: string[];
  };
  reference: {
    label: string;
    url: string;
  };
}

export const ZCAAllPolyAcetabularLearningData: ZCAAllPolyLearningSection[] = [
  {
    order: 1,
    slug: "overview",
    title: {
      id: "Gambaran Umum ZCA® All-Poly Cup",
      en: "Overview of ZCA® All-Poly Acetabular Cup",
    },
    content: {
      id: [
        "ZCA® All-Poly Acetabular Cups dirancang untuk fiksasi bertulang dengan semen (cemented fixation) pada arthroplasty total panggul primer atau revisi. :contentReference[oaicite:1]{index=1}",
        "Cup ini tersedia dalam beberapa varian – Neutral, Inclined Face, Flanged, dan Snap-In – yang membantu menyesuaikan kebutuhan stabilitas dan pencegahan dislokasi intraoperatif. :contentReference[oaicite:2]{index=2}",
        "Material polyethylene memiliki ketebalan minimal 6 mm dengan spacers 3 mm untuk membantu menciptakan mantel semen yang uniform. :contentReference[oaicite:3]{index=3}",
      ],
      en: [
        "ZCA® All-Poly Acetabular Cups are designed for cemented fixation in primary or revision total hip arthroplasty. :contentReference[oaicite:4]{index=4}",
        "These cups come in several styles – Neutral, Inclined Face, Flanged, and Snap-In – to help tailor stability and dislocation prevention intraoperatively. :contentReference[oaicite:5]{index=5}",
        "The polyethylene has a minimum thickness of 6 mm with 3 mm cement spacers to facilitate a uniform cement mantle. :contentReference[oaicite:6]{index=6}",
      ],
    },
    reference: {
      label: "ZCA® All-Poly Acetabular Cup Brochure (PDF)",
      url: "https://surgitech.net/wp-content/uploads/2018/11/ZCA-All-Poly-Acetabular-Cup-Brochure.pdf",
    },
  },
  {
    order: 2,
    slug: "variants",
    title: {
      id: "Varian ZCA® Cup & Fungsinya",
      en: "ZCA® Cup Variants & Functions",
    },
    content: {
      id: [
        "Neutral Cup adalah pilihan klasik untuk penggantian acetabular standar. :contentReference[oaicite:7]{index=7}",
        "Inclined Face Cup memiliki bagian wajah dengan kemiringan 10° untuk membantu mencegah dislokasi pada area elevasi. :contentReference[oaicite:8]{index=8}",
        "Flanged Cup memiliki flange yang dapat membantu menstabilkan tepi acetabulum dan memberikan pressurisasi semen tambahan. :contentReference[oaicite:9]{index=9}",
        "Snap-In Cup memberikan fitur constraint tambahan terhadap kepala femoral untuk mengurangi risiko dislokasi. :contentReference[oaicite:10]{index=10}",
      ],
      en: [
        "The Neutral Cup is a classic choice for standard acetabular replacement. :contentReference[oaicite:11]{index=11}",
        "The Inclined Face Cup has a 10° inclined face to help reduce dislocation risk in the elevation area. :contentReference[oaicite:12]{index=12}",
        "The Flanged Cup includes a flange to help stabilize the acetabular rim and add cement pressurization. :contentReference[oaicite:13]{index=13}",
        "The Snap-In Cup provides additional constraint of the femoral head to help minimize dislocation risk. :contentReference[oaicite:14]{index=14}",
      ],
    },
    reference: {
      label: "ZCA® All-Poly Acetabular Cup Brochure (PDF)",
      url: "https://surgitech.net/wp-content/uploads/2018/11/ZCA-All-Poly-Acetabular-Cup-Brochure.pdf",
    },
  },
  {
    order: 3,
    slug: "preoperative-planning",
    title: {
      id: "Perencanaan Pra Operasi",
      en: "Preoperative Planning",
    },
    content: {
      id: [
        "Perencanaan ukuran cup dilakukan berdasar templating radiografik dan pengukuran intraoperatif terhadap acetabulum. :contentReference[oaicite:15]{index=15}",
        "Pemilihan varian cup dan orientasi intraoperatif dapat disesuaikan dengan anatomi pasien dan preferensi bedah. :contentReference[oaicite:16]{index=16}",
        "Posisi cup optimal biasanya dimulai pada abduksi sekitar 40–45° dan anteversi sekitar 15–20°, tapi dapat disesuaikan sesuai kondisi klinis. :contentReference[oaicite:17]{index=17}",
      ],
      en: [
        "Cup size planning is based on radiographic templating and intraoperative measurement of the acetabulum. :contentReference[oaicite:18]{index=18}",
        "Variant and orientation selection can be tailored to the patient’s anatomy and surgical preference. :contentReference[oaicite:19]{index=19}",
        "The initial cup position is often targeted at around 40–45° abduction and 15–20° anteversion, but may be adjusted clinically. :contentReference[oaicite:20]{index=20}",
      ],
    },
    reference: {
      label: "ZCA® All-Poly Acetabular Cup Brochure (PDF)",
      url: "https://surgitech.net/wp-content/uploads/2018/11/ZCA-All-Poly-Acetabular-Cup-Brochure.pdf",
    },
  },
  {
    order: 4,
    slug: "surgical-technique",
    title: {
      id: "Teknik Bedah Pemasangan Cup",
      en: "Surgical Technique for Cup Placement",
    },
    content: {
      id: [
        "Ekspos acetabulum dengan retractors untuk menyingkirkan jaringan lunak dan osteofit perifer. :contentReference[oaicite:21]{index=21}",
        "Ream acetabulum secara bertahap dengan reamer hemisferik hingga mencapai cancellous subchondral bone yang berdarah. :contentReference[oaicite:22]{index=22}",
        "Gunakan acetabular drill untuk membuat keyholes yang membantu penempelan semen untuk tambahan stabilitas. :contentReference[oaicite:23]{index=23}",
        "Lavage dan keringkan acetabulum sebelum mengaplikasikan semen PMMA dan memasukkan cup. :contentReference[oaicite:24]{index=24}",
        "Posisikan cup sesuai templating, lakukan penekanan kontinyu sampai semen memadat, kemudian trimming kelebihan semen. :contentReference[oaicite:25]{index=25}",
      ],
      en: [
        "Expose the acetabulum with retractors to remove soft tissue and peripheral osteophytes. :contentReference[oaicite:26]{index=26}",
        "Ream the acetabulum progressively with hemispherical reamers to bleeding cancellous subchondral bone. :contentReference[oaicite:27]{index=27}",
        "Use an acetabular drill to create keyholes that help cement interdigitation for additional stability. :contentReference[oaicite:28]{index=28}",
        "Lavage and dry the acetabulum before applying PMMA cement and inserting the cup. :contentReference[oaicite:29]{index=29}",
        "Position the cup per templating, apply continuous pressure until cement polymerizes, then trim excess cement. :contentReference[oaicite:30]{index=30}",
      ],
    },
    reference: {
      label: "ZCA® All-Poly Acetabular Cup Brochure (PDF)",
      url: "https://surgitech.net/wp-content/uploads/2018/11/ZCA-All-Poly-Acetabular-Cup-Brochure.pdf",
    },
  },
  {
    order: 5,
    slug: "sizing",
    title: {
      id: "Ukuran Cup & Spacer",
      en: "Cup Sizing & Spacers",
    },
    content: {
      id: [
        "Diameter cup diukur dari permukaan spacer semen 3 mm. Oleh karena itu, ukuran cup akhir dipilih berdasar ukuran reamer terakhir yang digunakan. :contentReference[oaicite:31]{index=31}",
        "Jika reamer terakhir berukuran genap, pilih cup dengan diameter yang 1 mm lebih kecil untuk memastikan mantel semen yang cukup. :contentReference[oaicite:32]{index=32}",
        "Spacer semen 3 mm membantu menjaga mantel semen uniform di sekitar cup. :contentReference[oaicite:33]{index=33}",
      ],
      en: [
        "The cup diameter is measured over the 3 mm cement spacers. Therefore, the final cup size is chosen based on the last reamer used. :contentReference[oaicite:34]{index=34}",
        "If the last reamer is an even size, choose a cup diameter 1 mm smaller to ensure adequate cement mantle. :contentReference[oaicite:35]{index=35}",
        "The 3 mm cement spacers help maintain a uniform cement mantle around the cup. :contentReference[oaicite:36]{index=36}",
      ],
    },
    reference: {
      label: "ZCA® All-Poly Acetabular Cup Brochure (PDF)",
      url: "https://surgitech.net/wp-content/uploads/2018/11/ZCA-All-Poly-Acetabular-Cup-Brochure.pdf",
    },
  },
];
