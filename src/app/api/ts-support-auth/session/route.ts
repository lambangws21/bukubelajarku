import { NextRequest, NextResponse } from "next/server";
import { getTsSupportSessionFromRequest } from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = getTsSupportSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({ status: "success", user: session.user });
}

