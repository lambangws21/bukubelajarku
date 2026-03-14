import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getTsSupportSessionFromRequest } from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TOPIC = "ts_support_activity";

const getTopic = () => {
  const fromEnv = String(process.env.FCM_TS_SUPPORT_TOPIC || "").trim();
  return fromEnv || DEFAULT_TOPIC;
};

const readToken = (value: unknown) => String(value || "").trim();

const validateToken = (token: string) => {
  if (!token) return "Token FCM wajib diisi.";
  if (token.length < 60) return "Format token FCM tidak valid.";
  return "";
};

export async function POST(req: NextRequest) {
  const session = getTsSupportSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const token = readToken(payload.token);
    const validationError = validateToken(token);
    if (validationError) {
      return NextResponse.json(
        { status: "error", message: validationError },
        { status: 400 }
      );
    }

    const admin = getFirebaseAdmin();
    await admin.messaging().subscribeToTopic([token], getTopic());

    return NextResponse.json({
      status: "success",
      data: {
        tokenRegistered: true,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mendaftarkan token notifikasi.";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getTsSupportSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const token = readToken(payload.token);
    const validationError = validateToken(token);
    if (validationError) {
      return NextResponse.json(
        { status: "error", message: validationError },
        { status: 400 }
      );
    }

    const admin = getFirebaseAdmin();
    await admin.messaging().unsubscribeFromTopic([token], getTopic());

    return NextResponse.json({
      status: "success",
      data: {
        tokenRegistered: false,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menghapus token notifikasi.";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

