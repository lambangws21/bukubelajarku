import { NextRequest, NextResponse } from "next/server";
import { listTsSupportAuditLogs } from "@/lib/tsSupportAuth";
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

  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 150);
    const action = String(url.searchParams.get("action") || "").trim();
    const entityId = String(url.searchParams.get("entityId") || "").trim();
    const actorUid = String(url.searchParams.get("actorUid") || "").trim();

    const logs = await listTsSupportAuditLogs(limit);
    const filtered = logs.filter((log) => {
      if (action && log.action !== action) return false;
      if (entityId && log.entityId !== entityId) return false;
      if (actorUid && log.actor.uid !== actorUid) return false;
      return true;
    });

    return NextResponse.json({
      status: "success",
      data: filtered,
      total: filtered.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil audit log.";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

