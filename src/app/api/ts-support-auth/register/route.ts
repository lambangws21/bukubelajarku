import { NextRequest, NextResponse } from "next/server";
import {
  firebaseRegisterEmailPassword,
  normalizeTsSupportLoginEmail,
  normalizeTsSupportRole,
  upsertTsSupportUserProfile,
} from "@/lib/tsSupportAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      inviteToken?: string;
      role?: string;
    };

    const name = String(body.name || "").trim();
    const email = normalizeTsSupportLoginEmail(body.email);
    const password = String(body.password || "");
    const inviteToken = String(body.inviteToken || "").trim();
    const role = normalizeTsSupportRole(body.role || "ts");

    if (!name || !email || !password) {
      return NextResponse.json(
        { status: "error", message: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { status: "error", message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const requiredInviteToken = String(
      process.env.TS_SUPPORT_REGISTER_TOKEN || ""
    ).trim();
    if (requiredInviteToken && requiredInviteToken !== inviteToken) {
      return NextResponse.json(
        { status: "error", message: "Kode registrasi tidak valid." },
        { status: 403 }
      );
    }

    const auth = await firebaseRegisterEmailPassword({ email, password });
    const profile = await upsertTsSupportUserProfile(auth.uid, {
      email,
      name,
      role,
      status: "active",
    });

    return NextResponse.json({
      status: "success",
      user: {
        uid: profile.uid,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kendala saat registrasi TS Support.";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
