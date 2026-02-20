// src/lib/firebase/admin.ts
// Server-only helper (requires `firebase-admin` dependency).

type AdminLike = any;
let cachedAdmin: AdminLike | null = null;

const getEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const getFirebaseAdmin = () => {
  if (cachedAdmin) return cachedAdmin;

  let admin: AdminLike;
  try {
    admin = require("firebase-admin");
  } catch {
    throw new Error(
      "Missing dependency: firebase-admin. Install with `npm i firebase-admin`."
    );
  }

  if (!admin.apps?.length) {
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Missing env: FIREBASE_PROJECT_ID");

    const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL");
    const privateKey = getEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
    const storageBucket = getEnv("FIREBASE_STORAGE_BUCKET");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  }

  cachedAdmin = admin;
  return admin;
};

