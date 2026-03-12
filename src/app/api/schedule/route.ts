// app/api/schedule/route.ts

import { NextResponse } from 'next/server';

// Simpan URL Google Apps Script di environment variables untuk keamanan
const GAS_URL = process.env.GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbz6uWrmkveEmr7awZenZwND0LukrefsZUjwoNK3mPuzWa2k566qP54-9QeKlW1Yn945/exec';

const parseJsonSafe = (raw: string) => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const buildJsonResponseFromUpstream = async (response: Response) => {
  const text = await response.text();
  const parsed = parseJsonSafe(text);

  if (parsed) {
    return NextResponse.json(parsed, { status: response.status });
  }

  return NextResponse.json(
    {
      status: 'error',
      message: 'Respons Apps Script bukan JSON valid.',
      raw: text.slice(0, 300),
    },
    { status: response.ok ? 502 : response.status }
  );
};

// Fungsi untuk menangani GET request (mengambil semua atau satu data)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fullUrl = `${GAS_URL}?${searchParams.toString()}`;

    const response = await fetch(fullUrl, {
      // Revalidate 0 memastikan data selalu fresh dari Google Sheet
      next: { revalidate: 0 },
    });

    return buildJsonResponseFromUpstream(response);

  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch data' }, { status: 500 });
  }
}

// Fungsi untuk menangani POST request (Create, Update, Delete)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    return buildJsonResponseFromUpstream(response);

  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json({ status: 'error', message: 'Failed to process request' }, { status: 500 });
  }
}
