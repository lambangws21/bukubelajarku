// src/lib/firebase/admin.ts
// Server-only helper (requires `firebase-admin` dependency).

type AdminLike = any;
let cachedAdmin: AdminLike | null = null;

const isLikelyBucketName = (value: string) => {
  const bucket = value.trim();
  if (!bucket) return false;
  if (/^https?:\/\//i.test(bucket)) return false;
  if (bucket.includes("/")) return false;
  return /^[a-z0-9.\-_]+$/i.test(bucket);
};

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
    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "";

    const options: Record<string, unknown> = {
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    };
    if (isLikelyBucketName(storageBucket)) {
      options.storageBucket = storageBucket.trim();
    }

    admin.initializeApp(options);
  }

  cachedAdmin = admin;
  return admin;
};
