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

const stripWrappedQuotes = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const normalizeLineBreaks = (value: string) =>
  String(value || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

const extractPemPrivateKey = (value: string) => {
  const match = String(value || "").match(
    /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/
  );
  return match && match[0] ? match[0].trim() : "";
};

const tryDecodeBase64Utf8 = (value: string) => {
  const input = String(value || "").trim();
  if (!input) return "";
  const normalized = input.replace(/[\s\r\n]+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) return "";

  try {
    const decoded = Buffer.from(normalized, "base64").toString("utf-8");
    return decoded.trim();
  } catch {
    return "";
  }
};

const assertPrivateKeyUsable = (privateKey: string) => {
  try {
    const crypto = require("node:crypto") as {
      createPrivateKey: (args: { key: string; format: "pem" }) => unknown;
    };
    crypto.createPrivateKey({ key: privateKey, format: "pem" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid private key";
    throw new Error(
      `FIREBASE_PRIVATE_KEY tidak valid/corrupt (${message}). Ambil ulang private_key dari file service-account.json, atau pakai FIREBASE_SERVICE_ACCOUNT_JSON(_BASE64).`
    );
  }
};

const normalizePrivateKey = (value: string): string => {
  const raw = stripWrappedQuotes(value).trim();
  if (!raw) return "";

  const pemDirect = extractPemPrivateKey(normalizeLineBreaks(raw));
  if (pemDirect) return pemDirect;

  const parseServiceAccountPrivateKey = (text: string): string => {
    const source = String(text || "").trim();
    if (!source.startsWith("{")) return "";
    try {
      const parsed = JSON.parse(source) as { private_key?: string };
      const privateKey = String(parsed.private_key || "").trim();
      if (!privateKey) return "";
      return normalizePrivateKey(privateKey);
    } catch {
      return "";
    }
  };

  const privateKeyFromRawJson = parseServiceAccountPrivateKey(raw);
  if (privateKeyFromRawJson) return privateKeyFromRawJson;

  const decoded = tryDecodeBase64Utf8(raw);
  if (decoded) {
    const privateKeyFromDecodedJson = parseServiceAccountPrivateKey(decoded);
    if (privateKeyFromDecodedJson) return privateKeyFromDecodedJson;

    const pemFromDecoded = extractPemPrivateKey(normalizeLineBreaks(decoded));
    if (pemFromDecoded) return pemFromDecoded;
  }

  return normalizeLineBreaks(raw);
};

const parseServiceAccountFromEnv = () => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 || "";
  const sourceJson = stripWrappedQuotes(rawJson);
  const sourceBase64 = stripWrappedQuotes(rawBase64);
  if (!sourceJson && !sourceBase64) return null;

  let jsonText = "";
  if (sourceJson) {
    jsonText = sourceJson;
  } else {
    if (sourceBase64.includes("BEGIN PRIVATE KEY")) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 harus berisi base64 dari file JSON service account penuh, bukan private key mentah."
      );
    }

    jsonText = tryDecodeBase64Utf8(sourceBase64);
    if (!jsonText) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 tidak valid. Isi dengan base64 dari file service account JSON."
      );
    }
  }

  const normalizedJsonText = String(jsonText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!normalizedJsonText.startsWith("{")) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON harus berupa JSON object (bukan private key mentah)."
    );
  }

  try {
    const parsed = JSON.parse(normalizedJsonText) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    const projectId = String(parsed.project_id || "").trim();
    const clientEmail = String(parsed.client_email || "").trim();
    const privateKey = normalizePrivateKey(String(parsed.private_key || ""));
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON tidak lengkap (project_id, client_email, private_key)."
      );
    }
    return { projectId, clientEmail, privateKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON parse error";
    throw new Error(`Gagal parse service account JSON: ${message}`);
  }
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
    const serviceAccount = parseServiceAccountFromEnv();
    const projectId = (
      serviceAccount?.projectId ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      ""
    ).trim();
    if (!projectId) throw new Error("Missing env: FIREBASE_PROJECT_ID");

    const clientEmail = (
      serviceAccount?.clientEmail || getEnv("FIREBASE_CLIENT_EMAIL")
    ).trim();
    const privateKey = normalizePrivateKey(
      serviceAccount?.privateKey || getEnv("FIREBASE_PRIVATE_KEY")
    );
    assertPrivateKeyUsable(privateKey);
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

    try {
      admin.initializeApp(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown firebase-admin init error";
      throw new Error(
        `Firebase Admin init gagal: ${message}. Cek FIREBASE_PRIVATE_KEY atau gunakan FIREBASE_SERVICE_ACCOUNT_JSON(_BASE64).`
      );
    }
  }

  cachedAdmin = admin;
  return admin;
};
