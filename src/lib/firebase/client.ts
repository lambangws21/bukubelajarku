"use client";

// src/lib/firebase/client.ts
// Client-side helper (requires `firebase` dependency).

type FirebaseAppLike = any;
let cachedApp: FirebaseAppLike | null = null;

const getPublicEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const getFirebaseApp = () => {
  if (cachedApp) return cachedApp;

  let firebaseApp: any;
  try {
    const firebase = require("firebase/app");
    const { initializeApp, getApps, getApp } = firebase;

    const firebaseConfig = {
      apiKey: getPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
      authDomain: getPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: getPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: getPublicEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: getPublicEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: getPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    };

    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  } catch {
    throw new Error("Missing dependency: firebase. Install with `npm i firebase`.");
  }

  cachedApp = firebaseApp;
  return firebaseApp;
};

export const getFirestoreDb = () => {

  const { getFirestore } = require("firebase/firestore");
  return getFirestore(getFirebaseApp());
};

export const getFirebaseStorage = () => {

  const { getStorage } = require("firebase/storage");
  return getStorage(getFirebaseApp());
};

export const getFirebaseAuth = () => {

  const { getAuth } = require("firebase/auth");
  return getAuth(getFirebaseApp());
};

