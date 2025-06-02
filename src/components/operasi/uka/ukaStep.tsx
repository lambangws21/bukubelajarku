import React, { useState } from 'react';
import Image from 'next/image';
import { ukaSteps } from './ukaSteps';
import { motion, AnimatePresence } from 'framer-motion';

const highlightKeywords = (text: string): string => {
  const keywords = ['Potong', 'Pasang', 'Gunakan', 'Masukkan', 'Cek', 'Keluarkan', 'Bor', 'Isi'];
  let result = text;
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})`, 'gi');
    result = result.replace(
      regex,
      `<span class=\"font-semibold text-blue-700 dark:text-blue-300\">$1</span>`
    );
  });
  return result;
};

const UkaStepsGallery = () => {
  const [selectedStep, setSelectedStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const step = ukaSteps[selectedStep];
  const imageUrl = `/uka_images/uka_step_${selectedStep + 1}.png`;

  const handleStepClick = (index: number): void => {
    setSelectedStep(index);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowModal(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6">
        Tahapan UKA Oxford Partial Knee Microplasty
      </h2>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        {/* Sidebar Steps */}
        <div className="md:w-1/3 space-y-2 max-h-[60vh] md:max-h-[75vh] overflow-y-auto px-1">
          {ukaSteps.map((s, index: number) => (
            <button
              key={s.Step}
              onClick={() => handleStepClick(index)}
              className={`
                w-full text-left p-3 rounded-lg border text-sm sm:text-base transition-all duration-300
                ${
                  selectedStep === index
                    ? 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-300'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <strong>
                {s.Step}. {s.Tahapan}
              </strong>
            </button>
          ))}
        </div>

        {/* Detail Panel (desktop) */}
        <motion.div
          key={step.Step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 w-full bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg dark:shadow-xl transition-colors duration-300"
        >
          <h3 className="text-lg sm:text-xl font-semibold mb-3">
            {step.Step}. {step.Tahapan}
          </h3>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-sm sm:text-base space-y-1 mb-4">
            {step.Deskripsi.map((point: string, i: number) =>
              point.trim() ? (
                <li key={i} className="transition-transform duration-200 hover:scale-[1.02]">
                  <span dangerouslySetInnerHTML={{ __html: highlightKeywords(point.trim()) }} />
                </li>
              ) : null
            )}
          </ul>
          {step.Note && (
            <p className="text-sm italic text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900 p-2 rounded mb-4">
              💡 Catatan: {step.Note}
            </p>
          )}
          <div className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] rounded overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={imageUrl}
              alt={`Ilustrasi ${step.Tahapan}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
        </motion.div>
      </div>

      {/* Video Section */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-3 text-center md:text-left">
          Video Edukasi Animasi:
        </h3>
        <div className="relative pt-[56.25%] h-0 rounded overflow-hidden">
          <iframe
            src="https://zimmerbiomet.tv/videos/2235/embed"
            frameBorder="0"
            className="absolute top-0 left-0 w-full h-full rounded"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Modal (mobile) */}
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">
                {step.Step}. {step.Tahapan}
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4">
                {step.Deskripsi.map((point: string, i: number) =>
                  point.trim() ? (
                    <li
                      key={i}
                      className="transition-transform duration-200 hover:scale-[1.02]"
                    >
                      <span
                        dangerouslySetInnerHTML={{ __html: highlightKeywords(point.trim()) }}
                      />
                    </li>
                  ) : null
                )}
              </ul>
              {step.Note && (
                <p className="text-sm italic text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900 p-2 rounded mb-4">
                  💡 Catatan: {step.Note}
                </p>
              )}
              <div className="relative w-full h-64 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={imageUrl}
                  alt={`Ilustrasi ${step.Tahapan}`}
                  fill
                  sizes="(max-width: 480px) 100vw, 80vw"
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <button
                className="mt-4 w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
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

export default UkaStepsGallery;
