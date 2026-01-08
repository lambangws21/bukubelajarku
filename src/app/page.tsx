"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Lock,
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

/* ================= TAB TYPES ================= */
type TabItem = {
  value: string;
  label: string;
  icon: React.ElementType;
  component: React.ReactNode;
  protected?: boolean;
};

/* ================= TAB CONFIG ================= */
const TAB_ITEMS: TabItem[] = [
  // ✅ PUBLIC
  {
    value: "templating",
    label: "Templating",
    icon: Layers,
    component: <DigitalTemplatingPage />,
    protected: false,
  },
  {
    value: "case",
    label: "Studi Kasus",
    icon: ImageIcon,
    component: <LandingPage />,
    protected: false,
  },

  // 🔒 PROTECTED
  {
    value: "expense",
    label: "Pengeluaran",
    icon: Wallet,
    component: <EmailSender />,
    protected: true,
  },
  {
    value: "emailTeam",
    label: "Email Team",
    icon: Mail,
    component: <EmailSenderTeam />,
    protected: true,
  },
  {
    value: "history",
    label: "Riwayat",
    icon: History,
    component: <RiwayatOperasi />,
    protected: true,
  },
  {
    value: "stok",
    label: "Stok Implan",
    icon: Package,
    component: <StockPage />,
    protected: true,
  },
  {
    value: "personal",
    label: "Personal",
    icon: User,
    component: <Dashboard />,
    protected: true,
  },
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
      const data: { content_en: string; content_id: string; author: string } =
        await res.json();
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
            <p className="text-xl font-medium italic">“{quote.content_en}”</p>
            <p className="text-muted-foreground italic">“{quote.content_id}”</p>
            <p className="pt-2 font-semibold text-primary">~ {quote.author}</p>
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
    const timer = window.setTimeout(() => setHighlightBelajarku(false), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  // 🔒 akses
  const ACCESS_CODE = process.env.NEXT_PUBLIC_DASH_ACCESS_CODE ?? "2104";
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [openGate, setOpenGate] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const publicTabs = useMemo(
    () => TAB_ITEMS.filter((x) => !x.protected),
    []
  );
  const protectedTabs = useMemo(
    () => TAB_ITEMS.filter((x) => x.protected),
    []
  );

  const visibleTabs = useMemo(() => {
    return isUnlocked ? [...publicTabs, ...protectedTabs] : publicTabs;
  }, [isUnlocked, publicTabs, protectedTabs]);

  const tryUnlock = useCallback(() => {
    const trimmed = code.trim();
    if (!ACCESS_CODE) {
      setCodeError("Kode akses belum diset di .env.local");
      return;
    }
    if (trimmed === ACCESS_CODE) {
      setIsUnlocked(true);
      setOpenGate(false);
      setCode("");
      setCodeError(null);
    } else {
      setCodeError("Kode salah. Coba lagi.");
    }
  }, [code, ACCESS_CODE]);

  const onTabClick = useCallback(
    (value: string) => {
      const found = TAB_ITEMS.find((x) => x.value === value);
      if (!found) return;

      if (found.protected && !isUnlocked) {
        setOpenGate(true);
        setCodeError(null);
        return;
      }

      setActiveTab(value);
    },
    [isUnlocked]
  );

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

            {/* ===== ONLY SHOW PUBLIC TABS (Templating & Studi Kasus) ===== */}
            {visibleTabs.map(({ value, label, icon: Icon, protected: isProt }) => (
              <TabsTrigger
                key={value}
                value={value}
                onClick={() => onTabClick(value)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm
                  data-[state=active]:bg-primary
                  data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
                {isProt && !isUnlocked && <Lock className="h-3.5 w-3.5 opacity-70" />}
              </TabsTrigger>
            ))}

            {/* ===== BUTTON TO OPEN ACCESS GATE ===== */}
            {!isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  setOpenGate(true);
                  setCodeError(null);
                }}
                className="ml-1 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition"
                title="Masukkan kode untuk membuka menu lain"
              >
                <Lock className="h-4 w-4" />
                Kode Akses
              </button>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* ================= CONTENT ================= */}
        {activeTab === null ? (
          <WelcomeView />
        ) : (
          TAB_ITEMS.map(({ value, component }) => (
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

      {/* ================= ACCESS MODAL ================= */}
      {openGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-2xl border bg-card p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">Masukkan Kode Akses</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenGate(false);
                  setCode("");
                  setCodeError(null);
                }}
                className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Menu lain (Pengeluaran, Email Team, Riwayat, Stok Implan, Personal)
              terkunci.
            </p>

            <div className="mt-4 space-y-2">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") tryUnlock();
                }}
                placeholder="Kode akses…"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              {codeError && (
                <div className="text-xs text-red-500">{codeError}</div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={tryUnlock}
                className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95"
              >
                Buka
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenGate(false);
                  setCode("");
                  setCodeError(null);
                }}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
