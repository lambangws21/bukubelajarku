// File: src/app/api/my-case/postData/route.ts
import { NextResponse } from "next/server";

const APPSCRIPT_URL = process.env.NEXT_PUBLIC_APPSCRIPT_URL!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, note, base64Images, fileNames, mimeType } = body;

    /** Validasi sederhana */
    if (
      !title ||
      !note ||
      !Array.isArray(base64Images) ||
      !Array.isArray(fileNames) ||
      base64Images.length === 0 ||
      fileNames.length === 0 ||
      base64Images.length !== fileNames.length
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Missing or invalid fields: title, note, base64Images[], fileNames[]",
        },
        { status: 400 }
      );
    }

    // Kirim payload ke Apps Script
    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, note, base64Images, fileNames, mimeType }),
    });

    /** Log debugging di server console (jika Anda menjalankan Next.js secara lokal) */
    console.log(">> Forward ke Apps Script:", APPSCRIPT_URL);
    console.log(">> Status Apps Script:", response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Apps Script returned ${response.status}: ${text}`
      );
    }

    const json = await response.json();
    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Error di postData route:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
