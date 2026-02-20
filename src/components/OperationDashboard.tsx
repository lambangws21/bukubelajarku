"use client";

import { useMemo } from "react";
import type { Operation } from "@/app/operasi-manajemen/page";

export default function OperationDashboard({
  operations,
  isLoading,
}: {
  operations: Operation[];
  isLoading: boolean;
}) {
  const total = useMemo(
    () => operations.reduce((sum, op) => sum + (Number(op.jumlah) || 0), 0),
    [operations]
  );
  const avg = useMemo(
    () => (operations.length ? total / operations.length : 0),
    [operations.length, total]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[
        { label: "Entries", value: isLoading ? "…" : String(operations.length) },
        {
          label: "Total",
          value: isLoading ? "…" : `Rp ${total.toLocaleString("id-ID")}`,
        },
        {
          label: "Average",
          value: isLoading ? "…" : `Rp ${Math.round(avg).toLocaleString("id-ID")}`,
        },
      ].map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border bg-white/70 dark:bg-neutral-900/60 p-4 shadow-sm"
        >
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {card.label}
          </div>
          <div className="mt-1 text-2xl font-bold">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

