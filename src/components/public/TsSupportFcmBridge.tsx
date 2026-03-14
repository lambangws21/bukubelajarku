"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getFirebaseApp } from "@/lib/firebase/client";
import { buildAppServiceWorkerUrl } from "@/lib/appServiceWorker";

const FCM_TOKEN_CACHE_KEY = "ts_support_fcm_token_v1";
const NOTIFICATION_PERMISSION_GRANTED_EVENT = "ts-support:notification-permission-granted";

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
  const bootstrapErrorToastRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    let gestureListenersAttached = false;

    const detachGestureListeners = () => {
      if (!gestureListenersAttached) return;
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      gestureListenersAttached = false;
    };

    const requestPermissionIfNeeded = async () => {
      if (disposed || !hasNotificationApi()) return;
      if (window.Notification.permission !== "default") return;
      try {
        const permission = await window.Notification.requestPermission();
        if (permission === "granted") {
          window.dispatchEvent(
            new CustomEvent(NOTIFICATION_PERMISSION_GRANTED_EVENT)
          );
        }
      } catch {
        return;
      }
    };

    function handleFirstGesture() {
      detachGestureListeners();
      void requestPermissionIfNeeded();
    }

    const attachGestureListeners = () => {
      if (gestureListenersAttached) return;
      window.addEventListener("pointerdown", handleFirstGesture, { once: true });
      window.addEventListener("keydown", handleFirstGesture, { once: true });
      window.addEventListener("touchstart", handleFirstGesture, { once: true, passive: true });
      gestureListenersAttached = true;
    };

    const bootstrap = async () => {
      if (disposed || bootstrappingRef.current) return;
      if (!hasNotificationApi()) return;
      if (window.Notification.permission !== "granted") return;
      if (!window.isSecureContext) {
        throw new Error("Push notifikasi membutuhkan HTTPS atau localhost.");
      }

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

        if (!(await isSupported())) {
          throw new Error("Browser/perangkat ini belum mendukung push notifikasi FCM.");
        }

        const swUrl = buildAppServiceWorkerUrl();
        let registration = await navigator.serviceWorker.register(swUrl, {
          scope: "/",
        });
        await navigator.serviceWorker.ready;
        registration =
          (await navigator.serviceWorker.getRegistration("/")) || registration;

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
            const failedPayload = (await subscribeResponse
              .json()
              .catch(() => null)) as { message?: string } | null;
            throw new Error(
              String(failedPayload?.message || "Gagal sinkron token notifikasi.")
            );
          }
          window.localStorage.setItem(FCM_TOKEN_CACHE_KEY, token);
        }

        bootstrapErrorToastRef.current = "";

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
        const message =
          error instanceof Error ? error.message : "Gagal mengaktifkan notifikasi.";
        console.warn("FCM bootstrap failed:", error);
        if (bootstrapErrorToastRef.current !== message) {
          toast.error(message);
          bootstrapErrorToastRef.current = message;
        }
      } finally {
        bootstrappingRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void bootstrap();
    };

    const handlePermissionGranted = () => {
      void bootstrap();
    };

    if (window.Notification.permission === "default") {
      attachGestureListeners();
    }

    void bootstrap();
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(
      NOTIFICATION_PERMISSION_GRANTED_EVENT,
      handlePermissionGranted
    );

    return () => {
      disposed = true;
      detachGestureListeners();
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(
        NOTIFICATION_PERMISSION_GRANTED_EVENT,
        handlePermissionGranted
      );
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  return null;
}
