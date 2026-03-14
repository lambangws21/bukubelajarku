"use client";

import { useEffect } from "react";
import { buildAppServiceWorkerUrl } from "@/lib/appServiceWorker";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const hasFcmVapidKey = Boolean(
      String(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "").trim()
    );
    const shouldEnableSwInDev = process.env.NODE_ENV !== "production" && hasFcmVapidKey;

    // In development without FCM, stale SW caches can break Next dev chunks
    // (e.g. layout.js parse errors), so keep SW disabled.
    if (process.env.NODE_ENV !== "production" && !shouldEnableSwInDev) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          reg.unregister().catch(() => {
            // ignore
          });
        });
      });

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).catch(() => {
              // ignore
            });
          });
        });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register(buildAppServiceWorkerUrl(), { scope: "/" })
        .catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
