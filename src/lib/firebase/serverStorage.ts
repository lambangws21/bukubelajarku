import { createSign } from "crypto";

export type FirebaseStorageServerConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  bucket: string;
};

type CachedToken = { accessToken: string; expiresAtMs: number };
let cachedToken: CachedToken | null = null;

const base64Url = (input: Buffer | string) => {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const signJwtRs256 = (payload: Record<string, unknown>, privateKey: string) => {
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(data);
  signer.end();
  const signature = signer.sign(privateKey);
  return `${data}.${base64Url(signature)}`;
};

export const getFirebaseStorageServerConfig = (): FirebaseStorageServerConfig => {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "";

  if (!projectId) throw new Error("Missing env: FIREBASE_PROJECT_ID");
  if (!clientEmail) throw new Error("Missing env: FIREBASE_CLIENT_EMAIL");
  if (!privateKeyRaw) throw new Error("Missing env: FIREBASE_PRIVATE_KEY");
  if (!bucket) throw new Error("Missing env: FIREBASE_STORAGE_BUCKET");

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey, bucket };
};

export const getGcpAccessTokenForStorage = async (
  cfg: FirebaseStorageServerConfig,
  scope = "https://www.googleapis.com/auth/devstorage.read_only"
) => {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAtMs - 60_000) return cachedToken.accessToken;

  const iat = Math.floor(now / 1000);
  const exp = iat + 60 * 50; // 50 minutes

  const assertion = signJwtRs256(
    {
      iss: cfg.clientEmail,
      sub: cfg.clientEmail,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp,
    },
    cfg.privateKey
  );

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to get access token (${res.status}): ${text || res.statusText}`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Token response missing access_token");

  const expiresInSec = typeof json.expires_in === "number" ? json.expires_in : 3600;
  cachedToken = { accessToken: json.access_token, expiresAtMs: now + expiresInSec * 1000 };
  return json.access_token;
};

