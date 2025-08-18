'use client';
import type { Schedule } from '@/types/schedule';
import { motion, Variants } from 'framer-motion';
import { Hospital, Stethoscope, Edit3, Trash2, Users } from 'lucide-react';
import React from 'react';

// --- Props untuk ActionButton ---
type ActionButtonProps = {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  colorClass: string;
  hoverColorClass: string;
};

// --- Variants untuk animasi card ---
const cardVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 15 },
  },
};

// --- Tombol Aksi Kustom ---
const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, text, colorClass, hoverColorClass }) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-center h-9 w-9 rounded-full ${colorClass} text-white shadow-lg transition-all duration-300 ease-in-out hover:w-28 ${hoverColorClass}`}
  >
    {icon}
    <span className="absolute left-11 scale-0 rounded-md bg-gray-900 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
      {text}
    </span>
  </button>
);

// --- ScheduleCard Component ---
export function ScheduleCard({ schedule, onEdit, onDelete }: {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (submissionId: number) => void;
}) {
  const operationDate = new Date(schedule['Tanggal Operasi']);
  const day = operationDate.getDate();
  const month = operationDate.toLocaleDateString('id-ID', { month: 'short' });

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 border-2 border-gray-200/60 shadow-lg backdrop-blur-md transition-shadow duration-300 hover:shadow-2xl dark:bg-gray-900/80"
    >
      {/* --- Header Tanggal --- */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-md">
        <span className="text-6xl font-extrabold drop-shadow-sm">{day}</span>
        <span className="text-md font-semibold uppercase tracking-wide]">{month}</span>
      </div>

      {/* --- Body Card --- */}
      <div className="flex flex-grow flex-col p-5">
        <div className="flex-grow space-y-3">
          <div className="flex items-start gap-3">
            <Hospital className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
            <h3 className="text-2xl font-bold text-blue-800 dark:text-white break-words">
              {schedule['Hospital']}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5 flex-shrink-0 text-gray-500" />
            <p className="text-md font-bold text-gray-700 dark:text-gray-300">
              Dokter: {schedule['Operator']}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 flex-shrink-0 text-gray-500" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {schedule['Team TS']}
            </p>
          </div>

          {/* --- Keterangan --- */}
          {schedule['Keterangan'] && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
              <p className="text-xs italic text-gray-600 dark:text-gray-400">
                {schedule['Keterangan']}
              </p>
            </div>
          )}
        </div>

        {/* --- Tombol Aksi --- */}
        <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <ActionButton
            onClick={() => onEdit(schedule)}
            icon={<Edit3 size={18} />}
            text="Edit"
            colorClass="bg-yellow-500"
            hoverColorClass="hover:bg-yellow-600"
          />
          <ActionButton
            onClick={() => onDelete(schedule['Submission ID'])}
            icon={<Trash2 size={18} />}
            text="Hapus"
            colorClass="bg-red-500"
            hoverColorClass="hover:bg-red-600"
          />
        </div>
      </div>
    </motion.div>
  );
}
