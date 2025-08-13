"use client";

import React from "react";
import Image from "next/image";

export type ImageItem = {
  id: string;
  name: string;
  file: File;
  url: string;
};

interface ThumbnailListProps {
  images: ImageItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
}

const ThumbnailList: React.FC<ThumbnailListProps> = ({ images, activeIndex, onSelect, onRemove }) => {
  return (
    <div className="bg-white rounded p-2 border h-[560px] overflow-auto">
      <h3 className="font-medium mb-2">Thumbnails</h3>
      <div className="space-y-2">
        {images.length === 0 && <div className="text-sm text-gray-500">No images</div>}
        {images.map((img, idx) => (
          <div
            key={img.id}
            onClick={() => onSelect(idx)}
            className={`flex items-center gap-2 p-1 rounded cursor-pointer ${idx === activeIndex ? "bg-sky-50" : "hover:bg-gray-50"}`}
          >
            <div className="w-16 h-12 relative rounded overflow-hidden bg-gray-100">
              <Image src={img.url} alt={img.name} fill style={{ objectFit: "cover" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{img.name}</div>
              <div className="text-xs text-gray-400">({Math.round(img.file.size / 1024)} KB)</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(img.id);
              }}
              className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThumbnailList;
