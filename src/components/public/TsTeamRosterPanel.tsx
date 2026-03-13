"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { BriefcaseBusiness, Loader2, Plus, ShieldCheck, Trash2, Truck, UserRoundCog, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type TeamAvailabilityStatus = "aktif" | "sakit" | "izin" | "cuti" | "non_aktif";
export type TeamMemberRole = "" | "ts" | "logistik" | "admin";
export type TeamRosterViewMode = "table" | "card";

export type TsTeamMember = {
  no: string;
  nama: string;
  role: TeamMemberRole;
  email: string;
  phone: string;
  status: TeamAvailabilityStatus;
  profileId: string;
  profileUrl: string;
};

type TsTeamMemberSaveInput = {
  no: string;
  nama: string;
  role: TeamMemberRole;
  email: string;
  phone: string;
  status: TeamAvailabilityStatus;
  profileId: string;
  profileUrl: string;
};

type TsTeamRosterPanelProps = {
  members: TsTeamMember[];
  loading: boolean;
  saving: boolean;
  viewMode?: TeamRosterViewMode;
  onViewModeChange?: (mode: TeamRosterViewMode) => void;
  onCreate: (input: TsTeamMemberSaveInput, file: File | null) => Promise<void>;
  onUpdate: (
    originalNo: string,
    input: TsTeamMemberSaveInput,
    file: File | null,
    deleteProfile: boolean
  ) => Promise<void>;
  onDelete: (memberNo: string) => Promise<void>;
  onQuickStatusChange: (memberNo: string, status: TeamAvailabilityStatus) => Promise<void>;
};

const STATUS_OPTIONS: TeamAvailabilityStatus[] = ["aktif", "sakit", "izin", "cuti", "non_aktif"];
const ROLE_OPTIONS: TeamMemberRole[] = ["ts", "logistik", "admin", ""];

const ROLE_LABEL: Record<TeamMemberRole, string> = {
  "": "Sales / Direktor",
  ts: "TS",
  logistik: "Logistik",
  admin: "Admin",
};

const ROLE_CHIP_CLASS: Record<TeamMemberRole, string> = {
  "": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  ts: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",
  logistik: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
};

const ROLE_ICON: Record<TeamMemberRole, ComponentType<{ className?: string }>> = {
  "": BriefcaseBusiness,
  ts: Wrench,
  logistik: Truck,
  admin: ShieldCheck,
};

const STATUS_LABEL: Record<TeamAvailabilityStatus, string> = {
  aktif: "aktif",
  sakit: "sakit",
  izin: "izin",
  cuti: "cuti",
  non_aktif: "non aktif",
};

