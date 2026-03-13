import { NextResponse } from "next/server";
import { clearTsSupportSessionCookie } from "@/lib/tsSupportSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ status: "success" });
  clearTsSupportSessionCookie(response);
  return response;
}

