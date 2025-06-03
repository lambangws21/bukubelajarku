// File: src/app/api/my-case/getData/route.ts
import { NextResponse } from 'next/server';

const APPSCRIPT_URL = process.env.NEXT_PUBLIC_APPSCRIPT_URL!; 
// Pastikan di .env.local Anda sudah menambahkan:
// NEXT_PUBLIC_APPSCRIPT_URL=https://script.google.com/macros/s/ABCDE12345/exec

export async function GET() {
  try {
    // Memanggil Apps Script doGet()
    const response = await fetch(APPSCRIPT_URL, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Apps Script returned status ${response.status}`);
    }

    const json = await response.json();
    return NextResponse.json(json);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
