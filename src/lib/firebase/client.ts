"use client";

// src/lib/firebase/client.ts
// Client-side helper (requires `firebase` dependency).

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

type FirebaseAppLike = FirebaseApp;
let cachedApp: FirebaseAppLike | null = null;

export type FirebaseWebClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
};

type FirebaseAppModule = {
  initializeApp: (config: FirebaseWebClientConfig) => FirebaseAppLike;
  getApps: () => FirebaseAppLike[];
  getApp: () => FirebaseAppLike;
};

const normalizeText = (value: string | undefined) => String(value || "").trim();

const getPublicEnv = (key: string, override?: string) => {
  const fromOverride = normalizeText(override);
  if (fromOverride) return fromOverride;
  const v = normalizeText(process.env[key]);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const getFirebaseApp = (overrideConfig?: Partial<FirebaseWebClientConfig>) => {
  if (cachedApp) return cachedApp;

  const firebaseAppModule: FirebaseAppModule = {
    initializeApp,
    getApps,
    getApp,
  };

  const firebaseConfig: FirebaseWebClientConfig = {
    apiKey: getPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY", overrideConfig?.apiKey),
    authDomain: getPublicEnv(
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      overrideConfig?.authDomain
    ),
    projectId: getPublicEnv(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      overrideConfig?.projectId
    ),
    storageBucket: getPublicEnv(
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      overrideConfig?.storageBucket
    ),
    messagingSenderId: getPublicEnv(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      overrideConfig?.messagingSenderId
    ),
    appId: getPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID", overrideConfig?.appId),
    databaseURL:
      normalizeText(overrideConfig?.databaseURL) ||
      normalizeText(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) ||
      undefined,
  };

  const firebaseApp = !firebaseAppModule.getApps().length
    ? firebaseAppModule.initializeApp(firebaseConfig)
    : firebaseAppModule.getApp();

  cachedApp = firebaseApp;
  return firebaseApp;
};

export const getFirestoreDb = () => {
  return getFirestore(getFirebaseApp());
};

export const getFirebaseStorage = () => {
  return getStorage(getFirebaseApp());
};

export const getFirebaseAuth = () => {
  return getAuth(getFirebaseApp());
};
