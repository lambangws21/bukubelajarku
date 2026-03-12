import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  process.env.GAS_WEB_APP_URL ||
  "https://script.google.com/macros/s/AKfycbz6uWrmkveEmr7awZenZwND0LukrefsZUjwoNK3mPuzWa2k566qP54-9QeKlW1Yn945/exec";

const parseJsonSafe = (raw: string) => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export async function GET(req: NextRequest) {
  try {
    const upstream = new URL(GAS_URL);
    req.nextUrl.searchParams.forEach((value, key) => {
      upstream.searchParams.set(key, value);
    });

    const response = await fetch(upstream, { cache: "no-store" });

    if (!response.ok) throw new Error(`Script error: ${response.status}`);

    const text = await response.text();
    const parsed = parseJsonSafe(text);

    if (parsed) {
      return NextResponse.json(parsed, { status: response.status });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Apps Script mengembalikan respons non-JSON.",
        raw: text.slice(0, 300),
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Error in GET /api/getJadwal:", error);
    return NextResponse.json({ error: "Failed to fetch from Apps Script" }, { status: 500 });
  }
}
