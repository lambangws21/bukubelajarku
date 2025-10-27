import { NextResponse } from "next/server";

// --- Fungsi Helper untuk Standardisasi Respons Error ---
/**
 * Membuat respons JSON error yang terstandardisasi.
 * @param message Pesan error untuk dikembalikan ke klien.
 * @param status Kode status HTTP.
 * @returns NextResponse dengan status error yang sesuai.
 */
function createErrorResponse(message: string, status: number): NextResponse {
    // Console log tetap dipertahankan untuk debugging di server
    console.error(`[ERROR ${status}]`, message);
    return NextResponse.json(
        { status: "error", message },
        { status }
    );
}
// --------------------------------------------------------

// Pastikan di .env.local Anda punya:
// NEXT_PUBLIC_APPSCRIPT_ENDPOINT=https://script.google.com/macros/…/exec
// NOTE: Pemeriksaan dan throw error di level atas file telah dihapus.
// Pemeriksaan kini dilakukan di dalam handler POST untuk mencegah crash saat inisialisasi.
const APPSCRIPT_ENDPOINT = process.env.NEXT_PUBLIC_APPSCRIPT_ENDPOINT;

// Jika ada permintaan GET ke route ini, kembalikan 405
export function GET() {
  return createErrorResponse("Method GET tidak diizinkan, gunakan POST", 405);
}

// Hanya POST saja yang meneruskan data ke Apps Script
export async function POST(request: Request) {
  // Lakukan pemeriksaan endpoint di sini untuk mencegah kegagalan inisialisasi modul
  if (!APPSCRIPT_ENDPOINT) {
    return createErrorResponse(
      "Configuration Error: Missing NEXT_PUBLIC_APPSCRIPT_ENDPOINT environment variable. Please set it in .env.local.",
      500
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      // Menggunakan helper untuk 502 (Bad Gateway)
      return createErrorResponse(`Apps Script tidak mengembalikan JSON. Response: ${text.substring(0, 100)}...`, 502);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    // Menangani error parsing JSON (misalnya, jika body kosong) atau error fetch
    let message = "Unknown error during POST request or processing.";
    if (err instanceof Error) {
      message = `Gagal memanggil POST ke Apps Script atau memproses body: ${err.message}`;
    }

    // Menggunakan helper untuk 500 (Internal Server Error)
    return createErrorResponse(message, 500);
  }
}
