import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbz6uWrmkveEmr7awZenZwND0LukrefsZUjwoNK3mPuzWa2k566qP54-9QeKlW1Yn945/exec";
const GAS_TIMEOUT_MS = 60_000;

const getGasCandidates = () => {
  const rawCandidates = [
    process.env.GAS_TS_SUPPORT_URL,
    DEFAULT_GAS_URL,
  ];

  const seen = new Set<string>();
  const valid: string[] = [];

  for (const raw of rawCandidates) {
    const value = String(raw || "").trim();
    if (!value || seen.has(value)) continue;
    try {
      new URL(value);
      valid.push(value);
      seen.add(value);
    } catch {
      continue;
    }
  }

  return valid.length ? valid : [DEFAULT_GAS_URL];
};

export async function GET(req: NextRequest) {
  const candidates = getGasCandidates();
  let lastError: unknown;

  try {
    for (const gasUrl of candidates) {
      try {
        const url = new URL(gasUrl);
        req.nextUrl.searchParams.forEach((value, key) => {
          url.searchParams.set(key, value);
        });

        const response = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(GAS_TIMEOUT_MS),
        });
        const text = await response.text();

        return new NextResponse(text, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("content-type") ?? "application/json",
          },
        });
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error("Tidak ada endpoint GAS yang bisa diakses.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message, triedEndpoints: candidates.length },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const candidates = getGasCandidates();
  let lastError: unknown;

  try {
    const rawBody = await req.text();

    for (const gasUrl of candidates) {
      try {
        const response = await fetch(gasUrl, {
          method: "POST",
          headers: {
            "Content-Type": req.headers.get("content-type") ?? "application/json",
          },
          body: rawBody,
          signal: AbortSignal.timeout(GAS_TIMEOUT_MS),
        });

        const text = await response.text();
        return new NextResponse(text, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("content-type") ?? "application/json",
          },
        });
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error("Tidak ada endpoint GAS yang bisa diakses.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message, triedEndpoints: candidates.length },
      { status: 502 }
    );
  }
}
