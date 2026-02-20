import { NextResponse } from "next/server";
import { normalizeImageUrl } from "@/lib/googleDriveImage";

interface RiwayatOperasi {
  no: number;
  dokter: string;
  namaPasien: string;
  rumahSakit: string;
  implant: string;
  pre?: string;
  post?: string;
}

function formatDriveUrl(url?: string) {
  return normalizeImageUrl(url);
}

export async function GET() {
  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbxSxnyoM8gXQqHUh_DdG-DvuKlXe5yRI3H5tGvIp3r9O5cAh_o5kIsO2diCHLkarWJR/exec?sheet=Sheet5",
      { cache: "no-store" }
    );
    const json = await res.json();

    if (json.status === "success" && json.riwayatOperasi) {
      const formatted: RiwayatOperasi[] = json.riwayatOperasi.map((item: RiwayatOperasi) => ({
        ...item,
        pre: formatDriveUrl(item.pre),
        post: formatDriveUrl(item.post),
      }));

      return NextResponse.json({ status: "success", data: formatted });
    }

    return NextResponse.json({ status: "error", message: "Data tidak ditemukan" }, { status: 404 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ status: "error", message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch("https://script.google.com/macros/s/AKfycbxSxnyoM8gXQqHUh_DdG-DvuKlXe5yRI3H5tGvIp3r9O5cAh_o5kIsO2diCHLkarWJR/exec", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ status: "error", message: "Gagal mengirim data" }, { status: 500 });
  }
}
