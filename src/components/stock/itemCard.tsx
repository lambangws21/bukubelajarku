// File: src/components/stock/ItemCard.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trash2, Edit2, Box, Hash, Tag, Calendar, Package } from "lucide-react";

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
  const lowStock = Number(item.Jumlah) <= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
    >
      <Card className="w-full bg-gray-800 text-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3 sm:gap-6">
          {/* Info Container */}
          <div className="w-full sm:w-2/3 space-y-1">
            <motion.div
              className="flex items-center text-lg font-semibold truncate"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Box className="w-5 h-5 mr-2 text-green-400" />
              {item.Nama}
            </motion.div>

            <motion.div
              className="flex items-center text-sm text-gray-400"
              whileHover={{ x: 5 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <Hash className="w-4 h-4 mr-1 text-gray-500" />
              <span className="font-medium">Lot:</span>&nbsp;{item.Lot}
              <span className="mx-2">|</span>
              <Tag className="w-4 h-4 mr-1 text-gray-500" />
              <span className="font-medium">Ref:</span>&nbsp;{item.Ref}
            </motion.div>

            <motion.div
              className="flex items-center text-sm text-gray-400"
              initial={lowStock ? { color: '#FACC15' } : {}}
              animate={lowStock ? { color: ['#FACC15', '#F87171', '#FACC15'] } : undefined}
              transition={lowStock ? { repeat: Infinity, duration: 1.5 } : undefined}
            >
              <Package className="w-4 h-4 mr-1 text-gray-500" />
              <span className="font-medium">Jumlah:</span>&nbsp;{item.Jumlah}
            </motion.div>

            {item.Tanggal && (
              <motion.div
                className="flex items-center text-xs text-gray-500"
                whileHover={{ scale: 1.05 }}
              >
                <Calendar className="w-4 h-4 mr-1 text-gray-600" />
                <span>{new Date(item.Tanggal).toLocaleDateString('id-ID')}</span>
              </motion.div>
            )}
          </div>

          {/* Buttons Container */}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto text-sm px-4 py-2 flex items-center justify-center"
                onClick={() => onEdit(item)}
              >
                <Edit2 className="w-4 h-4 mr-1 text-green-400" />
                Edit
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Button
                variant="destructive"
                className="w-full sm:w-auto text-sm px-4 py-2 flex items-center justify-center"
                onClick={() => onDelete(item.Lot)}
              >
                <Trash2 className="w-4 h-4 mr-1 text-red-400" />
                Hapus
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
