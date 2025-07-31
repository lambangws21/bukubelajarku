"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TSItem {
  namaTS: string;
  profil: string;
}

export default function TSForm() {
  const [namaTS, setNamaTS] = useState("");
  const [profil, setProfil] = useState("");
  const [tsList, setTSList] = useState<TSItem[]>([]);

  const fetchTS = async () => {
    const res = await fetch("/api/ts");
    const data: TSItem[] = await res.json();
    setTSList(data);
  };

  useEffect(() => {
    fetchTS();
  }, []);

  const handleSubmit = async () => {
    if (!namaTS.trim() || !profil.trim()) {
      return toast.error("Nama TS dan Profil wajib diisi");
    }

    const res = await fetch("/api/ts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_ts", namaTS, profil }),
    });

    if (res.ok) {
      toast.success("Data TS berhasil ditambahkan");
      setNamaTS("");
      setProfil("");
      fetchTS();
    } else {
      toast.error("Gagal menyimpan TS");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 border rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold">Form Tambah TS</h2>
      <div>
        <Label>Nama TS</Label>
        <Input value={namaTS} onChange={(e) => setNamaTS(e.target.value)} />
      </div>
      <div>
        <Label>Profil</Label>
        <Input value={profil} onChange={(e) => setProfil(e.target.value)} />
      </div>
      <Button onClick={handleSubmit}>Simpan</Button>

      <div className="pt-6">
        <h3 className="text-md font-medium">Data TS Tersimpan:</h3>
        <ul className="list-disc pl-5 mt-2">
          {tsList.map((ts, idx) => (
            <li key={idx}>{ts.namaTS} - {ts.profil}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
