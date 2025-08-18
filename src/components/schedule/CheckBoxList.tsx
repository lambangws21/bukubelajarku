// components/new-schedule/CheckBoxList.tsx

import type { TeamMember } from '@/types/schedule';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CheckboxListProps = {
  options: TeamMember[];
  selected: TeamMember[];
  onChange: (selected: TeamMember[]) => void;
  maxSelection: number;
};

export function CheckboxList({ options, selected, onChange, maxSelection }: CheckboxListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (member: TeamMember) => {
    const isSelected = selected.some(m => m.email === member.email);
    let newSelected: TeamMember[];

    if (isSelected) {
      newSelected = selected.filter(m => m.email !== member.email);
    } else {
      if (selected.length >= maxSelection) {
        alert(`Anda hanya dapat memilih maksimal ${maxSelection} anggota tim.`);
        return;
      }
      newSelected = [...selected, member];
    }
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return "Pilih Team TS...";
    if (selected.length <= 2) return selected.map(m => m.name).join(', ');
    return `${selected.length} anggota tim terpilih`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-10 pr-4 py-2 text-left bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center"
      >
        <span className="text-gray-900 dark:text-white truncate">{getDisplayText()}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full -mt-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto"
          >
            {options.map(member => {
              const isSelected = selected.some(m => m.email === member.email);
              return (
                <li
                  key={member.email}
                  onClick={() => handleSelect(member)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {/* --- Checkbox Kustom --- */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-transparent border-gray-400'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  {/* --- Ikon User --- */}
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400 " />
                  
                  {/* --- Nama --- */}
                  <span className="text-gray-900 dark:text-gray-200">{member.name}</span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
       <div className="text-xs text-right text-gray-500 pr-2 mt-8">
          Terpilih: {selected.length}/{maxSelection}
       </div>
    </div>
  );
}