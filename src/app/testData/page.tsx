"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function FormInputOperasi() {
  const [formData, setFormData] = useState<{
    date: string;
    rumahSakit: string;
    tindakanOperasi: string;
    operator: string;
    jumlah: string;
    file: File | null;
  }>({
    date: "",
    rumahSakit: "",
    tindakanOperasi: "",
    operator: "",
    jumlah: "",
    file: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const json = await response.json();
      if (json.status === "success") {
        toast.success("✅ Data berhasil dikirim!");
        setFormData({
          date: "",
          rumahSakit: "",
          tindakanOperasi: "",
          operator: "",
          jumlah: "",
          file: null,
        });
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
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl mx-auto p-4 border rounded-xl shadow-md">
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
        <Input type="number" name="jumlah" value={formData.jumlah} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="file">Upload Foto (Opsional)</Label>
        <Input type="file" name="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Mengirim..." : "Kirim Data"}</Button>
    </form>
  );
}