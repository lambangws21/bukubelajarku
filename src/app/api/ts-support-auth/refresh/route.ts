import { NextRequest, NextResponse } from "next/server";
import {
  createTsSupportSessionToken,
  getTsSupportSessionFromRequest,
  setTsSupportSessionCookie,
} from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = getTsSupportSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const nextToken = createTsSupportSessionToken(session.user);
  const response = NextResponse.json({
    status: "success",
    data: {
      refreshedAt: new Date().toISOString(),
    },
  });
  setTsSupportSessionCookie(response, nextToken);
  return response;
}

