import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export type TsSupportRole =
  | "sales"
  | "ts"
  | "logistik"
  | "admin"
  | "coordinator"
  | "viewer";

export type TsSupportSessionUser = {
  uid: string;
  email: string;
  name: string;
  role: TsSupportRole;
};

const MANAGE_ROLES = new Set<TsSupportRole>([
  "sales",
  "coordinator",
]);

export const canManageTsSupport = (role: TsSupportRole) =>
  MANAGE_ROLES.has(role);

type TsSupportSessionPayload = {
  user: TsSupportSessionUser;
  iat: number;
  exp: number;
};

export const TS_SUPPORT_SESSION_COOKIE_NAME = "ts_support_session";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 jam

const getSessionSecret = () => {
  const secret =
    process.env.TS_SUPPORT_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";
  return secret.trim();
};

const sign = (data: string, secret: string) =>
  createHmac("sha256", secret).update(data).digest("base64url");

const decodePayload = (encoded: string): TsSupportSessionPayload | null => {
  try {
    const text = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(text) as TsSupportSessionPayload;
    if (!parsed?.user?.uid || !parsed?.exp || !parsed?.iat) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const createTsSupportSessionToken = (
  user: TsSupportSessionUser,
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS
) => {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("TS_SUPPORT_SESSION_SECRET belum diset di environment.");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const payload: TsSupportSessionPayload = {
    user,
    iat: nowSec,
    exp: nowSec + Math.max(60, ttlSeconds),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

export const verifyTsSupportSessionToken = (token: string | null | undefined) => {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = String(token).split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    givenBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(givenBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return payload;
};

export const getTsSupportSessionFromRequest = (req: NextRequest) => {
  const token = req.cookies.get(TS_SUPPORT_SESSION_COOKIE_NAME)?.value;
  return verifyTsSupportSessionToken(token);
};

export const getTsSupportSessionFromCookieStore = (cookieStore: {
  get: (name: string) => { value: string } | undefined;
}) => {
  const token = cookieStore.get(TS_SUPPORT_SESSION_COOKIE_NAME)?.value;
  return verifyTsSupportSessionToken(token);
};

export const setTsSupportSessionCookie = (res: NextResponse, token: string) => {
  res.cookies.set(TS_SUPPORT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_SESSION_TTL_SECONDS,
  });
};

export const clearTsSupportSessionCookie = (res: NextResponse) => {
  res.cookies.set(TS_SUPPORT_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
