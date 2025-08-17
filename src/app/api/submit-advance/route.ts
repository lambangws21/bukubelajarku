import { NextResponse } from 'next/server';

// Ganti dengan URL Web App Anda yang sudah di-deploy.
// Sangat disarankan untuk menyimpannya di environment variable (.env.local)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbySR11Wse1FqvMzx0B7wyOQWvdAoJLiLlZrO73j1zJ9Q_-Bv_6aDnhlDumS74jrlQ/exec";

export async function POST(request: Request) {
  // Hanya izinkan permintaan POST
  if (request.method !== 'POST') {
    return NextResponse.json({ status: 'error', message: 'Method Not Allowed' }, { status: 405 });
  }

  // Pastikan URL Apps Script sudah diatur
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ status: 'error', message: 'Apps Script URL is not configured' }, { status: 500 });
  }

  try {
    const dataToSend = await request.json();

    // Meneruskan permintaan ke Google Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(dataToSend),
    });
    
    // Memeriksa jika respons dari Apps Script berhasil
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apps Script responded with an error:', errorText);
      return NextResponse.json({ status: 'error', message: 'Failed to communicate with Google Apps Script.' }, { status: response.status });
    }

    const result = await response.json();
    
    // Mengembalikan respons dari Apps Script ke klien
    return NextResponse.json(result);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ status: 'error', message: 'An internal server error occurred.' }, { status: 500 });
  }
}