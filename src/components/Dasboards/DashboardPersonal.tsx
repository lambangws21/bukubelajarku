'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Lock, EyeOff, ShieldCheck, ScrollText, Stethoscope, Image as ImageIcon, PackageSearch, Mail, Calendar, Paperclip, User } from 'lucide-react';
import { motion } from 'framer-motion';

import Intertain from '@/components/Dasboards/DasboardAsistensi/DasboardPage';
import Asistensi from '@/components/Dasboards/Dasboard_Advance/DasboardPage';
import GaleryImage from '@/components/NEwGridImage';
import ManajemenStock from '@/components/stock/new-stock/StockTablePremium';
import EmailSender from "@/components/EmailSender/EmailSenderPage";
import ImageGrideA4 from "@/components/NewGirdeImageA4";

type TabValue = 'intertain' | 'asistensi' | 'galeryimage' | 'ImageGirdeA4' | 'stok' | "emailSender";

const tabConfig = [
  { value: 'intertain', label: 'Intertain', icon: <ScrollText className="w-4 h-4" />, Component: Asistensi },
  { value: 'asistensi', label: 'Asistensi', icon: <Stethoscope className="w-4 h-4" />, Component: Intertain },
  { value: 'galeryimage', label: 'Galery Image', icon: <ImageIcon className="w-4 h-4" />, Component: GaleryImage },
  { value: 'ImageGirdeA4', label: 'Image Gride A4', icon: <Paperclip className="w-4 h-4" />, Component: ImageGrideA4 },
  { value: 'stok', label: 'Manajemen Stock', icon: <PackageSearch className="w-4 h-4" />, Component: ManajemenStock },
  { value: "emailSender", label: 'New Expance', icon: <Mail className="w-4 h-4" />, Component: EmailSender },
] as const;

const CORRECT_USERNAME = 'lambang21';
const CORRECT_PIN = '2104';

export default function AnimatedTabs() {
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === 'undefined') return 'intertain';
    const saved = localStorage.getItem('pinnedTab') as TabValue | null;
    return saved && tabConfig.some(t => t.value === saved) ? saved : 'intertain';
  });

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
 

  useEffect(() => {
    localStorage.setItem('pinnedTab', tab);
  }, [tab]);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === CORRECT_USERNAME && pin === CORRECT_PIN) {
      setAuthorized(true);
      setError('');
    } else {
      setError('Username atau PIN salah.');
    }
  };

  // Reset akses saat reload
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
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 w-full max-w-sm space-y-5 border -mt-52 border-gray-200 dark:border-gray-700 "
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-bold text-center">Login Akses Dashboard</h2>
          </div>

          {/* Username input */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan Username"
                className="w-full pl-10 pr-4 py-2 border rounded-md text-black dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>
          </motion.div>

          {/* PIN input */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN"
                className="w-full pl-10 pr-4 py-2 border rounded-md text-black dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              className="flex items-center text-sm text-red-500 gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <EyeOff className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Button */}
          <motion.button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition"
            whileTap={{ scale: 0.97 }}
          >
            <ShieldCheck className="w-5 h-5" />
            Masuk
          </motion.button>
        </motion.form>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-[1900px] rounded-md mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 🗓 Tanggal Hari Ini */}
      <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 mb-2">
        <Calendar className="w-4 h-4 mr-1" />
        {today}
      </div>

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
