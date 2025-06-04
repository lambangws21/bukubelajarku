"use client";
import React from "react";
import ItemCard from "@/components/stock/itemCard";

interface Item {
  Tanggal?: string;
  Ref: string;
  Lot: string;
  Nama: string;
  Jumlah: string;
}
interface ItemsListProps {
  items: Item[];
  isLoading: boolean;
  onEdit: (item: Item) => void;
  onDelete: (lot: string) => void;
}
export default function ItemsList({ items, isLoading, onEdit, onDelete }: ItemsListProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold">Daftar Item</h2>
      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          items.slice(0, 6).map((item) => (
            <ItemCard key={item.Lot} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
