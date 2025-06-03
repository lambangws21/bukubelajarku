// File: app/components/ShareButtons.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ShareButtons() {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    // Ambil URL saat ini hanya di sisi klien
    setCurrentUrl(window.location.href);
  }, []);

  // Jika belum ada URL (SSR), jangan tampilkan apa‐apa
  if (!currentUrl) {
    return null;
  }

  const encodedUrl = encodeURIComponent(currentUrl);
  const whatsappShare = `https://wa.me/?text=${encodedUrl}`;
  const telegramShare = `https://t.me/share/url?url=${encodedUrl}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl)
      .then(() => alert("Link disalin ke clipboard!"))
      .catch(() => alert("Gagal menyalin link."));
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-4">
      {/* WhatsApp */}
      <a
        href={whatsappShare}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
      >
        <Image
          src="/whatsapp-brands.svg"
          alt="WhatsApp"
          width={18}
          height={18}
          className="object-contain"
        />
        <span>WhatsApp</span>
      </a>

      {/* Telegram */}
      <a
        href={telegramShare}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-1 px-3 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded text-sm"
      >
        <Image
          src="/telegram-brands.svg"
          alt="Telegram"
          width={18}
          height={18}
          className="object-contain"
        />
        <span>Telegram</span>
      </a>

      {/* Facebook */}
      <a
        href={facebookShare}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-1 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm"
      >
        <Image
          src="/facebook-brands.svg"
          alt="Facebook"
          width={18}
          height={18}
          className="object-contain"
        />
        <span>Facebook</span>
      </a>

      {/* Copy Link */}
      <button
        onClick={copyLink}
        className="flex items-center space-x-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 rounded text-sm"
      >
        <Image
          src="/link-solid.svg"
          alt="Salin Link"
          width={18}
          height={18}
          className="object-contain"
        />
        <span>Salin Link</span>
      </button>
    </div>
  );
}
