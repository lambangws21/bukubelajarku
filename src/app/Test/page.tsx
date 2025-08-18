'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Calendar, X } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Impor komponen form
import FormTeamCard from "@/components/schedule/NewAddScheduleForm";
import FormTeamCardOld from "@/components/schedule/AddSchedlueForm";

// --- Konfigurasi ---
const tabConfig = [
  { value: "FormNew", label: "Form List", Component: FormTeamCard },
  { value: "FormOld", label: "Form Card", Component: FormTeamCardOld },
] as const;

type TabValue = typeof tabConfig[number]['value'];

// --- Komponen Utama ---
export default function DashboardPage() {
  const [tab, setTab] = useState<TabValue>('FormNew');
  const [today, setToday] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const savedTab = localStorage.getItem('pinnedTab') as TabValue | null;
    if (savedTab && tabConfig.some(t => t.value === savedTab)) {
      setTab(savedTab);
    }

    const now = new Date();
    setToday(now.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem('pinnedTab', tab);
    setOpen(true);
  }, [tab]);

  const ActiveForm = tabConfig.find(t => t.value === tab)?.Component;

  return (
    <motion.div
      className="max-w-[1900px] mx-auto px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header tanggal */}
      <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 mb-4">
        <Calendar className="w-4 h-4 mr-1" /> {today}
      </div>

      {/* Tabs navigasi */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-6 shadow-sm">
          {tabConfig.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition 
              data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700
              data-[state=active]:shadow-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Modal tampil untuk tab aktif */}
        <TabsContent value={tab}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              className="max-w-3xl w-full h-[89%] sm:rounded-2xl rounded-none sm:shadow-2xl sm:my-6 p-0 overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-900"
              >
                <DialogHeader className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {tab === "FormNew" ? "Form List" : "Form Card"}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </Button>
                </DialogHeader>

                <div className="p-6">
                  {ActiveForm && (
                    <ActiveForm
                      isOpen={open}
                      onClose={() => setOpen(false)}
                      onSuccess={() => {
                        console.log("success submit");
                        setOpen(false);
                      }}
                      scheduleToEdit={null}
                    />
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
