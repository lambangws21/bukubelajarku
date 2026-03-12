import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormInputOperasiProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    date: string;
    rumahSakit: string;
    tindakanOperasi: string;
    operator: string;
    jumlah: number;
    file?: File | null;
  } | null;
}

const emptyForm = {
  date: "",
  rumahSakit: "",
  tindakanOperasi: "",
  operator: "",
  jumlah: 0,
  file: null as File | null,
};

export default function FormInputOperasi({
  visible,
  onClose,
  onSuccess,
  initialData,
}: FormInputOperasiProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setFormData({
        date: initialData.date || "",
        rumahSakit: initialData.rumahSakit || "",
        tindakanOperasi: initialData.tindakanOperasi || "",
        operator: initialData.operator || "",
        jumlah: initialData.jumlah ?? 0,
        file: null,
      });
      return;
    }

    setFormData(emptyForm);
  }, [visible, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "jumlah" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileBase64 = "";
      let mimeType = "";
      let fileName = "";

      if (formData.file instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(formData.file);
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            const parts = result.split(",");
            fileBase64 = parts[1] || "";
            mimeType = formData.file?.type || "";
            fileName = formData.file?.name || "";
            resolve();
          };
        });
      }

      const payload = {
        date: formData.date,
        rumahSakit: formData.rumahSakit,
        tindakanOperasi: formData.tindakanOperasi,
        operator: formData.operator,
        jumlah: formData.jumlah,
        fileBase64,
        fileName,
        mimeType,
      };

      const response = await fetch("/api/asistensi/add", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const raw = await response.text();
      let json: { status?: string; message?: string } | null = null;
      try {
        json = JSON.parse(raw) as { status?: string; message?: string };
      } catch {
        throw new Error(`Respons server tidak valid: ${raw.slice(0, 120)}`);
      }
      if (json.status === "success") {
        toast.success("Data berhasil dikirim");
        onSuccess();
      } else {
        toast.error(`Gagal: ${json.message || "Unknown error"}`);
      }
    } catch (error) {
      toast.error(`Error: ${String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="mx-auto max-w-2xl border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Data Asistensi" : "Input Data Asistensi"}</DialogTitle>
          <DialogDescription>
            Lengkapi data tindakan operasi dan unggah bukti jika diperlukan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rumahSakit">Rumah Sakit</Label>
              <Input
                id="rumahSakit"
                type="text"
                name="rumahSakit"
                value={formData.rumahSakit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tindakanOperasi">Tindakan Operasi</Label>
            <Textarea
              id="tindakanOperasi"
              name="tindakanOperasi"
              value={formData.tindakanOperasi}
              onChange={handleChange}
              required
              className="min-h-[90px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="operator">Operator</Label>
              <Input
                id="operator"
                type="text"
                name="operator"
                value={formData.operator}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jumlah">Jumlah</Label>
              <Input
                id="jumlah"
                type="number"
                name="jumlah"
                value={formData.jumlah}
                onChange={handleChange}
                min={0}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file">Upload Foto (Opsional)</Label>
            <Input id="file" type="file" name="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
