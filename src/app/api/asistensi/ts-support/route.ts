import { NextRequest, NextResponse } from "next/server";
import {
  appendTsSupportAuditLog,
  type TsSupportAuditAction,
} from "@/lib/tsSupportAuth";
import {
  canManageTsSupport,
  getTsSupportSessionFromRequest,
} from "@/lib/tsSupportSession";

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
  "createTeamTs",
  "updateTeamTs",
  "deleteTeamTs",
  "updateTeamTsStatus",
]);

const AUDIT_ACTION_MAP: Record<string, TsSupportAuditAction | undefined> = {
  create: "create_schedule",
  update: "update_schedule",
  delete: "delete_schedule",
  commentSchedule: "comment_schedule",
  createTeamTs: "create_team",
  updateTeamTs: "update_team",
  deleteTeamTs: "delete_team",
  updateTeamTsStatus: "update_team_status",
};

const parseJsonSafe = (text: string) => {
  const cleaned = text.trim().replace(/^\uFEFF/, "");
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned) as Record<string, any>;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]) as Record<string, any>;
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

const parseGasDataPayload = <T = unknown>(json: Record<string, any> | null): T | null => {
  if (!json || typeof json !== "object") return null;
  if (json.status === "error") return null;
  if ("data" in json) return (json.data as T) ?? null;
  return null;
};

const getSubmissionId = (data: Record<string, any>, responseData: any) =>
  String(
    responseData?.submissionId ||
      data?.submissionId ||
      data?.rowId ||
      ""
  ).trim();

const getTeamNo = (data: Record<string, any>, responseData: any) =>
  String(
    responseData?.no ||
      data?.no ||
      data?.oldNo ||
      data?.id ||
      ""
  ).trim();

const getCommentText = (data: Record<string, any>) =>
  String(data?.comment || data?.komentar || "").trim();

const getActorUsername = (email: string, name: string) => {
  const localPart = String(email || "").trim().split("@")[0] || "";
  if (localPart) return localPart.toLowerCase();
  return String(name || "").trim().toLowerCase().replace(/\s+/g, ".");
};

const fetchGasGetJson = async (
  candidates: string[],
  params: Record<string, string>
) => {
  let lastError: unknown;

  for (const gasUrl of candidates) {
    try {
      const url = new URL(gasUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (!value) return;
        url.searchParams.set(key, value);
      });

      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(GAS_TIMEOUT_MS),
      });
      const text = await response.text();
      if (!response.ok) continue;
      return parseJsonSafe(text);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return null;
};

const getScheduleBySubmissionId = async (candidates: string[], submissionId: string) => {
  if (!submissionId) return null;
  const json = await fetchGasGetJson(candidates, { id: submissionId });
  return parseGasDataPayload<Record<string, any>>(json);
};

const getTeamByNo = async (candidates: string[], noValue: string) => {
  if (!noValue) return null;
  const json = await fetchGasGetJson(candidates, { action: "getTeamTs" });
  const list = parseGasDataPayload<Record<string, any>[]>(json) || [];
  return (
    list.find((item) => String(item?.No || item?.no || "").trim() === noValue) ||
    null
  );
};

const shouldAuditAction = (action: string) => Boolean(AUDIT_ACTION_MAP[action]);

const captureBeforeState = async (
  action: string,
  data: Record<string, any>,
  candidates: string[]
) => {
  if (action === "update" || action === "delete") {
    return await getScheduleBySubmissionId(candidates, getSubmissionId(data, null));
  }
  if (action === "commentSchedule") {
    const entityId = getSubmissionId(data, null) || String(data?.entityId || "").trim();
    return await getScheduleBySubmissionId(candidates, entityId);
  }
  if (action === "updateTeamTs" || action === "deleteTeamTs" || action === "updateTeamTsStatus") {
    return await getTeamByNo(candidates, getTeamNo(data, null));
  }
  return null;
};