const STATUS_CHIP_CLASS: Record<TeamAvailabilityStatus, string> = {
  aktif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  sakit: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  izin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  cuti: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200",
  non_aktif: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

const STATUS_CARD_CLASS: Record<TeamAvailabilityStatus, string> = {
  aktif:
    "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/15",
  sakit: "border-rose-200/80 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/15",
  izin: "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/15",
  cuti: "border-sky-200/80 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/15",
  non_aktif:
    "border-slate-200/80 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-900/40",
};

const STATUS_SELECT_CLASS: Record<TeamAvailabilityStatus, string> = {
  aktif:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  sakit:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
  izin:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  cuti:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
  non_aktif:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const useObjectPreview = (file: File | null) => {
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return previewUrl;
};

export default function TsTeamRosterPanel({
  members,
  loading,
  saving,
  viewMode = "table",
  onViewModeChange,
  onCreate,
  onUpdate,
  onDelete,
  onQuickStatusChange,
}: TsTeamRosterPanelProps) {
  const [open, setOpen] = useState(false);
  const [editingNo, setEditingNo] = useState<string | null>(null);
  const [form, setForm] = useState<TsTeamMemberSaveInput>({
    no: "",
    nama: "",
    role: "ts",
    email: "",
    phone: "",
    status: "aktif",
    profileId: "",
    profileUrl: "",
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [deleteProfile, setDeleteProfile] = useState(false);
  const [statusUpdatingNo, setStatusUpdatingNo] = useState<string | null>(null);

  const previewUrl = useObjectPreview(profileFile);

  const activeCount = useMemo(() => members.filter((member) => member.status === "aktif").length, [members]);

  const openCreate = () => {
    setEditingNo(null);
    setForm({
      no: "",
      nama: "",
      role: "ts",
      email: "",
      phone: "",
      status: "aktif",
      profileId: "",
      profileUrl: "",
    });
    setProfileFile(null);
    setDeleteProfile(false);
    setOpen(true);
  };

  const openEdit = (member: TsTeamMember) => {
    setEditingNo(member.no);
    setForm({
      no: member.no,
      nama: member.nama,
      role: member.role,
      email: member.email,
      phone: member.phone,
      status: member.status,
      profileId: member.profileId,
      profileUrl: member.profileUrl,
    });
    setProfileFile(null);
    setDeleteProfile(false);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.nama.trim()) return;
    if (!editingNo) {
      await onCreate(form, profileFile);
    } else {
      await onUpdate(editingNo, form, profileFile, deleteProfile);
    }
    setOpen(false);
  };

  return (
    <Card className="rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/90 via-white to-fuchsia-50/70 p-3 shadow-sm dark:border-violet-900/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-fuchsia-950/20">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300">Staff Operasi</p>
          <h4 className="text-sm font-semibold md:text-base">
            {members.length} personel • {activeCount} aktif
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {onViewModeChange ? (
            <div className="hidden md:inline-flex items-center rounded-full border border-violet-200/70 bg-white/70 p-1 dark:border-violet-900/50 dark:bg-slate-900/70">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                className="h-8 rounded-full px-3 text-[11px]"
                onClick={() => onViewModeChange("table")}
              >
                Tabel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "card" ? "default" : "ghost"}
                className="h-8 rounded-full px-3 text-[11px]"
                onClick={() => onViewModeChange("card")}
              >
                Card
              </Button>
            </div>
          ) : null}
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tambah Staff
          </Button>
        </div>
      </div>

      <div className={cn("mt-3 space-y-2", members.length > 5 && "max-h-[520px] overflow-y-auto pr-1")}>
        {members.length > 0 ? (
          viewMode === "table" ? (
            <div className="overflow-x-auto rounded-xl border border-violet-200/60 bg-white/85 dark:border-violet-900/40 dark:bg-slate-900/70">
              <table className="w-full min-w-[760px] table-fixed text-xs">
                <thead className="sticky top-0 z-10 bg-violet-100/80 dark:bg-violet-950/40">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="w-[30%] px-3 py-2">Nama</th>
                    <th className="w-[108px] px-3 py-2">Role</th>
                    <th className="w-[26%] px-3 py-2">Kontak</th>
                    <th className="w-[154px] px-3 py-2">Status</th>
                    <th className="w-[150px] px-3 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.no}
                      className={cn(
                        "border-t text-[11px]",
                        STATUS_CARD_CLASS[member.status]
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {member.profileUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.profileUrl}
                              alt={`Foto ${member.nama || "TS"}`}
                              className="h-8 w-8 rounded-full border object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-violet-50 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                              {getInitials(member.nama || "TS")}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.nama || "-"}</p>
                            <p className="truncate text-[10px] text-muted-foreground">No: {member.no || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            ROLE_CHIP_CLASS[member.role]
                          )}
                        >
                          {(() => {
                            const RoleIcon = ROLE_ICON[member.role];
                            return <RoleIcon className="h-3 w-3" />;
                          })()}
                          {ROLE_LABEL[member.role]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <p className="truncate">{member.email || "-"}</p>
                        <p className="truncate">{member.phone || "-"}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CHIP_CLASS[member.status])}>
                            {STATUS_LABEL[member.status]}
                          </span>
                          <select
                            value={member.status}
                            onChange={async (event) => {
                              const nextStatus = event.target.value as TeamAvailabilityStatus;
                              setStatusUpdatingNo(member.no);
                              try {
                                await onQuickStatusChange(member.no, nextStatus);
                              } finally {
                                setStatusUpdatingNo((prev) => (prev === member.no ? null : prev));
                              }
                            }}
                            className={cn(
                              "h-8 rounded-md border px-2 text-[11px]",
                              STATUS_SELECT_CLASS[member.status]
                            )}
                            disabled={saving || statusUpdatingNo === member.no}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                          {statusUpdatingNo === member.no ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-[11px]"
                            onClick={() => openEdit(member)}
                          >
                            <UserRoundCog className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-[11px]"
                            onClick={() => void onDelete(member.no)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.no}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-xs shadow-sm",
                    STATUS_CARD_CLASS[member.status]
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {member.profileUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.profileUrl}
                          alt={`Foto ${member.nama || "TS"}`}
                          className="h-9 w-9 rounded-full border object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-violet-50 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                          {getInitials(member.nama || "TS")}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{member.nama || "-"}</p>
                        <p className="truncate text-[10px] text-muted-foreground">No: {member.no || "-"}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        ROLE_CHIP_CLASS[member.role]
                      )}
                    >
                      {(() => {
                        const RoleIcon = ROLE_ICON[member.role];
                        return <RoleIcon className="h-3 w-3" />;
                      })()}
                      {ROLE_LABEL[member.role]}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                    <p className="truncate">{member.email || "-"}</p>
                    <p className="truncate">{member.phone || "-"}</p>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CHIP_CLASS[member.status])}>
                      {STATUS_LABEL[member.status]}
                    </span>
                    <select
                      value={member.status}
                      onChange={async (event) => {
                        const nextStatus = event.target.value as TeamAvailabilityStatus;
                        setStatusUpdatingNo(member.no);
                        try {
                          await onQuickStatusChange(member.no, nextStatus);
                        } finally {
                          setStatusUpdatingNo((prev) => (prev === member.no ? null : prev));
                        }
                      }}
                      className={cn("h-8 rounded-md border px-2 text-[11px]", STATUS_SELECT_CLASS[member.status])}
                      disabled={saving || statusUpdatingNo === member.no}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    {statusUpdatingNo === member.no ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-[11px]"
                      onClick={() => openEdit(member)}
                    >
                      <UserRoundCog className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-[11px]"
                      onClick={() => void onDelete(member.no)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {!loading && members.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Belum ada data Team TS.
          </div>
        ) : null}
        {loading ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-violet-200/60 bg-white/80 px-2.5 py-2 dark:border-violet-900/40 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <div className="rounded-xl border border-violet-200/60 bg-white/80 px-2.5 py-2 dark:border-violet-900/40 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNo ? "Edit Staff" : "Tambah Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Nama *</label>
                <Input value={form.nama} onChange={(event) => setForm((prev) => ({ ...prev, nama: event.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Role</label>
                <select
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as TeamMemberRole }))}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Phone</label>
                <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TeamAvailabilityStatus }))}
                  className={cn(
                    "h-10 w-full rounded-md border px-3 text-sm",
                    STATUS_SELECT_CLASS[form.status]
                  )}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <label className="text-xs text-muted-foreground">Foto Profil Staff</label>
              <Input type="file" accept="image/*" onChange={(event) => setProfileFile(event.target.files?.[0] || null)} />
              <div className="flex items-center gap-2">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview foto profil staff" className="h-10 w-10 rounded-full object-cover border" />
                ) : form.profileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.profileUrl} alt="Foto profil staff" className="h-10 w-10 rounded-full object-cover border" />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-medium">
                    {getInitials(form.nama || "TS")}
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProfileFile(null);
                    setDeleteProfile(true);
                    setForm((prev) => ({ ...prev, profileId: "", profileUrl: "" }));
                  }}
                >
                  Hapus Foto
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="button" disabled={saving || !form.nama.trim()} onClick={() => void submit()}>
                {saving ? "Menyimpan..." : editingNo ? "Simpan Perubahan" : "Tambah Staff"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
