"use client";

import { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TsConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function TsConfirmDialog({
  open,
  title,
  description,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  destructive = false,
  loading = false,
  onOpenChange,
  onConfirm,
}: TsConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-sm rounded-2xl p-4 sm:w-full sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="h-10 w-full sm:w-auto"
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TsTextDialogProps = {
  open: boolean;
  title: string;
  description: string;
  value: string;
  label?: string;
  placeholder?: string;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  multiline?: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

export function TsTextDialog({
  open,
  title,
  description,
  value,
  label = "Input",
  placeholder = "",
  submitText = "Simpan",
  cancelText = "Batal",
  loading = false,
  multiline = false,
  onOpenChange,
  onValueChange,
  onSubmit,
}: TsTextDialogProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md rounded-2xl p-4 sm:w-full sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-muted-foreground">{label}</label>
            {multiline ? (
              <Textarea
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                rows={4}
                placeholder={placeholder}
                className="mt-1"
              />
            ) : (
              <Input
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={placeholder}
                className="mt-1"
              />
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelText}
            </Button>
            <Button type="submit" className="h-10 w-full sm:w-auto" disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
