import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSxnyoM8gXQqHUh_DdG-DvuKlXe5yRI3H5tGvIp3r9O5cAh_o5kIsO2diCHLkarWJR/exec";

export async function GET() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?sheet=Sheet5`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        method: "POST_RIWAYAT_OPERASI",
        ...body,
      }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
