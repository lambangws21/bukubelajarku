"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OperasiMaterialsPanel } from "@/components/operasi/OperasiMaterialsPanel";

const RAW_FORM_URL =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfaqN8MwjyAb4RzkX6afr_OYop5_WLYmPF7fEnWCe3inlWQ3w/formResponse";

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

export default function OperasiPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const [viewMode, setViewMode] = useState<"split" | "form" | "materials">(() => {
    if (typeof window === "undefined") return "split";
    const raw = window.localStorage.getItem("operasi:viewMode");
    if (raw === "form" || raw === "materials" || raw === "split") return raw;
    return "split";
  });
  const viewModeRef = useRef(viewMode);

  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 460;
    const raw = window.localStorage.getItem("operasi:leftWidth");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : 460;
  });

  const [iframeKey, setIframeKey] = useState(0);
  const embedUrl = useMemo(() => toEmbeddableGoogleFormUrl(RAW_FORM_URL), []);

  const resetView = () => {
    setViewMode("split");
    setLeftWidth(460);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("operasi:viewMode");
        window.localStorage.removeItem("operasi:leftWidth");
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("operasi:leftWidth", String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("operasi:viewMode", viewMode);
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
      const min = 340;
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

  return (
    <div className="min-h-svh p-4 bg-background">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xl font-bold">Operasi</div>
          <div className="text-xs text-muted-foreground">
            Split view: kiri untuk pilih implant/material, kanan untuk isi Google Form.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-wrap">
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
              variant={viewMode === "materials" ? "default" : "outline"}
              onClick={() => setViewMode("materials")}
              title="Hanya daftar implant/material"
            >
              Materials
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetView}
              title="Reset tampilan (kalau panel hilang)"
            >
              Reset
            </Button>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link href="/">Back</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIframeKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Form
          </Button>
          <Button type="button" asChild>
            <a href={embedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Form
            </a>
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[calc(100svh-88px)] rounded-xl border bg-card overflow-hidden flex"
      >
        {viewMode !== "form" && (
          <div
            className="h-full overflow-hidden"
            style={{ width: viewMode === "split" ? leftWidth : "100%" }}
          >
            <div className="h-full min-h-0 p-3 overflow-hidden">
              <OperasiMaterialsPanel />
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

        {viewMode !== "materials" && (
          <div className="flex-1 h-full overflow-hidden">
            <Card className="h-full rounded-none border-0">
              <iframe
                key={iframeKey}
                title="Google Form"
                src={embedUrl}
                className="h-full w-full"
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
