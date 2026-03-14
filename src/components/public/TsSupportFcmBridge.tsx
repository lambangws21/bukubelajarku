"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getFirebaseApp } from "@/lib/firebase/client";
import { buildAppServiceWorkerUrl } from "@/lib/appServiceWorker";

const FCM_TOKEN_CACHE_KEY = "ts_support_fcm_token_v1";

type TsSupportSessionUser = {
  uid: string;
  email: string;
  name: string;
  role: string;
};

type TsSupportSessionResponse = {
  status?: string;
  user?: TsSupportSessionUser | null;
};

const hasNotificationApi = () =>
  typeof window !== "undefined" && "Notification" in window;

const resolveClickUrl = (value: string) => {
  const fallback = "/ts-support-view";
  const text = String(value || "").trim();
  if (!text) return fallback;
  if (text.startsWith("/")) return text;
  try {
    const next = new URL(text);
    if (next.origin === window.location.origin) {
      return `${next.pathname}${next.search}${next.hash}`;
    }
  } catch {
    return fallback;
  }
  return fallback;
};

export default function TsSupportFcmBridge() {
  const bootstrappingRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;

    const bootstrap = async () => {
      if (disposed || bootstrappingRef.current) return;
      if (!hasNotificationApi()) return;
      if (window.Notification.permission !== "granted") return;

      const vapidKey = String(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "").trim();
      if (!vapidKey) return;

      try {
        bootstrappingRef.current = true;
        const sessionResponse = await fetch("/api/ts-support-auth/session", {
          cache: "no-store",
        });
        const sessionJson = (await sessionResponse.json()) as TsSupportSessionResponse;
        const hasSession =
          sessionResponse.ok &&
          String(sessionJson?.status || "").toLowerCase() === "success" &&
          Boolean(sessionJson?.user);
        if (!hasSession) return;

        const { getMessaging, getToken, onMessage, isSupported } = await import(
          "firebase/messaging"
        );

        if (!(await isSupported())) return;

        const swUrl = buildAppServiceWorkerUrl();
        let registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration) {
          registration = await navigator.serviceWorker.register(swUrl, {
            scope: "/",
          });
        }

        const messaging = getMessaging(getFirebaseApp());
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (!token) return;

        const cachedToken =
          typeof window !== "undefined"
            ? window.localStorage.getItem(FCM_TOKEN_CACHE_KEY) || ""
            : "";

        if (token !== cachedToken) {
          const subscribeResponse = await fetch("/api/ts-support-push/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (!subscribeResponse.ok) {
            throw new Error("Gagal sinkron token notifikasi.");
          }
          window.localStorage.setItem(FCM_TOKEN_CACHE_KEY, token);
        }

        if (!initializedRef.current) {
          unsubscribeRef.current = onMessage(messaging, (payload) => {
            const title = String(payload.notification?.title || "").trim() || "Aktivitas TS Support";
            const body =
              String(payload.notification?.body || payload.data?.body || "").trim() ||
              "Ada update aktivitas baru.";
            const clickUrl = resolveClickUrl(
              String(payload.data?.clickUrl || "/ts-support-view")
            );

            toast.message(title, {
              description: body,
              duration: 5000,
              action: {
                label: "Buka",
                onClick: () => {
                  window.location.assign(clickUrl);
                },
              },
            });
          });
          initializedRef.current = true;
        }
      } catch (error) {
        console.warn("FCM bootstrap failed:", error);
      } finally {
        bootstrappingRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void bootstrap();
    };

    void bootstrap();
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  return null;
}
