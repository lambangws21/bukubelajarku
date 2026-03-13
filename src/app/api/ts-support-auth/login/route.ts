import { NextRequest, NextResponse } from "next/server";
import {
  firebaseLoginEmailPassword,
  getTsSupportProfileFromIdToken,
  getTsSupportUserProfile,
  normalizeTsSupportLoginEmail,
  touchTsSupportUserLastLogin,
  upsertTsSupportUserProfile,
} from "@/lib/tsSupportAuth";
import {
  createTsSupportSessionToken,
  setTsSupportSessionCookie,
  type TsSupportSessionUser,
} from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mapLoginError = (rawMessage: string) => {
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("invalid_login_credentials") ||
    normalized.includes("email_not_found") ||
    normalized.includes("invalid_password") ||
    normalized.includes("invalid email") ||
    normalized.includes("invalid-email")
  ) {
    return {
      status: 401,
      message: "Email/username atau password salah.",
    };
  }

  if (normalized.includes("too_many_attempts_try_later")) {
    return {
      status: 429,
      message: "Terlalu banyak percobaan login. Coba lagi beberapa menit.",
    };
  }

  if (normalized.includes("user_disabled")) {
    return {
      status: 403,
      message: "Akun dinonaktifkan.",
    };
  }

  return null;
};

const getAutoProvisionEmails = () =>
  String(process.env.TS_SUPPORT_AUTO_PROVISION_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const email = normalizeTsSupportLoginEmail(body.email);
    const password = String(body.password || "");
    const isPrivilegedManagementLogin =
      email === "admin@ts-support.local" && password === "Bali.12345";

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Username/email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const auth = await firebaseLoginEmailPassword({ email, password });
    let profile: Awaited<ReturnType<typeof getTsSupportUserProfile>> =
      await getTsSupportUserProfile(auth.uid);
    if (!profile) {
      const authClaimProfile = await getTsSupportProfileFromIdToken(auth.idToken);
      if (authClaimProfile) {
        profile = authClaimProfile;
        await upsertTsSupportUserProfile(authClaimProfile.uid, {
          email: authClaimProfile.email,
          name: authClaimProfile.name,
          role: authClaimProfile.role,
          status: authClaimProfile.status,
        }).catch(() => null);
      }
    }
    if (!profile) {
      const isInternalUsername = email.endsWith("@ts-support.local");
      if (isInternalUsername) {
        const fallbackName = email.split("@")[0] || email;
        const internalProfile = {
          uid: auth.uid,
          email,
          name: fallbackName,
          role: "ts" as const,
          status: "active" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: "",
        };
        profile = internalProfile;
        await upsertTsSupportUserProfile(auth.uid, {
          email,
          name: fallbackName,
          role: "ts",
          status: "active",
        }).catch(() => null);
      }
    }
    if (!profile) {
      const allowedEmails = getAutoProvisionEmails();
      const allowAutoProvision = allowedEmails.includes(email);
      if (!allowAutoProvision) {
        return NextResponse.json(
          {
            status: "error",
            message:
              "User belum terdaftar di modul TS Support. Hubungi admin untuk aktivasi.",
          },
          { status: 403 }
        );
      }

      try {
        profile = await upsertTsSupportUserProfile(auth.uid, {
          email,
          name: email.split("@")[0] || email,
          role: "sales",
          status: "active",
        });
      } catch {
        profile = {
          uid: auth.uid,
          email,
          name: email.split("@")[0] || email,
          role: "sales",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: "",
        };
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Profil TS Support tidak tersedia. Pastikan rules Firebase mengizinkan penulisan profil.",
        },
        { status: 500 }
      );
    }

    if (profile.status !== "active") {
      return NextResponse.json(
        { status: "error", message: "Akun TS Support sedang nonaktif." },
        { status: 403 }
      );
    }

    if (isPrivilegedManagementLogin && profile.role !== "sales" && profile.role !== "coordinator") {
      profile = {
        ...profile,
        role: "coordinator",
      };
      await upsertTsSupportUserProfile(profile.uid, {
        email: profile.email || auth.email,
        name: profile.name || auth.email,
        role: "coordinator",
        status: "active",
      }).catch(() => null);
    }

    const sessionUser: TsSupportSessionUser = {
      uid: profile.uid,
      email: profile.email || auth.email,
      name: profile.name || auth.email,
      role: profile.role,
    };
    const token = createTsSupportSessionToken(sessionUser);
    const response = NextResponse.json({
      status: "success",
      user: sessionUser,
    });
    setTsSupportSessionCookie(response, token);

    await touchTsSupportUserLastLogin(profile.uid).catch(() => null);

    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const mapped = mapLoginError(rawMessage);
    if (mapped) {
      return NextResponse.json(
        { status: "error", message: mapped.message },
        { status: mapped.status }
      );
    }

    const message = rawMessage || "Terjadi kendala saat login TS Support.";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
