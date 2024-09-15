"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FormInput: React.FC = () => {
  const [formData, setFormData] = useState({
    id: "",
    ok: "",
    unit: "",
    jaminan: "",
    anestesi: "",
    tindakan: "",
    operator: "",
    perawat: "",
    waktu: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/addData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([formData]), // Dikirim sebagai array karena Google Sheets menggunakan loop
      });

      if (response.ok) {
        alert("Data berhasil ditambahkan!");
        setFormData({
          id: "",
          ok: "",
          unit: "",
          jaminan: "",
          anestesi: "",
          tindakan: "",
          operator: "",
          perawat: "",
          waktu: "",
        }); // Reset form setelah submit
      } else {
        alert("Gagal menambahkan data.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          {Object.keys(formData).map((field) => (
            <div key={field} className="mb-4">
              <Label htmlFor={field}>{field}</Label>
              <Input
                id={field}
                name={field}
                value={formData[field as keyof typeof formData]}
                onChange={handleChange}
                placeholder={field}
              />
            </div>
          ))}
          <Button type="submit">Submit</Button>
        </form>
      </Card>
    </motion.div>
  );
};

export default FormInput;
