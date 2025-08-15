"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/button-darkmode";
import { RefreshCw, Quote, Share2 } from "lucide-react";
import { toBlob } from 'html-to-image';

// 📂 Import Halaman/Komponen untuk Konten Tab
import DigitalTemplatingPage from "@/components/digitalTemplating/PACSviewer";
import LandingPage from "@/app/kasus/page";
import Belajarku from "@/components/Dasboards/DashBelajar";
import Dashboard from "@/components/Dasboards/DashboardPersonal";
import RiwayatOperasi from "@/components/RiwayatOperasi";
import StockPage from "@/components/stock/stokNoEdit";
import EmailSender from "@/components/EmailSender/EmailSenderPage";

// 📚 Teks UI dalam Bahasa Indonesia
const t = {
    title: "Catatan Operasi",
    subtitle: "Teknik bedah berdasarkan jenis tindakan: THR, UKA, Persona, Vanguard, dan Templating.",
    welcomeLoading: "Memuat kata-kata bijak...",
    welcomeButton: "Kutipan Baru",
    shareButton: "Bagikan",
    sharingText: "Mempersiapkan...",
    shareError: "Oops, gagal membagikan gambar.",
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
};

// 🎯 Konfigurasi Item Tab
const tabItems = [
    { value: "belajarku", label: t.tabBelajarku, component: <Belajarku /> },
    { value: "digitalTemplating", label: t.tabTemplating, component: <DigitalTemplatingPage /> },
    { value: "stok", label: t.tabStok, component: <StockPage /> },
    { value: "emailSender", label: t.tabExpance, component: <EmailSender /> },
    { value: "landingPage", label: t.tabCaseStudy, component: <LandingPage /> },
    { value: "RiwayatOperasi", label: t.tabRiwayat, component: <RiwayatOperasi /> },
    { value: "Dashboard", label: t.tabPersonal, component: <Dashboard /> },
];

// ✨ Komponen Halaman Sambutan (WelcomeView) - VERSI RESPONSIF
const WelcomeView = () => {
  const [quote, setQuote] = useState({ content_en: "", content_id: "", author: "" });
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
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
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleShare = useCallback(async () => {
    if (!quoteRef.current) return;

    setIsSharing(true);
    try {
      const blob = await toBlob(quoteRef.current, { quality: 0.95 });
      if (!blob) return;

      const file = new File([blob], "kutipan-bijak.png", { type: "image/png" });
      const shareData = {
        files: [file],
        title: "Kutipan Bijak",
        text: `"${quote.content_id}" - ${quote.author}`,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'kutipan-bijak.png';
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error("Gagal membagikan gambar:", error);
      alert(t.shareError);
    } finally {
      setIsSharing(false);
    }
  }, [quote]);

  return (
    <motion.div
      key="welcome-view"
      // ✅ CSS Dirapikan untuk centering dan padding responsif
      className="flex flex-col items-center justify-center text-center p-4 md:p-8 border rounded-lg bg-card min-h-[400px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ✅ Wrapper untuk konten utama agar bisa diatur lebarnya */}
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl">
        <div ref={quoteRef} className="p-4 bg-card w-full">
          <Quote className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-6 mx-auto" />
          {loading ? (
            <p className="text-muted-foreground">{t.welcomeLoading}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-lg md:text-2xl font-medium italic">
                ”{quote.content_en}”
              </p>
              <p className="text-base md:text-xl font-medium text-muted-foreground italic">
                ”{quote.content_id}”
              </p>
              <p className="text-md md:text-lg font-semibold text-primary pt-2">~ {quote.author}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ Tombol diletakkan di bagian bawah */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={fetchQuote}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          disabled={loading || isSharing}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.welcomeButton}
        </button>
        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          disabled={loading || isSharing}
        >
          <Share2 className={`w-4 h-4 ${isSharing ? 'animate-pulse' : ''}`} />
          {isSharing ? t.sharingText : t.shareButton}
        </button>
      </div>
    </motion.div>
  );
};

// 🏠 Komponen Halaman Utama
export default function Home() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  return (
    <div className="w-full px-4 md:px-6 py-6 bg-background text-foreground transition-colors">
      {/* 🏷️ Header */}
      <motion.div
        className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl mb-1">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base max-w-2xl">
            {t.subtitle}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <ThemeToggle />
        </div>
      </motion.div>

      {/* 📌 Navigasi Tab */}
      <Tabs 
        value={activeTab ?? ""} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-4 bg-card">
          <TabsList className="inline-flex h-auto p-2 gap-2 bg-muted">
            {tabItems.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="whitespace-nowrap px-4 py-2 text-sm rounded-md transition-all 
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  hover:bg-accent hover:text-accent-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* 📄 Konten Tab atau Halaman Sambutan */}
        {activeTab === null ? (
          <WelcomeView />
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