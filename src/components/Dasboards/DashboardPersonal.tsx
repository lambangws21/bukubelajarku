"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import {
  Calendar,
  EyeOff,
  Lock,
  Mail,
  PackageSearch,
  Paperclip,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import Intertain from "@/components/Dasboards/DasboardAsistensi/DasboardPage";
import Asistensi from "@/components/Dasboards/Dasboard_Advance/DasboardPage";
import GaleryImage from "@/components/NEwGridImage";
import ManajemenStock from "@/components/stock/new-stock/StockTablePremium";
import EmailSender from "@/components/EmailSender/EmailSenderPage";
import ImageGrideA4 from "@/components/NewGirdeImageA4";

type TabValue =
  | "intertain"
  | "asistensi"
  | "galeryimage"
  | "ImageGrideA4"
  | "stok"
  | "emailSender";

type TabItem = {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  Component: React.ComponentType<Record<string, never>>;
  protected?: boolean;
};

const TAB_CONFIG = [
  // ✅ PUBLIC
  {
    value: "intertain",
    label: "Intertain",
    icon: <ScrollText className="w-4 h-4" />,
    Component: Asistensi,
    protected: false,
  },
  {
    value: "asistensi",
    label: "Asistensi",
    icon: <Stethoscope className="w-4 h-4" />,
    Component: Intertain,
    protected: false,
  },
  {
    value: "galeryimage",
    label: "Galery Image",
    icon: <ImageIcon className="w-4 h-4" />,
    Component: GaleryImage,
    protected: false,
  },

  // 🔒 PROTECTED
  {
    value: "ImageGrideA4",
    label: "Image Gride A4",
    icon: <Paperclip className="w-4 h-4" />,
    Component: ImageGrideA4,
    protected: true,
  },
  {
    value: "stok",
    label: "Manajemen Stock",
    icon: <PackageSearch className="w-4 h-4" />,
    Component: ManajemenStock,
    protected: true,
  },
  {
    value: "emailSender",
    label: "New Expance",
    icon: <Mail className="w-4 h-4" />,
    Component: EmailSender,
    protected: true,
  },
] as const satisfies readonly TabItem[];

const LS_PINNED_TAB_KEY = "pinnedTab";
const LS_UNLOCK_KEY = "dashboardUnlocked";

function isTabValue(v: string): v is TabValue {
  return TAB_CONFIG.some((t) => t.value === v);
}

function isProtectedTab(v: TabValue): boolean {
  const cfg = TAB_CONFIG.find((t) => t.value === v);
  return Boolean(cfg?.protected);
}

function getFirstPublicTab(): TabValue {
  const first = TAB_CONFIG.find((t) => !t.protected);
  return (first?.value ?? "intertain") as TabValue;
}

function getLocalBool(key: string, fallback = false): boolean {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) === "1";
}

function getLocalTab(key: string, fallback: TabValue): TabValue {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  return saved && isTabValue(saved) ? saved : fallback;
}

