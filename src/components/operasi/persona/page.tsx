'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const SurgicalStepsPersona: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Langkah-langkah Teknik Bedah Persona® The Personalized Knee</h1>
      <Accordion type="single" collapsible>
        
        <AccordionItem value="item-1">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Persiapan Praoperasi</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Persiapan gambar radiografi anteroposterior dan lateral.</li>
                    <li>Tentukan sudut antara sumbu anatomis dan sumbu mekanis dengan menggunakan template overlay.</li>
                    <li>Pilih pendekatan pembedahan: midvastus, subvastus, atau parapatellar medial arthrotomy.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-2">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Reseksi Distal Femur</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Pasang instrumen reseksi distal yang dapat disesuaikan.</li>
                    <li>Tentukan alignment femoral.</li>
                    <li>Lakukan reseksi distal femur dengan panduan instrumen.</li>
                    <li>Pilih teknik pemotongan opsional jika diperlukan.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-3">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Reseksi Proksimal Tibia</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Pasang panduan alignment extramedullary (EM)</li>
                    <li>Sesuaikan tinggi dan sudut panduan pemotongan.</li>
                    <li>Tetapkan level reseski dan potong tibia proksimal.</li>
                    <li>Gunakan Teknik opsional jika diperlukan.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-4">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Penentuan Ukuran dan Rotasi Eksternal Femur</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Gunakan sizer femoral untuk menentukan ukuran dan rotasi eksternal</li>
                    <li>Tetntukan posisi rotasi eksternal dengan refrensi pada posterior condyles, axis epicondylar, atau Whiteside line</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-5">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Reseksi Femoral A/P dam Chamfer</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Tempatkan panduan pemotongan 4-in-1 pada femur</li>
                    <li>Lakukan reseksi anterior, posterior, posterior chamfer, dan anterior chamfer.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        
        <AccordionItem value="item-6">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Menentukan Ukuran dan Rotasi Tibia</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Pilih plat ukurajn tibial yang sesuai untuk menutupi permukaan tibial tanpa overhang</li>
                    <li>Sesuaikan rotasi tibial sesuai dengan anatomi pasien.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-7">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Drilling dan Broaching Tibia</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Guniakan panduan drilling dan lakukan drilling hingga kedalaman yang diperlukan</li>
                    <li>Gunakan broach untuk mempersiapkan tulang tibia untuk implan</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-8">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Persiapan Patela</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Ukur ketebalan patella dengan capiler</li>
                    <li>Potong patella menggunakan panduan osteotomi.</li>
                    <li>Tentukan ukuran patella yang tepat dan lakukan pengeboran untuk lubang pegs</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        <AccordionItem value="item-9">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Finishing dan Uji Coba Femoral CR</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Pasang provisional femoral CR pada femur dan uji posisi serta rentang gerak</li>
                    <li>Lakukan pengeboran untuk lubang peg femoral jika posisi sudah sesuai.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Tambahkan langkah-langkah lainnya sesuai kebutuhan */}

        <AccordionItem value="item-10">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Penutupan Insisi</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Setelah semua komponen diuji dan dipastikan berada pada posisi yang tepat, lakukan penutupan insisi.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-11">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Catatan Penting</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Kontraindikasi: Kondisi tertentu seperti infeksi sendi, stok tulang tidak memadai, osteoarthritis dengan deformitas valgus lebih dari5°, dll., harus dipertimbangkan sebelum operasi.</li>
                    <li>Pilihan Implan: Pilih CR, PS, atau CPS berdasarkan kondisi PCL dan kebutuhan pasien..</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-12">
          <Card className="mb-4 shadow-sm">
            <CardHeader>
              <AccordionTrigger>
                <CardTitle>Tips Operasional</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent asChild>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="list-disc list-inside">
                    <li>Pastikan reseksi dilakukan dengan tingkat kerataan yang tepat untuk kontak yang memadai antara implan dan tulang.</li>
                    <li>Selalu gunakan instrumen yang sesuai untuk memastikan akurasi dan keamanan selama operasi.</li>
                    <li>Verifikasi rotasi dan posisi implan secara berkala selama prosedur untuk menghindari kesalahan pemasangan.</li>
                  </ul>
                </motion.div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

      </Accordion>
    </div>
  );
};

export default SurgicalStepsPersona;
