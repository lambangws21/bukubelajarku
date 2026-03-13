"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TsSupportRole } from "@/lib/tsSupportSession";

type TsSupportStaffAccountDialogProps = {
  currentRole: TsSupportRole;
  onCreated?: () => void;
};

const roleOptions: Array<{ value: "sales" | "ts" | "logistik" | "admin"; label: string }> = [
  { value: "ts", label: "TS (Readonly)" },
  { value: "logistik", label: "Logistik (Readonly)" },
  { value: "admin", label: "Admin (Readonly)" },
  { value: "sales", label: "Sales (Manajemen)" },
];

export default function TsSupportStaffAccountDialog({
  currentRole,
  onCreated,
}: TsSupportStaffAccountDialogProps) {
  const canManage = currentRole === "sales";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("ts");
  const [password, setPassword] = useState("");

  const generatedEmail = useMemo(() => {
    const raw = username.trim().toLowerCase();
    if (!raw) return "";
    if (raw.includes("@")) return raw;
    return `${raw.replace(/[^a-z0-9._-]/g, "")}@ts-support.local`;
  }, [username]);

  if (!canManage) return null;

  const resetForm = () => {
    setName("");
    setUsername("");
    setRole("ts");
    setPassword("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ts-support-auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          role,
          password,
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | { status?: string; message?: string; warning?: string; data?: { email?: string } }
        | null;

      if (!response.ok || json?.status === "error") {
        throw new Error(json?.message || "Gagal membuat akun staff.");
      }

      toast.success(`Akun dibuat: ${json?.data?.email || generatedEmail}`);
      if (json?.warning) {
        toast.warning(json.warning);
      }
      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat akun staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-9 px-3 text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Buat Akun Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Akun Staff TS Support</DialogTitle>
          <DialogDescription>
            Buat username, role, dan password staff. Akun akan langsung disimpan ke Firebase Auth.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-xs text-muted-foreground">Nama Staff</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="contoh: jhonny atau jhonny@mail.com"
              required
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Login memakai: <span className="font-medium">{generatedEmail || "-"}</span>
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
              type="password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Simpan Akun Staff
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
