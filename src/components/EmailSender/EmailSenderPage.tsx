"use client";

import { useState, useEffect, useCallback } from "react";
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

const normalizeNumber = (value: number | string | undefined) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

const formatRupiah = (value: number | string) => {
  const num = normalizeNumber(value);
  return Number.isNaN(num)
    ? "-"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(num);
};

const formatInputAmount = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const exportDateSlug = () => new Date().toISOString().split("T")[0];

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
  const editingItem = editingIndex !== null ? items[editingIndex] : null;

  /* ================= HELPERS ================= */

  const totalAmount = items.reduce(
    (s, i) => s + normalizeNumber(i.jumlah),
    0
  );

  /* ================= PDF GENERATOR ================= */

  const generatePdf = useCallback(
    (data: DataItem[]) => {
      if (!data.length) {
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return "";
        });
        return;
      }

      const total = data.reduce((sum, item) => sum + Number(item.jumlah), 0);

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
      doc.text(`Total: ${formatRupiah(total)}`, 14, y + 10);

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);

      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    },
    [namaPemohon]
  );

  useEffect(() => {
    generatePdf(items);
  }, [items, generatePdf]);

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
  };

  const handleEditItem = (i: number) => {
    setInput(items[i]);
    setEditingIndex(i);
  };

  const handleDeleteItem = (i: number) => {
    const updated = items.filter((_, idx) => idx !== i);
    setItems(updated);
  };

  /* ================= EXPORT ================= */

  const handleExportPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `permintaan-advance-${exportDateSlug()}.pdf`;
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
    a.download = `permintaan-advance-${exportDateSlug()}.xlsx`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-slate-100">
      {/* loader */}
      <AnimatePresence>
        {loading && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            Advance Request
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white">
            💰 Permintaan Advance
          </h1>
          <p className="text-sm text-slate-300">
            Kelola kebutuhan advance timmu, kirim laporan dan lampirkan jumlah
            terbaru secara otomatis.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Total Permintaan
            </p>
            <p className="mt-4 text-5xl font-semibold text-emerald-300">
              {items.length}
            </p>
            <p className="text-sm text-slate-400">
              Terdaftar pada daftar advance, siap dibagikan.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 p-6 shadow-2xl shadow-emerald-500/20 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">
              Total Nominal
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatRupiah(totalAmount)}
            </p>
            <p className="text-sm text-emerald-100/80">
              {namaPemohon ? `Pemohon: ${namaPemohon}` : "Nama pemohon belum diisi"}
            </p>
          </div>
        </div>

        <motion.div
          className="rounded-3xl border border-white/10 bg-white/90 px-6 py-8 shadow-2xl shadow-black/20 backdrop-blur transition-all dark:bg-gray-900/90"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {editingIndex !== null && (
                  <motion.div
                    key="editing-mode"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                  >
                    <Edit3 className="h-4 w-4 text-emerald-200" />
                    <span>Mode edit: {editingItem?.keterangan || "item terpilih"}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={namaPemohon}
                  onChange={(e) => setNamaPemohon(e.target.value)}
                  placeholder="Nama Pemohon"
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-10 py-2 text-slate-900 shadow-inner shadow-slate-500/10"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="date"
                  value={input.tanggal}
                  onChange={(e) => setInput({ ...input, tanggal: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-10 py-2 text-slate-900 shadow-inner shadow-slate-500/10"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInputAmount(input.jumlah)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setInput({ ...input, jumlah: digits });
                  }}
                  placeholder="Jumlah"
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-10 py-2 text-slate-900 shadow-inner shadow-slate-500/10"
                />
              </div>
              <div className="relative">
                <StickyNote className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  placeholder="Keterangan"
                  value={input.keterangan}
                  onChange={(e) =>
                    setInput({ ...input, keterangan: e.target.value })
                  }
                  className="h-24 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-10 py-2 text-slate-900 shadow-inner shadow-slate-500/10"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddItem}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-base font-semibold text-white shadow-lg shadow-emerald-500/30"
              >
                {editingIndex !== null ? "Perbarui Data" : "Tambahkan"}
              </motion.button>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email tujuan"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-10 py-2 text-slate-900 shadow-inner shadow-slate-500/10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">📋 Daftar Permintaan</h2>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-900/90 p-4 text-slate-200 shadow-xl shadow-slate-900/40">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-slate-400"
                    >
                      Belum ada permintaan.
                    </motion.p>
                  ) : (
                    <motion.ul layout className="space-y-3">
                      {items.map((item, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-2xl border border-transparent bg-gradient-to-r from-slate-900 to-slate-800 p-4 shadow-lg shadow-black/30"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: editingIndex === i ? 1.02 : 1,
                          }}
                          exit={{ opacity: 0, y: -10 }}
                          whileHover={{ y: -3 }}
                          transition={{ type: "spring", stiffness: 260, damping: 24 }}
                          style={{
                            borderColor:
                              editingIndex === i
                                ? "rgba(16,185,129,0.8)"
                                : undefined,
                            boxShadow:
                              editingIndex === i
                                ? "0 20px 35px rgba(16,185,129,0.25)"
                                : undefined,
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-base font-semibold text-white">
                              <strong>{item.tanggal}</strong> -{" "}
                              {formatRupiah(item.jumlah)}
                            </p>
                            <p className="text-sm text-slate-400">{item.keterangan}</p>
                          </div>
                          <div className="flex flex-shrink-0 gap-2 text-slate-300">
                            <button
                              className="rounded-full p-2 hover:bg-white/10"
                              onClick={() => handleEditItem(i)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              className="rounded-full p-2 hover:bg-red-500/20"
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
                <div className="mt-4 text-right text-sm font-semibold text-slate-200">
                  Total: {formatRupiah(totalAmount)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {pdfUrl && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              className="flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:-translate-y-0.5"
            >
              <FileText className="h-4 w-4" /> Preview
            </a>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600/90 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:-translate-y-0.5"
            >
              <FileDown className="h-4 w-4" /> Excel
            </button>
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:-translate-y-0.5"
            >
              <Mail className="h-4 w-4" /> Kirim
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
