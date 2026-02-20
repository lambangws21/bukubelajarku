import { NextResponse } from "next/server";
import { buildMutationPayload, getAppsScriptEndpoint, normalizeCasesPayload } from "../_shared";

export async function GET(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpointURL = APPSCRIPT_ENDPOINT + (queryString ? "?" + queryString : "");

    const response = await fetch(endpointURL, { cache: "no-store" });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return NextResponse.json(
        { status: "error", message: `Apps Script non-JSON response: ${text.slice(0, 120)}` },
        { status: 502 }
      );
    }

    const raw = await response.json();
    return NextResponse.json(normalizeCasesPayload(raw), { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const body = await request.json();
    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const body = (await request.json()) as Record<string, unknown>;
    const payload = buildMutationPayload(body, "PUT");
    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const body = (await request.json()) as Record<string, unknown>;
    const payload = buildMutationPayload(body, "DELETE");
    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
