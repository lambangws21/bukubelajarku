"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Stethoscope,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type TsSummaryQuickViewItem = {
  id: string;
  dokter: string;
  tindakan: string;
  rumahSakit: string;
  jam: string;
  tanggalLabel: string;
  tsMembantu: string;
  statusLabel: string;
  notes: string;
};

type TsSummaryQuickViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  items: TsSummaryQuickViewItem[];
};

export default function TsSummaryQuickViewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  items,
}: TsSummaryQuickViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
            Tidak ada data untuk ditampilkan.
          </div>
        ) : (
          <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {item.jam || "-"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {item.tanggalLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.statusLabel}
                  </span>
                </div>

                <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">
                  <Stethoscope className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  {item.dokter || "-"}
                </p>
                <p className="text-sm text-muted-foreground">{item.tindakan || "-"}</p>

                <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-md border px-2.5 py-1.5 inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                    <span className="truncate">RS: {item.rumahSakit || "-"}</span>
                  </div>
                  <div className="rounded-md border px-2.5 py-1.5 inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                    <span className="truncate">TS: {item.tsMembantu || "-"}</span>
                  </div>
                </div>

                {item.notes ? (
                  <div className="mt-2 rounded-md border px-2.5 py-2 text-xs text-muted-foreground">
                    <p className="inline-flex items-center gap-1 font-medium text-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Catatan
                    </p>
                    <p className="mt-1 line-clamp-3">{item.notes}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
