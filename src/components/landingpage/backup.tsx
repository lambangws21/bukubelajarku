"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';

const features = [
  { icon: <CheckCircle size={24} className="text-indigo-500" />, title: "Personalized Pressure®", desc: "Adaptif sesuai karakteristik individu pasien untuk akurasi maksimal." },
  { icon: <CheckCircle size={24} className="text-indigo-500" />, title: "Leak Detection Otomatis", desc: "Deteksi kebocoran secara real-time untuk keamanan optimal." },
  { icon: <CheckCircle size={24} className="text-indigo-500" />, title: "Layar Sentuh 8.4\"", desc: "Antarmuka responsif dengan visual tajam." },
  { icon: <CheckCircle size={24} className="text-indigo-500" />, title: "Battery 6 Jam", desc: "Daya tahan ekstensif untuk operasi panjang." },
  { icon: <CheckCircle size={24} className="text-indigo-500" />, title: "Dual Cuff & Port", desc: "Konfigurasi ganda untuk efisiensi penggunaan." },
];

export default function ModernLandingATSNoNav() {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, margin: "-50px" });
  const heroControls = useAnimation();

  useEffect(() => {
    if (isHeroInView) heroControls.start("visible");
  }, [heroControls, isHeroInView]);

  return (
    <div className="font-sans antialiased text-gray-900">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-white via-indigo-50 to-indigo-100 px-6 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={heroControls}
          variants={{ visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
          className="text-5xl md:text-6xl font-extrabold text-indigo-700 mb-4"
        >
          Zimmer ATS 4000
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={heroControls}
          variants={{ visible: { opacity: 1, transition: { delay: 0.4, duration: 0.6 } } }}
          className="text-lg text-indigo-600 mb-8 max-w-2xl"
        >
          Torniquet system unggulan dengan kontrol presisi tinggi, deteksi bocor pintar, dan antarmuka modern.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={heroControls}
          variants={{ visible: { opacity: 1, scale: 1, transition: { delay: 0.8, duration: 0.6 } } }}
        >
          <Button
            variant="default"
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full shadow-lg"
          >
            Request Demo
          </Button>
        </motion.div>
      </section>

      {/* Features & Image Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
          {/* Features List */}
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-indigo-700 mb-6">Fitur Unggulan</h2>
            <div className="space-y-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="flex items-start space-x-4"
                >
                  <div>{f.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{f.title}</h3>
                    <p className="text-gray-600">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Image */}
          <motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Image
              src="/ATS_4000.webp"
              alt="Zimmer ATS 4000"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-indigo-600 text-white text-center px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Siap Jelajahi Keunggulan?</h2>
        <p className="mb-6 max-w-xl mx-auto">
          Dapatkan demo eksklusif dan konsultasi gratis untuk Zimmer ATS 4000 sekarang.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="border-white text-white hover:bg-white hover:text-indigo-600 px-6 py-3 rounded-full"
        >
          Hubungi Sekarang
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-indigo-500">
        <p>Herlambang Wicaksono</p>
      </footer>
    </div>
  );
}
