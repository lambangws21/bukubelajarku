// components/VanguardStepsGallery.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { vanguardSteps } from "./data/vanguardSteps";

const highlightKeywords = (text: string): string => {
  const keywords = [
    "Potong",
    "Pasang",
    "Gunakan",
    "Masukkan",
    "Cek",
    "Keluarkan",
    "Bor",
    "Isi",
  ];
  let result = text;
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})`, "gi");
    result = result.replace(regex, `<span class='font-semibold text-blue-700'>$1</span>`);
  });
  return result;
};

const VanguardStepsGallery = () => {
  const [selectedStep, setSelectedStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const step = vanguardSteps[selectedStep];

  const handleStepClick = (index: number) => {
    setSelectedStep(index);
    setSelectedImage(0);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowModal(true);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % step.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + step.images.length) % step.images.length);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
        Tahapan Operasi Vanguard Premier Total Knee
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3 max-h-[75vh] overflow-y-auto px-1 space-y-2">
          {vanguardSteps.map((s, index: number) => (
            <button
              key={s.step}
              onClick={() => handleStepClick(index)}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-300 ${
                selectedStep === index
                  ? "bg-blue-100 border-blue-500 text-blue-900"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
            >
              <strong>
                {s.step}. {s.title}
              </strong>
            </button>
          ))}
        </div>

        <motion.div
          key={step.step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 w-full bg-white p-4 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-3">
            {step.step}. {step.title}
          </h3>
          <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-4">
            {step.description.map((point, i) => (
              <li key={i} className="transition-transform duration-200 hover:scale-[1.02]">
                <span dangerouslySetInnerHTML={{ __html: highlightKeywords(point) }} />
              </li>
            ))}
          </ul>
          {step.note && (
            <p className="text-sm italic text-yellow-800 bg-yellow-100 p-2 rounded mb-4">
              💡 Catatan: {step.note}
            </p>
          )}
          <div className="relative w-full h-[350px] rounded overflow-hidden border">
            {step.images?.length > 0 && step.images[selectedImage]?.startsWith("/") ? (
              <Image
                src={step.images[selectedImage]}
                alt={`Ilustrasi ${step.title}`}
                fill
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
                Gambar tidak tersedia
              </div>
            )}
            {step.images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 px-2 py-1 rounded">&larr;</button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 px-2 py-1 rounded">&rarr;</button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-3 text-center md:text-left">Video Animasi Vanguard:</h3>
        <div className="relative pt-[56.25%] h-0 rounded overflow-hidden">
          <iframe
            src="https://zimmerbiomet.tv/videos/1685/embed"
            frameBorder="0"
            className="absolute top-0 left-0 w-full h-full rounded"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">
                {step.step}. {step.title}
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                {step.description.map((point, i) => (
                  <li key={i} className="transition-transform duration-200 hover:scale-[1.02]">
                    <span dangerouslySetInnerHTML={{ __html: highlightKeywords(point) }} />
                  </li>
                ))}
              </ul>
              {step.note && (
                <p className="text-sm italic text-yellow-800 bg-yellow-100 p-2 rounded mb-4">
                  💡 Catatan: {step.note}
                </p>
              )}
              <div className="relative w-full h-64 rounded overflow-hidden border">
                {step.images?.length > 0 && step.images[selectedImage]?.startsWith("/") ? (
                  <Image
                    src={step.images[selectedImage]}
                    alt={`Ilustrasi ${step.title}`}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
                    Gambar tidak tersedia
                  </div>
                )}
                {step.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 px-2 py-1 rounded">&larr;</button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 px-2 py-1 rounded">&rarr;</button>
                  </>
                )}
              </div>
              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VanguardStepsGallery;
