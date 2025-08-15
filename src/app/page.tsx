"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/button-darkmode";
import { RefreshCw, Quote, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

// 📂 Import Halaman
import DigitalTemplatingPage from "@/components/digitalTemplating/PACSviewer";
import LandingPage from "@/app/kasus/page";
import Belajarku from "@/components/Dasboards/DashBelajar";
import Dashboard from "@/components/Dasboards/DashboardPersonal";
import RiwayatOperasi from "@/components/RiwayatOperasi";
import StockPage from "@/components/stock/stokNoEdit";
import EmailSender from "@/components/EmailSender/EmailSenderPage";

// 📚 Kamus Terjemahan untuk Teks UI
const translations = {
  en: {
    title: "Surgery Notes",
    subtitle: "Surgical techniques by action: THR, UKA, Persona, Vanguard, and Templating.",
    welcomeLoading: "Loading words of wisdom...",
    welcomeButton: "New Quote",
    tabBelajarku: "My Learning",
    tabTemplating: "Templating",
    tabStok: "Implant Stock",
    tabExpance: "New Expense",
    tabCaseStudy: "Case Study",
    tabRiwayat: "Operation History",
    tabPersonal: "Personal",
    fallbackAuthor: "Winston Churchill",
    fallbackQuote_en: "Success is the ability to go from failure to failure without loss of enthusiasm.",
    fallbackQuote_id: "Kesuksesan adalah kemampuan untuk melewati kegagalan tanpa kehilangan antusiasme.",
  },
  id: {
    title: "Catatan Operasi",
    subtitle: "Teknik bedah berdasarkan jenis tindakan: THR, UKA, Persona, Vanguard, dan Templating.",
    welcomeLoading: "Memuat kata-kata bijak...",
    welcomeButton: "Kutipan Baru",
    tabBelajarku: "Belajarku",
    tabTemplating: "Templating",
    tabStok: "Stok Implan",
    tabExpance: "Pengeluaran Baru",
    tabCaseStudy: "Studi Kasus",
    tabRiwayat: "Riwayat Operasi",
    tabPersonal: "Personal",
    fallbackAuthor: "Winston Churchill",
    fallbackQuote_en: "Success is the ability to go from failure to failure without loss of enthusiasm.",
    fallbackQuote_id: "Kesuksesan adalah kemampuan untuk melewati kegagalan tanpa kehilangan antusiasme.",
  },
};

const getTabItems = (lang: 'en' | 'id') => [
    { value: "belajarku", label: translations[lang].tabBelajarku, component: <Belajarku /> },
    { value: "digitalTemplating", label: translations[lang].tabTemplating, component: <DigitalTemplatingPage /> },
    { value: "stok", label: translations[lang].tabStok, component: <StockPage /> },
    { value: "emailSender", label: translations[lang].tabExpance, component: <EmailSender /> },
    { value: "landingPage", label: translations[lang].tabCaseStudy, component: <LandingPage /> },
    { value: "RiwayatOperasi", label: translations[lang].tabRiwayat, component: <RiwayatOperasi /> },
    { value: "Dashboard", label: translations[lang].tabPersonal, component: <Dashboard /> },
];

const WelcomeView = ({ lang }: { lang: 'en' | 'id' }) => {
  // State untuk menyimpan kedua versi kutipan
  const [quote, setQuote] = useState({ content_en: "", content_id: "", author: "" });
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      // Panggil API tanpa parameter bahasa
      const response = await fetch(`/api/quote`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setQuote({
        content_en: data.content_en,
        content_id: data.content_id,
        author: data.author,
      });
    } catch (error) {
      console.error("Gagal mengambil kutipan:", error);
      setQuote({
        content_en: t.fallbackQuote_en,
        content_id: t.fallbackQuote_id,
        author: t.fallbackAuthor,
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return (
    <motion.div
      key="welcome-view"
      className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card min-h-[300px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Quote className="w-12 h-12 text-muted-foreground mb-6" />
      {loading ? (
        <p className="text-muted-foreground">{t.welcomeLoading}</p>
      ) : (
        <div className="space-y-4">
          {/* Tampilkan Kutipan Bahasa Inggris */}
          <p className="text-xl md:text-2xl font-medium italic max-w-3xl">
            ”{quote.content_en}”
          </p>
          {/* Tampilkan Kutipan Bahasa Indonesia */}
          <p className="text-lg md:text-xl font-medium text-muted-foreground italic max-w-3xl">
            ”{quote.content_id}”
          </p>
          <p className="text-lg font-semibold text-primary pt-2">~ {quote.author}</p>
        </div>
      )}
      <button
        onClick={fetchQuote}
        className="mt-8 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        disabled={loading}
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {t.welcomeButton}
      </button>
    </motion.div>
  );
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'id'>('id');

  const t = translations[language];
  const tabItems = getTabItems(language);

  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === 'id' ? 'en' : 'id'));
  };

  return (
    <div className="w-full px-4 py-6 bg-background text-foreground transition-colors">
      <motion.div
        className="mb-6 flex flex-col md:flex-row items-start justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-1">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={toggleLanguage} variant="outline" size="icon" aria-label="Toggle language">
            <Languages className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <ThemeToggle />
        </div>
      </motion.div>

      <Tabs 
        value={activeTab ?? ""} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <ScrollArea className="overflow-x-auto rounded-md border mb-4 bg-card">
          <div className="flex w-max p-2">
            <TabsList className="flex gap-2 bg-muted rounded-md px-2">
              {tabItems.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="whitespace-nowrap px-4 py-2 rounded-md transition-all 
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {activeTab === null ? (
          <WelcomeView lang={language} />
        ) : (
          tabItems.map(({ value, component }) => (
            <TabsContent key={value} value={value}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {component}
              </motion.div>
            </TabsContent>
          ))
        )}
      </Tabs>
    </div>
  );
}