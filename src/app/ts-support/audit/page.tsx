"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, Loader2, Search } from "lucide-react";
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
    ip?: string;
    userAgent?: string;
    comment?: string;
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

export default function TsSupportAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "300" });
        if (actionFilter !== "all") params.set("action", actionFilter);
        const res = await fetch(`/api/ts-support-audit?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as {
          data?: AuditLogItem[];
        } | null;
        if (!active) return;
        setLogs(Array.isArray(json?.data) ? json.data : []);
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
                Audit Timeline
              </p>
              <h1 className="text-lg font-semibold">Riwayat Edit / Delete TS Support</h1>
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
                { key: "update_schedule", label: "Update Jadwal" },
                { key: "delete_schedule", label: "Delete Jadwal" },
                { key: "update_team", label: "Update Team" },
                { key: "delete_team", label: "Delete Team" },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={actionFilter === item.key ? "default" : "ghost"}
                  className="h-8 px-2 text-[11px]"
                  onClick={() => setActionFilter(item.key)}
                >
                  <Filter className="mr-1 h-3 w-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950">
          <div className="overflow-x-auto">
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
      </div>
    </main>
  );
}
