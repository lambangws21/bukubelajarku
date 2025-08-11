'use client';

import React, { useEffect, useState } from 'react';
import ImageGalleryWithPreview from '@/components/Dasboards/Dasboard_Advance/DriveGridImage';
import Lottie from 'lottie-react';
import monkeyAnimation from '@/components/hear-no-evil-monkey.json';

export default function ImageView() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/advance/getAllData');
        const json = await res.json();
        if (json.status === 'success') {
          setImages(json.imagesForSheet1); // ✅ simpan di images
        } else {
          throw new Error(json.message || 'Gagal fetch data');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">
        <Lottie
          animationData={monkeyAnimation}
          loop={true}
          className="w-48 h-48"
        />
  </div>;
  if (error) return <div className="p-4 text-red-500">❌ {error}</div>;

  return (
    <div className="p-4">
      <ImageGalleryWithPreview driveImages={images} /> {/* ✅ gunakan 'images' */}
    </div>
  );
}
