import { NextRequest, NextResponse } from "next/server";
import { getTsSupportSessionFromRequest } from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_MANAGE_EMAIL = "admin@ts-support.local";

const canManageByIdentity = (email: string, role: string) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedEmail !== ADMIN_MANAGE_EMAIL) return false;
  return normalizedRole === "sales" || normalizedRole === "coordinator" || normalizedRole === "admin";
};

export async function GET(req: NextRequest) {
  const session = getTsSupportSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { status: "unauthenticated", user: null, canManage: false },
      { status: 200 }
    );
  }

  return NextResponse.json({
    status: "success",
    user: session.user,
    canManage: canManageByIdentity(session.user.email, session.user.role),
  });
}
