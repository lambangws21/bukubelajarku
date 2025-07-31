import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sheet = searchParams.get("sheet") || "JADWAL";

    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbw5KxMn7OLci-nZ2WhYNObGKlyHexKj23nrsqC0uUm3QEtLZfcC33Qpye7atnGPQbzC/exec?sheet=${sheet}`
    );

    if (!response.ok) throw new Error(`Script error: ${response.status}`);

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/getJadwal:", error);
    return NextResponse.json({ error: "Failed to fetch from Apps Script" }, { status: 500 });
  }
}
