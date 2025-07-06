// File: app/api/advance/route.ts
import { NextResponse } from 'next/server';

const INTERTAIN_URL = "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

// ✅ UPDATE (PUT)
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(INTERTAIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methodOverride: 'PUT', ...body }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: 'error', message: String(error) });
  }
}

// ✅ DELETE
export async function DELETE(req: Request) {
  try {
    const { no } = await req.json();

    const response = await fetch(INTERTAIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methodOverride: 'DELETE', no }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: 'error', message: String(error) });
  }
}
