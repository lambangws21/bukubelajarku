// import { NextRequest, NextResponse } from "next/server";
// import {  StokResponse } from "@/types/stock"

// const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwg4U7JI8onh628U5aEVoQP5KPYirYHJo_SFfw4EE4C9savbixPch-GT96HCbXmRZjm/exec";

// export async function GET() {
//   try {
//     const res = await fetch(`${APPS_SCRIPT_URL}?sheet=Sheet6`);
//     if (!res.ok) {
//       return NextResponse.json<StokResponse>(
//         { status: "error", message: `Gagal ambil data stok: ${res.statusText}` },
//         { status: res.status }
//       );
//     }
//     const data: StokResponse = await res.json();
//     return NextResponse.json<StokResponse>(data);
//   } catch (error) {
//     return NextResponse.json<StokResponse>(
//       { status: "error", message: error instanceof Error ? error.message : "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: NextRequest) {
//   try {
//     const { no, jumlah, permintaan }: { no: string; jumlah: number; permintaan: string } = await req.json();

//     if (!no) {
//       return NextResponse.json<StokResponse>(
//         { status: "error", message: "No stok wajib diisi" },
//         { status: 400 }
//       );
//     }

//     // Cek apakah stok sudah ada
//     const checkRes = await fetch(`${APPS_SCRIPT_URL}?sheet=Sheet6`);
//     if (!checkRes.ok) {
//       return NextResponse.json<StokResponse>(
//         { status: "error", message: "Gagal memeriksa data stok" },
//         { status: checkRes.status }
//       );
//     }

//     const currentData: StokResponse = await checkRes.json();
//     const stokList = currentData.stokBarang || [];
//     const stokAda = stokList.find((item) => item.noStok === no);

//     if (!stokAda) {
//       return NextResponse.json<StokResponse>(
//         { status: "error", message: "Data stok tidak ditemukan" },
//         { status: 404 }
//       );
//     }

//     // Update stok yang sudah ada di Apps Script
//     const updatePayload = {
//       methodOverride: "PUT",
//       sheet: "Sheet6",
//       no,
//       jumlah,
//       permintaan: permintaan || "",
//     };

//     const res = await fetch(APPS_SCRIPT_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(updatePayload),
//     });

//     if (!res.ok) {
//       return NextResponse.json<StokResponse>(
//         { status: "error", message: `Gagal update stok: ${res.statusText}` },
//         { status: res.status }
//       );
//     }

//     const data: StokResponse = await res.json();
//     return NextResponse.json<StokResponse>(data);
//   } catch (error) {
//     return NextResponse.json<StokResponse>(
//       { status: "error", message: error instanceof Error ? error.message : "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
