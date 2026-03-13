"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenText, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TsSupportRole } from "@/lib/tsSupportSession";

type TsSupportSessionBarProps = {
  userName: string;
  userEmail: string;
  role: TsSupportRole;
  showAuditTimeline?: boolean;
};

const roleLabel: Record<TsSupportSessionBarProps["role"], string> = {
  sales: "Sales",
  ts: "TS",
  logistik: "Logistik",
  admin: "Admin",
  coordinator: "Coordinator",
  viewer: "Viewer",
};

export default function TsSupportSessionBar({
  userName,
  userEmail,
  role,
  showAuditTimeline = true,
}: TsSupportSessionBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/ts-support-auth/logout", {
        method: "POST",
      });
      router.replace("/ts-support-login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Session TS Support
          </p>
          <p className="text-sm font-semibold leading-tight">
            {userName} · {roleLabel[role]}
          </p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild type="button" variant="outline" className="h-9 px-3 text-xs">
            <Link href="/belajarku">
              <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
              Belajarku
            </Link>
          </Button>
          {showAuditTimeline ? (
            <Button asChild type="button" variant="outline" className="h-9 px-3 text-xs">
              <Link href="/ts-support/audit">Timeline</Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-9 px-3 text-xs"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="mr-1 h-3.5 w-3.5" />
            )}
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
