"use client";

import { useState } from "react";
import { StockRow } from "@/types/stock";
import {
  MoreVertical,
  Edit,
  Copy,
  RefreshCcw,
  Trash2,
  Info,
} from "lucide-react";

import MutateModal from "./MutateModal";
import DuplicateModal from "./DuplicateModal";
import DeleteConfirmModal from "./DeleteConfirm";

export interface RowActionsProps {
  row: StockRow;
  sheet: string;
  onEdit: (row: StockRow) => void;
  onReload: () => Promise<void>;

  /** OPTIONAL — untuk buka detail + history */
  onDetail?: (row: StockRow) => void;
}

export default function RowActions({
  row,
  sheet,
  onEdit,
  onReload,
  onDetail,
}: RowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [mutateOpen, setMutateOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  

  return (
    <div className="relative">
      {/* ACTION BUTTON */}
      <button
        onClick={() => setMenuOpen((x) => !x)}
        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
      >
        <MoreVertical size={18} />
      </button>

      {/* DROPDOWN MENU */}
      {menuOpen && (
        <div
          className="absolute right-0 mt-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 shadow-lg rounded-lg w-44 z-40"
          onMouseLeave={() => setMenuOpen(false)}
        >
          {/* DETAIL */}
          {onDetail && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onDetail(row);
              }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Info size={14} /> Detail & History
            </button>
          )}

          {/* EDIT */}
          <button
            onClick={() => {
              setMenuOpen(false);
              onEdit(row);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Edit size={14} /> Edit
          </button>

          {/* MUTASI */}
          <button
            onClick={() => {
              setMenuOpen(false);
              setMutateOpen(true);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCcw size={14} /> Mutasi
          </button>

          {/* DUPLICATE */}
          <button
            onClick={() => {
              setMenuOpen(false);
              setDuplicateOpen(true);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Copy size={14} /> Duplicate
          </button>

          {/* DELETE */}
          <button
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className="w-full px-3 py-2 text-left text-red-600 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Mutasi IN / OUT */}
      <MutateModal
        open={mutateOpen}
        sheet={sheet}
        row={row}
        onClose={() => setMutateOpen(false)}
        onSuccess={onReload}
      />

      {/* Duplicate */}
      <DuplicateModal
        open={duplicateOpen}
        sheet={sheet}
        row={row}
        onClose={() => setDuplicateOpen(false)}
        onSuccess={onReload}
      />

      {/* Delete */}
      <DeleteConfirmModal
        open={deleteOpen}
        sheet={sheet}
        row={row}
        onClose={() => setDeleteOpen(false)}
        onSuccess={onReload}
      />
    </div>
  );
}
