

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxkbSV9Qexu6t7pyT28vqjxTTcnKb56Ryw4StH5a_HU5yDi2LkymDyou6ZQbvwxInZGjQ/exec",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
