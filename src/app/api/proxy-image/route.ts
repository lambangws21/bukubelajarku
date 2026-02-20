import { NextRequest, NextResponse } from "next/server";
import { buildGoogleDriveImageCandidates, isGoogleDriveUrl } from "@/lib/googleDriveImage";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("URL required", { status: 400 });
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new NextResponse("Invalid URL protocol", { status: 400 });
    }

    const candidates = isGoogleDriveUrl(rawUrl)
      ? buildGoogleDriveImageCandidates(rawUrl)
      : [rawUrl];

    for (const candidate of candidates) {
      const res = await fetch(candidate, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      const isImage =
        contentType.startsWith("image/") || contentType === "application/octet-stream";
      if (!isImage) continue;

      const buffer = await res.arrayBuffer();
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          "Content-Type": contentType || "image/jpeg",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse("Failed to fetch valid image", { status: 502 });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
