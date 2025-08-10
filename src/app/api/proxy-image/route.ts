import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("URL required", { status: 400 });
  }

  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch  {
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
