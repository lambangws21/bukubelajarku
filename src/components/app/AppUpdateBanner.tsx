"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, X } from "lucide-react";

type AppConfigResponse = {
  currentVersion: string;
  latestVersion: string;
  minVersion: string;
  updateUrl?: string;
  message?: string;
  maintenance?: boolean;
  maintenanceMessage?: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
  return (await res.json()) as AppConfigResponse;
};

const parseVersion = (v: string) => v.split("-")[0].split(".").map((n) => Number(n) || 0);

const compareSemver = (a: string, b: string) => {
  const aa = parseVersion(a);
  const bb = parseVersion(b);
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i++) {
    const av = aa[i] ?? 0;
    const bv = bb[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
};

export function AppUpdateBanner() {
  const { data } = useSWR<AppConfigResponse>("/api/app-config", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const currentVersion = useMemo(
    () => process.env.NEXT_PUBLIC_APP_VERSION || data?.currentVersion || "0.0.0",
    [data?.currentVersion]
  );

  const latestVersion = data?.latestVersion || currentVersion;
  const minVersion = data?.minVersion || currentVersion;
  const maintenance = Boolean(data?.maintenance);

  const forceUpdate = !maintenance && compareSemver(currentVersion, minVersion) < 0;
  const updateAvailable = !maintenance && compareSemver(currentVersion, latestVersion) < 0;

  const dismissKey = `dismiss-update-${latestVersion}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(dismissKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [dismissKey]);

  const show = maintenance || forceUpdate || (updateAvailable && !dismissed);
  if (!show) return null;

  const title = maintenance
    ? "Maintenance aktif"
    : forceUpdate
      ? "Update wajib"
      : "Update tersedia";

  const description = maintenance
    ? data?.maintenanceMessage || "Aplikasi sedang maintenance. Coba lagi sebentar."
    : data?.message ||
      `Versi kamu ${currentVersion}. Versi terbaru ${latestVersion}.`;

  const updateUrl = data?.updateUrl || "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 text-slate-100">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-0.5 text-xs text-slate-300">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {updateUrl ? (
              <Link
                href={updateUrl}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5"
              >
                Update <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}

            {!forceUpdate && !maintenance ? (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(dismissKey, "1");
                  } catch {
                    // ignore
                  }
                  setDismissed(true);
                }}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

