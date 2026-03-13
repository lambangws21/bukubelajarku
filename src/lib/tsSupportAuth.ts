import "server-only";

import type { TsSupportRole } from "@/lib/tsSupportSession";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export type TsSupportUserStatus = "active" | "inactive";

export type TsSupportUserProfile = {
  uid: string;
  email: string;
  name: string;
  role: TsSupportRole;
  status: TsSupportUserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type TsSupportAuditAction =
  | "create_schedule"
  | "update_schedule"
  | "delete_schedule"
  | "comment_schedule"
  | "create_team"
  | "update_team"
  | "delete_team"
  | "update_team_status";

export type TsSupportAuditLog = {
  id: string;
  createdAt: string;
  actor: {
    uid: string;
    email: string;
    name: string;
    username?: string;
    role: TsSupportRole;
  };
  action: TsSupportAuditAction;
  entityType: "schedule" | "team";
  entityId: string;
  before: unknown;
  after: unknown;
  meta?: {
    ip?: string;
    userAgent?: string;
    comment?: string;
    source?: string;
    status?: string;
  };
};

type FirebaseSignInResponse = {
  localId: string;
  email: string;
  idToken: string;
};

const TS_SUPPORT_USERNAME_DOMAIN = "ts-support.local";

const sanitizeUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

export const normalizeTsSupportLoginEmail = (value: unknown) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("@")) return raw;
  const username = sanitizeUsername(raw);
  if (!username) return "";
  return `${username}@${TS_SUPPORT_USERNAME_DOMAIN}`;
};

const ensureApiKey = () => {
  const key =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "";
  if (!key.trim()) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY / FIREBASE_WEB_API_KEY belum diset.");
  }
  return key.trim();
};

const getRealtimeDbBaseUrl = () => {
  const raw =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "";
  const normalized = raw.trim().replace(/\/$/, "");
  if (!normalized) throw new Error("FIREBASE_DATABASE_URL belum diset.");
  return normalized;
};

const getRealtimeDbAuthQuery = () => {
  const token = String(process.env.FIREBASE_DB_AUTH_TOKEN || "").trim();
  if (!token) return "";
  return `auth=${encodeURIComponent(token)}`;
};

const buildRealtimeDbUrl = (path: string, query?: string) => {
  const baseUrl = getRealtimeDbBaseUrl();
  const cleanPath = path.replace(/^\/+/, "");
  const mergedQuery = [query, getRealtimeDbAuthQuery()].filter(Boolean).join("&");
  return `${baseUrl}/${cleanPath}.json${mergedQuery ? `?${mergedQuery}` : ""}`;
};

