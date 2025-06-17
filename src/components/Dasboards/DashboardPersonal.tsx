'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Lock, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import Intertain from '@/components/Dasboards/DasboardIntertain/DasboardPage';
import Asistensi from '@/components/Dasboards/DasboardAdvance/DasboardPage';
import ManajemenStock from '@/components/stock/Stock';

type TabValue = 'intertain' | 'asistensi' | 'stock';
const tabConfig: { value: TabValue; label: string; Component: React.ComponentType }[] = [
  { value: 'intertain', label: 'Intertain', Component: Asistensi },
  { value: 'asistensi', label: 'Asistensi', Component: Intertain },
  { value: 'stock', label: 'Manajemen Stock', Component: ManajemenStock },
];

const CORRECT_PIN = '2104';

export default function AnimatedTabs() {
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === 'undefined') return 'intertain';
    const saved = localStorage.getItem('pinnedTab') as TabValue | null;
    return saved && ['asistensi', 'intertain', 'stock'].includes(saved) ? saved : 'intertain';
  });

  useEffect(() => {
    localStorage.setItem('pinnedTab', tab);
  }, [tab]);

  // PIN logic — no localStorage so it always asks again
  const [pin, setPin] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setAuthorized(true);
    } else {
      setError('PIN salah, coba lagi.');
    }
  };

  // Lock on tab close/reload
  useEffect(() => {
    const handleUnload = () => setAuthorized(false);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  if (!authorized) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white px-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 w-full max-w-sm space-y-4 border border-gray-200 dark:border-gray-700"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-bold text-center">PIN Akses Dashboard</h2>
          </div>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Masukkan PIN"
            className="w-full px-4 py-2 border rounded-md text-black dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {error && (
            <div className="flex items-center text-sm text-red-500 gap-2">
              <EyeOff className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition"
          >
            <ShieldCheck className="w-5 h-5" />
            Masuk
          </button>
        </motion.form>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-200 dark:bg-gray-700 rounded-full p-1 mb-4">
          {tabConfig.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="inline-block px-4 py-2 rounded-full cursor-pointer whitespace-nowrap
                         data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 transition"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Component />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
