"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { IntertainItem } from "@/types/intertain";

type ApiIntertainResponse =
  | IntertainItem[]
  | { intertain?: IntertainItem[]; data?: IntertainItem[] };

type MealsMeetingForm = {
  no?: number;
  tanggal: string;
  jenis: string;
  keterangan: string;
  jumlah: number;
  rumahSakit: string;
};

const INITIAL_FORM: MealsMeetingForm = {
  tanggal: "",
  jenis: "Meals Meeting",
  keterangan: "",
  jumlah: 0,
  rumahSakit: "",
};

const toIntertainArray = (payload: ApiIntertainResponse): IntertainItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.intertain)) return payload.intertain;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function MealsMeetingPanel() {
  const [data, setData] = useState<IntertainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rumahSakit, setRumahSakit] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MealsMeetingForm>(INITIAL_FORM);
  const deferredSearch = useDeferredValue(search);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intertain", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat data Meals Meeting");
      const json = (await res.json()) as ApiIntertainResponse;
      setData(toIntertainArray(json));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const mealsMeetingData = useMemo(() => {
    const filtered = data.filter((item) =>
      /meal|meals|meeting|metting/i.test(`${item.jenis} ${item.keterangan}`)
    );
    return filtered.length ? filtered : data;
  }, [data]);

  const rumahSakitOptions = useMemo(
    () => Array.from(new Set(mealsMeetingData.map((d) => d.rumahSakit))).filter(Boolean),
    [mealsMeetingData]
  );

  const filteredData = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return mealsMeetingData
      .filter((item) => !rumahSakit || item.rumahSakit === rumahSakit)
      .filter((item) => {
        if (!term) return true;
        return (
          item.jenis.toLowerCase().includes(term) ||
          item.keterangan.toLowerCase().includes(term) ||
          item.rumahSakit.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  }, [deferredSearch, mealsMeetingData, rumahSakit]);

  const total = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.jumlah || 0), 0),
    [filteredData]
  );

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setOpenForm(true);
  };

  const openEdit = (item: IntertainItem) => {
    setForm({
      no: item.no,
      tanggal: item.tanggal || "",
      jenis: item.jenis || "Meals Meeting",
      keterangan: item.keterangan || "",
      jumlah: Number(item.jumlah || 0),
      rumahSakit: item.rumahSakit || "",
    });
    setOpenForm(true);
  };

  const submitForm = async () => {
    if (!form.tanggal || !form.jenis || !form.rumahSakit || form.jumlah <= 0) return;
    setSaving(true);
    try {
      const method = form.no ? "PUT" : "POST";
      const res = await fetch("/api/intertain", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      setOpenForm(false);
      setForm(INITIAL_FORM);
      await fetchData();
    } catch {
      // keep silent to keep flow simple
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item: IntertainItem) => {
    const confirmed = window.confirm(`Hapus data "${item.jenis}" (${item.tanggal})?`);
    if (!confirmed) return;
    try {
      const res = await fetch("/api/intertain", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no: item.no }),
      });
      if (!res.ok) throw new Error("Gagal menghapus data");
      await fetchData();
    } catch {
      // keep silent to keep flow simple
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-r from-cyan-500 to-sky-600 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide opacity-85">Meals Meeting</div>
            <div className="text-2xl font-bold mt-1">Rp {total.toLocaleString("id-ID")}</div>
            <div className="text-xs opacity-90 mt-1">{filteredData.length} transaksi</div>
          </div>
          <Building2 className="h-10 w-10 opacity-30" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jenis / keterangan / rumah sakit..."
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={rumahSakit}
          onChange={(e) => setRumahSakit(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Semua Rumah Sakit</option>
          {rumahSakitOptions.map((rs) => (
            <option key={rs} value={rs}>
              {rs}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Tambah Meals Meeting
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["Tanggal", "Jenis", "Keterangan", "Jumlah", "Rumah Sakit", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading &&
              filteredData.map((item) => (
                <tr key={item.no} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">{item.tanggal || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.jenis || "-"}</td>
                  <td className="px-4 py-3">{item.keterangan || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    Rp {Number(item.jumlah || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.rumahSakit || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada data Meals Meeting.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-xl border bg-background p-4 space-y-3">
            <div className="text-base font-semibold">
              {form.no ? "Edit Meals Meeting" : "Tambah Meals Meeting"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={form.jenis}
                onChange={(e) => setForm((prev) => ({ ...prev, jenis: e.target.value }))}
                placeholder="Jenis"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={form.jumlah}
                onChange={(e) => setForm((prev) => ({ ...prev, jumlah: Number(e.target.value) }))}
                placeholder="Jumlah"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={form.rumahSakit}
                onChange={(e) => setForm((prev) => ({ ...prev, rumahSakit: e.target.value }))}
                placeholder="Rumah Sakit"
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Keterangan"
              className="w-full rounded-md border px-3 py-2 text-sm min-h-24"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="rounded-md border px-3 py-2 text-sm"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
