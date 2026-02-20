"use client";

import { useMemo, useState } from "react";
import { IMPLANT_MATERIALS, type ImplantCategory, type ImplantMaterialItem } from "@/lib/implantMaterials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_OPTIONS: Array<{ label: string; value: "ALL" | ImplantCategory }> = [
  { label: "All", value: "ALL" },
  { label: "THR", value: "THR" },
  { label: "TKR", value: "TKR" },
  { label: "BIPOLAR", value: "BIPOLAR" },
  { label: "BEARING", value: "BEARING" },
  { label: "STEM", value: "STEM" },
];

const formatItem = (item: ImplantMaterialItem) => {
  return `${item.name} - ${item.summary}`;
};

const buildSummary = (items: ImplantMaterialItem[]) => {
  if (!items.length) return "";
  const byCategory = items.reduce<Record<string, ImplantMaterialItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return Object.entries(byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, list]) => {
      const lines = list
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((it) => `- ${formatItem(it)}`);
      return `${cat}\n${lines.join("\n")}`;
    })
    .join("\n\n");
};

export function OperasiMaterialsPanel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | ImplantCategory>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IMPLANT_MATERIALS.filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [category, query]);

  const selectedItems = useMemo(
    () => IMPLANT_MATERIALS.filter((it) => selectedIds.has(it.id)),
    [selectedIds]
  );

  const summary = useMemo(() => buildSummary(selectedItems), [selectedItems]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((it) => next.add(it.id));
      return next;
    });
  };

  const clearSelected = () => setSelectedIds(new Set());

  const copySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(null), 1200);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold leading-tight">Operasi</div>
          <div className="text-xs text-muted-foreground">
            Pilih implant/material lalu copy ke Google Form.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedItems.length} selected</Badge>
          {copyStatus && <Badge variant="outline">{copyStatus}</Badge>}
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Search name / category / summary / tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={category === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <div className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
              Select filtered
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearSelected}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr className="text-left">
                <th className="px-3 py-2 w-10">Sel</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const checked = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`border-b hover:bg-muted/40 cursor-pointer ${checked ? "bg-muted/30" : ""}`}
                    onClick={() => toggleSelected(item.id)}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{item.category}</td>
                    <td className="px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2">{item.summary}</td>
                    <td className="px-3 py-2">{item.tags.join(", ")}</td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                    Tidak ada data. Isi `src/lib/implantMaterials.ts`.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Paste hasilnya ke field implant/material di form.
          </div>
          <Button type="button" onClick={copySummary} disabled={!summary}>
            Copy Summary
          </Button>
        </div>
        {summary && (
          <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted/40 p-2 text-xs whitespace-pre-wrap">
            {summary}
          </pre>
        )}
      </Card>
    </div>
  );
}
