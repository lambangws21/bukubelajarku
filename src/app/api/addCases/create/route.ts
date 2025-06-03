// src/app/api/addCases/create/route.ts
import { NextResponse } from "next/server";

// Pastikan di .env.local Anda punya:
// NEXT_PUBLIC_APPSCRIPT_ENDPOINT=https://script.google.com/macros/…/exec
const rawEndpoint = process.env.NEXT_PUBLIC_APPSCRIPT_ENDPOINT;
if (!rawEndpoint) {
  throw new Error("Missing NEXT_PUBLIC_APPSCRIPT_ENDPOINT environment variable");
}
const APPSCRIPT_ENDPOINT = rawEndpoint;

// Jika ada permintaan GET ke route ini, kembalikan 405
export function GET() {
  return NextResponse.json(
    { status: "error", message: "Method GET tidak diizinkan, gunakan POST" },
    { status: 405 }
  );
}

// Hanya POST saja yang meneruskan ke Apps Script
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Apps Script tidak mengembalikan JSON:", text);
      return NextResponse.json(
        { status: "error", message: "Apps Script tidak mengembalikan JSON" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Gagal memanggil POST ke Apps Script:", err);
    if (err instanceof Error) {
      return NextResponse.json(
        { status: "error", message: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { status: "error", message: "Unknown error" },
      { status: 500 }
    );
  }
}
