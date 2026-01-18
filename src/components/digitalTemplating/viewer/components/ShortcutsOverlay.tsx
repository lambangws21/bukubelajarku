"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function ShortcutsOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const groups = [
    {
      title: "General",
      items: [
        { keys: "Shift+/", label: "Toggle shortcuts" },
        { keys: "Esc", label: "Cancel mode or deselect" },
        { keys: "Ctrl/Cmd+Z", label: "Undo" },
        { keys: "Ctrl/Cmd+Shift+Z", label: "Redo" },
        { keys: "Ctrl/Cmd+Y", label: "Redo" },
        { keys: "Del/Backspace", label: "Delete active implant" },
      ],
    },
    {
      title: "Measurements",
      items: [
        { keys: "R", label: "Ruler (click 2 points)" },
        { keys: "L", label: "LLD (vertical 2 points)" },
        { keys: "O", label: "Offset (horizontal 2 points)" },
        { keys: "A", label: "Angle (click 3 points)" },
        { keys: "H", label: "aHKA (hip-knee-ankle, click 3 points)" },
        { keys: "V", label: "Valgus cut (set hip+knee, drag points)" },
        { keys: "T", label: "Tibial slope (set prox+dist, drag points)" },
        { keys: "C", label: "Tibial cut (set prox+dist, drag points)" },
        { keys: "N", label: "Annotate (click to add note)" },
      ],
    },
    {
      title: "Transform",
      items: [
        { keys: "Arrows", label: "Move active implant" },
        { keys: "Shift+Arrows", label: "Scale active implant" },
        { keys: "Ctrl/Cmd+Arrows", label: "Rotate active implant" },
        { keys: "Drag", label: "Move implant" },
        { keys: "Pinch", label: "Scale or rotate (if scale lock off)" },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed right-4 top-4 z-50 w-[min(360px,92vw)]"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-2xl border border-gray-200/70 bg-white/95 shadow-2xl backdrop-blur dark:border-neutral-700/70 dark:bg-neutral-900/95">
            <div className="flex items-center justify-between border-b border-gray-200/70 px-3 py-2 text-[11px] font-semibold text-gray-800 dark:border-neutral-800/70 dark:text-gray-100">
              <span>Shortcuts & Tips</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                aria-label="Close shortcuts"
                title="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="max-h-[70svh] space-y-3 overflow-y-auto px-3 py-3 text-[10px] text-gray-600 dark:text-gray-300">
              {groups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <div
                        key={`${group.title}-${item.keys}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
                          {item.keys}
                        </span>
                        <span className="text-right">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

