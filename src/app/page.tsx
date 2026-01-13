"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

/* ================= COPY ================= */
const t = {
  title: "Catatan Operasi",
  subtitle:
    "Catatan selama operasi, dokumentasi foto, dan penjelasan teknik bedah.",
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
  description: string;
  protected?: boolean;
};

/* ================= TAB CONFIG ================= */
const TAB_ITEMS: TabItem[] = [
  // ✅ PUBLIC
  {
    value: "templating",
    label: "Templating",
    icon: Layers,
    description: "Templating berbasis digital dan fisik untuk kebutuhan operasi.",
    protected: false,
  },
  {
    value: "case",
    label: "Studi Kasus",
    icon: ImageIcon,
    description: "Pantau kasus nyata tim bedah dengan timeline, outcome, dan dokumentasi foto.",
    protected: false,
  },

  // 🔒 PROTECTED
  {
    value: "expense",
    label: "Pengeluaran",
    icon: Wallet,
    description: "Catat biaya per operasi, pantau saldo, dan siapkan laporan keuangan cepat.",
    protected: true,
  },
  {
    value: "emailTeam",
    label: "Email Team",
    icon: Mail,
    description: "Kirim briefing pra-bedah, follow-up pasien, dan update ke seluruh tim.",
    protected: true,
  },
  {
    value: "history",
    label: "Riwayat",
    icon: History,
    description: "Lihat log akut, revisi checklist, dan catatan learning harian.",
    protected: true,
  },
  {
    value: "stok",
    label: "Stok Implan",
    icon: Package,
    description: "Inventaris implan, restock alert, dan histori penggunaan setiap tim.",
    protected: true,
  },
  {
    value: "personal",
    label: "Personal",
    icon: User,
    description: "Profil tiap dokter dan anggota tim dengan sertifikasi & jadwal.",
    protected: true,
  },
];

/* ================= ROUTE MAP =================
   Sesuaikan dengan route kamu di /app
   Contoh:
   - Templating: /templating (buat app/templating/page.tsx)
   - Studi kasus: /kasus (sudah ada di kode kamu)
   - Pengeluaran: /expense (dst)
*/
const TAB_ROUTES: Record<string, string> = {
  templating: "/template-digital",
  case: "/kasus",
  expense: "/expense",
  emailTeam: "/email-team",
  history: "/riwayat",
  stok: "/stok",
  personal: "/personal",
};

const heroHighlights = [
  "Template operasi siap pakai",
  "Mini catatan",
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

const TabCard = ({
  item,
  locked,
  isActive,
  onClick,
}: {
  item: TabItem;
  locked: boolean;
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex flex-col gap-1 overflow-hidden rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:ring-primary ${
        isActive
          ? "border-primary bg-gradient-to-br from-primary/90 to-primary/50 text-primary-foreground shadow-lg"
          : "border-border/60 bg-background/80 hover:border-primary/60 dark:border-border/40 dark:bg-card"
      } ${locked ? "opacity-100" : ""}`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
          {locked && <Lock className="h-4 w-4 opacity-60" aria-hidden />}
        </div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
          {locked ? "Butuh kode akses" : "Klik untuk masuk"}
        </span>
      </div>
      {locked && (
        <div className="pointer-events-none absolute inset-0 bg-card/70 backdrop-blur-sm" />
      )}
    </motion.button>
  );
};

/* ================= MAIN PAGE ================= */
export default function Home() {
  const pathname = usePathname();
  const router = useRouter();

  const isBelajarkuActive = pathname.startsWith("/belajarku");

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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [lockedExpanded, setLockedExpanded] = useState(false);

  const publicTabs = useMemo(() => TAB_ITEMS.filter((x) => !x.protected), []);
  const protectedTabs = useMemo(() => TAB_ITEMS.filter((x) => x.protected), []);

  const tryUnlock = useCallback(() => {
    const trimmed = code.trim();
    if (!ACCESS_CODE) {
      setCodeError("Kode akses belum diset di .env.local");
      return;
    }
    if (trimmed === ACCESS_CODE) {
      setIsUnlocked(true);
      setLockedExpanded(true);
      setOpenGate(false);
      setCode("");
      setCodeError(null);

      // kalau user tadi klik menu protected, langsung navigasi setelah unlock
      if (pendingHref) {
        const to = pendingHref;
        setPendingHref(null);
        router.push(to);
      }
    } else {
      setCodeError("Kode salah. Coba lagi.");
    }
  }, [code, ACCESS_CODE, pendingHref, router]);

  const onNavClick = useCallback(
    (item: TabItem) => {
      const href = TAB_ROUTES[item.value] ?? "/";
      if (item.protected && !isUnlocked) {
        setPendingHref(href);
        setOpenGate(true);
        setCodeError(null);
        return;
      }
      router.push(href);
    },
    [isUnlocked, router]
  );

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
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
          <p className="text-sm text-muted-foreground max-w-2xl">{t.subtitle}</p>
        </div>
        <ThemeToggle />
      </motion.div>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/80 bg-card p-5 shadow-lg dark:border-border/40"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Navigasi cepat
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                Pilih modul & aksesnya
              </h2>
            </div>
            <motion.div
              animate={
                highlightBelajarku && !isBelajarkuActive
                  ? { y: [0, -4, 0], scale: [1, 1.04, 1] }
                  : {}
              }
              transition={{
                duration: 2.6,
                repeat: highlightBelajarku && !isBelajarkuActive ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-2 shadow-lg"
            >
              <Link
                href="/belajarku"
                onClick={() => setHighlightBelajarku(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${
                  isBelajarkuActive ? "bg-white/10 text-white" : "bg-white/20 text-white"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Belajarku
                {!isBelajarkuActive && highlightBelajarku && (
                  <span className="flex items-center rounded-full bg-white/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                    <StarIcon className="h-3 w-3" />
                    Baru
                  </span>
                )}
              </Link>
            </motion.div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {heroHighlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {highlight}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Publik</h3>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                  Siap pakai
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {publicTabs.map((item) => (
                  <TabCard
                    key={item.value}
                    item={item}
                    locked={false}
                    isActive={isActive(TAB_ROUTES[item.value] ?? "/")}
                    onClick={() => onNavClick(item)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Terkunci</h3>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:inline">
                    Masukkan kode untuk buka
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLockedExpanded((prev) => !prev)}
                  className="md:hidden rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary hover:text-primary"
                  aria-expanded={lockedExpanded}
                >
                  {lockedExpanded ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <div
                className={`grid gap-3 md:grid-cols-2 transition-[max-height] duration-300 ease-in-out ${
                  lockedExpanded ? "max-h-[2000px]" : "max-h-0 overflow-hidden"
                } md:max-h-full md:overflow-visible`}
              >
                {protectedTabs.map((item) => (
                  <TabCard
                    key={item.value}
                    item={item}
                    locked={!isUnlocked}
                    isActive={isActive(TAB_ROUTES[item.value] ?? "/")}
                    onClick={() => onNavClick(item)}
                  />
                ))}
              </div>
            </div>
            {!isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  setPendingHref(null);
                  setOpenGate(true);
                  setCodeError(null);
                }}
                className="w-full rounded-2xl border border-border/80 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                Masukkan kode akses
              </button>
            )}
          </div>
        </motion.div>

        <WelcomeView />
      </section>

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
                  setPendingHref(null);
                }}
                className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Menu lain (Pengeluaran, Email Team, Riwayat, Stok Implan, Personal) terkunci.
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
              {codeError && <div className="text-xs text-red-500">{codeError}</div>}
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
                  setPendingHref(null);
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
