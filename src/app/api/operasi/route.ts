import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbz6uWrmkveEmr7awZenZwND0LukrefsZUjwoNK3mPuzWa2k566qP54-9QeKlW1Yn945/exec";

const getGasUrl = () => process.env.GAS_OPERASI_URL || DEFAULT_GAS_URL;

export async function GET(req: NextRequest) {
  try {
    const gasUrl = getGasUrl();
    const url = new URL(gasUrl);

    // Forward query params to GAS (if any).
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gasUrl = getGasUrl();
    const body = await req.text();

    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": req.headers.get("content-type") ?? "application/json" },
      body,
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
