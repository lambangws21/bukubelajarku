"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, Loader2, MessageSquareText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuditLogItem = {
  id: string;
  createdAt: string;
  action: string;
  entityType: "schedule" | "team";
  entityId: string;
  actor: {
    uid: string;
    email: string;
    name: string;
    username?: string;
    role: string;
  };
  before: unknown;
  after: unknown;
  meta?: {
    comment?: string;
    status?: string;
    source?: string;
    doctor?: string;
    hospital?: string;
    preChanged?: boolean;
    postChanged?: boolean;
    statusChanged?: boolean;
  };
};

const actionLabel = (value: string) => {
  const map: Record<string, string> = {
    create_schedule: "Create Jadwal",
    update_schedule: "Update Jadwal",
    delete_schedule: "Delete Jadwal",
    comment_schedule: "Komentar Jadwal",
    create_team: "Create Team",
    update_team: "Update Team",
    delete_team: "Delete Team",
    update_team_status: "Update Status Team",
  };
  return map[value] || value;
};

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

const normalizeStatus = (value: string) => {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("baru")) return "jadwal_baru";
  if (raw.includes("selesai")) return "selesai";
  if (raw.includes("resched")) return "reschedule";
  if (raw.includes("tunda") || raw.includes("delay")) return "tunda";
  if (raw.includes("batal") || raw.includes("cancel")) return "batal";
  return raw;
};

const statusLabel = (value: string) => {
  const normalized = normalizeStatus(value);
  const map: Record<string, string> = {
    jadwal_baru: "Jadwal Baru",
    selesai: "Selesai",
    reschedule: "Reschedule",
    tunda: "Tunda",
    batal: "Batal",
  };
  return map[normalized] || value || "-";
};

const pickObjectValue = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== "object") return "";
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
};

const getLogContext = (item: AuditLogItem) => {
  const doctor =
    pickObjectValue(item.after, ["Operator", "operator", "Nama Dokter", "namaDokter"]) ||
    pickObjectValue(item.before, ["Operator", "operator", "Nama Dokter", "namaDokter"]) ||
    String(item.meta?.doctor || "").trim();
  const hospital =
    pickObjectValue(item.after, ["Hospital", "hospital", "Rumah Sakit", "rumahSakit"]) ||
    pickObjectValue(item.before, ["Hospital", "hospital", "Rumah Sakit", "rumahSakit"]) ||
    String(item.meta?.hospital || "").trim();
  return {
    doctor,
    hospital,
    context: [doctor, hospital].filter(Boolean).join(" • "),
  };
};

const getAfterStatus = (item: AuditLogItem) =>
  pickObjectValue(item.after, ["status", "Status"]) || String(item.meta?.status || "").trim();

