"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/button-darkmode";
import {
  Quote,
  BookOpen,
  Layers,
  Package,
  Wallet,
  Mail,
  Image as ImageIcon,
  History,
  User,
  StarIcon,
} from "lucide-react";

/* ================= IMPORT CONTENT (LOCAL TABS ONLY) ================= */
import DigitalTemplatingPage from "@/components/digitalTemplating/digitalTemplatingViewer";
import LandingPage from "@/app/kasus/page";
import EmailSenderTeam from "@/components/schedule/page";
import Dashboard from "@/components/Dasboards/DashboardPersonal";
import RiwayatOperasi from "@/components/RiwayatOperasi";
import StockPage from "@/components/stock/NoEditStockTablePremium";
import EmailSender from "@/components/EmailSender/EmailSenderPage";

/* ================= COPY ================= */
const t = {
  title: "Catatan Operasi",
  subtitle:
    "Teknik bedah, templating, stok implan, pengeluaran, dan manajemen operasi dalam satu dashboard.",
  welcomeLoading: "Memuat kutipan inspiratif…",
  fallbackAuthor: "Winston Churchill",
  fallbackQuote_en:
    "Success is the ability to go from failure to failure without loss of enthusiasm.",
  fallbackQuote_id:
    "Kesuksesan adalah kemampuan melewati kegagalan tanpa kehilangan antusiasme.",
};

/* ================= LOCAL TAB CONFIG ================= */
const tabItems = [
  { value: "templating", label: "Templating", icon: Layers, component: <DigitalTemplatingPage /> },
  { value: "stok", label: "Stok Implan", icon: Package, component: <StockPage /> },
  { value: "expense", label: "Pengeluaran", icon: Wallet, component: <EmailSender /> },
  { value: "emailTeam", label: "Email Team", icon: Mail, component: <EmailSenderTeam /> },
  { value: "case", label: "Studi Kasus", icon: ImageIcon, component: <LandingPage /> },
  { value: "history", label: "Riwayat", icon: History, component: <RiwayatOperasi /> },
  { value: "personal", label: "Personal", icon: User, component: <Dashboard /> },
];

/* ================= WELCOME VIEW ================= */
const WelcomeView = () => {
  const [quote, setQuote] = useState({
    content_en: "",
    content_id: "",
    author: "",
  });
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote");
      const data = await res.json();
      setQuote(data);
    } catch {
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

  return (
    <motion.div
      className="rounded-2xl border bg-gradient-to-br from-background to-muted p-8 shadow-lg"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div ref={ref} className="mx-auto max-w-3xl text-center">
        <Quote className="mx-auto mb-6 h-10 w-10 text-primary opacity-80" />
        {loading ? (
          <p className="text-muted-foreground">{t.welcomeLoading}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xl font-medium italic">
              “{quote.content_en}”
            </p>
            <p className="text-muted-foreground italic">
              “{quote.content_id}”
            </p>
            <p className="pt-2 font-semibold text-primary">
              ~ {quote.author}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ================= MAIN PAGE ================= */
export default function Home() {
  const pathname = usePathname();
  const isBelajarkuActive = pathname.startsWith("/belajarku");

  const [activeTab, setActiveTab] = useState<string | null>(null);

  // 🔔 highlight khusus Belajarku
  const [highlightBelajarku, setHighlightBelajarku] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHighlightBelajarku(false), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6">
      {/* ================= HEADER ================= */}
      <motion.div
        className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card/80 p-4 backdrop-blur md:flex-row md:items-center md:justify-between"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t.title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t.subtitle}
          </p>
        </div>
        <ThemeToggle />
      </motion.div>

      {/* ================= TABS + LINK ================= */}
      <Tabs value={activeTab ?? ""} onValueChange={setActiveTab}>
        <ScrollArea className="mb-5 rounded-xl border bg-card">
          <TabsList className="flex gap-2 p-2">
            {/* ===== BELAJARKU (NEXT LINK) ===== */}
            <motion.div
              className="relative"
              animate={
                highlightBelajarku && !isBelajarkuActive
                  ? { y: [0, -4, 0], scale: [1, 1.05, 1] }
                  : {}
              }
              transition={{
                duration: 2.6,
                repeat: highlightBelajarku && !isBelajarkuActive ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              {(highlightBelajarku || isBelajarkuActive) && (
                <span
                  className={`absolute -inset-1 rounded-xl blur-lg ${
                    isBelajarkuActive
                      ? "bg-primary/40"
                      : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-60"
                  }`}
                />
              )}

              <Link
                href="/belajarku"
                onClick={() => setHighlightBelajarku(false)}
                className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition
                  ${
                    isBelajarkuActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  }
                `}
              >
                <BookOpen className="h-4 w-4" />
                Belajarku
                {!isBelajarkuActive && highlightBelajarku && (
                  <span className="ml-1 rounded-lg bg-indigo-600 px-2 py-0.5 text-[10px] text-white">
                    <StarIcon className="h-3 w-3" />
                  </span>
                )}
              </Link>
            </motion.div>

            {/* ===== LOCAL TABS ===== */}
            {tabItems.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                onClick={() => setActiveTab(value)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm
                  data-[state=active]:bg-primary
                  data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* ================= CONTENT ================= */}
        {activeTab === null ? (
          <WelcomeView />
        ) : (
          tabItems.map(({ value, component }) => (
            <TabsContent key={value} value={value}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
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
