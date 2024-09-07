'use client'
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";


const steps = [
    {
      title: "Posisi Kaki",
      description:
        "Inflasi turniket paha dan posisikan kaki dengan dukungan paha yang membuat pinggul fleksi sekitar 30 derajat dan lutut dapat fleksi hingga sekitar 110 derajat.",
      imageSrcs: ["/components/operasi/ukr/img/posisi.png"], // Jadikan sebagai array
    },
    {
      title: "Insisi",
      description:
        "Buat insisi kulit parapatelar medial dari tepi medial patela hingga sekitar 3 cm distal ke garis sendi dengan lutut fleksi 90 derajat.",
      imageSrcs: ["/components/operasi/ukr/img/insisi.png"], // Jadikan sebagai array
    },
    {
      title: "Eksisi Osteofit",
      description:
        "Buang semua osteofit dari margin medial kondilus femoral medial dan dari margin interkondiler, serta bagian depan plateau tibia.",
      imageSrcs: ["/components/operasi/ukr/img/ostefied.png"], // Jadikan sebagai array
    },
    {
      title: "Reseksi Plateau Tibial",
      description:
        "Dengan lutut dalam posisi fleksi, gunakan panduan gergaji tibial untuk melakukan reseksi plateau tibial.",
      imageSrcs: [
        "/components/operasi/ukr/img/reseksitibialplateu.png",
        "/components/operasi/ukr/img/reseksitibia.png",
        "/components/operasi/ukr/img/reseksitibial2.png",
        "/components/operasi/ukr/img/reseksitibia3.png",
      ],
    },
  {
    title: "Pengeboran Lubang femoral",
    description:
      "Lakukan pengeboran lubang pada kanal intramedular femur untuk memasukkan batang intramedular. Pasang panduan pengeboran femoral untuk menentukan posisi yang tepat.",
    imageSrcs: ["/components/operasi/ukr/img/holesfemoral.png", 
      "/components/operasi/ukr/img/holefemoral2.png"
    ],
  },
  {
    title: "Pemotongan Femoral dengan Gergaji",
    description:
      "Gunakan panduan reseksi posterior untuk mengarahkan gergaji pada kondilus femoral posterior, menghindari kerusakan pada ligamen kolateral medial dan ligamen krusiat anterior",
    imageSrcs: ["/components/operasi/ukr/img/femoralcut.webp"],
  },

  {
    title: "Penggilingan pertama kondilus",
    description:
      "Memasukan spigot 0 kedalam lubang pengeboran besar dan gunakan pemotongan bola untuk menggiling kondilus hingga permukaan yang diinginkan tercapai",
    imageSrcs:["/components/operasi/ukr/img/femoraldrill.webp"],
  },

  {
    title: "Menyeimbangkan Gap Fleksi dan Ekstensi",
    description:
      "Ukur gap fleksi dan ekstensi dengan feeler gauge untuk memastikan gap yang sesuai, dan sesuaikan jumla tulang yang akan digiling berdasarkan ukuran gap fleksi dan ekstensi.",
    imageSrcs:["/components/operasi/ukr/img/flexgap.png",
      "/components/operasi/ukr/img/exgap.webp"
    ],
  },
  {
    title: "Mencegah Impingement",
    description:"Buang tulang anterior dan posterior kondilus untuk mengurangi risiko impingement saat ekstensi penuh dan fleksi penuh",
    imageSrcs: ["/components/operasi/ukr/img/mencegahimpigement.png",
      "/components/operasi/ukr/img/mecegahimpigmen2.png"
    ],
  },
  {
    title: "Persiapan AKhir dan Plateau Tibial",
    description:
      "Memasukan template tibial yang sesuda dan pastikan posisinya benar, lakuakn pemotongan keel-cut untuk menyiapkan tempat pemasangan komponen tibial",
    imageSrcs: ["/components/operasi/ukr/img/finalpre.png",],
  },
  {
    title: "Pengurangan Uji Coba Akhir",
    description:
      "Pasang komponen uji coba femoral dan meniscal bearing untuk memeriksa stabilisasi dan tidak ada impingement",
    imageSrcs: ["/components/operasi/ukr/img/trial.png"],
  },
  {
    title: "Pencemenan komponen",
    description:
      "Aplikasin semen pada permukaan femoral dan tibial serta pasang kompnen dengan benar. Tekan komponen hingga posisi yang diingkan dan buat semen yang berlebihan",
    imageSrcs: ["/components/operasi/ukr/img/final.webp", "/components/operasi/ukr/img/final2.webp"],
  },
];
const SurgicalStepsUka: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
               <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-5 p-4">Steps Operasi UKA</h1>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          className="hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="h-full flex flex-col justify-between min-h-[300px]">
            <CardHeader>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <Badge className="mt-2 w-28">{`Langkah ${index + 1}`}</Badge>
            </CardHeader>
            <CardContent className="flex gap-4 flex-col md:flex-row">
              <div
                className={`${
                  step.imageSrcs.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""
                }`}
              >
                {(Array.isArray(step.imageSrcs) ? step.imageSrcs : [step.imageSrcs]).map(
                  (src, imgIndex) => (
                    <motion.div
                      key={imgIndex}
                      className=""
                      style={{ scale }}
                    >
                      <Image
                        src={src}
                        alt={`Image for ${step.title} - ${imgIndex + 1}`}
                        className="mb-4 w-full h-auto transition-transform duration-300 ease-in-out md:hover:scale-150 md:hover:translate-x-11"
                        width={300}
                        height={250}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        priority={index === 0 && imgIndex === 0}
                      />
                    </motion.div>
                  )
                )}
              </div>
              <p className="leading-7 md:mt-0 mt-4">{step.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SurgicalStepsUka;
