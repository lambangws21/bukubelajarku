"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NotificationPermissionState = NotificationPermission | "unsupported";

const INSTALL_PROMPT_DISMISSED_KEY = "pwa_install_prompt_dismissed";
const NOTIFICATION_PROMPT_DISMISSED_KEY = "pwa_notification_prompt_dismissed";

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

const readNotificationPermission = (): NotificationPermissionState => {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return window.Notification.permission;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());
  const [installPromptDismissed, setInstallPromptDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(NOTIFICATION_PROMPT_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(
    () => readNotificationPermission()
  );
  const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] = useState(false);

  const showIosHint = useMemo(() => isIosDevice() && !deferredPrompt, [deferredPrompt]);
  const canShowInstallPrompt =
    !installed && !installPromptDismissed && (Boolean(deferredPrompt) || showIosHint);
  const canShowNotificationPrompt =
    installed &&
    !notificationPromptDismissed &&
    notificationPermission === "default" &&
    !canShowInstallPrompt;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const syncPermission = () => {
      setNotificationPermission(window.Notification.permission);
    };

    syncPermission();
    window.addEventListener("focus", syncPermission);
    document.addEventListener("visibilitychange", syncPermission);
    return () => {
      window.removeEventListener("focus", syncPermission);
      document.removeEventListener("visibilitychange", syncPermission);
    };
  }, []);

  if (!canShowInstallPrompt && !canShowNotificationPrompt) return null;

  const closeInstallPrompt = () => {
    setInstallPromptDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "1");
    } catch {
      return;
    }
  };

  const closeNotificationPrompt = () => {
    setNotificationPromptDismissed(true);
    try {
      window.localStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, "1");
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

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (window.Notification.permission !== "default") {
      setNotificationPermission(window.Notification.permission);
      return;
    }

    try {
      setIsRequestingNotificationPermission(true);
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        closeNotificationPrompt();
      }
    } finally {
      setIsRequestingNotificationPermission(false);
    }
  };

  if (canShowNotificationPrompt) {
    return (
      <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aktifkan notifikasi di HP
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Izinkan notifikasi agar update jadwal/komentar baru bisa langsung muncul di perangkat.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={closeNotificationPrompt}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={isRequestingNotificationPermission}
            onClick={() => void handleEnableNotifications()}
          >
            {isRequestingNotificationPermission ? "Meminta izin..." : "Aktifkan notifikasi"}
          </Button>
        </div>
      </div>
    );
  }

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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={closeInstallPrompt}
        >
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