export default function DashboardPersonal() {
  const DASH_USER = process.env.NEXT_PUBLIC_DASH_USER ?? "lambang";
  const DASH_PIN = process.env.NEXT_PUBLIC_DASH_PIN ?? "2104";
  const ACCESS_CODE = process.env.NEXT_PUBLIC_DASH_ACCESS_CODE ?? "1994";

  // ===== login =====
  const [username, setUsername] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // ===== unlock (init dari localStorage) =====
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    getLocalBool(LS_UNLOCK_KEY, false)
  );

  // ===== tab (init dari localStorage + guard) =====
  const [tab, setTab] = useState<TabValue>(() => {
    const fallback = getFirstPublicTab();
    const saved = getLocalTab(LS_PINNED_TAB_KEY, fallback);
    const unlockedLocal = getLocalBool(LS_UNLOCK_KEY, false);
    if (isProtectedTab(saved) && !unlockedLocal) return fallback;
    return saved;
  });

  // ===== access modal =====
  const [openGate, setOpenGate] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string | null>(null);

  // (Effect allowed) sync pinned tab to localStorage — no setState here
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_PINNED_TAB_KEY, tab);
  }, [tab]);

  // (Effect allowed) sync unlock flag to localStorage — no setState here
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_UNLOCK_KEY, isUnlocked ? "1" : "0");
  }, [isUnlocked]);

  // Reset login saat reload (opsional)
  useEffect(() => {
    const handleUnload = () => setAuthorized(false);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const visibleTabs = useMemo(() => {
    return isUnlocked ? TAB_CONFIG : TAB_CONFIG.filter((t) => !t.protected);
  }, [isUnlocked]);

  const ensureAllowedTab = useCallback(
    (next: TabValue): TabValue => {
      if (isProtectedTab(next) && !isUnlocked) return getFirstPublicTab();
      return next;
    },
    [isUnlocked]
  );

  const handleLogin = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!DASH_USER || !DASH_PIN) {
        setError("Env login belum diset (NEXT_PUBLIC_DASH_USER/PIN).");
        return;
      }

      if (username === DASH_USER && pin === DASH_PIN) {
        setAuthorized(true);
        setError("");
        // kalau tab yang tersimpan protected tapi belum unlock, paksa ke public (event-driven)
        setTab((prev) => ensureAllowedTab(prev));
      } else {
        setError("Username atau PIN salah.");
      }
    },
    [username, pin, DASH_USER, DASH_PIN, ensureAllowedTab]
  );

  const tryUnlock = useCallback(() => {
    const trimmed = code.trim();

    if (!ACCESS_CODE) {
      setCodeError("Kode akses belum diset di env (NEXT_PUBLIC_DASH_ACCESS_CODE).");
      return;
    }

    if (trimmed === ACCESS_CODE) {
      setIsUnlocked(true);
      setOpenGate(false);
      setCode("");
      setCodeError(null);
      // setelah unlock, biarkan user tetap di tab sekarang (nggak perlu setTab)
    } else {
      setCodeError("Kode akses salah. Coba lagi.");
    }
  }, [code, ACCESS_CODE]);

  const onTabRequested = useCallback(
    (next: TabValue) => {
      if (isProtectedTab(next) && !isUnlocked) {
        setOpenGate(true);
        setCodeError(null);
        return;
      }
      setTab(next);
    },
    [isUnlocked]
  );

  // kalau user “kehilangan unlock” (misal env berubah / storage dibersihkan),
  // kita nggak setTab di effect; kita guard lewat UI:
  // - visibleTabs sudah menyembunyikan protected
  // - onValueChange + onClick sudah mencegah pindah ke protected

  // ===================== LOGIN VIEW =====================
  if (!authorized) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white px-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.form
          onSubmit={handleLogin}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 w-full max-w-sm space-y-5 border -mt-52 border-gray-200 dark:border-gray-700"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-bold text-center">Login Akses Dashboard</h2>
          </div>

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

          {error && (
            <div className="flex items-center text-sm text-red-500 gap-2">
              <EyeOff className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

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

  // ===================== DASH VIEW =====================
  return (
    <motion.div
      className="max-w-[1900px] rounded-md mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 mb-2">
        <Calendar className="w-4 h-4 mr-1" />
        {today}
      </div>

      <RadixTabs.Root value={ensureAllowedTab(tab)} onValueChange={(v) => onTabRequested(v as TabValue)}>
        <RadixTabs.List className="flex flex-nowrap space-x-2 overflow-x-auto scrollbar-hide bg-gray-200 dark:bg-gray-700 rounded-full p-1 mb-4">
          {visibleTabs.map(({ value, label, icon, protected: prot }) => (
            <RadixTabs.Trigger
              key={value}
              value={value}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full cursor-pointer whitespace-nowrap data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800 transition"
              onClick={(e) => {
                if (Boolean(prot) && !isUnlocked) {
                  e.preventDefault();
                  setOpenGate(true);
                  setCodeError(null);
                }
              }}
            >
              {icon}
              {label}
              {Boolean(prot) && !isUnlocked && (
                <Lock className="w-3.5 h-3.5 opacity-70 ml-1" />
              )}
            </RadixTabs.Trigger>
          ))}

          {!isUnlocked && (
            <button
              type="button"
              onClick={() => {
                setOpenGate(true);
                setCodeError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60 transition"
              title="Masukkan kode untuk membuka menu lain"
            >
              <Lock className="w-4 h-4" />
              Kode Akses
            </button>
          )}
        </RadixTabs.List>

        {TAB_CONFIG.map(({ value, Component }) => (
          <RadixTabs.Content key={value} value={value} className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Component />
            </motion.div>
          </RadixTabs.Content>
        ))}
      </RadixTabs.Root>

      {openGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-2xl border bg-white dark:bg-gray-900 p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Masukkan Kode Akses
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenGate(false);
                  setCode("");
                  setCodeError(null);
                }}
                className="rounded-lg px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              Menu tambahan terkunci. Masukkan kode untuk membukanya.
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
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              />
              {codeError && <div className="text-xs text-red-500">{codeError}</div>}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={tryUnlock}
                className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
