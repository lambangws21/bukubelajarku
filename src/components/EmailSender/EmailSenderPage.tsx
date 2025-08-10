"use client";

import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

export default function AdvanceFormPage() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [email, setEmail] = useState<string>("");
  const [namaPemohon, setNamaPemohon] = useState<string>("");
  const [input, setInput] = useState<DataItem>({
    tanggal: "",
    jumlah: "",
    keterangan: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const formatRupiah = (value: number | string) => {
    const number = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(number)
      ? "-"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(number);
  };

  const totalAmount = items.reduce((acc, item) => acc + Number(item.jumlah), 0);

  const handleAddItem = () => {
    if (!input.tanggal || !input.jumlah || !input.keterangan) return;
    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = input;
      setItems(updated);
      setEditingIndex(null);
    } else {
      setItems([...items, input]);
    }
    setInput({ tanggal: input.tanggal, jumlah: "", keterangan: "" });
  };

  const handleEditItem = (index: number) => {
    setInput(items[index]);
    setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const generatePdf = useCallback(() => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.text("PT KARYA BAKTI NUSINDO", 105, 15, { align: "center" });
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(
      "Jl. Arjuna Utara No.12 RT11/RW12, Tanjung Duren Selatan, Grogol, Petamburan, Jakarta Barat.",
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
      body: items.map((item) => [
        item.tanggal,
        formatRupiah(item.jumlah),
        item.keterangan,
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175] },
    });
  
    const tableY = (doc as any).lastAutoTable?.finalY || 56;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total Permintaan: ${formatRupiah(totalAmount)}`, 14, tableY + 10);
  
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  }, [items, namaPemohon, totalAmount]);
  

  // Otomatis update preview PDF setiap ada perubahan data
  useEffect(() => {
    if (items.length > 0) {
      generatePdf();
    } else {
      setPdfUrl("");
    }
  }, [items, namaPemohon, generatePdf]);
  

  const handleExportPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "permintaan-advance.pdf";
    a.click();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      items.map((item) => ({
        Tanggal: item.tanggal,
        Jumlah: item.jumlah,
        Keterangan: item.keterangan,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permintaan Advance");
    XLSX.writeFile(wb, "permintaan-advance.xlsx");
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advance/addEmailSender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, namaPemohon, data: items }),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("✅ Email berhasil dikirim!");
      } else {
        toast.error("❌ " + result.message);
      }
    } catch {
      toast.error("❌ Gagal mengirim email");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <Loader2 className="animate-spin text-blue-600 w-6 h-6" />
              <span className="text-sm font-medium">Mengirim data...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1
        className="text-3xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        💰 Form Permintaan Advance
      </motion.h1>

      {/* Form */}
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
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg w-full"
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
                    className="border p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex justify-between"
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

      {/* Preview & Actions */}
      {pdfUrl && (
        <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
          <a
            href={pdfUrl}
            target="_blank"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FileText className="w-5 h-5" /> Preview PDF
          </a>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="w-5 h-5" /> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" /> Export Excel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={!email}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Mail className="w-5 h-5" /> Kirim Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
