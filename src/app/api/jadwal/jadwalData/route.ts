// app/api/ts/route.ts (Next.js App Router API Route)

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbw5KxMn7OLci-nZ2WhYNObGKlyHexKj23nrsqC0uUm3QEtLZfcC33Qpye7atnGPQbzC/exec",
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan saat request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sheet = url.searchParams.get("sheet");

  if (!sheet) {
    return NextResponse.json({ error: "Parameter 'sheet' dibutuhkan" }, { status: 400 });
  }

  const response = await fetch(
    `https://script.google.com/macros/s/AKfycbw5KxMn7OLci-nZ2WhYNObGKlyHexKj23nrsqC0uUm3QEtLZfcC33Qpye7atnGPQbzC/exec?sheet=${sheet}`
  );

  const result = await response.json();
  return NextResponse.json(result);
}
