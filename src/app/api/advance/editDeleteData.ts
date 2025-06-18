// File: app/api/advance/route.ts
import { NextResponse } from 'next/server';

const ADVANCE_URL = "https://script.google.com/macros/s/AKfycbw5ACQflrxjlsoY_ZvjZQs7Xd8f2lFnzNjOtXPLW_xx3bHb8TNK02VX0ghXLbE7QDnF/exec";

// ✅ UPDATE (PUT)
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(ADVANCE_URL, {
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

    const response = await fetch(ADVANCE_URL, {
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
