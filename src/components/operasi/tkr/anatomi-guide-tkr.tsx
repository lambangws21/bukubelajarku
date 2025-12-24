'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Bone,
  Share2,
  Home,
  Activity,
  GitBranch,
  Layers,
  AlertTriangle,
} from 'lucide-react';

import {
  mainBoneData,
  softTissueData,
  axesKinematicsData,
  functionalDesignData,
  materialData,
} from '@/components/operasi/tkr/data';

/* ================= MOTION ================= */

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

/* ================= SHARE ================= */

const handleShare = async () => {
  if (!navigator.share) return;
  await navigator.share({
    title: 'Panduan Anatomi TKR',
    text: 'Panduan anatomi & desain implan Total Knee Replacement',
    url: window.location.href,
  });
};

/* ================= COMPONENT ================= */

const TkrAnatomyGuide = () => {
  const router = useRouter();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-8 space-y-14"
    >
      {/* ================= HERO HEADER ================= */}
      <motion.section variants={item}>
        <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-none text-white shadow-xl">
          <CardContent className="p-6 md:p-10 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">
                TKR Anatomy & Implant Logic
              </h1>
              <p className="mt-2 text-blue-200 max-w-xl">
                Panduan anatomi, kinematika, dan desain implan Total Knee Replacement
                untuk Technical Support & edukasi klinis.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="border-white/30 hover:bg-white/10"
                onClick={() => router.push('/')}
              >
                <Home />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-white/30 hover:bg-white/10"
                onClick={handleShare}
              >
                <Share2 />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ================= ANATOMI DASAR ================= */}
      <motion.section variants={item} className="space-y-6">
        <h2 className="text-2xl font-bold border-l-4 border-blue-500 pl-3">
          1. Anatomi Dasar Lutut
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {mainBoneData.map((b) => (
            <Card
              key={b.title}
              className="border-l-4 border-blue-500 bg-muted/30 hover:shadow-md transition"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-500">
                  <Bone size={18} />
                  {b.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>{b.description}</p>
                <p className="text-xs text-muted-foreground border-t pt-2">
                  Relevansi TS: {b.relevance}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ================= SOFT TISSUE ================= */}
      <motion.section variants={item} className="space-y-4">
        <h2 className="text-2xl font-bold border-l-4 border-emerald-500 pl-3">
          2. Jaringan Lunak & Stabilitas
        </h2>

        <Table className="border border-emerald-800 rounded-xl overflow-hidden">
          <TableHeader className="bg-emerald-900/30">
            <TableRow>
              <TableHead className="text-emerald-400">Struktur</TableHead>
              <TableHead className="text-emerald-400">Fungsi</TableHead>
              <TableHead className="text-emerald-400">Relevansi TKR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {softTissueData.map((s) => (
              <TableRow key={s.structure} className="hover:bg-emerald-900/20">
                <TableCell className="font-medium">{s.structure}</TableCell>
                <TableCell>{s.location}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.relevance}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.section>

      {/* ================= KINEMATIKA ================= */}
      <motion.section variants={item} className="space-y-4">
        <h2 className="text-2xl font-bold border-l-4 border-yellow-400 pl-3">
          3. Kinematika & Mechanical Axis
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {axesKinematicsData.map((k) => (
            <AccordionItem
              key={k.concept}
              value={k.concept}
              className="border border-yellow-700/40 rounded-xl"
            >
              <AccordionTrigger className="px-4 text-yellow-400">
                <span className="flex items-center gap-2">
                  <GitBranch size={16} />
                  {k.concept}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm">
                <p className="font-semibold">Definisi:</p>
                <p className="mb-2 text-muted-foreground">{k.definition}</p>
                <p className="font-semibold">Relevansi TS:</p>
                <p className="text-muted-foreground">{k.relevance}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.section>

      {/* ================= INSERT DESIGN ================= */}
      <motion.section variants={item} className="space-y-6">
        <h2 className="text-2xl font-bold border-l-4 border-teal-500 pl-3">
          4. Polyethylene Insert & Implant Logic
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {functionalDesignData.map((f) => (
            <Card
              key={f.title}
              className="border border-teal-800 bg-teal-900/20"
            >
              <CardHeader>
                <CardTitle className="text-teal-400">
                  {f.title} ({f.acronym})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><b>PCL:</b> {f.pcl_status}</p>
                <p><b>Stabilisasi:</b> {f.stability_mechanism}</p>
                <p className="text-xs text-teal-300 border-t pt-2">
                  Fokus TS: {f.ts_relevance}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ================= GOLDEN RULE ================= */}
      <motion.section variants={item}>
        <Card className="border-4 border-red-600 bg-red-950 shadow-xl">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto text-red-400 mb-2" />
            <p className="text-xl font-bold text-red-400">
              GOLDEN RULE – INSERT THICKNESS
            </p>
            <p className="mt-2 text-gray-300">
              Jangan menutup ketidakseimbangan ligamen dengan insert terlalu tebal.
              Gunakan trial 1–2 mm untuk mencapai flexion & extension balance ideal.
            </p>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
};

export default TkrAnatomyGuide;
