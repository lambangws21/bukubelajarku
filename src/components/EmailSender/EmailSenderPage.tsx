"use client";

import { useState, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

import {
  Loader2,
  Mail,
  FileText,
  Download,
  User,
  Calendar,
  DollarSign,
  StickyNote,
  Edit3,
  Trash2,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

interface DataItem {
  tanggal: string;
  jumlah: string;
  keterangan: string;
}

export default function EmailSenderPage() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [email, setEmail] = useState("");
  const [namaPemohon, setNamaPemohon] = useState("");
  const [input, setInput] = useState<DataItem>({
    tanggal: "",
    jumlah: "",
    keterangan: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  /* ================= HELPERS ================= */

  const formatRupiah = (value: number | string) => {
    const num = typeof value === "string" ? Number(value) : value;
    return isNaN(num)
      ? "-"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(num);
  };

  const totalAmount = items.reduce((s, i) => s + Number(i.jumlah), 0);

  /* ================= PDF GENERATOR ================= */

  const generatePdf = useCallback(
    (data: DataItem[]) => {
      if (!data.length) {
        setPdfUrl("");
        return;
      }

      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.text("PT KARYA BAKTI NUSINDO", 105, 15, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(
        "Jl. Arjuna Utara No.12 RT11/RW12, Tanjung Duren Selatan, Jakarta Barat",
        105,
        21,
        { align: "center" }
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("LAPORAN PERMINTAAN ADVANCE", 105, 30, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Nama Pemohon:", 14, 45);
      doc.setTextColor(30, 64, 175);
      doc.text(namaPemohon || "-", 50, 45);

      autoTable(doc, {
        startY: 56,
        head: [["Tanggal", "Jumlah", "Keterangan"]],
        body: data.map((i) => [
          i.tanggal,
          formatRupiah(i.jumlah),
          i.keterangan,
        ]),
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175] },
      });

      const y = (doc as any).lastAutoTable?.finalY || 56;
      doc.setTextColor(0);
      doc.text(`Total: ${formatRupiah(totalAmount)}`, 14, y + 10);

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);

      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    },
    [namaPemohon, totalAmount]
  );

  /* ================= CRUD ITEMS ================= */

  const handleAddItem = () => {
    if (!input.tanggal || !input.jumlah || !input.keterangan) return;

    let updated: DataItem[];

    if (editingIndex !== null) {
      updated = [...items];
      updated[editingIndex] = input;
      setEditingIndex(null);
    } else {
      updated = [...items, input];
    }

    setItems(updated);
    setInput({ tanggal: input.tanggal, jumlah: "", keterangan: "" });

    generatePdf(updated); // ✅ EVENT-BASED
  };

  const handleEditItem = (i: number) => {
    setInput(items[i]);
    setEditingIndex(i);
  };

  const handleDeleteItem = (i: number) => {
    const updated = items.filter((_, idx) => idx !== i);
    setItems(updated);
    generatePdf(updated); // ✅ EVENT-BASED
  };

  /* ================= EXPORT ================= */

  const handleExportPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "permintaan-advance.pdf";
    a.click();
  };

  const handleExportExcel = async () => {
    if (!items.length) return toast.error("Tidak ada data");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Advance");

    ws.columns = [
      { header: "Tanggal", key: "tanggal", width: 15 },
      { header: "Jumlah", key: "jumlah", width: 18 },
      { header: "Keterangan", key: "keterangan", width: 40 },
    ];

    items.forEach((i) =>
      ws.addRow({
        tanggal: i.tanggal,
        jumlah: Number(i.jumlah),
        keterangan: i.keterangan,
      })
    );

    ws.views = [{ state: "frozen", ySplit: 1 }];

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "permintaan-advance.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= SEND EMAIL ================= */

  const handleSendEmail = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const res = await fetch("/api/advance/addEmailSender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, namaPemohon, data: items }),
      });

      const json = await res.json();
      json.status === "success"
        ? toast.success("Email terkirim")
        : toast.error(json.message);
    } catch {
      toast.error("Gagal kirim email");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-gray-800 to-white/25">
      {/* loader */}
      <AnimatePresence>
        {loading && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-3xl font-bold text-center mb-6">
        💰 Permintaan Advance
      </h1>

      {/* FORM & LIST — (UI kamu TIDAK diubah besar) */}
      <motion.div
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Input */}
        <div className="space-y-4">
          {/* Nama Pemohon */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={namaPemohon}
              onChange={(e) => setNamaPemohon(e.target.value)}
              placeholder="Nama Pemohon"
              className="pl-10 border rounded-lg p-2 w-full dark:bg-gray-800"
            />
          </div>
          {/* Tanggal */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={input.tanggal}
              onChange={(e) => setInput({ ...input, tanggal: e.target.value })}
              className="pl-10 border rounded-lg p-2 w-full dark:bg-gray-800"
            />
          </div>
          {/* Jumlah */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="number"
              value={input.jumlah}
              onChange={(e) => setInput({ ...input, jumlah: e.target.value })}
              placeholder="Jumlah"
              className="pl-10 border rounded-lg p-2 w-full dark:bg-gray-800"
            />
          </div>
          {/* Keterangan */}
          <div className="relative">
            <StickyNote className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              placeholder="Keterangan"
              value={input.keterangan}
              onChange={(e) =>
                setInput({ ...input, keterangan: e.target.value })
              }
              className="pl-10 border rounded-lg p-2 w-full dark:bg-gray-800"
            />
          </div>
          {/* Tombol Tambah */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddItem}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-slate-50 px-4 py-2 rounded-lg w-full"
          >
            {editingIndex !== null ? "Perbarui Data" : "Tambahkan"}
          </motion.button>
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email tujuan"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 border rounded-lg p-2 w-full dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Daftar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📋 Daftar Permintaan</h2>
          <AnimatePresence>
            {items.length === 0 ? (
              <p className="text-gray-500">Belum ada permintaan.</p>
            ) : (
              <motion.ul layout className="space-y-3">
                {items.map((item, i) => (
                  <motion.li
                    key={i}
                    className="border p-3 rounded-lg bg-slate-500 dark:bg-gray-800 shadow-sm flex justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div>
                      <p>
                        <strong>{item.tanggal}</strong> -{" "}
                        {formatRupiah(item.jumlah)}
                      </p>
                      <p className="text-sm">{item.keterangan}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-blue-500"
                        onClick={() => handleEditItem(i)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-500"
                        onClick={() => handleDeleteItem(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <div className="pt-2 text-right font-semibold">
            Total: {formatRupiah(totalAmount)}
          </div>
        </div>
      </motion.div>
      {/* ... UI form + list sama seperti punyamu ... */}

      {pdfUrl && (
        <div className="mt-6 flex gap-3 justify-end">
          <a
            href={pdfUrl}
            target="_blank"
            className="text-slate-200 flex items-center p-1 py-2 px-5 rounded bg-blue-600  gap-2"
          >
            <FileText /> Preview
          </a>
          <button onClick={handleExportPDF} className="text-slate-200 flex items-center p-1 py-2 px-5 rounded bg-green-600">
            <Download /> PDF
          </button>
          <button onClick={handleExportExcel} className="text-slate-200 flex items-center p-1 py-2 px-5 rounded bg-green-600">
            <FileDown /> Excel
          </button>
          <button onClick={handleSendEmail} className="text-slate-200 flex items-center p-1 py-2 px-5 rounded bg-green-600">
            <Mail /> Kirim
          </button>
        </div>
      )}
    </div>
  );
}
