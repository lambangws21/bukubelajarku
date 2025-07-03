'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface ImagePreviewButtonProps {
  fileName: string;
  googleDriveId: string;
}

export default function ImagePreviewButton({
  fileName,
  googleDriveId,
}: ImagePreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const imgUrl = `https://drive.google.com/uc?export=view&id=${googleDriveId}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          onClick={() => setOpen(true)}
          title="Lihat Gambar"
        >
          <Eye size={18} />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <div className="relative w-full h-[400px]">
          <Image
            src={imgUrl}
            alt={fileName}
            fill
            className="object-contain rounded"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
