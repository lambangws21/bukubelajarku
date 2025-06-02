// file: app/api/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";

type AppsScriptResponse = unknown;

// Ganti dengan URL Web App Anda yang menjalankan doGet() untuk Sheet1
const APPSCRIPT_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwPnzRBDJOjGoYYg2DAE_THUlsKyjUA5TVmvCIa04YUb2ctHA6deROnaU6xXKaPeL_u/exec";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(APPSCRIPT_SHEET_URL);
    const text = await res.text();

    let parsed: AppsScriptResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: "error", message: "Response dari Apps Script bukan JSON" },
        { status: 502 }
      );
    }

    // Jika Apps Script mengembalikan objek error: { status: "error", message }
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      (parsed as any).status === "error" &&
      "message" in parsed &&
      typeof (parsed as any).message === "string"
    ) {
      return NextResponse.json(
        { status: "error", message: (parsed as any).message },
        { status: 502 }
      );
    }

    // Jika Apps Script mengembalikan array
    if (Array.isArray(parsed)) {
      const photos: string[] = [];
      for (const item of parsed) {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          // Prioritaskan imageUrl, jika ada; jika tidak, coba fileUrl
          let url: unknown = obj.imageUrl ?? obj.fileUrl;
          if (typeof url === "string" && url.length > 0) {
            photos.push(url);
          }
        }
      }
      return NextResponse.json({ status: "success", photos }, { status: 200 });
    }

    // Jika Apps Script mengembalikan objek { status: "success", data: [...] }
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      (parsed as any).status === "success" &&
      "data" in parsed &&
      Array.isArray((parsed as any).data)
    ) {
      const dataArr = (parsed as any).data as unknown[];
      const photos: string[] = [];
      for (const item of dataArr) {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          let url: unknown = obj.imageUrl ?? obj.fileUrl;
          if (typeof url === "string" && url.length > 0) {
            photos.push(url);
          }
        }
      }
      return NextResponse.json({ status: "success", photos }, { status: 200 });
    }

    // Format tak dikenali
    return NextResponse.json(
      { status: "error", message: "Format data tidak dikenali" },
      { status: 502 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan tak terduga";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