const callIdentityToolkit = async <T>(endpoint: string, body: Record<string, unknown>) => {
  const apiKey = ensureApiKey();
  const url = `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: Record<string, any> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, any>) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    const message = String(
      json?.error?.message || json?.error || `Firebase auth error (${res.status})`
    );
    throw new Error(message);
  }

  return json as T;
};

export const firebaseRegisterEmailPassword = async (input: {
  email: string;
  password: string;
}) => {
  const response = await callIdentityToolkit<FirebaseSignInResponse>("accounts:signUp", {
    email: input.email,
    password: input.password,
    returnSecureToken: true,
  });
  return {
    uid: String(response.localId || ""),
    email: String(response.email || input.email),
    idToken: String(response.idToken || ""),
  };
};

export const firebaseLoginEmailPassword = async (input: {
  email: string;
  password: string;
}) => {
  const response = await callIdentityToolkit<FirebaseSignInResponse>(
    "accounts:signInWithPassword",
    {
      email: input.email,
      password: input.password,
      returnSecureToken: true,
    }
  );
  return {
    uid: String(response.localId || ""),
    email: String(response.email || input.email),
    idToken: String(response.idToken || ""),
  };
};

const toIsoStringSafe = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text) return new Date().toISOString();
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const resolveRoleFromClaims = (
  claims: Record<string, unknown> | null | undefined,
  fallback: unknown
) =>
  normalizeTsSupportRole(
    claims?.tsSupportRole ||
      claims?.role ||
      fallback
  );

const resolveStatusFromClaims = (
  claims: Record<string, unknown> | null | undefined,
  fallback: unknown
) => normalizeStatus(claims?.tsSupportStatus || claims?.status || fallback);

export const firebaseCreateTsSupportAuthUser = async (input: {
  email: string;
  password: string;
  name: string;
  role: TsSupportRole;
  status?: TsSupportUserStatus;
}) => {
  const admin = getFirebaseAdmin();
  const auth = admin.auth();
  const role = normalizeTsSupportRole(input.role);
  const status = normalizeStatus(input.status || "active");

  const userRecord = await auth.createUser({
    email: String(input.email || "").trim().toLowerCase(),
    password: String(input.password || ""),
    displayName: String(input.name || "").trim(),
    disabled: status !== "active",
  });

  await auth.setCustomUserClaims(userRecord.uid, {
    tsSupportRole: role,
    tsSupportStatus: status,
  });

  return {
    uid: String(userRecord.uid || ""),
    email: String(userRecord.email || input.email),
    name: String(userRecord.displayName || input.name),
    role,
    status,
    createdAt: toIsoStringSafe(userRecord.metadata?.creationTime),
    updatedAt: new Date().toISOString(),
  } satisfies TsSupportUserProfile;
};

export const getTsSupportProfileFromIdToken = async (
  idToken: string
): Promise<TsSupportUserProfile | null> => {
  const token = String(idToken || "").trim();
  if (!token) return null;

  try {
    const admin = getFirebaseAdmin();
    const auth = admin.auth();
    const decoded = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decoded.uid);
    const claims = ((decoded as any)?.tsSupportRole ||
      (decoded as any)?.role ||
      (decoded as any)?.tsSupportStatus ||
      (decoded as any)?.status)
      ? (decoded as Record<string, unknown>)
      : (userRecord.customClaims as Record<string, unknown> | undefined);

    const role = resolveRoleFromClaims(claims, "ts");
    const statusFromClaims = resolveStatusFromClaims(claims, userRecord.disabled ? "inactive" : "active");
    const status = userRecord.disabled ? "inactive" : statusFromClaims;

    return {
      uid: String(userRecord.uid || decoded.uid || ""),
      email: String(userRecord.email || decoded.email || ""),
      name: String(userRecord.displayName || decoded.email || ""),
      role,
      status,
      createdAt: toIsoStringSafe(userRecord.metadata?.creationTime),
      updatedAt: new Date().toISOString(),
      lastLoginAt: toIsoStringSafe(userRecord.metadata?.lastSignInTime),
    } satisfies TsSupportUserProfile;
  } catch {
    return null;
  }
};

export const normalizeTsSupportRole = (value: unknown): TsSupportRole => {
  const role = String(value || "").trim().toLowerCase();
  if (
    role === "sales" ||
    role === "direktor" ||
    role === "director" ||
    role === "direktur"
  ) {
    return "sales";
  }
  if (role === "logistik" || role === "logistic") return "logistik";
  if (role === "ts" || role === "teknikal support" || role === "technical support") {
    return "ts";
  }
  if (role === "admin") return "admin";
  if (role === "coordinator") return "coordinator";
  if (role === "viewer") return "viewer";
  return "ts";
};

const normalizeStatus = (value: unknown): TsSupportUserStatus => {
  const status = String(value || "").trim().toLowerCase();
  return status === "inactive" ? "inactive" : "active";
};

export const getTsSupportUserProfile = async (
  uid: string
): Promise<TsSupportUserProfile | null> => {
  const key = String(uid || "").trim();
  if (!key) return null;

  const res = await fetch(buildRealtimeDbUrl(`tsSupportUsers/${encodeURIComponent(key)}`), {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as Record<string, unknown> | null;
  if (!raw) return null;

  return {
    uid: key,
    email: String(raw.email || ""),
    name: String(raw.name || ""),
    role: normalizeTsSupportRole(raw.role),
    status: normalizeStatus(raw.status),
    createdAt: String(raw.createdAt || ""),
    updatedAt: String(raw.updatedAt || ""),
    lastLoginAt: raw.lastLoginAt ? String(raw.lastLoginAt) : undefined,
  } satisfies TsSupportUserProfile;
};

export const upsertTsSupportUserProfile = async (
  uid: string,
  input: {
    email: string;
    name: string;
    role?: TsSupportRole;
    status?: TsSupportUserStatus;
  }
): Promise<TsSupportUserProfile> => {
  const key = String(uid || "").trim();
  if (!key) throw new Error("UID user kosong.");
  const now = new Date().toISOString();
  const existing = await getTsSupportUserProfile(key);

  const payload = {
    uid: key,
    email: String(input.email || existing?.email || "").trim().toLowerCase(),
    name: String(input.name || existing?.name || "").trim(),
    role: normalizeTsSupportRole(input.role || existing?.role || "ts"),
    status: normalizeStatus(input.status || existing?.status || "active"),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastLoginAt: existing?.lastLoginAt || "",
  };

  const res = await fetch(buildRealtimeDbUrl(`tsSupportUsers/${encodeURIComponent(key)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gagal simpan user TS Support (${res.status}): ${text || res.statusText}`);
  }

  return payload as TsSupportUserProfile;
};

export const touchTsSupportUserLastLogin = async (uid: string) => {
  const key = String(uid || "").trim();
  if (!key) return;

  await fetch(buildRealtimeDbUrl(`tsSupportUsers/${encodeURIComponent(key)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    cache: "no-store",
  });
};

