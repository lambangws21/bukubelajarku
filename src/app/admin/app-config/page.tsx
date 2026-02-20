"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

type AppConfigResponse = {
  currentVersion: string;
  latestVersion: string;
  minVersion: string;
  updateUrl?: string;
  message?: string;
  maintenance?: boolean;
  maintenanceMessage?: string;
};

export default function AppConfigAdminPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [latestVersion, setLatestVersion] = useState("");
  const [minVersion, setMinVersion] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  const [message, setMessage] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/app-config", { cache: "no-store" });
        const json = (await res.json()) as AppConfigResponse;
        setLatestVersion(json.latestVersion || "");
        setMinVersion(json.minVersion || "");
        setUpdateUrl(json.updateUrl || "");
        setMessage(json.message || "");
        setMaintenance(Boolean(json.maintenance));
        setMaintenanceMessage(json.maintenanceMessage || "");
      } catch {
        toast({
          title: "Gagal memuat config",
          description: "Tidak bisa mengambil /api/app-config.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const handleSave = async () => {
    if (!token) {
      toast({
        title: "Token diperlukan",
        description: "Isi APP_CONFIG_ADMIN_TOKEN untuk update config.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/app-config/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latestVersion,
          minVersion,
          updateUrl,
          message,
          maintenance,
          maintenanceMessage,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Gagal menyimpan",
          description: json?.error || `HTTP ${res.status}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "appConfig berhasil diupdate.",
      });
    } catch {
      toast({
        title: "Gagal menyimpan",
        description: "Tidak bisa menghubungi server.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
                Admin
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                App Config (Update / Upgrade)
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Versi aplikasi saat ini:{" "}
                <span className="font-semibold text-emerald-200">
                  {currentVersion}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Admin Token (APP_CONFIG_ADMIN_TOKEN)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Masukkan token"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat config…
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Latest Version (optional update)
                    </label>
                    <input
                      value={latestVersion}
                      onChange={(e) => setLatestVersion(e.target.value)}
                      placeholder="contoh: 2.2.0"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Min Version (force update)
                    </label>
                    <input
                      value={minVersion}
                      onChange={(e) => setMinVersion(e.target.value)}
                      placeholder="contoh: 2.1.0"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Update URL
                  </label>
                  <input
                    value={updateUrl}
                    onChange={(e) => setUpdateUrl(e.target.value)}
                    placeholder="contoh: https://..."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Pesan Update (optional)
                  </label>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="contoh: Ada fitur baru, silakan update."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Maintenance Mode
                    </p>
                    <p className="text-xs text-slate-400">
                      Jika aktif, banner maintenance akan tampil ke semua user.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenance((v) => !v)}
                    className={`relative h-7 w-12 rounded-full border transition ${
                      maintenance
                        ? "border-emerald-400 bg-emerald-500/40"
                        : "border-white/10 bg-white/5"
                    }`}
                    aria-pressed={maintenance}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                        maintenance ? "left-6" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Pesan Maintenance
                  </label>
                  <input
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="contoh: Maintenance sampai 22:00 WIB."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Catatan: Pastikan env server sudah terisi `APP_CONFIG_ADMIN_TOKEN`
              dan `FIREBASE_DATABASE_URL` atau `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

