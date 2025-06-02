// File: app/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Gantilah string berikut dengan Web App URL Anda yang dideploy dari Google Apps Script:
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPnzRBDJOjGoYYg2DAE_THUlsKyjUA5TVmvCIa04YUb2ctHA6deROnaU6xXKaPeL_u/exec';

export async function GET() {
  try {
    const res = await fetch(APPSCRIPT_URL);
    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.toString() },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Kirim ke Apps Script dengan method POST
    const res = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.toString() },
      { status: 500 }
    );
  }
}
