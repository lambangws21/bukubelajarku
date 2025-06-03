// File: src/app/api/dataDokter/getImages/route.ts
import { NextResponse } from "next/server";

// Ambil base URL dari .env.local (tanpa query string)
const rawGAS = process.env.APPSCRIPT_ENDPOINT;
if (!rawGAS) {
  throw new Error("Missing APPSCRIPT_ENDPOINT environment variable");
}

// Pastikan kita hanya menambahkan `?getImages=true` sekali
const GAS_BASE = rawGAS.replace(/\?getImages=.*$/, "");

export async function GET(_req: Request) {
  // Bangun URL lengkap dengan query
  const endpointURL = `${GAS_BASE}?getImages=true`;

  try {
    const response = await fetch(endpointURL, {
      headers: { "Cache-Control": "no-store" },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Unexpected response (GET images):", textResponse);
      return NextResponse.json(
        { error: "API did not return JSON" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
