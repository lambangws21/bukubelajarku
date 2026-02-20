import { NextRequest, NextResponse } from "next/server";
import {
  getFirebaseStorageServerConfig,
  getGcpAccessTokenForStorage,
} from "@/lib/firebase/serverStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GcsListResponse = {
  items?: Array<{
    name: string;
    bucket?: string;
    size?: string;
    contentType?: string;
    updated?: string;
    md5Hash?: string;
    generation?: string;
  }>;
  prefixes?: string[];
  nextPageToken?: string;
};

const parseIntClamped = (
  value: string | null,
  fallback: number,
  min: number,
  max: number
) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

export async function GET(request: NextRequest) {
  try {
    const cfg = getFirebaseStorageServerConfig();
    const token = await getGcpAccessTokenForStorage(cfg);

    const url = request.nextUrl;
    const prefix = url.searchParams.get("prefix") ?? "";
    const delimiter = url.searchParams.get("delimiter") ?? "/";
    const pageToken = url.searchParams.get("pageToken") ?? undefined;
    const maxResults = parseIntClamped(url.searchParams.get("limit"), 200, 1, 1000);

    const listUrl = new URL(
      `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(cfg.bucket)}/o`
    );
    listUrl.searchParams.set("prefix", prefix);
    if (delimiter) listUrl.searchParams.set("delimiter", delimiter);
    listUrl.searchParams.set("maxResults", String(maxResults));
    if (pageToken) listUrl.searchParams.set("pageToken", pageToken);

    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { status: "error", message: `GCS list failed (${res.status}): ${text || res.statusText}` },
        { status: 502 }
      );
    }

    const json = (await res.json()) as GcsListResponse;

    const items =
      json.items?.map((it) => ({
        name: it.name,
        bucket: it.bucket ?? cfg.bucket,
        size: it.size ? Number(it.size) : null,
        contentType: it.contentType ?? null,
        updated: it.updated ?? null,
        md5Hash: it.md5Hash ?? null,
        generation: it.generation ?? null,
        // URL publik Firebase Storage (akan works jika rules/ACL memperbolehkan read)
        firebaseUrl: `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
          cfg.bucket
        )}/o/${encodeURIComponent(it.name)}?alt=media`,
        // Proxy download via server (works dengan service account)
        proxyUrl: `/api/firebase/storage/download?name=${encodeURIComponent(it.name)}`,
      })) ?? [];

    return NextResponse.json(
      {
        status: "success",
        bucket: cfg.bucket,
        prefix,
        prefixes: json.prefixes ?? [],
        nextPageToken: json.nextPageToken ?? null,
        items,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan tak terduga";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
