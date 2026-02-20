import { NextRequest, NextResponse } from "next/server";
import {
  getFirebaseStorageServerConfig,
  getGcpAccessTokenForStorage,
} from "@/lib/firebase/serverStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get("name");
    if (!name) {
      return NextResponse.json(
        { status: "error", message: "Missing query: name" },
        { status: 400 }
      );
    }

    const cfg = getFirebaseStorageServerConfig();
    const token = await getGcpAccessTokenForStorage(cfg);

    const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
      cfg.bucket
    )}/o/${encodeURIComponent(name)}?alt=media`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { status: "error", message: `Download failed (${res.status}): ${text || res.statusText}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = res.headers.get("content-length");

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "no-store");
    if (contentLength) headers.set("Content-Length", contentLength);

    // Let browser decide how to handle; if you want force-download:
    // headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(name.split("/").pop() || "file")}"`);

    return new NextResponse(res.body, { status: 200, headers });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan tak terduga";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
