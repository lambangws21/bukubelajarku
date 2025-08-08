// app/api/annotations/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const data = await req.json();
  console.log("Anotasi diterima:", data);
  // Simpan ke DB / Sheet / File sesuai kebutuhan
  return NextResponse.json({ status: 'ok' });
}
