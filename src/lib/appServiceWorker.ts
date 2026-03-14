"use client";

const normalize = (value: string | undefined) => String(value || "").trim();

export const buildAppServiceWorkerUrl = () => {
  const apiKey = normalize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const authDomain = normalize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const projectId = normalize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const messagingSenderId = normalize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
  const appId = normalize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

  const hasFcmConfig =
    Boolean(apiKey) &&
    Boolean(authDomain) &&
    Boolean(projectId) &&
    Boolean(messagingSenderId) &&
    Boolean(appId);

  if (!hasFcmConfig) return "/sw.js";

  const params = new URLSearchParams({
    fcmApiKey: apiKey,
    fcmAuthDomain: authDomain,
    fcmProjectId: projectId,
    fcmMessagingSenderId: messagingSenderId,
    fcmAppId: appId,
  });

  return `/sw.js?${params.toString()}`;
};

