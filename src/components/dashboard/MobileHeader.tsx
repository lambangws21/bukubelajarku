"use client";

import { BookUser, Menu } from "lucide-react";

export default function MobileHeader({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center justify-between">
      <button onClick={onOpen}>
        <Menu className="w-6 h-6" />
      </button>
      <span className="text-sm font-semibold flex items-centet gap-2"><BookUser className="w-6 h-6" /> HERLAMBANG</span>
      <div className="w-6" />
    </header>
  );
}