export const appendTsSupportAuditLog = async (payload: Omit<TsSupportAuditLog, "id" | "createdAt">) => {
  const now = new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const log: TsSupportAuditLog = {
    id,
    createdAt: now,
    ...payload,
  };

  let adminWriteError: unknown = null;
  try {
    const admin = getFirebaseAdmin();
    await admin.firestore().collection("tsSupportAuditLogs").doc(id).set(log);
    return log;
  } catch (error) {
    adminWriteError = error;
  }

  const res = await fetch(buildRealtimeDbUrl(`tsSupportAuditLogs/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const adminMessage =
      adminWriteError instanceof Error ? `; firestore: ${adminWriteError.message}` : "";
    throw new Error(
      `Gagal simpan audit log (${res.status}): ${text || res.statusText}${adminMessage}`
    );
  }

  return log;
};

export const listTsSupportAuditLogs = async (
  limit = 200
): Promise<TsSupportAuditLog[]> => {
  const safeLimit = Math.min(500, Math.max(1, Number(limit) || 200));
  try {
    const admin = getFirebaseAdmin();
    const snapshot = await admin
      .firestore()
      .collection("tsSupportAuditLogs")
      .orderBy("createdAt", "desc")
      .limit(safeLimit)
      .get();

    return snapshot.docs
      .map((doc: { data: () => unknown }) => doc.data() as TsSupportAuditLog)
      .filter(
        (log: TsSupportAuditLog | null | undefined): log is TsSupportAuditLog =>
          Boolean(log && typeof log === "object" && log.id && log.createdAt)
      );
  } catch {
    const query = `orderBy=${encodeURIComponent('"createdAt"')}&limitToLast=${safeLimit}`;
    const res = await fetch(buildRealtimeDbUrl("tsSupportAuditLogs", query), {
      cache: "no-store",
    });
    if (!res.ok) return [] as TsSupportAuditLog[];
    const raw = (await res.json()) as Record<string, TsSupportAuditLog> | null;
    if (!raw || typeof raw !== "object") return [] as TsSupportAuditLog[];

    return Object.values(raw)
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }
};
