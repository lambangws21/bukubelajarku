// File: src/app/api/driveImages/route.ts
import { NextResponse } from 'next/server';

const rawGAS = "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";
if (!rawGAS) {
  throw new Error("Missing APPSCRIPT_ENDPOINT environment variable");
}

const GAS_BASE = rawGAS.replace(/\?sheet=.*$/, "");

export async function GET() {
  try {
    const endpointURL = `${GAS_BASE}`; // tidak perlu ?getImages=true karena semua sudah digabung dalam Apps Script

    const response = await fetch(endpointURL, {
      headers: { "Cache-Control": "no-store" },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Unexpected non-JSON response:", text);
      return NextResponse.json({ status: "error", message: "Invalid response from server" }, { status: 500 });
    }

    const json = await response.json();
    if (json.status === "success" && Array.isArray(json.driveImages)) {
      return NextResponse.json({ status: "success", data: json.driveImages });
    }

    return NextResponse.json({ status: "error", message: "driveImages not found in response" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching driveImages:", error);
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 });
  }
}
