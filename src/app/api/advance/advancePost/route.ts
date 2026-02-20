import { NextRequest, NextResponse } from "next/server";

const APPSCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "error", message: "Payload tidak valid" },
        { status: 400 }
      );
    }

    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let parsed: any = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: parsed?.message || `Apps Script error (${response.status}).`,
          upstream: rawText?.slice(0, 240) || null,
        },
        { status: response.status }
      );
    }

    if (parsed && typeof parsed === "object") {
      return NextResponse.json(parsed, { status: 200 });
    }

    if (rawText && /success|berhasil/i.test(rawText)) {
      return NextResponse.json(
        { status: "success", message: rawText },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Response dari Apps Script tidak valid",
        upstream: rawText?.slice(0, 240) || null,
      },
      { status: 502 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
