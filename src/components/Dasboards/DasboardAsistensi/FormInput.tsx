import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export default function FormInputOperasi({ visible, onClose, onSuccess, initialData }: FormInputOperasiProps) {
  const [formData, setFormData] = useState({
    date: "",
    rumahSakit: "",
    tindakanOperasi: "",
    operator: "",
    jumlah: 0,
    file: null as File | null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || "",
        rumahSakit: initialData.rumahSakit || "",
        tindakanOperasi: initialData.tindakanOperasi || "",
        operator: initialData.operator || "",
        jumlah: initialData.jumlah ?? 0,
        file: null, // jangan pre-fill file
      });
    }
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jumlah' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
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
        await new Promise((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            const parts = result.split(",");
            fileBase64 = parts[1];
            mimeType = formData.file!.type;
            fileName = formData.file!.name;
            resolve(null);
          };
        });
      }

      const payload = {
        date: formData.date,
        rumahSakit: formData.rumahSakit,
        tindakanOperasi: formData.tindakanOperasi,
        operator: formData.operator,
        jumlah: formData.jumlah, // sudah number
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

      const json = await response.json();
      if (json.status === "success") {
        toast.success("✅ Data berhasil dikirim!");
        onSuccess();
      } else {
        toast.error("❌ Gagal: " + json.message);
      }
    } catch (error) {
      toast.error("❌ Error: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-xl mx-auto">
        <DialogHeader>
          <DialogTitle>Input Data Operasi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="date">Tanggal</Label>
            <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="rumahSakit">Rumah Sakit</Label>
            <Input type="text" name="rumahSakit" value={formData.rumahSakit} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="tindakanOperasi">Tindakan Operasi</Label>
            <Textarea name="tindakanOperasi" value={formData.tindakanOperasi} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="operator">Operator</Label>
            <Input type="text" name="operator" value={formData.operator} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="jumlah">Jumlah</Label>
            <Input
              type="number"
              name="jumlah"
              value={formData.jumlah}
              onChange={handleChange}
              min={0}
              required
            />
          </div>
          <div>
            <Label htmlFor="file">Upload Foto (Opsional)</Label>
            <Input type="file" name="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mengirim..." : "Kirim Data"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
