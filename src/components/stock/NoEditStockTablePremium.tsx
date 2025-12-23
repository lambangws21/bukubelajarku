"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExcelJS from "exceljs";
import { StockRow } from "@/types/new-stock";
import { useStockCRUD } from "@/hooks/useStockCRUD";
import { useStockTable } from "@/hooks/useStockTable";
import EditModal from "@/components/stock/new-stock/EditModal";
import RowActions from "@/components/stock/new-stock/RowActions";
import HistoryPanel from "@/components/stock/new-stock/RowHistoryPanel";

import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  RefreshCcw,
  Plus,
  Sparkles,
  Search,
  NotebookTabs,
} from "lucide-react";
import HistoryTimelineModal from "@/components/stock/new-stock//HistoryModalTimeline";

/* ================= TYPES ================= */
type ChangeInfo = {
  before: string | number;
  after: string | number;
};

type ChangeMap = Record<number, Partial<Record<keyof StockRow, ChangeInfo>>>;

/* ================= COMPONENT ================= */
export default function StockTablePremium({
  sheet = "Sheet1",
}: {
  sheet?: string;
}) {
  const { data, loading, reload, createRow, updateRow } = useStockCRUD({
    sheet,
  });
  const table = useStockTable(data);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);

  const [changes, setChanges] = useState<ChangeMap>({});

  const [openHistory, setOpenHistory] = useState<number | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyNo, setHistoryNo] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [table.page]);

  /* ================= ACTIONS ================= */
  const openNew = () => {
    setSelectedRow({
      No: 0,
      NoStok: "",
      Deskripsi: "",
      Batch: "",
      Qty: 0,
      TotalQty: 0,
      TERPAKAI: 0,
      REFILL: 0,
      KET: "",
    });
    setEditOpen(true);
  };

  const handleSave = async (payload: StockRow) => {
    if (payload.No === 0) {
      await createRow(payload);
      setEditOpen(false);
      return;
    }

    const before = data.find((d) => d.No === payload.No);
    if (!before) return;

    await updateRow(payload);

    const diff: Partial<Record<keyof StockRow, ChangeInfo>> = {};
    (Object.keys(payload) as (keyof StockRow)[]).forEach((k) => {
      if (payload[k] !== before[k]) {
        diff[k] = { before: before[k], after: payload[k] };
      }
    });

    setChanges((p) => ({ ...p, [payload.No]: diff }));

    setTimeout(() => {
      setChanges((p) => {
        const c = { ...p };
        delete c[payload.No];
        return c;
      });
    }, 6000);

    setEditOpen(false);
  };

  const handleExport = async () => {
    try {
      if (!table.sorted.length) {
        alert("Tidak ada data untuk diexport");
        return;
      }
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheet);
  
      worksheet.columns = [
        { header: "No", key: "No", width: 8 },
        { header: "No Stok", key: "NoStok", width: 18 },
        { header: "Deskripsi", key: "Deskripsi", width: 30 },
        { header: "Batch", key: "Batch", width: 15 },
        { header: "Qty", key: "Qty", width: 12 },
        { header: "Total Qty", key: "TotalQty", width: 14 },
        { header: "Terpakai", key: "TERPAKAI", width: 14 },
        { header: "Refill", key: "REFILL", width: 14 },
        { header: "Keterangan", key: "KET", width: 25 },
      ];
  
      table.sorted.forEach((row) => {
        worksheet.addRow(row);
      });
  
      /* ===== STYLING ===== */
  
      // Freeze header
      worksheet.views = [{ state: "frozen", ySplit: 1 }];
  
      // Header style
      const header = worksheet.getRow(1);
      header.font = { bold: true };
      header.alignment = { horizontal: "center", vertical: "middle" };
  
      header.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
  
      // Body style
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
  
        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
  
          const key = worksheet.columns[col - 1]?.key;
  
          // numeric alignment
          if (
            key === "Qty" ||
            key === "TotalQty" ||
            key === "TERPAKAI" ||
            key === "REFILL"
          ) {
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
        });
      });
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sheet}-stock.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal export Excel");
    }
  };
  

  /* ================= HELPERS ================= */
  const renderBadge = (change?: ChangeInfo) => {
    if (!change) return null;
    if (typeof change.before === "number" && typeof change.after === "number") {
      if (change.after > change.before)
        return <span className="badge bg-green-100 text-green-700">UP</span>;
      if (change.after < change.before)
        return <span className="badge bg-red-100 text-red-700">DOWN</span>;
    }
    return <span className="badge bg-amber-100 text-amber-700">EDIT</span>;
  };

  const renderCell = (row: StockRow, field: keyof StockRow) => {
    const change = changes[row.No]?.[field];

    return (
      <div className="flex items-center gap-2">
        <span>{String(row[field])}</span>
        {change && (
          <>
            <Sparkles size={14} className="text-yellow-500 animate-pulse" />
            {renderBadge(change)}
          </>
        )}
      </div>
    );
  };

  /* ================= FILTER ================= */
  const filteredRows = table.paginated.filter((r) =>
    `${r.No} ${r.NoStok} ${r.Deskripsi} ${r.Batch}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div
      ref={topRef}
      className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-lg border space-y-5"
    >
      {/* HEADER */}
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">📦 Implant Stock Dashboard</h2>
          <p className="text-xs text-zinc-500">
            CRUD • Mutasi • Animated History
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={openNew} className="flex items-center border-[1.5px] py-1.5 px-2.5 rounded ">
            <Plus size={14} /> Tambah
          </button>
          <button onClick={handleExport} className="flex items-center border-[1.5px] py-1.5 px-2.5 rounded ">
            <FileSpreadsheet size={14} /> Export
          </button>
          <button onClick={reload} className="flex items-center border-[1.5px] py-1.5 px-2.5 rounded ">
            <RefreshCcw size={14} /> Reload
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative w-64">
        <Search size={16} className="absolute left-2 top-2.5 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search No / Nama / Batch"
          className="pl-8 pr-3 py-2 border rounded w-full text-sm dark:bg-zinc-800"
        />
      </div>

      {/* TABLE */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              {(
                [
                  "No",
                  "NoStok",
                  "Deskripsi",
                  "Batch",
                  "Qty",
                  "TotalQty",
                  "TERPAKAI",
                  "REFILL",
                  "KET",
                ] as (keyof StockRow)[]
              ).map((f) => (
                <th key={f} className="px-4 py-2">
                  {f}
                </th>
              ))}
              <th className="px-4 py-2 text-center">Histori</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <Fragment key={`row-${r.No}-${r.NoStok}-${r.Batch}`}>
                  {/* MAIN ROW */}
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-b ${
                      changes[r.No] ? "bg-yellow-50" : ""
                    }`}
                  >
                    {(Object.keys(r) as (keyof StockRow)[]).map((f) => (
                      <td key={`${r.No}-${f}`} className="px-4 py-2">
                        {renderCell(r, f)}
                      </td>
                    ))}

                    <td className="px-4 py-2 flex gap-2 items-center">
                      <button
                        onClick={() => {
                          setHistoryNo(r.No);
                          setHistoryOpen(true);
                        }}
                      >
                            <NotebookTabs
                          size={16}
                          className={`transition ${
                            openHistory === r.No ? "transform rotate-90" : ""
                          }`}
                        />
                      </button>

                      {/* <RowActions
                        row={r}
                        sheet={sheet}
                        onReload={reload}
                        onEdit={(row) => {
                          setSelectedRow(row);
                          setEditOpen(true);
                        }}
                      /> */}
                    </td>
                  </motion.tr>

                  {/* HISTORY */}
                  <AnimatePresence>
                    {openHistory === r.No && (
                      <motion.tr
                        key={`history-${r.No}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-50 dark:bg-zinc-800/50"
                      >
                        {/* ✅ WAJIB ADA TD */}
                        <td colSpan={10} className="px-6 py-4">
                          <HistoryPanel
                            sheet={sheet}
                            No={r.No}
                            localChanges={changes[r.No]}
                          />
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-4">
        <button onClick={() => table.setPage(Math.max(1, table.page - 1))}>
          <ChevronLeft />
        </button>
        <span>
          {table.page} / {table.totalPages}
        </span>
        <button
          onClick={() =>
            table.setPage(Math.min(table.totalPages, table.page + 1))
          }
        >
          <ChevronRight />
        </button>
      </div>

      {/* EDIT MODAL */}
      <EditModal
        open={editOpen}
        row={selectedRow}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      {historyNo !== null && (
        <HistoryTimelineModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          sheet={sheet}
          No={historyNo}
          localChanges={changes[historyNo]}
        />
      )}
    </div>
  );
}
