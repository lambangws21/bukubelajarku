import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL: string;
  vapidKey: string;
};

const normalizeText = (value: string | undefined) => String(value || "").trim();

const readFirebasePublicConfig = (): FirebasePublicConfig => ({
  apiKey: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeText(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  databaseURL: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
  vapidKey: normalizeText(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
});

export async function GET() {
  const config = readFirebasePublicConfig();

  return NextResponse.json({
    status: "success",
    data: config,
    meta: {
      hasRequiredFirebaseWebConfig: Boolean(
        config.apiKey &&
          config.authDomain &&
          config.projectId &&
          config.storageBucket &&
          config.messagingSenderId &&
          config.appId
      ),
      hasVapidKey: Boolean(config.vapidKey),
    },
  });
}
