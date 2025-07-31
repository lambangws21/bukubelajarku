// ============================
// JadwalPage.tsx (Frontend UI)
// ============================

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface JadwalItem {
  namaTS: string;
  tindakan: string;
  rs: string;
  tanggal: string;
  id: string;
}

export default function JadwalPage() {
  const [data, setData] = useState<JadwalItem[]>([]);
  const [filtered, setFiltered] = useState<JadwalItem[]>([]);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<JadwalItem | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/ts?sheet=JADWAL");
    const json = await res.json();
    setData(json);
    setFiltered(json);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFiltered(
      data.filter(
        (d) =>
          d.namaTS.toLowerCase().includes(lower) ||
          d.rs.toLowerCase().includes(lower) ||
          d.tanggal.toLowerCase().includes(lower)
      )
    );
  }, [search, data]);

  const deleteJadwal = async (id: string) => {
    const res = await fetch("/api/ts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_jadwal", id }),
    });
    if (res.ok) {
      toast.success("Data dihapus");
      fetchData();
    } else {
      toast.error("Gagal menghapus");
    }
  };

  const exportPDF = async () => {
    const email = prompt("Masukkan email tujuan:");
    if (!email) return;
    const res = await fetch("/api/ts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_pdf", email }),
    });
    if (res.ok) toast.success("Email dikirim");
    else toast.error("Gagal kirim email");
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <Input
          placeholder="Cari nama TS / RS / tanggal"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={exportPDF}>Export ke Email (PDF)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border rounded p-4 shadow hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-lg">{item.namaTS}</h3>
            <p className="text-sm">Tindakan: {item.tindakan}</p>
            <p className="text-sm">RS: {item.rs}</p>
            <p className="text-xs text-gray-500">{item.tanggal}</p>

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                onClick={() => setEditItem(item)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteJadwal(item.id)}
              >
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">Edit Jadwal</h2>
            <Input
              placeholder="Nama TS"
              value={editItem.namaTS}
              onChange={(e) =>
                setEditItem({ ...editItem, namaTS: e.target.value })
              }
            />
            <Input
              placeholder="Tindakan"
              value={editItem.tindakan}
              onChange={(e) =>
                setEditItem({ ...editItem, tindakan: e.target.value })
              }
            />
            <Input
              placeholder="RS"
              value={editItem.rs}
              onChange={(e) =>
                setEditItem({ ...editItem, rs: e.target.value })
              }
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  const res = await fetch("/api/ts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "update_jadwal",
                      ...editItem,
                    }),
                  });
                  if (res.ok) {
                    toast.success("Data diperbarui");
                    setEditItem(null);
                    fetchData();
                  } else {
                    toast.error("Gagal update");
                  }
                }}
              >
                Simpan
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
