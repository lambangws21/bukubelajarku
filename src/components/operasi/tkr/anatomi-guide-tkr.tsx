// TkrAnatomyGuide.tsx (FINAL GABUNGAN MATERI & FUNGSI)
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; 
import { AlertTriangle, Bone, Share2, Home, Lightbulb } from 'lucide-react';

// NOTE: Asumsi semua data diimport dari satu file data.ts
import { 
    mainBoneData, softTissueData, axesKinematicsData, 
    functionalDesignData, materialData, complicationData 
} from '@/components/operasi/tkr/data'; 

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
        text: 'Pelajari dasar-dasar anatomi TKR dan desain implan.',
        url: typeof window !== 'undefined' ? window.location.href : '/',
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            alert(`Fungsi Share tidak didukung di browser ini. Anda dapat menyalin tautan: ${shareData.url}`);
        }
    } catch (err) {
        console.error('Gagal berbagi:', err);
    }
};

const TkrAnatomyGuide: React.FC = () => {
  const router = useRouter(); 

  return (
    <motion.div
      className="space-y-10 p-6 md:p-10 max-w-6xl mx-auto bg-background min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* HEADER SECTION (Judul, Share Button, dan Home Button) */}
      <motion.div 
        className="flex justify-between items-start border-b border-primary/50 pb-4" 
        variants={itemVariants}
      >
        <div>
          <motion.h1 
            className="text-3xl md:text-4xl font-extrabold text-blue-400"
            variants={itemVariants}
          >
            Panduan Komprehensif TKR
          </motion.h1>
          <motion.p className="text-lg text-muted-foreground mt-1" variants={itemVariants}>
            Anatomi, Kinematika, dan Desain Implan untuk Technical Support
          </motion.p>
        </div>
        
        {/* Tombol Aksi (Home dan Share) */}
        <div className="flex space-x-3 mt-1">
            {/* Tombol Back to Home */}
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.push('/')}
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
      
      {/* ==================================================================== */}
      {/* BAGIAN 1: ANATOMI DASAR (TULANG & LIGAMEN) */}
      {/* ==================================================================== */}
      
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-blue-400 pl-3 text-foreground">1. Anatomi Fungsional Dasar</h2>
        
        {/* Tulang Utama */}
        <h3 className='text-xl font-semibold mt-6 mb-3 text-gray-300'>1.1 Tulang Utama (*Bones*)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainBoneData.map((bone, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-card border border-gray-700/50">
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

        {/* Jaringan Lunak */}
        <h3 className='text-xl font-semibold mt-8 mb-3 text-gray-300'>1.2 Jaringan Lunak Penting (*Soft Tissues*)</h3>
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
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-yellow-400 pl-3 text-foreground">2. Kinematika dan Sumbu Kritis</h2>
        
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
          
          {/* Prinsip Keseimbangan Inti */}
          <motion.div variants={itemVariants} className="pt-4">
             <div>
             <h2 className='text-xl font-bold mb-3 border-b border-purple-500 pb-1 text-purple-400'>
                Prinsip Keseimbangan Inti (*Ligament Balancing*)
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

      {/* ==================================================================== */}
      {/* BAGIAN 3: POLYETHYLENE INSERT DAN RISIKO */}
      {/* ==================================================================== */}
      
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-teal-400 pl-3 text-foreground">3. Desain Polyethylene Insert & Risiko</h2>
        
        {/* Desain Fungsional */}
        <h3 className='text-xl font-semibold mt-6 mb-3 text-gray-300'>3.1 Jenis Insert Berdasarkan Desain Fungsional (CR vs. PS)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {functionalDesignData.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-gray-800 border-teal-800 border">
                <CardHeader>
                  <CardTitle className="text-lg text-teal-400">{item.title} ({item.acronym})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-gray-300"><strong>PCL:</strong> {item.pcl_status}</p>
                  <p className="text-gray-300"><strong>Stabilisasi:</strong> {item.stability_mechanism}</p>
                  <p className="text-xs text-teal-500 pt-1 border-t border-gray-700 mt-2">
                    Fokus TS: {item.ts_relevance}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Jenis Material */}
        <h3 className='text-xl font-semibold mt-8 mb-3 text-gray-300'>3.2 Jenis Material </h3>
        <Table className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <TableHeader className="bg-yellow-900/30">
            <TableRow className='hover:bg-yellow-900/40'>
              <TableHead className="text-yellow-400">Material</TableHead>
              <TableHead className="text-yellow-400">Deskripsi</TableHead>
              <TableHead className="text-yellow-400">Tindakan TS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materialData.map((mat, index) => (
              <motion.tr key={index} variants={itemVariants} className="hover:bg-gray-700/50">
                <TableCell className="font-semibold text-gray-200">{mat.material}</TableCell>
                <TableCell className="text-gray-400">{mat.description}</TableCell>
                <TableCell className="text-sm text-yellow-500">{mat.ts_action}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>

        {/* Komplikasi Kritis */}
        {/* <h3 className='text-xl font-semibold mt-8 mb-3 text-gray-300'>3.3 Komplikasi & Pencegahan Kritis (Fokus TS)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complicationData.map((comp, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-gray-800 border-2 border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{comp.problem}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-gray-400"><strong>Mekanisme:</strong> {comp.mechanism}</p>
                  <div className="text-xs text-red-300 pt-2 border-t border-red-700 mt-2">
                    <strong className='flex items-center space-x-1'><Lightbulb className='w-4 h-4'/> Fokus Pencegahan TS:</strong> {comp.ts_prevention_focus}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div> */}
      </motion.div>

      {/* --------------------------- Kesimpulan GOLDEN RULE --------------------------- */}
      <motion.div variants={itemVariants} className="pt-6">
        <Card className="border-4 border-red-500 bg-red-950 shadow-2xl shadow-red-900/50">
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-xl font-bold text-red-400">GOLDEN RULE KETEBALAN INSERT</p>
            <p className="mt-2 text-base text-gray-300">
              TS harus selalu siap dengan *Trial Insert* dengan **interval penambahan ketebalan terkecil (1-2 mm)**. Tujuan utamanya adalah mencapai **keseimbangan ligamen** sempurna tanpa menggunakan *insert* yang terlalu tebal.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TkrAnatomyGuide;