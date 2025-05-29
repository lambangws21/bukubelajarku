"use client";

import React from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { motion } from "framer-motion";
import LareralPosisi from "@/app/procedure/posisihip/img/lateralposisi.jpg";
import Support from "@/app/procedure/posisihip/img/support.jpg";
import AnteSupp from "@/app/procedure/posisihip/img/antesup.webp";

const StepsCard = () => {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Posisi Total Hip Replacement</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <HoverCard>
              <HoverCardTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AccordionTrigger>Penempatan Pasien </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs">
                Pasien berbaring di sisi yang tidak dioperasi dengan sisi yang
                dioperasi menghadap ke atas. Fleksikan pinggul dan lutut sisi
                yang dioperasi sekitar 10-15° untuk eksposur yang lebih baik.
              </HoverCardContent>
            </HoverCard>
            <AccordionContent>
              <p>
                Fleksikan pinggul dan lutut sisi yang dioperasi sekitar 10-15°
                untuk eksposur yang lebih baik dan memudahkan akses ke sendi
                pinggul.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={LareralPosisi}
                  alt="Penjelasan Gambar Pertama"
                  width={468}
                  height={826}
                  className="rounded-md w-auto h-auto"
                />
              </motion.div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AccordionTrigger>Stabilisasi Tubuh </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs">
                Gunakan bantalan di bawah tubuh untuk menstabilkan pelvis dan
                bahu. Pastikan pelvis tidak bergeser selama operasi.
              </HoverCardContent>
            </HoverCard>
            <AccordionContent>
              <p>
                Bantalan di bawah tubuh memastikan stabilitas tubuh pasien
                selama prosedur, mencegah pergeseran pelvis yang dapat
                mempengaruhi hasil operasi.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={Support}
                  alt="Penjelasan Gambar Pertama"
                  width={468}
                  height={826}
                  className="rounded-md w-auto h-auto"
                />
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          {/* Teruskan animasi untuk item lainnya dengan pola yang sama */}
          {/* Contoh untuk item lainnya */}
          <AccordionItem value="item-3">
            <HoverCard>
              <HoverCardTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AccordionTrigger>Penataan Anggota Gerak </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs">
                Abduksi dan rotasi eksternal kaki yang dioperasi sekitar 10-20°
                dan rotasi minimal (5-10°) untuk eksposur optimal ke sendi
                pinggul.
              </HoverCardContent>
            </HoverCard>
            <AccordionContent>
              <p>
                Abduksi dan rotasi eksternal kaki yang dioperasi sekitar 10-20°
                dan rotasi minimal (5-10°).
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={AnteSupp}
                  alt="Penjelasan Gambar Pertama"
                  width={468}
                  height={826}
                  className="rounded-md w-auto h-auto"
                />
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <HoverCard>
              <HoverCardTrigger asChild>
              <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                <AccordionTrigger>
                  Orientasi Acetabulum dan Femur
                </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs">
                Inklinasi acetabulum 40-45°, versi acetabulum 10-20°, dan
                anteversi femoral 10-15° untuk stabilitas optimal implan.
              </HoverCardContent>
            </HoverCard>
            <AccordionContent>
              Orientasi acetabulum dan femur dengan sudut yang tepat sangat
              penting untuk mencegah dislokasi dan memastikan stabilitas implan.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <HoverCard>
              <HoverCardTrigger asChild>
              <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                <AccordionTrigger>Pemasangan Implan </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs">
                Gunakan alat bantu bedah untuk memastikan sudut-sudut yang
                diatur dipertahankan selama pemasangan implan.
              </HoverCardContent>
            </HoverCard>
            <AccordionContent>
              Alat bantu bedah membantu menjaga sudut yang tepat selama
              pemasangan implan, yang penting untuk hasil yang optimal.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <HoverCard>
              <HoverCardTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 1.05 }}
                >
                  <AccordionTrigger>
                    Perlindungan Jaringan Lunak
                  </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs">
                Hindari menarik atau meregangkan jaringan lunak secara
                berlebihan. Pastikan saraf sciatic terlindungi.
              </HoverCardContent>
            </HoverCard>
            <AccordionContent>
              Perlindungan saraf dan jaringan lunak adalah kunci untuk mencegah
              cedera dan komplikasi pasca operasi.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <HoverCard>
              <HoverCardTrigger asChild>
              <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 1.05 }}
                >
                <AccordionTrigger>Monitoring Intraoperatif </AccordionTrigger>
                </motion.div>
              </HoverCardTrigger>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <HoverCardContent className="max-w-xs">
                  Pemantauan neuromuskular dapat digunakan untuk memastikan
                  tidak ada cedera saraf selama operasi.
                </HoverCardContent>
              </motion.div>
            </HoverCard>
            <AccordionContent>
              Monitoring intraoperatif membantu dalam mendeteksi dan menghindari
              komplikasi selama operasi.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default StepsCard;
