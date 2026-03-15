"use client";

import { useEffect, useRef } from "react";
import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from "firebase/messaging";
import { toast } from "sonner";
import {
  getFirebaseApp,
  type FirebaseWebClientConfig,
} from "@/lib/firebase/client";
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

type FirebasePublicConfigPayload = Partial<FirebaseWebClientConfig> & {
  vapidKey?: string;
};

type FirebasePublicConfigResponse = {
  status?: string;
  data?: FirebasePublicConfigPayload | null;
};

type PushPayloadData = {
  actor?: string;
  actorEmail?: string;
  body?: string;
  clickUrl?: string;
};

const hasNotificationApi = () =>
  typeof window !== "undefined" && "Notification" in window;

const readText = (value: unknown) => String(value || "").trim();
const normalizeEmail = (value: unknown) => readText(value).toLowerCase();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const personalizeNotificationBody = ({
  body,
  actorLabel,
  actorEmail,
  viewerEmail,
}: {
  body: string;
  actorLabel: string;
  actorEmail: string;
  viewerEmail: string;
}) => {
  if (!body) return body;
  if (!actorEmail || !viewerEmail || actorEmail !== viewerEmail) return body;
  const label = readText(actorLabel);
  if (!label) return body;

  const startsWithLabel = new RegExp(`^${escapeRegExp(label)}\\b`);
  if (startsWithLabel.test(body)) {
    return body.replace(startsWithLabel, "Anda");
  }
  return body.replace(label, "Anda");
};

const syncViewerIdentityToServiceWorker = (
  registration: ServiceWorkerRegistration | null,
  viewerEmail: string
) => {
  const payload = {
    type: "TS_SUPPORT_VIEWER",
    email: normalizeEmail(viewerEmail),
  };

  try {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(payload);
    }
    registration?.active?.postMessage(payload);
  } catch {
    return;
  }
};

const readFirebaseRuntimeConfig = (payload: FirebasePublicConfigPayload) => {
  const config: FirebaseWebClientConfig = {
    apiKey: readText(payload.apiKey),
    authDomain: readText(payload.authDomain),
    projectId: readText(payload.projectId),
    storageBucket: readText(payload.storageBucket),
    messagingSenderId: readText(payload.messagingSenderId),
    appId: readText(payload.appId),
    databaseURL: readText(payload.databaseURL) || undefined,
  };
  const missing =
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.storageBucket ||
    !config.messagingSenderId ||
    !config.appId;
  return { config, isComplete: !missing, vapidKey: readText(payload.vapidKey) };
};

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
  const sessionUserRef = useRef<TsSupportSessionUser | null>(null);

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

      try {
        bootstrappingRef.current = true;
        const sessionResponse = await fetch("/api/ts-support-auth/session", {
          cache: "no-store",
        });
        const sessionJson = (await sessionResponse.json()) as TsSupportSessionResponse;
        const sessionUser =
          sessionJson?.user && typeof sessionJson.user === "object"
            ? sessionJson.user
            : null;
        const hasSession =
          sessionResponse.ok &&
          String(sessionJson?.status || "").toLowerCase() === "success" &&
          Boolean(sessionUser);
        if (!hasSession) {
          sessionUserRef.current = null;
          return;
        }
        sessionUserRef.current = sessionUser;

        const firebaseConfigResponse = await fetch("/api/firebase/public-config", {
          cache: "no-store",
        });
        const firebaseConfigJson =
          (await firebaseConfigResponse.json().catch(() => null)) as
            | FirebasePublicConfigResponse
            | null;
        const runtimeConfigPayload =
          firebaseConfigJson?.data && typeof firebaseConfigJson.data === "object"
            ? firebaseConfigJson.data
            : {};
        const { config: runtimeConfig, isComplete, vapidKey } =
          readFirebaseRuntimeConfig(runtimeConfigPayload);
        if (!isComplete) {
          throw new Error(
            "Konfigurasi Firebase Web belum lengkap di environment deployment."
          );
        }
        if (!vapidKey) {
          throw new Error(
            "NEXT_PUBLIC_FIREBASE_VAPID_KEY belum diisi di environment deployment."
          );
        }

        if (!(await isMessagingSupported())) {
          throw new Error("Browser/perangkat ini belum mendukung push notifikasi FCM.");
        }

        const swUrl = buildAppServiceWorkerUrl(runtimeConfig);
        let registration = await navigator.serviceWorker.register(swUrl, {
          scope: "/",
        });
        await navigator.serviceWorker.ready;
        registration =
          (await navigator.serviceWorker.getRegistration("/")) || registration;
        syncViewerIdentityToServiceWorker(
          registration,
          String(sessionUser?.email || "")
        );

        const messaging = getMessaging(getFirebaseApp(runtimeConfig));
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
            const data = (payload.data || {}) as PushPayloadData;
            const title = String(payload.notification?.title || "").trim() || "Aktivitas TS Support";
            const rawBody =
              String(payload.notification?.body || payload.data?.body || "").trim() ||
              "Ada update aktivitas baru.";
            const body = personalizeNotificationBody({
              body: rawBody,
              actorLabel: String(data.actor || ""),
              actorEmail: normalizeEmail(data.actorEmail),
              viewerEmail: normalizeEmail(sessionUserRef.current?.email),
            });
            const clickUrl = resolveClickUrl(
              String(data.clickUrl || "/ts-support-view")
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
