"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isIosDevice = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const standaloneViaMedia = window.matchMedia("(display-mode: standalone)").matches;
  const standaloneViaNavigator =
    typeof window.navigator !== "undefined" &&
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneViaMedia || standaloneViaNavigator;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("pwa_install_prompt_dismissed") === "1";
    } catch {
      return false;
    }
  });

  const showIosHint = useMemo(() => isIosDevice() && !deferredPrompt, [deferredPrompt]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;
  if (!deferredPrompt && !showIosHint) return null;

  const closePrompt = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem("pwa_install_prompt_dismissed", "1");
    } catch {
      return;
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Install aplikasi di perangkat
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {deferredPrompt
              ? "Tap Install agar aplikasi bisa dipakai seperti app di HP."
              : "iPhone/iPad: buka Share lalu pilih Add to Home Screen."}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={closePrompt}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {deferredPrompt ? (
        <div className="mt-2 flex justify-end">
          <Button type="button" size="sm" onClick={() => void handleInstall()}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Install
          </Button>
        </div>
      ) : null}
    </div>
  );
}
