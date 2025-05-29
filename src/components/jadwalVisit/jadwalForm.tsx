"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function JadwalForm({ onSubmit, initialData, onCancel }: any) {
  const [form, setForm] = useState(initialData || {
    tanggal: "",
    rumahSakit: "",
    alamat: "",
    dokter: "",
    waktuMulai: "",
    waktuSelesai: "",
    status: "Belum Visit",
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-xl shadow-md space-y-3"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {["tanggal", "rumahSakit", "alamat", "dokter", "waktuMulai", "waktuSelesai"].map((field) => (
          <input
            key={field}
            type={field === "tanggal" ? "date" : field.includes("waktu") ? "time" : "text"}
            name={field}
            placeholder={field}
            value={form[field]}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        ))}

        <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded">
          <option value="Belum Visit">Belum Visit</option>
          <option value="Sudah Visit">Sudah Visit</option>
        </select>

        <div className="flex gap-2 col-span-full">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
          <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">Batal</button>
        </div>
      </form>
    </motion.div>
  );
}
