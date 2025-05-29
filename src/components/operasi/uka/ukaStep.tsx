import React, { useState } from 'react';
import Image from 'next/image';
import { ukaSteps } from './ukaSteps';
import { motion, AnimatePresence } from 'framer-motion';

const highlightKeywords = (text: string): string => {
  const keywords = ['Potong', 'Pasang', 'Gunakan', 'Masukkan', 'Cek', 'Keluarkan', 'Bor', 'Isi'];
  let result = text;
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})`, 'gi');
    result = result.replace(regex, `<span class="font-semibold text-blue-700">$1</span>`);
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6">
        Tahapan UKA Oxford Partial Knee Microplasty
      </h2>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        <div className="md:w-1/3 space-y-2 max-h-[60vh] md:max-h-[75vh] overflow-y-auto px-1">
          {ukaSteps.map((s: { Step: string; Tahapan: string; Deskripsi: string }, index: number) => (
            <button
              key={s.Step}
              onClick={() => handleStepClick(index)}
              className={`w-full text-left p-3 rounded-lg border text-sm sm:text-base transition-all duration-300 ${
                selectedStep === index
                  ? 'bg-blue-100 border-blue-500 text-blue-900'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <strong>{s.Step}. {s.Tahapan}</strong>
            </button>
          ))}
        </div>

        <motion.div
          key={step.Step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 w-full bg-white p-4 sm:p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg sm:text-xl font-semibold mb-3">{step.Step}. {step.Tahapan}</h3>
          <ul className="list-disc pl-5 text-gray-700 text-sm sm:text-base space-y-1 mb-4">
            {step.Deskripsi.split(',').map((point: string, i: number) => (
              point.trim() && (
                <li key={i}>
                  🔹{' '}
                  <span dangerouslySetInnerHTML={{ __html: highlightKeywords(point.trim()) }} />
                </li>
              )
            ))}
          </ul>
          <div className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] rounded overflow-hidden border">
            <Image
              src={imageUrl}
              alt={`Ilustrasi ${step.Tahapan}`}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </motion.div>
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
              <h3 className="text-lg font-semibold mb-3">{step.Step}. {step.Tahapan}</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                {step.Deskripsi.split(',').map((point: string, i: number) => (
                  point.trim() && (
                    <li key={i}>
                      🔹{' '}
                      <span dangerouslySetInnerHTML={{ __html: highlightKeywords(point.trim()) }} />
                    </li>
                  )
                ))}
              </ul>
              <div className="relative w-full h-64 rounded overflow-hidden border">
                <Image
                  src={imageUrl}
                  alt={`Ilustrasi ${step.Tahapan}`}
                  fill
                  style={{ objectFit: 'contain' }}
                />
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

export default UkaStepsGallery;
