'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

import FormTeamCard from "@/components/schedule/NewAddScheduleForm";
import FormTeamCardOld from "@/components/schedule/AddSchedlueForm";

/* ================= CONFIG ================= */

const tabConfig = [
  { value: "FormNew", label: "Form List", Component: FormTeamCard },
  { value: "FormOld", label: "Form Card", Component: FormTeamCardOld },
] as const;

type TabValue = typeof tabConfig[number]['value'];

/* ================= PAGE ================= */

export default function TabForm() {
  /* ✅ INIT TAB DARI localStorage (NO useEffect) */
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === 'undefined') return "FormNew";

    const saved = localStorage.getItem('pinnedTab') as TabValue | null;
    return saved && tabConfig.some(t => t.value === saved)
      ? saved
      : "FormNew";
  });

  /* ✅ INIT TANGGAL LANGSUNG */
  const [today] = useState(() =>
    new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );

  return (
    <motion.div
      className="max-w-[1900px] rounded-md mx-auto px-4 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Tanggal */}
      <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 mb-2">
        <Calendar className="w-4 h-4 mr-1" /> {today}
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as TabValue;
          setTab(next);
          localStorage.setItem('pinnedTab', next); // ✅ SIDE EFFECT DI HANDLER
        }}
      >
        <TabsList className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-200 dark:bg-gray-700 rounded-full p-1 mb-4">
          {tabConfig.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="inline-flex items-center px-4 py-2 rounded-full cursor-pointer whitespace-nowrap
                         data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800
                         transition text-sm font-medium"
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
              <Component
                isOpen={true}
                onClose={() => {}}
                onSuccess={() => {}}
              />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
