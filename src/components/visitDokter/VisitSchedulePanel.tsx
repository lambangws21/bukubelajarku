"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type VisitRow = {
  id: number;
  tanggal: string;
  tanggalAsli: string;
  rumahSakit: string;
  alamat: string;
  dokter: string;
  waktuMulai: string;
  waktuSelesai: string;
  status: string;
};

const API_URL =
  "https://script.google.com/macros/s/AKfycbwtK10lWBGRcRw8I_yOFYXNQWJqXAi6k-BDkUOyYYk7gcfX5UKYZBBYQqklgASNf3Ow/exec";

function formatJam(jamISO: string): string {
  if (!jamISO) return "-";
  const date = new Date(jamISO);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatTanggal(tanggalISO: string): string {
  if (!tanggalISO) return "-";
  const date = new Date(tanggalISO);
  return Number.isNaN(date.getTime()) ? tanggalISO : date.toLocaleDateString("id-ID");
}

function normalizeJadwalData(raw: any[]): VisitRow[] {
  return raw
    .filter((item) => item && item["Rumah Sakit"] && item["Dokter"])
    .map((item, idx) => ({
      id: idx + 1,
      tanggal: formatTanggal(item["Tanggal"]),
      tanggalAsli: item["Tanggal"],
      rumahSakit: item["Rumah Sakit"] || "-",
      alamat: item["Alamat"] || "-",
      dokter: item["Dokter"] || "-",
      waktuMulai: formatJam(item["Waktu Visit"]),
      waktuSelesai: formatJam(item["Waktu Selesai"] || item[""]),
      status: item["Status"] || "Belum Visit",
    }));
}

function toIsoDate(input: string): string | null {
  if (!input) return null;
  if (input.includes("/")) {
    const [day, month, year] = input.split("/");
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().split("T")[0] ?? null;
}

const statusBadge = (status: string) => {
  if (status === "Belum Visit") return "bg-yellow-100 text-yellow-800";
  if (status === "Sedang Visit") return "bg-blue-100 text-blue-800";
  if (status === "Sudah Visit") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

export function VisitSchedulePanel() {
  const [data, setData] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const raw = (await res.json()) as any[];
      setData(normalizeJadwalData(Array.isArray(raw) ? raw : []));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((row) => {
      const rowDate = toIsoDate(row.tanggalAsli) ?? "";
      if (rowDate !== selectedDate) return false;
      if (selectedStatus !== "All" && row.status !== selectedStatus) return false;
      if (!q) return true;
      return (
        row.rumahSakit.toLowerCase().includes(q) ||
        row.dokter.toLowerCase().includes(q) ||
        row.alamat.toLowerCase().includes(q)
      );
    });
  }, [data, query, selectedDate, selectedStatus]);

  const copyRow = async (row: VisitRow) => {
    const text = [
      `Tanggal: ${row.tanggal}`,
      `RS: ${row.rumahSakit}`,
      `Alamat: ${row.alamat}`,
      `Dokter: ${row.dokter}`,
      `Waktu: ${row.waktuMulai} - ${row.waktuSelesai}`,
      `Status: ${row.status}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(null), 1200);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold leading-tight">Visit Dokter</div>
          <div className="text-xs text-muted-foreground">
            Pilih jadwal lalu copy detail untuk isi Google Form.
          </div>
        </div>
        <div className="flex items-center gap-2">
          {copyStatus && <Badge variant="outline">{copyStatus}</Badge>}
          <Badge variant="secondary">{filtered.length} rows</Badge>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tanggal</div>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="All">All</option>
                <option value="Belum Visit">Belum Visit</option>
                <option value="Sedang Visit">Sedang Visit</option>
                <option value="Sudah Visit">Sudah Visit</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Cari</div>
              <Input
                placeholder="RS / dokter / alamat…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr className="text-left">
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">RS</th>
                <th className="px-3 py-2">Dokter</th>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/40">
                  <td className="px-3 py-2">{row.tanggal}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.rumahSakit}</div>
                    <div className="text-xs text-muted-foreground">{row.alamat}</div>
                  </td>
                  <td className="px-3 py-2">{row.dokter}</td>
                  <td className="px-3 py-2">
                    {row.waktuMulai} - {row.waktuSelesai}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs rounded ${statusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => copyRow(row)}>
                      Copy
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                    Tidak ada jadwal untuk filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

