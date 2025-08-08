'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Lock, EyeOff, ShieldCheck, ScrollText, Stethoscope, Image as ImageIcon, PackageSearch, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import Intertain from '@/components/Dasboards/DasboardAsistensi/DasboardPage';
import Asistensi from '@/components/Dasboards/Dasboard_Advance/DasboardPage';
import GaleryImage from '@/components/NEwGridImage';
import ManajemenStock from '@/components/stock/Stock';
import EmailSender from "@/components/EmailSender/EmailSenderPage";

type TabValue = 'intertain' | 'asistensi' | 'galeryimage' | 'stock' | "emailSender";

const tabConfig: {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  Component: React.ComponentType;
}[] = [
  { value: 'intertain', label: 'Intertain', icon: <ScrollText className="w-4 h-4" />, Component: Asistensi },
  { value: 'asistensi', label: 'Asistensi', icon: <Stethoscope className="w-4 h-4" />, Component: Intertain },
  { value: 'galeryimage', label: 'Galery Image', icon: <ImageIcon className="w-4 h-4" />, Component: GaleryImage },
  { value: 'stock', label: 'Manajemen Stock', icon: <PackageSearch className="w-4 h-4" />, Component: ManajemenStock },
  { value: "emailSender", label:'New Expance', icon: <Mail className="w-4 h-4" />, Component: EmailSender },
];

const CORRECT_PIN = '2104';

export default function AnimatedTabs() {
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === 'undefined') return 'intertain';
    const saved = localStorage.getItem('pinnedTab') as TabValue | null;
    return saved && ['asistensi', 'intertain', 'stock', 'galeryimage'].includes(saved) ? saved : 'intertain';
  });

  useEffect(() => {
    localStorage.setItem('pinnedTab', tab);
  }, [tab]);

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
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 w-full max-w-sm space-y-4 border border-gray-200 dark:border-gray-700"
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
    <motion.div className="max-w-[1900px] rounded-md mx-auto px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-200 dark:bg-gray-700 rounded-full p-1 mb-4">
          {tabConfig.map(({ value, label, icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full cursor-pointer whitespace-nowrap data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 transition"
            >
              {icon}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="mt-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Component />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
