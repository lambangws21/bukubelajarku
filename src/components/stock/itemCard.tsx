// File: components/stock/ItemCard.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Edit2,
  Box,
  Hash,
  Tag,
  Calendar,
  Package,
} from "lucide-react";

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
    <Card className="w-full bg-gray-800 text-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3 sm:gap-6">
        {/* Kontainer Info */}
        <div className="w-full sm:w-2/3 space-y-1">
          <div className="flex items-center text-lg font-semibold truncate">
            <Box className="w-5 h-5 mr-2 text-green-400" />
            {item.Nama}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Hash className="w-4 h-4 mr-1 text-gray-500" />
            <span className="font-medium">Lot:</span>&nbsp;{item.Lot}
            <span className="mx-2">|</span>
            <Tag className="w-4 h-4 mr-1 text-gray-500" />
            <span className="font-medium">Ref:</span>&nbsp;{item.Ref}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Package className="w-4 h-4 mr-1 text-gray-500" />
            <span className="font-medium">Jumlah:</span>&nbsp;{item.Jumlah}
          </div>
          {item.Tanggal && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-4 h-4 mr-1 text-gray-600" />
              <span>{item.Tanggal}</span>
            </div>
          )}
        </div>

        {/* Kontainer Tombol */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-sm px-4 py-2 flex items-center justify-center"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="w-4 h-4 mr-1 text-green-400" />
            Edit
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto text-sm px-4 py-2 flex items-center justify-center"
            onClick={() => onDelete(item.Lot)}
          >
            <Trash2 className="w-4 h-4 mr-1 text-red-400" />
            Hapus
          </Button>
        </div>
      </div>
    </Card>
  );
}
