"use client";

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import type { ImplantLibraryItem } from "@/components/digitalTemplating/implantLibrary";
import { collapseVariants } from "@/components/digitalTemplating/viewer/constants";

type GroupedLibrary = Record<
  "stem" | "cup" | "knee",
  Record<string, ImplantLibraryItem[]>
>;

export function ImplantModal({
  open,
  setOpenImplantModal,
  search,
  setSearch,
  openType,
  setOpenType,
  openSystem,
  setOpenSystem,
  groupedLibrary,
  addImplant,
}: {
  open: boolean;
  setOpenImplantModal: React.Dispatch<React.SetStateAction<boolean>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  openType: Record<"stem" | "cup" | "knee", boolean>;
  setOpenType: React.Dispatch<
    React.SetStateAction<Record<"stem" | "cup" | "knee", boolean>>
  >;
  openSystem: Record<string, boolean>;
  setOpenSystem: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  groupedLibrary: GroupedLibrary;
  addImplant: (item: ImplantLibraryItem) => void;
}) {
  const stemCount = Object.values(groupedLibrary.stem).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const cupCount = Object.values(groupedLibrary.cup).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const kneeCount = Object.values(groupedLibrary.knee).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-gray-200/70 dark:border-neutral-700/70 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-3 border-b border-gray-200/70 dark:border-neutral-700/70 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Implant Library
                </div>
                <div className="text-[11px] text-gray-500">
                  {stemCount + cupCount + kneeCount} templates
                </div>
              </div>
              <button
                onClick={() => setOpenImplantModal(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                aria-label="Close implant library"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-gray-200/70 dark:border-neutral-700/70 bg-gray-50/70 dark:bg-neutral-900/60">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search implant…"
                className="w-full rounded-lg px-3 py-2 text-xs border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="max-h-[65svh] overflow-y-auto">
              <button
                onClick={() => setOpenType((p) => ({ ...p, stem: !p.stem }))}
                className="w-full px-4 py-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
              >
                <span>🦴 Stem</span>
                <span className="text-[11px] text-gray-500">{stemCount}</span>
              </button>

              <AnimatePresence initial={false}>
                {openType.stem && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.stem).map(
                      ([system, items]) => {
                        const systemKey = `stem:${system}`;
                        const isOpen = Boolean(openSystem[systemKey]);
                        return (
                          <div key={system}>
                            <button
                              onClick={() =>
                                setOpenSystem((p) => ({
                                  ...p,
                                  [systemKey]: !p[systemKey],
                                }))
                              }
                              className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                            >
                              <span>
                                {isOpen ? "▾" : "▸"} {system}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {items.length}
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  variants={collapseVariants}
                                  initial="collapsed"
                                  animate="open"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  {items.map((item) => (
                                    <button
                                      key={`${system}:${item.id}:${item.label}`}
                                      onClick={() => {
                                        addImplant(item);
                                        setOpenImplantModal(false);
                                      }}
                                      className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setOpenType((p) => ({ ...p, cup: !p.cup }))}
                className="w-full px-4 py-2 mt-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
              >
                <span>Cup</span>
                <span className="text-[11px] text-gray-500">{cupCount}</span>
              </button>

              <AnimatePresence initial={false}>
                {openType.cup && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.cup).map(
                      ([system, items]) => {
                        const systemKey = `cup:${system}`;
                        const isOpen = Boolean(openSystem[systemKey]);
                        return (
                          <div key={system}>
                            <button
                              onClick={() =>
                                setOpenSystem((p) => ({
                                  ...p,
                                  [systemKey]: !p[systemKey],
                                }))
                              }
                              className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                            >
                              <span>
                                {isOpen ? "▾" : "▸"} {system}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {items.length}
                              </span>
                            </button>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  variants={collapseVariants}
                                  initial="collapsed"
                                  animate="open"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  {items.map((item) => (
                                    <button
                                      key={`${system}:${item.id}:${item.label}`}
                                      onClick={() => {
                                        addImplant(item);
                                        setOpenImplantModal(false);
                                      }}
                                      className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setOpenType((p) => ({ ...p, knee: !p.knee }))}
                className="w-full px-4 py-2 mt-2 text-left text-xs font-semibold bg-gray-100/80 dark:bg-neutral-800/80 flex items-center justify-between"
              >
                <span>🦵 Knee</span>
                <span className="text-[11px] text-gray-500">{kneeCount}</span>
              </button>

              <AnimatePresence initial={false}>
                {openType.knee && (
                  <motion.div
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    {Object.entries(groupedLibrary.knee).map(([system, items]) => {
                      const systemKey = `knee:${system}`;
                      const isOpen = Boolean(openSystem[systemKey]);
                      return (
                        <div key={system}>
                          <button
                            onClick={() =>
                              setOpenSystem((p) => ({
                                ...p,
                                [systemKey]: !p[systemKey],
                              }))
                            }
                            className="w-full px-5 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-neutral-800 flex items-center justify-between"
                          >
                            <span>
                              {isOpen ? "▾" : "▸"} {system}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {items.length}
                            </span>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                variants={collapseVariants}
                                initial="collapsed"
                                animate="open"
                                exit="collapsed"
                                className="overflow-hidden"
                              >
                                {items.map((item) => (
                                  <button
                                    key={`${system}:${item.id}:${item.label}`}
                                    onClick={() => {
                                      addImplant(item);
                                      setOpenImplantModal(false);
                                    }}
                                    className="w-full px-8 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800"
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
