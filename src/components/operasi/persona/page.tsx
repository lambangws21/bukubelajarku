// app/components/SurgicalStepsPersona.tsx
'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Highlight keywords with support for Dark Mode
const highlightKeywords = (text: string): string => {
  const keywords = [
    'Potong', 'Pasang', 'Gunakan', 'Masukkan', 'Cek',
    'Keluarkan', 'Bor', 'Isi', 'Atur', 'Ukur',
    'Tentukan', 'Lakukan'
  ];
  let result = text;
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})`, 'gi');
    result = result.replace(
      regex,
      `<span class="font-semibold text-blue-700 dark:text-blue-300">$1</span>`
    );
  });
  return result;
};

const SurgicalStepsPersona: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const step = steps[selectedStep];
  const imageUrl = `/persona_images/persona_step_${selectedStep + 1}.png`;

  const handleStepClick = (index: number): void => {
    setSelectedStep(index);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowModal(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
        Tahapan Teknik Bedah Persona® The Personalized Knee
      </h2>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        {/** Sidebar Steps **/}
        <div className="md:w-1/3 space-y-2 max-h-[60vh] md:max-h-[75vh] overflow-y-auto px-1">
          {steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => handleStepClick(index)}
              className={`
                w-full text-left p-3 rounded-lg border text-sm sm:text-base transition-all duration-300
                ${
                  selectedStep === index
                    ? 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:border-blue-300 dark:text-blue-100'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <strong>
                {s.id}. {s.title}
              </strong>
            </button>
          ))}
        </div>

        {/** Detail Panel (desktop) **/}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block md:w-2/3 w-full bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg dark:shadow-xl transition-colors duration-300"
        >
          <h3 className="text-lg sm:text-xl font-semibold mb-3">
            {step.id}. {step.title}
          </h3>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-sm sm:text-base space-y-1 mb-4">
            {step.details.map((point: string, i: number) =>
              point.trim() ? (
                <li key={i} className="transition-transform duration-200 hover:scale-[1.02]">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywords(point.trim()),
                    }}
                  />
                </li>
              ) : null
            )}
          </ul>
          {step.note && (
            <p className="text-sm italic text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900 p-2 rounded mb-4">
              💡 Catatan: {step.note}
            </p>
          )}
          <div className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] rounded overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={imageUrl}
              alt={`Ilustrasi ${step.title}`}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </motion.div>
      </div>

      {/** Video Section **/}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-3 text-center md:text-left">
          Video Edukasi Animasi:
        </h3>
        <div className="relative pt-[56.25%] h-0 rounded overflow-hidden">
          <iframe
            src="https://zimmerbiomet.tv/videos/1665/embed"
            frameBorder="0"
            className="absolute top-0 left-0 w-full h-full rounded"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/** Modal (mobile) **/}
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
                {step.id}. {step.title}
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4">
                {step.details.map((point: string, i: number) =>
                  point.trim() ? (
                    <li
                      key={i}
                      className="transition-transform duration-200 hover:scale-[1.02]"
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywords(point.trim()),
                        }}
                      />
                    </li>
                  ) : null
                )}
              </ul>
              {step.note && (
                <p className="text-sm italic text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900 p-2 rounded mb-4">
                  💡 Catatan: {step.note}
                </p>
              )}
              <div className="relative w-full h-64 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={imageUrl}
                  alt={`Ilustrasi ${step.title}`}
                  fill
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

