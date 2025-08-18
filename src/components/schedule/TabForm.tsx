'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

// Impor komponen-komponen untuk konten tab
import FormTeamCard from "@/components/schedule/NewAddScheduleForm";
import FormTeamCardOld from "@/components/schedule/AddSchedlueForm";

// --- Konfigurasi ---

// Konfigurasi untuk setiap tab
const tabConfig = [
  { value: "FormNew", label: "Form List", Component: FormTeamCard },
  { value: "FormOld", label: "Form Card", Component: FormTeamCardOld },

] as const;

type TabValue = typeof tabConfig[number]['value'];

// --- Komponen Utama ---

export default function DashboardPage() {
  const [tab, setTab] = useState<TabValue>('FormNew');
  const [today, setToday] = useState('');

  // --- Efek Samping (Side Effects) ---

  useEffect(() => {
    // Memuat tab terakhir dari localStorage
    const savedTab = localStorage.getItem('pinnedTab') as TabValue | null;
    if (savedTab && tabConfig.some(t => t.value === savedTab)) {
      setTab(savedTab);
    }

    // Mengatur tanggal hari ini
    const now = new Date();
    setToday(now.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }));
  }, []);

  useEffect(() => {
    // Menyimpan tab aktif ke localStorage setiap kali berubah
    localStorage.setItem('pinnedTab', tab);
  }, [tab]);


  // --- Render Tampilan Dasbor ---

  return (
    <motion.div
      className="max-w-[1900px] rounded-md mx-auto px-4 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 mb-2">
        <Calendar className="w-4 h-4 mr-1" /> {today}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-200 dark:bg-gray-700 rounded-full p-1 mb-4">
          {tabConfig.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full cursor-pointer whitespace-nowrap data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 transition text-sm font-medium"
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
      transition={{ duration: 0.4 }}
    >
      <Component 
        isOpen={true} 
        onClose={() => console.log("close modal")} 
        onSuccess={() => console.log("success submit")} 
      />
    </motion.div>
  </TabsContent>
))}

    
      </Tabs>
    </motion.div>
  );
}