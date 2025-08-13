// src/components/PACS/ThumbnailList.tsx
"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion"; // Import Variants
import { X } from "lucide-react";

// Pastikan import tipe data dari file terpusat
import type { ImageItem } from "@/lib/types-pacs";

interface ThumbnailListProps {
  images: ImageItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
}

// Varian animasi untuk kontainer
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

// Varian animasi untuk setiap item
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

const ThumbnailList: React.FC<ThumbnailListProps> = ({ images, activeIndex, onSelect, onRemove }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-4 h-full flex flex-col">
      <h3 className="font-semibold text-lg text-white mb-4">Image Series</h3>
      <motion.div
        className="space-y-3 overflow-y-auto pr-2 -mr-2 flex-grow"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {images.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-center text-gray-400 py-10"
            >
              No images uploaded.
            </motion.div>
          )}
          {images.map((img, idx) => (
            <motion.div
              key={img.id}
              layout
              variants={itemVariants}
              exit="exit"
              onClick={() => onSelect(idx)}
              className="relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-300 hover:bg-gray-700/60"
            >
              {idx === activeIndex && (
                <motion.div
                  layoutId="active-thumbnail-highlight"
                  className="absolute inset-0 bg-blue-600/30 border border-blue-500 rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                ></motion.div>
              )}
              <div className="relative w-20 h-16 rounded-md overflow-hidden bg-gray-900 shrink-0">
                <Image src={img.url} alt={img.name} fill style={{ objectFit: "cover" }} />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{img.name}</p>
                <p className="text-xs text-gray-400">({Math.round(img.file.size / 1024)} KB)</p>
              </div>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(img.id);
                }}
                className="relative z-10 p-1 rounded-full text-gray-400 hover:bg-red-500/50 hover:text-white"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                title="Remove image"
              >
                <X size={16} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ThumbnailList;
