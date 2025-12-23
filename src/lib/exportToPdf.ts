// utils/exportUtils.ts
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function exportToExcel<T extends object>(
  items: readonly T[],
  fileName: string = "export"
) {
  if (!items.length) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  const headers = Object.keys(items[0] as object);

  worksheet.columns = headers.map((key) => ({
    header: key,
    key,
    width: Math.max(12, key.length + 2),
  }));

  items.forEach((item) => {
    worksheet.addRow(item as any);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  worksheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + headers.length)}1`,
  };

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF<T extends object>(
  items: readonly T[],
  fileName: string = "export"
) {
  if (!items.length) return;

  const doc = new jsPDF({ orientation: "landscape" });

  const headers = Object.keys(items[0] as object);
  const body = items.map((item) =>
    headers.map((key) => String((item as any)[key] ?? ""))
  );

  doc.setFontSize(16);
  doc.text("Daftar Stok", 14, 15);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save(`${fileName}.pdf`);
}
