import { NextResponse } from 'next/server';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec';

export async function GET() {
  try {
    const res = await fetch(SCRIPT_URL);
    const json = await res.json();

    if (json.status !== 'success') {
      return NextResponse.json({ status: 'error', message: 'Gagal mengambil data dari Apps Script' }, { status: 500 });
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error('❌ Error getAllData:', error);
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
  }
}
