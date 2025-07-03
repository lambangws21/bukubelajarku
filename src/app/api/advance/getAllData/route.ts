// app/api/data/route.ts

import { NextResponse } from 'next/server';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec';

export async function GET() {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);

      // Cek apakah status dari Apps Script adalah 'success'
      if (json.status !== 'success') {
        return NextResponse.json(
          { status: 'error', message: 'Gagal mengambil data dari Apps Script', response: json },
          { status: 500 }
        );
      }

      // Berhasil
      return NextResponse.json(json);
    } catch (parseError) {
      // Gagal parse JSON
      return NextResponse.json(
        { status: 'error', message: 'Gagal mengurai JSON dari Apps Script', rawText: text },
        { status: 500 }
      );
    }
  } catch (error) {
    // Gagal fetch
    return NextResponse.json(
      { status: 'error', message: 'Gagal mengambil data', error: String(error) },
      { status: 500 }
    );
  }
}
