// File: app/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Ganti ini dengan Web App URL Google Apps Script Anda
const APPSCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwPnzRBDJOjGoYYg2DAE_THUlsKyjUA5TVmvCIa04YUb2ctHA6deROnaU6xXKaPeL_u/exec';

// Handler untuk GET /api/cases
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

// Handler untuk POST /api/cases
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Teruskan payload ke Google Apps Script
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
