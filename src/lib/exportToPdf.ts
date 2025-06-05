// File: utils/exportUtils.ts
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Export data ke Excel (.xlsx).
 * @param items Array objek dengan properti: Lot, Ref, Nama, Jumlah, Tanggal
 * @param fileName Nama file Excel yang diunduh (tanpa ekstensi)
 */
export function exportToExcel<T extends Record<string, any>>(
  items: T[],
  fileName: string = "export"
) {
  // 1. Konversi array objek ke worksheet
  const worksheet = XLSX.utils.json_to_sheet(items);
  // 2. Buat workbook baru, lalu tambahkan worksheet di dalamnya
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  // 3. Buat blob Excel dan unduh
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Export data ke PDF.
 * Menggunakan jsPDF dan plugin autotable untuk otomasi tabel.
 * @param items Array objek dengan properti: Lot, Ref, Nama, Jumlah, Tanggal
 * @param fileName Nama file PDF yang diunduh (tanpa ekstensi)
 */
export function exportToPDF(items: any[], fileName: string = "export") {
  const doc = new jsPDF();

  // 1. Siapkan header kolom: ambil keys dari objek pertama, jika ada
  const keys = items.length > 0 ? Object.keys(items[0]) : [];
  // 2. Konversi items menjadi array array values (sesuai urutan keys)
  const data = items.map((item) => keys.map((k) => item[k] ?? ""));

  // 3. Gunakan autotable untuk menampilkan tabel
  (doc as any).autoTable({
    head: [keys],
    body: data,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] }, // warna header
    margin: { top: 20 },
  });

  // 4. Tambahkan judul di atas
  doc.setFontSize(16);
  doc.text("Daftar Stok", 14, 15);

  // 5. Unduh file PDF
  doc.save(`${fileName}.pdf`);
}
