// components/Dasboards/DasboardAdvance/AdvanceStats.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface AdvanceData {
  totalBiaya: number;
  totalAdvance: number;
  selisih: number;
}

interface AdvanceStatsProps {
  advance: AdvanceData | null;
}

const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const AdvanceStats: React.FC<AdvanceStatsProps> = ({ advance }) => {
  if (!advance) return null;

  const { totalAdvance, selisih } = advance;

  const stats = [
    {
      label: 'Total Advance',
      value: formatRupiah(totalAdvance),
      color: 'text-green-500',
      icon: null,
    },
    {
      label: 'Selisih',
      value: formatRupiah(selisih),
      color: selisih < 0 ? 'text-red-500' : 'text-yellow-500',
      icon: selisih < 0 ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />,
    }
  ];

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      transition={{ delay: 0.2 }}
    >
      {stats.map((item, idx) => (
        <motion.div
          key={item.label + idx}
          className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between ${item.color}`}
          whileHover={{ scale: 1.03 }}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase text-xs sm:text-sm opacity-75 text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
            {item.icon && <div>{item.icon}</div>}
          </div>
          <span className={`text-2xl sm:text-3xl font-bold mt-1`}>{item.value}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AdvanceStats;