const steps = [
  {
    id: 1,
    title: "Persiapan Praoperasi",
    details: [
      "Persiapan radiografi: foto berdiri anteroposterior 36 atau 53 inci serta lateral dan sunrise view patella.",
      "Evaluasi sudut antara sumbu anatomis dan mekanis menggunakan template overlay.",
      "Pilih pendekatan: midvastus, subvastus, atau parapatellar medial arthrotomy.",
      "Tentukan apakah patella akan dievert atau disubluksasi."
    ],
    note: "Patella dapat dipotong ulang nanti jika diperlukan untuk keseimbangan jaringan lunak."
  },
  {
    id: 2,
    title: "Reseksi Distal Femur",
    details: [
      "Pasang IM rod ke pegangan modular dan set sudut valgus sesuai sisi (kiri/kanan).",
      "Atur kedalaman reseksi 10–14 mm menggunakan tower adjustable.",
      "Kunci posisi terhadap epicondylar axis untuk orientasi reseksi yang akurat.",
      "Pasang dan kunci cutting guide, lalu lakukan reseksi distal femur."
    ],
    note: "Gunakan drop rod untuk verifikasi alignment terhadap axis mekanik."
  },
  {
    id: 3,
    title: "Reseksi Proksimal Tibia",
    details: [
      "Pasang panduan EM alignment dari pergelangan kaki ke proksimal tibia.",
      "Atur slope pemotongan (3° untuk PS, 5–7° untuk UC, 5° untuk MC).",
      "Gunakan stylus 2 mm atau 10 mm untuk menentukan level reseksi berdasarkan kondilus tibia.",
      "Lakukan reseksi menggunakan gergaji oscillating."
    ],
    note: "Pastikan pemotongan datar untuk kontak implan yang optimal."
  },
  {
    id: 4,
    title: "Penentuan Ukuran dan Rotasi Eksternal Femur",
    details: [
      "Gunakan anterior referencing sizer dan posisikan terhadap condyl posterior serta Whiteside line.",
      "Tentukan rotasi eksternal (3° atau 5°) dan ukuran femur."
    ],
    note: "Hindari notching dengan memposisikan boom pada area tertinggi femur."
  },
  {
    id: 5,
    title: "Reseksi A/P dan Chamfer Femoral",
    details: [
      "Pasang panduan 4-in-1 ke femur dengan pin sebelumnya.",
      "Lakukan reseksi: anterior, posterior, anterior chamfer, dan posterior chamfer.",
      "Gunakan shift block jika diperlukan untuk penyesuaian rotasi."
    ],
    note: "Urutan pemotongan disarankan: anterior → posterior → posterior chamfer → anterior chamfer."
  },
  {
    id: 6,
    title: "Ukuran dan Rotasi Tibia",
    details: [
      "Pilih plat tibial yang sesuai untuk coverage tanpa overhang.",
      "Rotasi disesuaikan dengan tuberositas tibial dan PCL."
    ],
    note: "Pastikan plate tidak mengalami medialisasi berlebihan."
  },
  {
    id: 7,
    title: "Drilling dan Broaching Tibia",
    details: [
      "Gunakan panduan pengeboran tibia dan bor ke kedalaman yang ditentukan (sesuai ukuran).",
      "Lanjutkan dengan broaching menggunakan handle broach sesuai ukuran yang sudah dikunci."
    ],
    note: "Pastikan alat broach sejajar dan tidak miring saat pemukulan."
  },
  {
    id: 8,
    title: "Reseksi dan Finishing Patela",
    details: [
      "Ukur ketebalan patella, buat resection flat menggunakan osteotomy guide.",
      "Tentukan ukuran dan lakukan pengeboran lubang peg sesuai patella prosthesis."
    ],
    note: "Minimal sisa tulang patella 10 mm untuk menghindari perforasi peg."
  },
  {
    id: 9,
    title: "Trial dan Finishing Femoral CR",
    details: [
      "Pasang femoral provisional (CR/MC/UC sesuai kondisi PCL).",
      "Uji posisi, rentang gerak, dan lakukan pengeboran peg hole jika sesuai."
    ],
    note: "Hindari pukulan langsung pada flange anterior selama pemasangan."
  },
  {
    id: 10,
    title: "Penutupan Insisi",
    details: [
      "Setelah semua implan diuji dan diverifikasi, lakukan penutupan luka sesuai standar."
    ],
    note: "Periksa kembali semua pin dan alat sudah dilepas sebelum closure."
  },
  {
    id: 11,
    title: "Catatan dan Tips",
    details: [
      "CPS digunakan jika dibutuhkan stabilitas tambahan (varus/valgus).",
      "Jangan gunakan PS component pada PCL yang masih utuh.",
      "Lakukan verifikasi potongan agar permukaan reseksi rata dan kontak implan maksimal."
    ],
    note: "Gunakan instrument sesuai instruksi produsen dan teknik masing-masing komponen."
  }
];

export default SurgicalStepsPersona;
