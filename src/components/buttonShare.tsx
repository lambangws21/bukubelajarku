// File: app/components/ShareButtons.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";

export default function ShareButtons() {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  if (!currentUrl) return null;

  const encodedUrl = encodeURIComponent(currentUrl);
  const whatsappShare = `https://wa.me/?text=${encodedUrl}`;
  const telegramShare = `https://t.me/share/url?url=${encodedUrl}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => alert("Gagal menyalin link."));
  };

  const buttons = [
    {
      name: "WhatsApp",
      href: whatsappShare,
      bg: "bg-green-500 hover:bg-green-600",
      icon: "/whatsapp-brands.svg",
    },
    {
      name: "Telegram",
      href: telegramShare,
      bg: "bg-blue-400 hover:bg-blue-500",
      icon: "/telegram-brands.svg",
    },
    {
      name: "Facebook",
      href: facebookShare,
      bg: "bg-blue-700 hover:bg-blue-800",
      icon: "/facebook-brands.svg",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {buttons.map((btn, i) => (
        <motion.a
          key={btn.name}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-white rounded-full ${btn.bg}`}
        >
          <Image src={btn.icon} alt={btn.name} width={14} height={14} />
          <span>{btn.name}</span>
        </motion.a>
      ))}

      <motion.button
        onClick={copyLink}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium bg-gray-400 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full"
      >
        <Copy size={14} />
        <span>{copied ? "Disalin!" : "Salin Link"}</span>
      </motion.button>
    </div>
  );
}