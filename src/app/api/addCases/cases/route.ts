import { NextResponse } from 'next/server';

const APPSCRIPT_ENDPOINT =
  "https://script.google.com/macros/s/AKfycby9tPiT3Pt7t2rx2g85Q-CxZfiZi131Z7EU9OAql-y81HFNcyGfEKlpA7dv9l79f3yn/exec";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const endpointURL = APPSCRIPT_ENDPOINT + (queryString ? "?" + queryString : "");

  try {
    const response = await fetch(endpointURL);
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
