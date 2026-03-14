import { NextRequest, NextResponse } from "next/server";
import {
  canMutateTsSupportData,
  getTsSupportSessionFromRequest,
} from "@/lib/tsSupportSession";
import { sendTsSupportPushNotification } from "@/lib/tsSupportPush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbz6uWrmkveEmr7awZenZwND0LukrefsZUjwoNK3mPuzWa2k566qP54-9QeKlW1Yn945/exec";
const GAS_TIMEOUT_MS = 60_000;

const MUTATION_ACTIONS = new Set([
  "create",
  "update",
  "delete",
  "commentSchedule",
  "deleteScheduleComment",
  "createTeamTs",
  "updateTeamTs",
  "deleteTeamTs",
  "updateTeamTsStatus",
]);

const parseJsonSafe = (text: string) => {
  const cleaned = text.trim().replace(/^\uFEFF/, "");
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
};

const getGasCandidates = () => {
  const rawCandidates = [process.env.GAS_TS_SUPPORT_URL, DEFAULT_GAS_URL];
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

const buildActorPayload = (
  session: NonNullable<ReturnType<typeof getTsSupportSessionFromRequest>>
) => {
  const email = String(session.user.email || "").trim().toLowerCase();
  const fallbackUsername =
    email.split("@")[0] ||
    String(session.user.name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".");
  return {
    uid: String(session.user.uid || "").trim(),
    email,
    name: String(session.user.name || "").trim(),
    username: String(fallbackUsername || "").trim().toLowerCase(),
    role: String(session.user.role || "").trim().toLowerCase(),
  };
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
    const parsedBody = (parseJsonSafe(rawBody) || {}) as Record<string, unknown>;
    const action = String(parsedBody.action || "").trim();
    const data =
      parsedBody.data && typeof parsedBody.data === "object"
        ? ({ ...parsedBody.data } as Record<string, unknown>)
        : {};

    const requiresSession = MUTATION_ACTIONS.has(action);
    let session = null as ReturnType<typeof getTsSupportSessionFromRequest> | null;
    let actorPayload: ReturnType<typeof buildActorPayload> | null = null;
    if (requiresSession) {
      session = getTsSupportSessionFromRequest(req);
      if (!session) {
        return NextResponse.json(
          { status: "error", message: "Unauthorized. Silakan login TS Support." },
          { status: 401 }
        );
      }
      if (!canMutateTsSupportData(session.user.role)) {
        return NextResponse.json(
          {
            status: "error",
            message:
              "Role akun ini hanya bisa mode lihat (readonly). Hubungi sales untuk perubahan data.",
          },
          { status: 403 }
        );
      }
      actorPayload = buildActorPayload(session);
    }

    if (action === "commentSchedule") {
      const entityId = String(data.submissionId || data.entityId || "").trim();
      const comment = String(data.comment || data.komentar || "").trim();
      if (!entityId) {
        return NextResponse.json(
          { status: "error", message: "submissionId/entityId komentar wajib diisi." },
          { status: 400 }
        );
      }
      if (!comment) {
        return NextResponse.json(
          { status: "error", message: "Komentar tidak boleh kosong." },
          { status: 400 }
        );
      }
    }

    if (action === "deleteScheduleComment") {
      const entityId = String(data.submissionId || data.entityId || "").trim();
      const commentId = String(data.commentId || data.logId || data.id || "").trim();
      if (!entityId) {
        return NextResponse.json(
          { status: "error", message: "submissionId/entityId komentar wajib diisi." },
          { status: 400 }
        );
      }
      if (!commentId) {
        return NextResponse.json(
          { status: "error", message: "commentId/logId komentar wajib diisi." },
          { status: 400 }
        );
      }
    }

    if (actorPayload) {
      data.__actor = actorPayload;
    }

    const forwardedPayload = JSON.stringify({
      ...parsedBody,
      action,
      data,
    });

    for (const gasUrl of candidates) {
      try {
        const response = await fetch(gasUrl, {
          method: "POST",
          headers: {
            "Content-Type": req.headers.get("content-type") ?? "application/json",
          },
          body: forwardedPayload,
          signal: AbortSignal.timeout(GAS_TIMEOUT_MS),
        });

        const text = await response.text();
        const parsed = parseJsonSafe(text);
        const normalizedResponseStatus = String(parsed?.status || "").trim().toLowerCase();
        const isSuccessfulPayload =
          response.ok && (!normalizedResponseStatus || normalizedResponseStatus === "success");

        if (isSuccessfulPayload && actorPayload) {
          const responseData =
            parsed?.data && typeof parsed.data === "object"
              ? (parsed.data as Record<string, unknown>)
              : {};
          try {
            await sendTsSupportPushNotification({
              action,
              actor: actorPayload,
              requestData: data,
              responseData,
            });
          } catch (notificationError) {
            console.warn("Gagal kirim FCM TS Support:", notificationError);
          }
        }

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
