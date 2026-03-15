"use client";

import type { FirebaseWebClientConfig } from "@/lib/firebase/client";

type FirebaseSwConfig = Pick<
  FirebaseWebClientConfig,
  "apiKey" | "authDomain" | "projectId" | "messagingSenderId" | "appId"
>;

const normalize = (value: string | undefined) => String(value || "").trim();

const readSwConfigFromEnv = (): FirebaseSwConfig => ({
  apiKey: normalize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  messagingSenderId: normalize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
});

export const buildAppServiceWorkerUrl = (overrideConfig?: Partial<FirebaseSwConfig>) => {
  const envConfig = readSwConfigFromEnv();
  const config: FirebaseSwConfig = {
    apiKey: normalize(overrideConfig?.apiKey) || envConfig.apiKey,
    authDomain: normalize(overrideConfig?.authDomain) || envConfig.authDomain,
    projectId: normalize(overrideConfig?.projectId) || envConfig.projectId,
    messagingSenderId:
      normalize(overrideConfig?.messagingSenderId) || envConfig.messagingSenderId,
    appId: normalize(overrideConfig?.appId) || envConfig.appId,
  };

  const hasFcmConfig =
    Boolean(config.apiKey) &&
    Boolean(config.authDomain) &&
    Boolean(config.projectId) &&
    Boolean(config.messagingSenderId) &&
    Boolean(config.appId);

  if (!hasFcmConfig) return "/sw.js";

  const params = new URLSearchParams({
    fcmApiKey: config.apiKey,
    fcmAuthDomain: config.authDomain,
    fcmProjectId: config.projectId,
    fcmMessagingSenderId: config.messagingSenderId,
    fcmAppId: config.appId,
  });

  return `/sw.js?${params.toString()}`;
};
