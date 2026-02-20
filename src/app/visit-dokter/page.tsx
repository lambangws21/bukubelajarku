"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VisitSchedulePanel } from "@/components/visitDokter/VisitSchedulePanel";

const toEmbeddableGoogleFormUrl = (url: string) => {
  try {
    const u = new URL(url);
    if (u.pathname.endsWith("/formResponse")) {
      u.pathname = u.pathname.replace(/\/formResponse$/, "/viewform");
    }
    if (!u.pathname.endsWith("/viewform")) return url;
    u.searchParams.set("embedded", "true");
    return u.toString();
  } catch {
    return url;
  }
};

export default function VisitDokterPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const [viewMode, setViewMode] = useState<"split" | "form" | "visit">(() => {
    if (typeof window === "undefined") return "split";
    const raw = window.localStorage.getItem("visitDokter:viewMode");
    if (raw === "form" || raw === "visit" || raw === "split") return raw;
    return "split";
  });
  const viewModeRef = useRef(viewMode);

  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 520;
    const raw = window.localStorage.getItem("visitDokter:leftWidth");
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : 520;
  });

  const [formUrlInput, setFormUrlInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("visitDokter:formUrl") ?? "";
  });
  const [formUrl, setFormUrl] = useState(formUrlInput);

  const [iframeKey, setIframeKey] = useState(0);
  const embedUrl = useMemo(() => (formUrl ? toEmbeddableGoogleFormUrl(formUrl) : ""), [formUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("visitDokter:leftWidth", String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("visitDokter:viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current || viewModeRef.current !== "split") return;
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const delta = e.clientX - dragStartX.current;
      const next = dragStartW.current + delta;
      const min = 380;
      const max = Math.max(min, rect.width - 420);
      setLeftWidth(Math.max(min, Math.min(max, next)));
    };
    const onUp = () => {
      dragRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const saveFormUrl = () => {
    const trimmed = formUrlInput.trim();
    setFormUrl(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("visitDokter:formUrl", trimmed);
    }
    setIframeKey((k) => k + 1);
  };

  return (
    <div className="min-h-svh p-4 bg-background">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xl font-bold">Visit Dokter</div>
          <div className="text-xs text-muted-foreground">
            Split view: kiri jadwal visit, kanan Google Form.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "split" ? "default" : "outline"}
              onClick={() => setViewMode("split")}
              title="Tampilkan 2 window"
            >
              Split
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "visit" ? "default" : "outline"}
              onClick={() => setViewMode("visit")}
              title="Hanya jadwal visit"
            >
              Visit
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "form" ? "default" : "outline"}
              onClick={() => setViewMode("form")}
              title="Hanya Google Form"
            >
              Form
            </Button>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link href="/">Back</Link>
          </Button>
        </div>
      </div>

      <Card className="mb-3 p-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Google Form URL (opsional)</div>
            <Input
              value={formUrlInput}
              onChange={(e) => setFormUrlInput(e.target.value)}
              placeholder="Paste link Google Form (formResponse / viewform)…"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={saveFormUrl}>
              Set Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIframeKey((k) => k + 1)}
              disabled={!embedUrl}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button type="button" asChild disabled={!embedUrl}>
              <a href={embedUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </Card>

      <div
        ref={containerRef}
        className="h-[calc(100svh-148px)] rounded-xl border bg-card overflow-hidden flex"
      >
        {viewMode !== "form" && (
          <div
            className="h-full overflow-hidden"
            style={{ width: viewMode === "split" ? leftWidth : "100%" }}
          >
            <div className="h-full p-3 overflow-auto">
              <VisitSchedulePanel />
            </div>
          </div>
        )}

        {viewMode === "split" && (
          <div
            className="w-2 cursor-col-resize bg-border/60 hover:bg-border relative"
            onPointerDown={(e) => {
              dragRef.current = true;
              dragStartX.current = e.clientX;
              dragStartW.current = leftWidth;
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            }}
            aria-label="Resize panels"
            title="Drag to resize"
          />
        )}

        {viewMode !== "visit" && (
          <div className="flex-1 h-full overflow-hidden">
            <Card className="h-full rounded-none border-0">
              {embedUrl ? (
                <iframe
                  key={iframeKey}
                  title="Google Form"
                  src={embedUrl}
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  Set link Google Form dulu.
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

