// src/components/PACSViewer/PACSViewer.tsx
"use client";

import Image from "next/image";
import React, { useState } from "react";

// --- TIPE DATA ---
interface ImageItem {
  id: string;
  name: string;
  file: File;
  url: string;
}

// --- PLACEHOLDER PROPS ---
interface ImageCanvasPlaceholderProps {
  image?: ImageItem;
  onRemove: () => void;
  onFilesSelected: (files: FileList | null) => void;
}

interface ThumbnailListProps {
  images: ImageItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
}

// --- PLACEHOLDER COMPONENTS ---
const ImageCanvas: React.FC<ImageCanvasPlaceholderProps> = ({ image, onRemove, onFilesSelected }) => (
  <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center text-white relative">
    {image ? (
      <div className="relative w-full h-full">
        <Image src={image.url} alt={image.name} fill style={{ objectFit: 'contain' }} />
        <p className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded">{image.name}</p>
        <button onClick={onRemove} className="absolute top-4 right-4 p-2 bg-red-600 rounded text-white">Remove</button>
      </div>
    ) : (
      <div className="text-center">
        <p>Tidak ada gambar yang dipilih.</p>
        <label className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
          Pilih File
          <input type="file" className="hidden" onChange={e => onFilesSelected(e.target.files)} multiple />
        </label>
      </div>
    )}
  </div>
);

const ThumbnailList: React.FC<ThumbnailListProps> = ({ images, activeIndex, onSelect, onRemove }) => (
  <div className="bg-gray-200 p-2 rounded-lg h-full">
    <h3 className="font-bold mb-2 text-gray-700">Daftar Gambar</h3>
    <div className="space-y-2">
      {images.map((img, index) => (
        <div key={img.id} className={`p-2 rounded cursor-pointer flex justify-between items-center ${index === activeIndex ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`} onClick={() => onSelect(index)}>
          <p className="truncate text-sm">{img.name}</p>
          <button onClick={e => { e.stopPropagation(); onRemove(img.id); }} className="text-red-500 hover:text-red-700 text-xs font-bold">X</button>
        </div>
      ))}
    </div>
  </div>
);

// --- COMPONENT UTAMA ---
export default function PACSViewer(): JSX.Element {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageItem[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        file,
        url: URL.createObjectURL(file),
      }));
    if (newImages.length === 0) return;
    setImages(prev => [...prev, ...newImages]);
    setActiveIndex(images.length + newImages.length - 1);
  };

  const handleRemoveImage = (id: string) => {
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    if (newImages.length === 0) setActiveIndex(0);
    else if (activeIndex >= newImages.length) setActiveIndex(newImages.length - 1);
  };

  return (
    <div className="p-4 space-y-4 font-sans bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">PACS-like Viewer</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        <div className="bg-black rounded-lg overflow-hidden border border-gray-300 shadow-lg">
          <ImageCanvas
            key={images[activeIndex]?.id ?? 'empty'}
            image={images[activeIndex]}
            onRemove={() => { const id = images[activeIndex]?.id; if (id) handleRemoveImage(id); }}
            onFilesSelected={handleAddFiles}
          />
        </div>
        <ThumbnailList images={images} activeIndex={activeIndex} onSelect={setActiveIndex} onRemove={handleRemoveImage} />
      </div>
    </div>
  );
}