const captureAfterState = async (
  action: string,
  data: Record<string, any>,
  responseData: any,
  candidates: string[]
) => {
  if (action === "delete" || action === "deleteTeamTs") return null;

  if (action === "create") return responseData || null;
  if (action === "createTeamTs") return responseData || null;
  if (action === "commentSchedule") {
    return {
      comment: getCommentText(data),
      submissionId: getSubmissionId(data, responseData) || String(data?.entityId || "").trim(),
      commentedAt: new Date().toISOString(),
    };
  }

  if (action === "update") {
    return await getScheduleBySubmissionId(
      candidates,
      getSubmissionId(data, responseData)
    );
  }
  if (action === "updateTeamTs" || action === "updateTeamTsStatus") {
    return await getTeamByNo(candidates, getTeamNo(data, responseData));
  }

  return responseData || null;
};

const getEntityInfo = (
  action: string,
  data: Record<string, any>,
  responseData: any
) => {
  if (action === "create" || action === "update" || action === "delete" || action === "commentSchedule") {
    return {
      entityType: "schedule" as const,
      entityId: getSubmissionId(data, responseData) || "-",
    };
  }

  return {
    entityType: "team" as const,
    entityId: getTeamNo(data, responseData) || "-",
  };
};

const getClientIp = (req: NextRequest) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return req.headers.get("x-real-ip") || "";
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
    const parsedBody = parseJsonSafe(rawBody) || {};
    const action = String(parsedBody?.action || "").trim();
    const data = (parsedBody?.data || {}) as Record<string, any>;

    const requiresSession = MUTATION_ACTIONS.has(action);
    const auditAction = AUDIT_ACTION_MAP[action];
    const shouldAudit = shouldAuditAction(action);

    let session = null as ReturnType<typeof getTsSupportSessionFromRequest> | null;
    if (requiresSession) {
      session = getTsSupportSessionFromRequest(req);
      if (!session) {
        return NextResponse.json(
          { status: "error", message: "Unauthorized. Silakan login TS Support." },
          { status: 401 }
        );
      }
      if (!canManageTsSupport(session.user.role)) {
        return NextResponse.json(
          {
            status: "error",
            message:
              "Role akun ini hanya bisa mode lihat (readonly). Hubungi sales untuk perubahan data.",
          },
          { status: 403 }
        );
      }
    }

    const beforeState = shouldAudit
      ? await captureBeforeState(action, data, candidates).catch(() => null)
      : null;

    if (action === "commentSchedule") {
      const entityId = getSubmissionId(data, null) || String(data?.entityId || "").trim();
      const comment = getCommentText(data);
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

      if (!session || !auditAction) {
        return NextResponse.json(
          { status: "error", message: "Session tidak valid untuk menulis komentar." },
          { status: 401 }
        );
      }

      await appendTsSupportAuditLog({
        actor: {
          uid: session.user.uid,
          email: session.user.email,
          name: session.user.name,
          username: getActorUsername(session.user.email, session.user.name),
          role: session.user.role,
        },
        action: auditAction,
        entityType: "schedule",
        entityId,
        before: beforeState,
        after: {
          comment,
          entityId,
          commentedAt: new Date().toISOString(),
        },
        meta: {
          ip: getClientIp(req),
          userAgent: req.headers.get("user-agent") || "",
          source: "api/asistensi/ts-support",
          comment,
        },
      });

      return NextResponse.json({
        status: "success",
        data: {
          message: "Komentar berhasil disimpan.",
          entityId,
          comment,
        },
      });
    }

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
        const json = parseJsonSafe(text);
        const responseData = parseGasDataPayload(json);
        const isSuccess = response.ok && (!json || json.status !== "error");

        if (shouldAudit && isSuccess && auditAction && session) {
          const afterState = await captureAfterState(
            action,
            data,
            responseData,
            candidates
          ).catch(() => responseData ?? null);
          const { entityType, entityId } = getEntityInfo(action, data, responseData);

          void appendTsSupportAuditLog({
            actor: {
              uid: session.user.uid,
              email: session.user.email,
              name: session.user.name,
              username: getActorUsername(session.user.email, session.user.name),
              role: session.user.role,
            },
            action: auditAction,
            entityType,
            entityId,
            before: beforeState,
            after: afterState,
            meta: {
              ip: getClientIp(req),
              userAgent: req.headers.get("user-agent") || "",
              source: "api/asistensi/ts-support",
              comment: getCommentText(data) || undefined,
              status: String(data?.status || "").trim() || undefined,
            },
          }).catch((error) => {
            console.error("[TS_SUPPORT_AUDIT_LOG_ERROR]", error);
          });
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
