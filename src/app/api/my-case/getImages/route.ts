// File: src/app/api/my-case/getDoctorImages/route.ts
import { NextResponse } from "next/server";

// Kita akan memanggil doGet(e) pada Apps Script
// dengan query parameter action=getDoctorImages.
// Di Apps Script Anda, doGet harus mengecek e.parameter.action.
const APPSCRIPT_URL = process.env.NEXT_PUBLIC_APPSCRIPT_URL!;

export async function GET() {
  try {
    // Tambahkan ?action=getDoctorImages supaya Apps Script tahu memanggil fungsi getDoctorImages()
    const url = `${APPSCRIPT_URL}?action=getDoctorImages`;
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Apps Script returned status ${response.status}`);
    }

    const json = await response.json();
    return NextResponse.json(json);
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
