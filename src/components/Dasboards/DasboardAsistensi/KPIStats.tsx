'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface KPIStatsProps {
  entries: number;
  total: number;
  avg: number;
}

const KPIStats: React.FC<KPIStatsProps> = ({ entries, total, avg }) => {
  const stats = [
    { label: 'Entries', value: entries.toString() },
    { label: 'Total', value: `Rp ${total.toLocaleString()}` },
    { label: 'Average', value: `Rp ${avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      transition={{ delay: 0.2 }}
    >
      {stats.map((c, idx) => (
        <motion.div
          key={c.label + idx}
          className="p-4 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-lg shadow flex flex-col"
          whileHover={{ scale: 1.03 }}
        >
          <span className="uppercase text-xs sm:text-sm opacity-75">{c.label}</span>
          <span className="text-2xl sm:text-3xl font-bold mt-1">{c.value}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default KPIStats;
