// TkrAnatomyGuide.tsx (Dark Theme & Share + Home Functionality)
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // Tambahkan import useRouter
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; 
// Ganti path import ini dengan path yang benar di project Anda
import { mainBoneData, softTissueData, axesKinematicsData } from '@/components/operasi/tkr/data'; 
import { Bone, Share2, Home } from 'lucide-react'; // Tambahkan ikon Home

// --- Framer Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
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
        title: 'Panduan Anatomi TKR',
        text: 'Pelajari dasar-dasar anatomi Total Knee Replacement (TKR) untuk Technical Support.',
        url: typeof window !== 'undefined' ? window.location.href : '/',
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('Konten berhasil dibagikan.');
        } else {
            alert(`Fungsi Share tidak didukung di browser ini. Anda dapat menyalin tautan: ${shareData.url}`);
        }
    } catch (err) {
        console.error('Gagal berbagi:', err);
    }
};

const TkrAnatomyGuide: React.FC = () => {
  const router = useRouter(); // Inisialisasi router

  return (
    <motion.div
      // Latar belakang utama: bg-background (untuk Dark Theme)
      className="space-y-8 p-6 md:p-10 max-w-5xl mx-auto bg-background min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* HEADER SECTION (Judul, Share Button, dan Home Button) */}
      <motion.div 
        className="flex justify-between items-start border-b border-primary/50 pb-2" 
        variants={itemVariants}
      >
        <div>
          <motion.h1 
            className="text-3xl md:text-4xl font-extrabold text-blue-400"
            variants={itemVariants}
          >
            Panduan Anatomi TKR
          </motion.h1>
          <motion.p className="text-lg text-muted-foreground mt-2" variants={itemVariants}>
            Untuk Technical Support
          </motion.p>
        </div>
        
        {/* Tombol Aksi (Home dan Share) */}
        <div className="flex space-x-3 mt-1">
            {/* Tombol Back to Home */}
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.push('/')} // Navigasi ke halaman utama
                className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600/50 flex-shrink-0" 
                aria-label="Back to Home"
            >
                <Home className="h-5 w-5" />
            </Button>
            
            {/* Share Button */}
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handleShare}
                className="bg-gray-800 text-blue-400 hover:bg-gray-700 border-blue-500/50 flex-shrink-0" 
                aria-label="Share Guide"
            >
                <Share2 className="h-5 w-5" />
            </Button>
        </div>
      </motion.div>
      
      {/* --------------------------- 1. Tulang Utama --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-blue-400 pl-3 text-foreground">1. Tulang Utama (*Bones*)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainBoneData.map((bone, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-300 bg-card border border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg text-blue-400">
                    <Bone className="w-5 h-5" />
                    <span>{bone.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">{bone.description}</p>
                  <div className="text-xs text-muted-foreground pt-1 border-t border-gray-700 mt-2">
                    Relevansi TS: {bone.relevance}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* --------------------------- 2. Jaringan Lunak --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-green-400 pl-3 text-foreground">2. Jaringan Lunak Penting (*Soft Tissues*)</h2>
        <Table className="rounded-xl border border-gray-700 bg-card">
          <TableHeader className="bg-green-900/30">
            <TableRow className='hover:bg-green-900/30'>
              <TableHead className="w-[180px] text-green-400">Struktur</TableHead>
              <TableHead className="text-green-400">Lokasi & Fungsi</TableHead>
              <TableHead className="text-green-400">Relevansi Teknis TKR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {softTissueData.map((tissue, index) => (
              <motion.tr 
                key={index} 
                variants={itemVariants} 
                className="hover:bg-gray-700/50"
              >
                <TableCell className="font-medium text-foreground">{tissue.structure}</TableCell>
                <TableCell className='text-muted-foreground'>{tissue.location}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{tissue.relevance}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* --------------------------- 3. Sumbu Mekanis & Kinematika --------------------------- */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-yellow-400 pl-3 text-foreground">3. Garis, Sumbu, dan Kinematika 📐</h2>
        
        <Accordion type="single" collapsible className="w-full space-y-3">
          {axesKinematicsData.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <AccordionItem value={`item-${index}`} className="border-b border-gray-700/50">
                <AccordionTrigger className="text-base font-medium text-foreground hover:bg-gray-800/70 rounded-md">
                  <span className="flex items-center space-x-3 text-yellow-400">
                    {item.icon && <item.icon className="w-5 h-5" />}
                    <span>{item.concept}</span>
                  </span >
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-gray-800/50 text-sm text-muted-foreground">
                  <p className="font-semibold mb-2 text-foreground">Definisi Teoritis:</p>
                  <p className="mb-3">{item.definition}</p>
                  <p className="font-semibold mb-2 text-foreground">Relevansi TS:</p>
                  <p>{item.relevance}</p>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
          
          {/* Kinematics Conclusion Item */}
          <motion.div variants={itemVariants} className="pt-4">
             <div>
             <h2 className='text-xl font-bold mb-3 border-b border-purple-500 pb-1 text-purple-400'>
                4. Prinsip Keseimbangan Inti (*Ligament Balancing*)
            </h2>
            <div className="p-4 bg-purple-900/30 rounded-lg text-sm border border-purple-800">
                    <p className="font-semibold mb-2 text-purple-200">Konsep:</p>
                    <p className="mb-3 text-purple-300">Inti dari TKR adalah memastikan lutut buatan memiliki stabilitas yang sama di sisi medial dan lateral, baik saat **fleksi** maupun **ekstensi**.</p>
                    <p className="font-semibold mb-2 text-purple-200">Peran TS:</p>
                    <p className='text-purple-300'>Memahami bagaimana alat ukur (*spacer block*) membantu mencapai keseimbangan **Flexion Gap** dan **Extension Gap** yang sesuai dengan implan yang akan dipasang.</p>
                </div>
            </div>
           
          </motion.div>
        </Accordion>
      </motion.div>

      {/* --------------------------- Kesimpulan --------------------------- */}
      <motion.div variants={itemVariants} className="pt-6">
        <Card className="border-4 border-red-500 bg-red-950 shadow-2xl shadow-red-900/50">
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-xl font-bold text-red-400">KESIMPULAN</p>
            <p className="mt-2 text-base text-gray-300">
              Fokus TS adalah menguasai anatomi **makroskopik dan fungsional**. Pengetahuan ini memungkinkan Anda mengantisipasi kebutuhan ahli bedah, memastikan *alignment* yang akurat, dan menjamin fungsi implan yang optimal.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TkrAnatomyGuide;