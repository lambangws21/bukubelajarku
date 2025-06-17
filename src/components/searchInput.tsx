'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

interface SearchInputProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export default function SearchInput({ searchTerm, setSearchTerm }: SearchInputProps) {
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Detect outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  return (
    <div ref={wrapperRef} className="relative sm:w-auto w-[9rem]">
      {/* Mobile icon */}
      <button
        type="button"
        onClick={() => setShowInput((prev) => !prev)}
        className="sm:hidden p-2 border rounded-xl bg-white dark:bg-gray-800 dark:text-white shadow"
        title="Cari"
      >
        <Search className="w-4 h-4 text-gray-500" />
      </button>

      {/* AnimatePresence handles enter/exit animation */}
      <AnimatePresence>
        {(showInput || typeof window !== 'undefined' && window.innerWidth >= 640) && (
          <motion.div
            key="search"
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.2 }}
            className="relative mt-2 sm:mt-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari keterangan..."
              title="Cari keterangan"
              className="w-full pl-10 pr-3 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white text-sm shadow sm:min-w-[200px]"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/4 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
