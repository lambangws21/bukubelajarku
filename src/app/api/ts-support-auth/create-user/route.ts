import { NextRequest, NextResponse } from "next/server";
import {
  firebaseRegisterEmailPassword,
  firebaseCreateTsSupportAuthUser,
  normalizeTsSupportLoginEmail,
  normalizeTsSupportRole,
  type TsSupportUserProfile,
  upsertTsSupportUserProfile,
} from "@/lib/tsSupportAuth";
import {
  canManageTsSupport,
  getTsSupportSessionFromRequest,
} from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mapCreateUserError = (rawMessage: string) => {
  const normalized = rawMessage.toLowerCase();
  if (
    normalized.includes("email-already-exists") ||
    normalized.includes("email_exists") ||
    normalized.includes("email already exists")
  ) {
    return {
      status: 409,
      message: "Email/username sudah terdaftar.",
    };
  }

  if (
    normalized.includes("invalid-password") ||
    normalized.includes("weak_password") ||
    normalized.includes("password should be at least")
  ) {
    return {
      status: 400,
      message: "Password tidak valid. Minimal 6 karakter.",
    };
  }

  if (
    normalized.includes("operation_not_allowed") ||
    normalized.includes("password sign-in is disabled")
  ) {
    return {
      status: 503,
      message:
        "Email/password sign-in belum aktif di Firebase Authentication. Aktifkan dulu di Firebase Console.",
    };
  }

  return null;
};

export async function POST(req: NextRequest) {
  try {
    const session = getTsSupportSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized. Silakan login TS Support." },
        { status: 401 }
      );
    }

    if (!canManageTsSupport(session.user.role)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Role akun ini hanya bisa mode lihat (readonly).",
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      username?: string;
      email?: string;
      name?: string;
      role?: string;
      password?: string;
    };

    const email = normalizeTsSupportLoginEmail(body.username || body.email || "");
    const fallbackName = String(body.username || body.email || "").trim();
    const name = String(body.name || fallbackName).trim();
    const role = normalizeTsSupportRole(body.role || "ts");
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Username/email dan password wajib diisi." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { status: "error", message: "Nama staff wajib diisi." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { status: "error", message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    let authProfile: TsSupportUserProfile;
    let authWarning = "";
    try {
      authProfile = await firebaseCreateTsSupportAuthUser({
        email,
        password,
        name,
        role,
        status: "active",
      });
    } catch (error) {
      const adminMessage = error instanceof Error ? error.message : "";
      const mappedAdminError = mapCreateUserError(adminMessage);
      if (mappedAdminError) {
        return NextResponse.json(
          { status: "error", message: mappedAdminError.message },
          { status: mappedAdminError.status }
        );
      }

      const fallback = await firebaseRegisterEmailPassword({
        email,
        password,
      });
      authProfile = {
        uid: fallback.uid,
        email,
        name,
        role,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      authWarning =
        "Firebase Admin tidak aktif, akun dibuat via Auth standar. Role akan mengikuti profil database.";
    }

    let profile = authProfile;
    let warning = "";
    try {
      profile = await upsertTsSupportUserProfile(authProfile.uid, {
        email,
        name,
        role,
        status: "active",
      });
    } catch (error) {
      warning =
        error instanceof Error
          ? `Profil RTDB gagal disimpan: ${error.message}`
          : "Profil RTDB gagal disimpan.";
    }

    const finalWarning = [authWarning, warning].filter(Boolean).join(" ");

    return NextResponse.json({
      status: "success",
      warning: finalWarning,
      data: {
        uid: profile.uid,
        name: profile.name,
        role: profile.role,
        email: profile.email,
      },
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const mappedError = mapCreateUserError(rawMessage);
    if (mappedError) {
      return NextResponse.json(
        { status: "error", message: mappedError.message },
        { status: mappedError.status }
      );
    }

    const message =
      rawMessage || "Terjadi kendala saat membuat akun staff TS Support.";
    return NextResponse.json(
      {
        status: "error",
        message,
        detail: process.env.NODE_ENV === "production" ? undefined : rawMessage,
      },
      { status: 500 }
    );
  }
}
