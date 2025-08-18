'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BoneIcon,
  Calendar,
  Hammer,
  Hospital,
  PencilIcon,
  Trash2Icon,
  X,
} from 'lucide-react';
import type { Schedule } from '@/types/schedule';

type OperationCardProps = {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: number) => void;
};

export default function OperationCard({ schedule, onEdit, onDelete }: OperationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Schedule>(schedule);

  // Format tanggal operasi
  const rawDate = schedule['Tanggal Operasi'];
  let formattedDate = 'Tanggal belum ditentukan';

  if (rawDate) {
    try {
      const date = new Date(rawDate);
      formattedDate = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      formattedDate = rawDate;
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onEdit(formData);
    setShowEditModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={() => setShowActions(!showActions)} // toggle untuk mobile
        className="relative group w-full max-w-md rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 shadow-lg overflow-hidden cursor-pointer"
      >
        {/* Floating action buttons */}
        <div
          className={`
            absolute top-3 right-3 flex gap-2 transition-opacity duration-300
            ${showActions ? 'opacity-100' : 'opacity-0'}
            group-hover:opacity-100
          `}
        >
          {/* Edit Button */}
          {/* <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg shadow-md transition-all"
          >
            <PencilIcon size={16} />
            <span className="hidden sm:inline text-xs">Edit</span>
          </motion.button> */}

          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(schedule['Submission ID']);
            }}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg shadow-md transition-all"
          >
            <Trash2Icon size={16} />
            <span className="hidden sm:inline text-xs">Hapus</span>
          </motion.button>
        </div>

        {/* Card Content */}
        <div className="flex items-center gap-2 p-1 w-full bg-red-300/10">
          <div className="flex items-center justify-center w-16 h-16 p-1 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white">
            <BoneIcon size={27} className="hover:animate-spin" />
          </div>
          <div className="flex flex-col">
            <span className="flex items-center text-xl font-bold text-gray-700 dark:text-gray-300 hover:text-green-400">
              <Hammer size={24} className="animate-bounce mr-2 text-green-400 rotate-19" />
             <p className='text-wrap'>  {schedule.Keterangan ?? 'Keterangan'}</p>
            </span>
            <span className="flex items-center text-lg font-bold text-gray-900 dark:text-white hover:text-blue-400">
              <Hospital size={22} className="animate-pulse mr-2 text-blue-400" />
              {schedule.Hospital ?? 'Rumah Sakit Tindakan'}
            </span>
            <span className="flex items-center text-md text-gray-500 dark:text-gray-400">
              <Calendar size={17} className="text-amber-300 mr-1" />
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="px-5 pb-3">
          <p className="text-gray-800 dark:text-white font-semibold">
            {schedule.Operator ?? 'Nama Dokter'}
          </p>
        </div>

        <div className="px-5 pb-5">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl px-4 py-2 shadow-md">
            <p className="text-white text-sm font-bold">Team Support :</p>
            {schedule['Team TS'] ?? 'Nama A, Nama B'}
          </div>
        </div>
      </motion.div>

      {/* Modal Edit */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Edit Jadwal Operasi
              </h2>

              <div className="space-y-3">
                <input
                  name="Keterangan"
                  value={formData.Keterangan || ''}
                  onChange={handleChange}
                  placeholder="Keterangan"
                  className="w-full border rounded p-2"
                />
                <input
                  name="Hospital"
                  value={formData.Hospital || ''}
                  onChange={handleChange}
                  placeholder="Rumah Sakit"
                  className="w-full border rounded p-2"
                />
                <input
                  name="Operator"
                  value={formData.Operator || ''}
                  onChange={handleChange}
                  placeholder="Dokter Operator"
                  className="w-full border rounded p-2"
                />
                <input
                  name="Team TS"
                  value={formData['Team TS'] || ''}
                  onChange={handleChange}
                  placeholder="Team Support"
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
