import { NextResponse } from "next/server";
import { buildMutationPayload, getAppsScriptEndpoint, normalizeCasesPayload } from "../_shared";

export async function GET(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpointURL = APPSCRIPT_ENDPOINT + (queryString ? `?${queryString}` : "");

    const response = await fetch(endpointURL, {
      headers: { "Cache-Control": "no-store" },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return NextResponse.json(
        { status: "error", message: `Apps Script non-JSON response: ${text.slice(0, 120)}` },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const raw = await response.json();
    const normalized = normalizeCasesPayload(raw);

    return NextResponse.json(normalized, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const body = (await request.json()) as Record<string, unknown>;
    const methodOverrideRaw = String(body?.methodOverride ?? "").toUpperCase();
    const payload =
      methodOverrideRaw === "PUT"
        ? buildMutationPayload(body, "PUT")
        : methodOverrideRaw === "DELETE"
          ? buildMutationPayload(body, "DELETE")
          : body;

    const response = await fetch(APPSCRIPT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return NextResponse.json(
        { status: "error", message: `Apps Script non-JSON response: ${text.slice(0, 120)}` },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await response.json();
    const result = data && typeof data === "object" && "data" in data ? data : { status: "success", data };

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
