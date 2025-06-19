// File: src/app/api/driveImages/route.ts
import { NextResponse } from 'next/server';

const rawGAS = "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

export async function GET() {
  try {
    const res = await fetch(rawGAS, {
      headers: { "Cache-Control": "no-store" },
    });

    const json = await res.json();

    if (!json || json.status !== "success") {
      return NextResponse.json({ status: "error", message: "Invalid response from Apps Script" }, { status: 500 });
    }

    const imagesForSheet1 = json.imagesForSheet1 || [];

    return NextResponse.json({ status: "success", data: imagesForSheet1 });
  } catch (error) {
    console.error("❌ Error fetching driveImages:", error);
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 });
  }
}
