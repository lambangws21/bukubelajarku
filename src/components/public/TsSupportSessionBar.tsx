"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, History, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TsSupportRole } from "@/lib/tsSupportSession";

type TsSupportSessionBarProps = {
  userName: string;
  userEmail: string;
  role: TsSupportRole;
  showAuditTimeline?: boolean;
};

const FCM_TOKEN_CACHE_KEY = "ts_support_fcm_token_v1";
const SESSION_PROFILE_CACHE_KEY = "ts_support_profile_photo_v1";
const SESSION_REFRESH_INTERVAL_MS = 5 * 60_000;
const SESSION_ACTIVITY_THROTTLE_MS = 30_000;

const roleLabel: Record<TsSupportSessionBarProps["role"], string> = {
  sales: "Sales",
  ts: "TS",
  logistik: "Logistik",
  admin: "Admin",
  coordinator: "Coordinator",
  viewer: "Member",
};

const getGoogleDriveFileId = (raw: unknown) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^[a-zA-Z0-9_-]{20,}$/.test(value)) return value;
  const fromPath = value.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (fromPath?.[1]) return fromPath[1];
  const fromDirect = value.match(/\/d\/([a-zA-Z0-9_-]{20,})(?:[/?=&]|$)/);
  if (fromDirect?.[1]) return fromDirect[1];
  const fromParam = value.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (fromParam?.[1]) return fromParam[1];
  return "";
};

const toDriveImageUrl = (rawUrl: unknown, rawId: unknown) => {
  const id = getGoogleDriveFileId(rawId) || getGoogleDriveFileId(rawUrl);
  if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
  return String(rawUrl || "").trim();
};

export default function TsSupportSessionBar({
  userName,
  userEmail,
  role,
  showAuditTimeline = true,
}: TsSupportSessionBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoutOverlayOpen, setLogoutOverlayOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const lastSessionRefreshAtRef = useRef(0);
  const sessionRefreshInFlightRef = useRef(false);
  const lastActivityTriggerAtRef = useRef(0);
  const normalizedUserEmail = useMemo(
    () => String(userEmail || "").trim().toLowerCase(),
    [userEmail]
  );
  const initials = useMemo(
    () =>
      String(userName || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "TS",
    [userName]
  );

  const refreshSession = useCallback(async (force = false) => {
    if (typeof window === "undefined") return;
    if (sessionRefreshInFlightRef.current) return;

    const now = Date.now();
    if (!force && now - lastSessionRefreshAtRef.current < SESSION_REFRESH_INTERVAL_MS) {
      return;
    }

    sessionRefreshInFlightRef.current = true;
    try {
      const response = await fetch("/api/ts-support-auth/refresh", {
        method: "POST",
        cache: "no-store",
        keepalive: true,
      });
      if (response.ok) {
        lastSessionRefreshAtRef.current = Date.now();
      }
    } catch {
      return;
    } finally {
      sessionRefreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refreshSession(true);

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTriggerAtRef.current < SESSION_ACTIVITY_THROTTLE_MS) return;
      lastActivityTriggerAtRef.current = now;
      void refreshSession(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void refreshSession(false);
    };

    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("focus", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = window.setInterval(() => {
      void refreshSession(false);
    }, SESSION_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cacheKey = `${SESSION_PROFILE_CACHE_KEY}:${normalizedUserEmail}`;
    const cached = String(window.localStorage.getItem(cacheKey) || "").trim();
    if (cached) setProfileUrl(cached);

    const controller = new AbortController();
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/asistensi/ts-support?action=getTeamTs", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const json = (await response.json().catch(() => null)) as
          | { status?: string; data?: unknown }
          | null;
        const rows = Array.isArray(json?.data) ? (json?.data as Array<Record<string, unknown>>) : [];
        if (!rows.length) return;

        const byEmail = rows.find((row) => {
          const email = String(row?.Email || row?.email || "").trim().toLowerCase();
          return Boolean(email) && email === normalizedUserEmail;
        });
        const byName =
          byEmail ||
          rows.find((row) => {
            const name = String(row?.Nama || row?.nama || row?.Name || row?.name || "")
              .trim()
              .toLowerCase();
            return Boolean(name) && name === String(userName || "").trim().toLowerCase();
          });

        const profile = byName || null;
        if (!profile) return;
        const nextProfileUrl = toDriveImageUrl(
          profile["Profile URL"] || profile.profileUrl || profile["Photo URL"] || profile["Foto URL"],
          profile["Profile Id"] || profile["Profile ID"] || profile.profileId
        );
        if (!nextProfileUrl) return;
        setProfileUrl(nextProfileUrl);
        window.localStorage.setItem(cacheKey, nextProfileUrl);
      } catch {
        return;
      }
    };

    void loadProfile();
    return () => controller.abort();
  }, [normalizedUserEmail, userName]);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    setLogoutOverlayOpen(true);
    const minimumAnimation = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 650);
    });

    try {
      const cachedFcmToken =
        typeof window !== "undefined"
          ? String(window.localStorage.getItem(FCM_TOKEN_CACHE_KEY) || "").trim()
          : "";

      if (cachedFcmToken) {
        await fetch("/api/ts-support-push/token", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: cachedFcmToken }),
        }).catch(() => null);

        window.localStorage.removeItem(FCM_TOKEN_CACHE_KEY);
      }

      await Promise.all([
        fetch("/api/ts-support-auth/logout", {
          method: "POST",
        }).catch(() => null),
        minimumAnimation,
      ]);
      router.replace("/ts-support-login");
      router.refresh();
    } finally {
      setLoading(false);
      setLogoutOverlayOpen(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative mb-3 overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-50/90 to-cyan-50/80 p-3 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-cyan-950/20"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_120%_20%,rgba(16,185,129,0.12),transparent_38%)] dark:bg-[radial-gradient(circle_at_120%_20%,rgba(16,185,129,0.18),transparent_42%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/60 bg-white text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-slate-900 dark:text-emerald-300">
              {profileUrl ? (
                <span
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${profileUrl})` }}
                  aria-label={`Foto profil ${userName}`}
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Session TS Support
              </p>
              <p className="truncate text-sm font-semibold leading-tight">
                {userName} · {roleLabel[role]}
              </p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild type="button" variant="outline" className="h-8 rounded-lg px-2.5 text-[11px] md:h-9 md:px-3 md:text-xs">
              <Link href="/belajarku">
                <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
                Belajarku
              </Link>
            </Button>
            {showAuditTimeline ? (
              <Button asChild type="button" variant="outline" className="h-8 rounded-lg px-2.5 text-[11px] md:h-9 md:px-3 md:text-xs">
                <Link href="/ts-support/audit">
                  <History className="mr-1.5 h-3.5 w-3.5" />
                  Timeline
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-lg px-2.5 text-[11px] md:h-9 md:px-3 md:text-xs"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="mr-1 h-3.5 w-3.5" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {logoutOverlayOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.24 }}
              className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-xl dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="inline-flex items-center gap-2 font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-300" />
                Sedang logout...
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="h-full w-full bg-emerald-500 dark:bg-emerald-400"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
