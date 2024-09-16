// pages/displaydata/page.tsx
"use client";

import { useState, useEffect } from "react";
import DataList from "@/components/dataList";
import EditDialog from "@/components/editDialog";
import DeleteConfirmation from "@/components/deleteConfirmation";

type SheetDataItem = {
  id: number;
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
};

const DisplayDataPage = () => {
  const [data, setData] = useState<SheetDataItem[]>([]);
  const [editingItem, setEditingItem] = useState<SheetDataItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<number | null>(null);

  const fetchData = async () => {
    const response = await fetch("/api/googlesheet");
    const result = await response.json();
    setData(result.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item: SheetDataItem) => setEditingItem(item);

  const handleUpdate = async (item: SheetDataItem) => {
    await fetch("/api/googlesheet", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setEditingItem(null);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/googlesheet?id=${id}`, { method: "DELETE" });
    setDeletingItem(null);
    fetchData();
  };

  return (
    <div>
      <DataList data={data} onEdit={handleEdit} onDelete={setDeletingItem} />
      {editingItem && (
        <EditDialog item={editingItem} onClose={() => setEditingItem(null)} onSave={handleUpdate} />
      )}
      {deletingItem !== null && (
        <DeleteConfirmation
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onDelete={() => handleDelete(deletingItem)}
        />
      )}
    </div>
  );
};

export default DisplayDataPage;
