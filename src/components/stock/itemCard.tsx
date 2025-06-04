"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Item {
  Tanggal?: string;
  Ref: string;
  Lot: string;
  Nama: string;
  Jumlah: string;
}
interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (lot: string) => void;
}
export default function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  return (
    <Card className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
      <div className="mb-2 sm:mb-0 w-full sm:w-auto">
        <div className="font-semibold">{item.Nama}</div>
        <div className="text-sm text-gray-500">Lot: {item.Lot} | Ref: {item.Ref}</div>
        <div className="text-xs text-gray-400">Jumlah: {item.Jumlah}</div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button variant="destructive" className="flex-1 sm:flex-none" onClick={() => onDelete(item.Lot)}>
          <Trash2 size={16} />
        </Button>
      </div>
    </Card>
  );
}