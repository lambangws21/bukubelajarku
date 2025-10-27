// HipArthroplastyGuide.tsx (Dark Theme Optimized dengan Fungsi Share)
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
// Asumsi komponen Button dari shadcn sudah tersedia
import { Button } from "@/components/ui/button"; 
import { hipProcedureData, thrComponentData, hipAnatomyData, hipStabilityData } from './data'; // Sesuaikan path
import { Share2 } from 'lucide-react'; // Impor ikon Share2

// --- Framer Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

// --- Fungsi Share ---
const handleShare = async () => {
    const shareData = {
        title: 'Panduan HA & THR',
        text: 'Pelajari dasar-dasar Hemiarthroplasty dan Total Hip Replacement untuk Technical Support.',
        url: window.location.href, // Mengambil URL halaman saat ini
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('Konten berhasil dibagikan.');
        } else {
            // Fallback untuk browser yang tidak mendukung Web Share API
            alert(`Fungsi Share tidak didukung di browser ini. Anda dapat menyalin tautan: ${window.location.href}`);
        }
    } catch (err) {
        console.error('Gagal berbagi:', err);
    }
};

const HipArthroplastyGuide: React.FC = () => {
  return (
    <motion.div
      className="space-y-12 p-4 md:p-10 max-w-6xl mx-auto bg-gray-950 text-gray-100 min-h-screen" // Latar belakang gelap utama
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER SECTION (Judul dan Share Button) */}
      <motion.div 
        className="flex justify-between items-center border-b-4 border-red-800 pb-3" 
        variants={itemVariants}
      >
        <motion.h1 
            className="text-3xl md:text-5xl font-extrabold text-red-400" 
            variants={itemVariants}
        >
            Panduan HA & THR
        </motion.h1>
        
        {/* Share Button */}
        <Button 
            variant="outline" 
            size="icon" 
            onClick={handleShare}
            // Gaya tombol disesuaikan untuk Dark Theme dan tema merah/panggul
            className="bg-gray-800 text-red-400 hover:bg-gray-700 border-red-500/50 flex-shrink-0" 
        >
            <Share2 className="h-5 w-5" />
        </Button>
      </motion.div>
      
      <motion.p className="text-lg text-gray-400 text-center" variants={itemVariants}>
        Pemahaman ini sangat penting untuk mendukung prosedur penggantian sendi panggul secara efektif.
      </motion.p>

      {/* --------------------------- I & II. Perbandingan Prosedur --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-6 text-gray-200 border-l-4 border-red-400 pl-3">I & II. Definisi & Perbedaan Utama</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hipProcedureData.map((proc, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className={`h-full bg-gray-800 border-gray-700 text-gray-100 hover:shadow-2xl hover:shadow-red-900 transition-all duration-500 border-t-8 ${index === 0 ? 'border-red-500' : 'border-red-400'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-2xl text-red-400">
                    <proc.icon className="w-7 h-7" />
                    <span>{proc.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="font-semibold text-gray-200">{proc.definition}</p>
                  <Separator className="bg-gray-700" />
                  <p><strong>Komponen Diganti:</strong> {proc.components}</p>
                  <p><strong>Fiksasi:</strong> {proc.fixation}</p>
                  <p className="text-xs text-gray-500 pt-1"><strong>Indikasi Utama:</strong> {proc.indication}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* --------------------------- Komponen Implan THR --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-200 border-l-4 border-yellow-400 pl-3">Komponen Implan Total Hip Replacement (THR)</h2>
        <Table className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
          <TableHeader className="bg-yellow-900/40">
            <TableRow className='hover:bg-yellow-900/40'>
              <TableHead className="w-[150px] text-lg font-bold text-yellow-400">Komponen</TableHead>
              <TableHead className="text-lg font-bold text-yellow-400">Material Umum</TableHead>
              <TableHead className="text-lg font-bold text-yellow-400">Fungsi Kritis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thrComponentData.map((comp, index) => (
              <motion.tr key={index} variants={itemVariants} className="hover:bg-gray-700/50">
                <TableCell className="font-semibold text-gray-200">{comp.component}</TableCell>
                <TableCell className="text-gray-400">{comp.material}</TableCell>
                <TableCell className="text-sm text-gray-500">{comp.function}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Separator className="bg-gray-700" />

      {/* --------------------------- III. Anatomi Fungsional Panggul --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-200 border-l-4 border-blue-400 pl-3">III. Anatomi Fungsional Panggul</h2>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {hipAnatomyData.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="shadow-md border-blue-800 bg-gray-800">
                <AccordionItem value={`hip-item-${index}`} className="border-none">
                  <AccordionTrigger className="text-base font-medium p-4 hover:bg-blue-900/50 rounded-t-lg">
                    <span className="text-lg font-semibold text-blue-400">{item.structure}</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-blue-950/20 text-sm border-t border-blue-800 rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-bold mb-1 text-gray-200">Lokasi:</p>
                            <p className="text-gray-400">{item.location}</p>
                        </div>
                        <div>
                            <p className="font-bold mb-1 text-gray-200">Relevansi TS/Bedah:</p>
                            <p className="text-gray-400">{item.relevance}</p>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
      
      {/* --------------------------- IV. Teknik Pengecekan Stabilitas --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-200 border-l-4 border-green-400 pl-3">IV. Teknik Pengecekan Stabilitas Panggul</h2>
        <p className='text-gray-400 mb-4'>Fokus utama: **Mencegah Dislokasi** setelah pemasangan *trial implant*.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hipStabilityData.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-gray-800 border-2 border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg text-green-400">{item.structure}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className='text-gray-300'><strong>Pengujian:</strong> {item.location}</p>
                  <p className="text-xs text-green-500 pt-2 border-t border-green-800 mt-2">
                    **Tindakan TS:** Jika stabilitas buruk (*dislocate*), segera siapkan *femoral head* dengan panjang leher (*neck length*) yang berbeda (lebih panjang).
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* --------------------------- Penutup --------------------------- */}
      <motion.div variants={itemVariants} className="pt-8">
        <Card className="border-4 border-red-500 bg-red-950 shadow-2xl shadow-red-900/50">
          <CardContent className="p-6 md:p-8 text-center">
            <p className="text-2xl font-extrabold text-red-300">RINGKASAN KRITIS TS</p>
            <p className="mt-3 text-lg text-gray-300">
              Dalam operasi panggul, **Orientasi Implan (Anteversi/Retroversi)** dan **Keseimbangan Panjang Kaki (*LLD*)** adalah metrik teknis terpenting yang harus Anda pastikan keakuratannya. Kegagalan pada metrik ini akan berujung pada dislokasi pasca-operasi.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default HipArthroplastyGuide;