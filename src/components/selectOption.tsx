// src/components/SelectOption.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectOptionProps {
  /** List of option values */
  options: string[];
  /** Controlled selected value(s) */
  selected: string | string[];
  /** Callback when selection changes */
  onChange: (value: string | string[]) => void;
  /** Optional label above the select */
  label?: string;
  /** Allow multiple selection */
  multiple?: boolean;
}

export default function SelectOption({
  options,
  selected,
  onChange,
  label,
  multiple = false,
}: SelectOptionProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const listVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const ITEM_HEIGHT = 36;
  const dropdownHeight = options.length * ITEM_HEIGHT;

  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

  const handleSelect = (value: string) => {
    if (!multiple) {
      onChange(value);
      setOpen(false);
    } else {
      const idx = selectedArray.indexOf(value);
      const next = idx >= 0 ? selectedArray.filter(v => v !== value) : [...selectedArray, value];
      onChange(next);
    }
  };

  const labelText = !multiple
    ? (selected as string) || 'Pilih...'
    : selectedArray.length > 0
      ? selectedArray.join(', ')
      : 'Pilih...';

  return (
    <div className="flex flex-col relative w-full" ref={containerRef}>
      {label && (
        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-between px-3 py-1 rounded-2xl border bg-white hover:cursor-pointer dark:bg-gray-800 text-sm min-w-[120px]"
      >
        <span className={labelText === 'Pilih...' ? 'text-gray-400' : ''}>
          {labelText}
        </span>
        <ChevronDown
          size={16}
          className="text-gray-500 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listVariants}
            style={{ height: dropdownHeight, overflowY: 'auto' }}
            className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg"
          >
            {options.map(opt => (
              <motion.li
                key={opt}
                className={`flex items-center px-3 py-1 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedArray.includes(opt) ? 'font-semibold' : ''}`}
                onClick={() => handleSelect(opt)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {multiple && (
                  <input
                    type="checkbox"
                    checked={selectedArray.includes(opt)}
                    readOnly
                    className="mr-2"
                  />
                )}
                {opt}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
