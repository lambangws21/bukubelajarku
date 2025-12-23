// File: utils/exportUtils.ts
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export data ke Excel (.xlsx) menggunakan exceljs
 * @param items Array objek (contoh: { Lot, Ref, Nama, Jumlah, Tanggal })
 * @param fileName Nama file (tanpa ekstensi)
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  items: T[],
  fileName: string = "export"
) {
  if (items.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  // Ambil header dari key object pertama
  const headers = Object.keys(items[0]);

  worksheet.columns = headers.map((key) => ({
    header: key,
    key,
    width: Math.max(12, key.length + 2),
  }));

  // Tambahkan data
  items.forEach((item) => {
    worksheet.addRow(item);
  });

  // Styling header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  // Auto filter
  worksheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + headers.length)}1`,
  };

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();

  // Download (browser)
  const blob = new Blob([buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export data ke PDF
 * @param items Array objek
 * @param fileName Nama file (tanpa ekstensi)
 */
export function exportToPDF<T extends Record<string, unknown>>(
  items: T[],
  fileName: string = "export"
) {
  if (items.length === 0) return;

  const doc = new jsPDF({ orientation: "landscape" });

  const headers = Object.keys(items[0]);
  const body = items.map((item) =>
    headers.map((key) => String(item[key] ?? ""))
  );

  doc.setFontSize(16);
  doc.text("Daftar Data", 14, 15);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${fileName}.pdf`);
}
