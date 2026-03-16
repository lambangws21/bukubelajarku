"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const normalizeLoginEmailInput = (value: string) => {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return "";
  if (cleaned.includes("@")) return cleaned;
  const safe = cleaned.replace(/[^a-z0-9._-]/g, "");
  if (!safe) return "";
  return `${safe}@ts-support.local`;
};

export default function TsSupportLoginPage() {
  const loginAnimationLabels = ["Verifikasi akun", "Menyiapkan session", "Mengarahkan..."];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginAnimationStep, setLoginAnimationStep] = useState(0);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/ts-support-auth/session", {
          cache: "no-store",
        });
        if (!active) return;
        if (res.ok) {
          const json = (await res.json().catch(() => null)) as {
            status?: string;
            user?: { role?: string; email?: string } | null;
            canManage?: boolean;
          } | null;
          if (json?.status !== "success" || !json.user) return;
          router.replace(
            Boolean(json?.canManage) ? "/ts-support" : "/ts-support-view"
          );
          return;
        }
      } catch {
        // ignore
      } finally {
        if (active) setCheckingSession(false);
      }
    };

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!loading) {
      setLoginAnimationStep(0);
      return;
    }
    const intervalId = window.setInterval(() => {
      setLoginAnimationStep((current) => (current + 1) % loginAnimationLabels.length);
    }, 700);
    return () => window.clearInterval(intervalId);
  }, [loading, loginAnimationLabels.length]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setErrorText("");

    setLoading(true);
    try {
      const normalizedEmail = normalizeLoginEmailInput(email);
      if (!normalizedEmail) {
        throw new Error("Username/email wajib diisi.");
      }

      const response = await fetch("/api/ts-support-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const json = (await response.json().catch(() => null)) as {
        status?: string;
        message?: string;
        user?: {
          role?: string;
          email?: string;
        };
        canManage?: boolean;
      } | null;

      if (!response.ok || json?.status === "error") {
        throw new Error(json?.message || "Proses autentikasi gagal.");
      }

      toast.success("Login berhasil.");
      router.replace(Boolean(json?.canManage) ? "/ts-support" : "/ts-support-view");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kendala.";
      setErrorText(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 md:p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memeriksa session TS Support...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 md:p-6">
      <div className="mx-auto flex min-h-[85vh] max-w-md items-center">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full"
        >
        <Card className="w-full rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-black/30">
          <div className="mb-4">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              TS Support Session
            </p>
            <h1 className="mt-1 text-xl font-semibold">Login TS Support</h1>
            <p className="text-sm text-muted-foreground">
              Daftar akun dibuat lewat halaman manajemen oleh user sales.
            </p>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-900/60">
              <UserRound className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-200" />
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-200">
              Saran login: <span className="font-semibold">nama@ts-support.local</span>
            </p>
          </div>

          <form className="space-y-3.5" onSubmit={submit}>
            <div>
              <label className="text-xs text-muted-foreground">Username / Email</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setEmail((prev) => normalizeLoginEmailInput(prev) || prev.trim().toLowerCase())}
                placeholder="contoh: johnny@ts-support.local"
                required
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Jika isi <span className="font-medium">johnny</span>, sistem otomatis jadi{" "}
                <span className="font-medium">johnny@ts-support.local</span>.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 6 karakter"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {errorText ? (
              <div className="rounded-md border border-rose-300/80 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">
                {errorText}
              </div>
            ) : null}

            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? (
                <motion.span
                  initial={{ opacity: 0.7, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1.02 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.5 }}
                  className="inline-flex items-center"
                >
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                </motion.span>
              ) : (
                <LogIn className="mr-1 h-4 w-4" />
              )}
              {loading ? "Memproses..." : "Masuk"}
            </Button>

            <Button asChild type="button" variant="outline" className="h-10 w-full">
              <Link href="/belajarku">
                <BookOpenText className="mr-1 h-4 w-4" />
                Buka Belajarku
              </Link>
            </Button>
          </form>
        </Card>
        </motion.div>
      </div>
      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-lg dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-300" />
                Sedang login...
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loginAnimationLabels[loginAnimationStep]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-xs font-normal text-muted-foreground"
                >
                  {loginAnimationLabels[loginAnimationStep]}
                </motion.p>
              </AnimatePresence>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <motion.div
                  key={loginAnimationStep}
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="h-full w-full bg-emerald-500 dark:bg-emerald-400"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
