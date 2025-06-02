// File: app/doctors/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Doctor {
  name: string;
  photoUrl: string;
  dateCreated: string;
}

export default function DoctorsGridPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Ganti dengan Web App URL Anda (fungsi getDoctorImages atau doGet yang mengembalikan array object)
  const APPSCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz5Z6rrtL1kcw-5Z-Rjcu19PvB5PNmlRuHJdlLymspCNQ1Fs5NED-l7FT27Fqyb0qGP/exec";

  // Fungsi untuk mengubah preview-link Google Drive menjadi direct-download
  function toDownloadLink(url: string): string {
    // Cari pola /file/d/ID/view
    const match = url.match(/\/file\/d\/([^/]+)\//);
    if (match && match[1]) {
      const id = match[1];
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    // Jika URL sudah direct-download (uc?export=download), kembalikan langsung
    if (url.includes("uc?export=download")) {
      return url;
    }
    // Kembalikan apa adanya jika pola lain
    return url;
  }

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(APPSCRIPT_URL);
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          console.error("Response (raw text, bukan JSON):", text);
          setError("Server mengembalikan data yang tidak valid (bukan JSON).");
          setLoading(false);
          return;
        }

        console.log("Respons JSON dari Apps Script:", json);

        // 1) Jika Apps Script mengembalikan error secara langsung: { error: "Pesan" }
        if (json.error) {
          setError(typeof json.error === "string" ? json.error : "Unknown error");
          setLoading(false);
          return;
        }

        // 2) Jika bentuknya { status: "...", data: [...] }
        if (
          typeof json === "object" &&
          json.status &&
          Array.isArray((json as any).data)
        ) {
          const arr = (json as any).data;
          setDoctors(
            arr.map((item: any) => ({
              name: item.name,
              photoUrl: toDownloadLink(item.photoUrl),
              dateCreated: item.dateCreated,
            }))
          );
          setLoading(false);
          return;
        }

        // 3) Jika bentuknya langsung array: [ { name, photoUrl, dateCreated }, ... ]
        if (Array.isArray(json)) {
          setDoctors(
            json.map((item: any) => ({
              name: item.name,
              photoUrl: toDownloadLink(item.photoUrl),
              dateCreated: item.dateCreated,
            }))
          );
          setLoading(false);
          return;
        }

        // 4) Jika struktur tak terduga
        console.error("Struktur JSON tak terduga:", json);
        setError("Data memiliki format yang tidak dikenali.");
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <p>Memuat data dokter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 px-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Daftar Dokter</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {doctors.map((doc, idx) => (
          <div
            key={`${doc.name}-${idx}`}
            className="bg-gray-800 rounded-lg overflow-hidden flex flex-col items-center p-4"
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
              <Image
                src={doc.photoUrl}
                alt={doc.name}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/no-image.png";
                }}
                unoptimized={false}
              />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-white">
              {doc.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
