// src/components/AnimatedTabs.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import Intertain from '@/components/Dasboards/DasboardIntertain/DasboardPage';
import Asistensi from '@/components/Dasboards/DasboardAdvance/DasboardPage';
import ManajemenStock from '@/components/stock/Stock';

// Configuration for tabs
type TabValue = 'intertain' | 'asistensi' | 'stock';
const tabConfig: { value: TabValue; label: string; Component: React.ComponentType }[] = [
  { value: 'intertain', label: 'Intertain', Component:  Asistensi },
  { value: 'asistensi', label: 'Asistensi', Component:  Intertain },
  { value: 'stock', label: 'Manajemen Stock', Component: ManajemenStock },
];

export default function AnimatedTabs() {
  // State for active tab, persisted in localStorage
  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === 'undefined') return 'intertain';
    const saved = localStorage.getItem('pinnedTab') as TabValue | null;
    return saved && ['asistensi','intertain','stock'].includes(saved) ? saved : 'intertain';
  });
  useEffect(() => {
    localStorage.setItem('pinnedTab', tab);
  }, [tab]);

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Tab Triggers */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-200 dark:bg-gray-700 rounded-full p-1">
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

        {/* Tab Contents */}
        {tabConfig.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="mt-4">
            <Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
