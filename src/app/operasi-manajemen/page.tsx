"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileDown, FileText, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import jsPDF from "jspdf";
import "jspdf-autotable";

import OperationDashboard from "@/components/OperationDashboard";
import OperationManager from "@/components/OperationManager";
import OperationForm from "@/components/OperationForm";
import Spinner from "@/components/Spinner";

export interface Operation {
  id: string;
  date: string;
  dokter: string;
  tindakanOperasi: string;
  rumahSakit: string;
  jumlah: number;
  klaim: string;
  namaPerawat: string;
}

const escapeCSV = (str: string | number): string => {
  let value = String(str);
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
};

type GasOperasiRow = {
  [key: string]: unknown;
};

const extractRows = (payload: unknown): GasOperasiRow[] => {
  if (Array.isArray(payload)) {
    return payload as GasOperasiRow[];
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const obj = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    obj.data,
    obj.rows,
    (obj.result as Record<string, unknown> | undefined)?.data,
    obj.riwayatOperasi,
    obj.intertain,
    obj.operations,
    obj.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as GasOperasiRow[];
    }
  }

  return [];
};

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchOperations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/operasi?sheet=ALL", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal mengambil data operasi.");

      const rawText = await response.text();
      let json: unknown = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error("Response API operasi tidak valid JSON.");
      }

      const rows = extractRows(json);

      const mapped: Operation[] = rows.map((r, index) => ({
        id: String(r.no ?? r.id ?? index + 1),
        date: String(r.date ?? r.tanggal ?? r.createdAt ?? ""),
        dokter: String(r.operator ?? r.dokter ?? r.klaimOleh ?? "-"),
        tindakanOperasi: String(r.tindakanOperasi ?? r.tindakan ?? r.implant ?? r.keterangan ?? "-"),
        rumahSakit: String(r.rumahSakit ?? r.hospital ?? "-"),
        jumlah: parseNumber(r.jumlah ?? r.total ?? r.nominal ?? r.amount),
        klaim: String(r.status ?? r.klaim ?? r.post ?? ""),
        namaPerawat: "",
      }));
      setOperations(mapped);
    } catch (error) {
      setOperations([]);
      toast.error((error as Error).message || "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (operations.length === 0) return;
    setIsExporting(true);

    try {
      const headers = [
        "ID",
        "Tanggal",
        "Dokter",
        "Tindakan Operasi",
        "Rumah Sakit",
        "Jumlah",
        "Klaim",
      ];

      const rows = operations.map((op) =>
        [
          escapeCSV(op.id),
          escapeCSV(op.date),
          escapeCSV(op.dokter),
          escapeCSV(op.tindakanOperasi),
          escapeCSV(op.rumahSakit),
          escapeCSV(op.jumlah),
          escapeCSV(op.klaim),
        ].join(",")
      );

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data_operasi_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("✅ Export CSV berhasil!");
    } catch {
      toast.error("❌ Gagal export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [operations]);

  const handleExportPDF = useCallback(async () => {
    if (operations.length === 0) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF();

      const tableCols = [
        "Tanggal",
        "Dokter",
        "Tindakan",
        "Rumah Sakit",
        "Jumlah",
        "Klaim",
      ];
      const tableRows = operations.map((op) => [
        op.date,
        op.dokter,
        op.tindakanOperasi,
        op.rumahSakit,
        String(op.jumlah),
        op.klaim,
      ]);

      doc.text("LAPORAN DATA OPERASI", 14, 15);

      (doc as any).autoTable({
        head: [tableCols],
        body: tableRows,
        startY: 20,
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175] },
      });

      doc.save(`laporan_operasi_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("✅ Export PDF berhasil!");
    } catch {
      toast.error("❌ Gagal export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [operations]);

  useEffect(() => {
    void fetchOperations();
  }, [fetchOperations]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-cyan-500" />
              Manajemen Operasi
            </h1>
            <p className="text-sm text-muted-foreground">
              Pantau, filter, dan export data operasi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={isExporting || operations.length === 0}
            variant="outline"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            onClick={handleExportPDF}
            disabled={isExporting || operations.length === 0}
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>

          <OperationForm onFormSubmit={fetchOperations} />
        </div>
      </div>

      <OperationDashboard operations={operations} isLoading={isLoading} />

      <OperationManager
        operationsData={operations}
        isLoading={isLoading}
        onDataChange={fetchOperations}
        user={null}
      />
    </div>
  );
}
