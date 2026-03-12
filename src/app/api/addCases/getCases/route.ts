import { NextResponse } from "next/server";
import { buildMutationPayload, getAppsScriptEndpoint, normalizeCasesPayload } from "../_shared";

type CaseRow = {
  no?: string | number;
  id?: string | number;
  title?: string;
  tindakan?: string;
  note?: string;
  tags?: string[] | string;
  googleDriveId?: string;
  imageUrl?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

const toStringSafe = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => toStringSafe(item).toLowerCase())
          .filter(Boolean)
      )
    );
  }

  const raw = toStringSafe(value);
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const toDateMs = (value: unknown) => {
  const raw = toStringSafe(value);
  if (!raw) return Number.NaN;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

const countImages = (row: CaseRow) => {
  const ids = toStringSafe(row.googleDriveId)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (ids.length > 0) return ids.length;
  return row.imageUrl ? 1 : 0;
};

const toPositiveInt = (value: string | null, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
};

const normalizeCaseRow = (row: CaseRow): CaseRow => {
  const tags = normalizeTags(row.tags);
  return {
    ...row,
    title: toStringSafe(row.title || row.tindakan),
    tindakan: toStringSafe(row.tindakan || row.title),
    note: toStringSafe(row.note),
    tags,
  };
};

export async function GET(request: Request) {
  try {
    const APPSCRIPT_ENDPOINT = getAppsScriptEndpoint();
    const { searchParams } = new URL(request.url);

    const q = toStringSafe(searchParams.get("q")).toLowerCase();
    const tag = toStringSafe(searchParams.get("tag")).toLowerCase();
    const dateFrom = toStringSafe(searchParams.get("dateFrom"));
    const dateTo = toStringSafe(searchParams.get("dateTo"));

    const fromMs = dateFrom ? toDateMs(`${dateFrom}T00:00:00`) : Number.NaN;
    const toMs = dateTo ? toDateMs(`${dateTo}T23:59:59.999`) : Number.NaN;

    const page = toPositiveInt(searchParams.get("page"), DEFAULT_PAGE, Number.MAX_SAFE_INTEGER);
    const pageSize = toPositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const endpointURL = APPSCRIPT_ENDPOINT;

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

    if (normalized.status === "error") {
      return NextResponse.json(normalized, {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const rows = Array.isArray(normalized.data)
      ? (normalized.data as CaseRow[]).map(normalizeCaseRow)
      : [];

    const availableTags = Array.from(
      new Set(rows.flatMap((row) => normalizeTags(row.tags)))
    ).sort();

    const filtered = rows
      .filter((row) => {
        if (q) {
          const haystack = [
            toStringSafe(row.title || row.tindakan),
            toStringSafe(row.note),
            normalizeTags(row.tags).join(" "),
          ]
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(q)) return false;
        }

        if (tag) {
          const tags = normalizeTags(row.tags);
          if (!tags.includes(tag)) return false;
        }

        if (dateFrom || dateTo) {
          const createdMs = toDateMs(row.createdAt);
          if (Number.isNaN(createdMs)) return false;
          if (!Number.isNaN(fromMs) && createdMs < fromMs) return false;
          if (!Number.isNaN(toMs) && createdMs > toMs) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aMs = toDateMs(a.createdAt);
        const bMs = toDateMs(b.createdAt);

        if (Number.isNaN(aMs) && Number.isNaN(bMs)) {
          return toStringSafe(a.title || a.tindakan).localeCompare(
            toStringSafe(b.title || b.tindakan),
            "id"
          );
        }
        if (Number.isNaN(aMs)) return 1;
        if (Number.isNaN(bMs)) return -1;
        return bMs - aMs;
      });

    const totalItems = filtered.length;
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const paged = filtered.slice(start, end);

    const totalImagesAll = rows.reduce((sum, row) => sum + countImages(row), 0);
    const totalImagesFiltered = filtered.reduce((sum, row) => sum + countImages(row), 0);
    const totalImagesPage = paged.reduce((sum, row) => sum + countImages(row), 0);

    return NextResponse.json(
      {
        status: "success",
        scriptVersion: normalized.scriptVersion,
        data: paged,
        count: paged.length,
        total: totalItems,
        availableTags,
        filters: {
          q,
          tag: tag || "all",
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
        },
        meta: {
          page: safePage,
          pageSize,
          totalItems,
          totalPages,
          hasPrev: safePage > 1,
          hasNext: safePage < totalPages,
        },
        summary: {
          totalCasesAll: rows.length,
          totalCasesFiltered: totalItems,
          totalCasesPage: paged.length,
          totalImagesAll,
          totalImagesFiltered,
          totalImagesPage,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
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