export default function TsSupportAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          action: "getActivities",
          limit: "300",
        });
        if (actionFilter !== "all") params.set("auditAction", actionFilter);
        const res = await fetch(`/api/asistensi/ts-support?${params.toString()}`, {
          cache: "no-store",
        });
        const text = await res.text();
        const json = parseJsonSafe(text) as
          | {
              status?: string;
              message?: string;
              data?: AuditLogItem[];
            }
          | null;
        if (!res.ok) {
          throw new Error(json?.message || `Gagal memuat activity log (${res.status})`);
        }
        if (json?.status === "error") {
          throw new Error(json.message || "Gagal memuat activity log.");
        }
        if (!active) return;
        setLogs(Array.isArray(json?.data) ? json.data : []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat activity log.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [actionFilter]);

  const filteredLogs = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return logs;
    return logs.filter((item) => {
      const target = [
        item.entityId,
        item.entityType,
        item.action,
        item.actor?.name,
        item.actor?.username,
        item.actor?.email,
        item.meta?.comment,
      ]
        .join(" ")
        .toLowerCase();
      return target.includes(keyword);
    });
  }, [logs, query]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-3">
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <Clock3 className="h-3.5 w-3.5" />
                Activity Timeline
              </p>
              <h1 className="text-lg font-semibold">Riwayat Aktivitas TS Support</h1>
              <p className="text-sm text-muted-foreground">
                {filteredLogs.length} log ditampilkan
              </p>
            </div>
            <Button asChild type="button" variant="outline" className="h-9 px-3 text-xs">
              <a href="/ts-support">Kembali ke TS Support</a>
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari actor, action, entity..."
                className="h-9 pl-9"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              {[
                { key: "all", label: "Semua" },
                { key: "create_schedule", label: "Create Jadwal" },
                { key: "update_schedule", label: "Update Jadwal" },
                { key: "delete_schedule", label: "Delete Jadwal" },
                { key: "comment_schedule", label: "Komentar Jadwal" },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={actionFilter === item.key ? "default" : "ghost"}
                  className="h-8 px-2 text-[11px]"
                  onClick={() => setActionFilter(item.key)}
                >
                  <Filter className="mr-1 h-3 w-3 shrink-0" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {error ? (
          <Card className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </Card>
        ) : null}

        <Card className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950 md:block">
          <div className="overflow-x-auto pb-1">
            <table className="w-full min-w-[980px] text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-900/70">
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Komentar</th>
                  <th className="px-3 py-2">Before</th>
                  <th className="px-3 py-2">After</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                      Memuat audit log...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Tidak ada data audit.
                    </td>
                  </tr>
                ) : (
                    filteredLogs.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200/80 dark:border-slate-800">
                      <td className="whitespace-nowrap px-3 py-2 text-[11px]">
                        {new Date(item.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">
                          {item.actor?.username
                            ? `@${item.actor.username}`
                            : item.actor?.name || "-"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{item.actor?.name || "-"}</p>
                        <p className="text-[11px] text-muted-foreground">{item.actor?.email || "-"}</p>
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const { context } = getLogContext(item);
                          const afterStatus = getAfterStatus(item);
                          return (
                            <>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                            item.action.includes("delete")
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                              : item.action.includes("update")
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          )}
                        >
                          {actionLabel(item.action)}
                        </span>
                        {afterStatus ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">Status: {statusLabel(afterStatus)}</p>
                        ) : null}
                        {context ? <p className="mt-1 text-[11px] text-muted-foreground">{context}</p> : null}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.entityType}</p>
                        <p className="text-[11px] text-muted-foreground">{item.entityId}</p>
                      </td>
                      <td className="max-w-[220px] px-3 py-2 align-top text-[11px]">
                        {item.meta?.comment ? (
                          <p className="rounded-md bg-indigo-50 px-2 py-1.5 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                            {item.meta.comment}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="max-w-[260px] px-3 py-2 align-top">
                        <pre className="max-h-40 overflow-auto rounded-md bg-slate-100 p-2 text-[11px] leading-relaxed dark:bg-slate-900">
                          {item.before ? JSON.stringify(item.before, null, 2) : "-"}
                        </pre>
                      </td>
                      <td className="max-w-[260px] px-3 py-2 align-top">
                        <pre className="max-h-40 overflow-auto rounded-md bg-slate-100 p-2 text-[11px] leading-relaxed dark:bg-slate-900">
                          {item.after ? JSON.stringify(item.after, null, 2) : "-"}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-2 md:hidden">
          {loading ? (
            <Card className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-950">
              <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
              Memuat activity log...
            </Card>
          ) : null}

          {!loading && filteredLogs.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-950">
              Tidak ada data activity log.
            </Card>
          ) : null}

          {!loading
            ? filteredLogs.map((item) => {
                const { context } = getLogContext(item);
                const afterStatus = getAfterStatus(item);
                const actionChipClass = item.action.includes("delete")
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                  : item.action.includes("update")
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
                return (
                  <Card
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString("id-ID")}
                        </p>
                        <p className="font-semibold">
                          {item.actor?.username
                            ? `@${item.actor.username}`
                            : item.actor?.name || item.actor?.email || "User"}
                        </p>
                      </div>
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", actionChipClass)}>
                        {actionLabel(item.action)}
                      </span>
                    </div>

                    <div className="space-y-1 text-[12px]">
                      <p className="text-muted-foreground">Entity: {item.entityType} • {item.entityId}</p>
                      {context ? <p className="text-muted-foreground">{context}</p> : null}
                      {afterStatus ? (
                        <p className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Status: {statusLabel(afterStatus)}
                        </p>
                      ) : null}
                    </div>

                    {item.meta?.comment ? (
                      <div className="mt-2 rounded-lg bg-indigo-50 px-2.5 py-2 text-[12px] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                        <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium">
                          <MessageSquareText className="h-3.5 w-3.5" />
                          Komentar
                        </p>
                        <p>{item.meta.comment}</p>
                      </div>
                    ) : null}
                  </Card>
                );
              })
            : null}
        </div>
      </div>
    </main>
  );
}
