"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Hand,
  ImageIcon,
  Maximize2,
  RefreshCcw,
  Redo2,
  RulerIcon,
  Settings2,
  Square,
  Undo2,
} from "lucide-react";

export function MobileControlDock({
  panelsHidden,
  onTogglePanelsHidden,
  xrayPanelOpen,
  onToggleXrayPanel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  measurementsOpen,
  onToggleMeasurements,
  implantToolOpen,
  onToggleImplantTool,
  panMode,
  onTogglePanMode,
  canvasMode,
  onFitToScreen,
  onSetOneToOne,
  onResetView,
}: {
  panelsHidden: boolean;
  onTogglePanelsHidden: () => void;
  xrayPanelOpen: boolean;
  onToggleXrayPanel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  measurementsOpen: boolean;
  onToggleMeasurements: () => void;
  implantToolOpen: boolean;
  onToggleImplantTool: () => void;
  panMode: boolean;
  onTogglePanMode: () => void;
  canvasMode: "fit" | "oneToOne";
  onFitToScreen: () => void;
  onSetOneToOne: () => void;
  onResetView: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const baseButton =
    "h-9 w-9 rounded-xl ring-1 ring-gray-200/70 bg-white/95 text-gray-700 shadow-sm backdrop-blur transition active:scale-95 hover:bg-white dark:ring-neutral-700/70 dark:bg-neutral-900/95 dark:text-gray-200";
  const activeButton =
    "ring-emerald-300/70 text-emerald-700 dark:text-emerald-300";
  const inactiveButton = "text-gray-600 dark:text-gray-200";

  return (
    <motion.div
      className="md:hidden fixed right-[calc(env(safe-area-inset-right)+6px)] top-[calc(env(safe-area-inset-top)+8px)] z-50 rounded-2xl border border-gray-200/70 bg-white/95 px-2 py-2 shadow-xl backdrop-blur dark:border-neutral-700/70 dark:bg-neutral-900/95"
      onPointerDown={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePanelsHidden}
          aria-pressed={panelsHidden}
          className={`${baseButton} ${
            panelsHidden ? activeButton : inactiveButton
          }`}
          aria-label={panelsHidden ? "Show panels" : "Hide panels"}
          title={panelsHidden ? "Show panels" : "Hide panels"}
        >
          {panelsHidden ? (
            <Eye className="mx-auto h-5 w-5" />
          ) : (
            <EyeOff className="mx-auto h-5 w-5" />
          )}
        </button>

        <div className="h-7 w-px bg-gray-200/70 dark:bg-neutral-700/70" />

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`${baseButton} ${inactiveButton} disabled:opacity-50`}
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 className="mx-auto h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`${baseButton} ${inactiveButton} disabled:opacity-50`}
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 className="mx-auto h-5 w-5" />
        </button>

        <div className="h-7 w-px bg-gray-200/70 dark:bg-neutral-700/70" />

        <button
          type="button"
          onClick={onToggleXrayPanel}
          aria-pressed={xrayPanelOpen && !panelsHidden}
          className={`${baseButton} ${
            xrayPanelOpen && !panelsHidden ? activeButton : inactiveButton
          }`}
          aria-label={xrayPanelOpen ? "Hide X-ray panel" : "Show X-ray panel"}
          title="X-ray Panel"
        >
          <ImageIcon className="mx-auto h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleMeasurements}
          aria-pressed={measurementsOpen && !panelsHidden}
          className={`${baseButton} ${
            measurementsOpen && !panelsHidden ? activeButton : inactiveButton
          }`}
          aria-label={
            measurementsOpen ? "Hide measurements panel" : "Show measurements panel"
          }
          title="Measurements"
        >
          <RulerIcon className="mx-auto h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleImplantTool}
          aria-pressed={implantToolOpen && !panelsHidden}
          className={`${baseButton} ${
            implantToolOpen && !panelsHidden ? activeButton : inactiveButton
          }`}
          aria-label={implantToolOpen ? "Hide implant tool" : "Show implant tool"}
          title="Implant Tool"
        >
          <Settings2 className="mx-auto h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-pressed={expanded}
          className={`${baseButton} ${inactiveButton}`}
          aria-label={expanded ? "Hide view tools" : "Show view tools"}
          title="View tools"
        >
          <ChevronDown
            className={`mx-auto h-5 w-5 transition ${
              expanded ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-gray-200/70 bg-white/80 px-2 py-2 dark:border-neutral-700/70 dark:bg-neutral-900/60">
              <button
                type="button"
                onClick={onTogglePanMode}
                aria-pressed={panMode}
                className={`${baseButton} ${panMode ? activeButton : inactiveButton}`}
                aria-label={panMode ? "Disable pan tool" : "Enable pan tool"}
                title="Pan (hand tool)"
              >
                <Hand className="mx-auto h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onFitToScreen}
                className={`${baseButton} ${inactiveButton}`}
                aria-label="Fit to screen"
                title="Fit to screen"
              >
                <Maximize2 className="mx-auto h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onSetOneToOne}
                aria-pressed={canvasMode === "oneToOne"}
                className={`${baseButton} ${
                  canvasMode === "oneToOne" ? activeButton : inactiveButton
                }`}
                aria-label="1:1 view"
                title="1:1 view"
              >
                <Square className="mx-auto h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onResetView}
                className={`${baseButton} ${inactiveButton}`}
                aria-label="Reset view"
                title="Reset view"
              >
                <RefreshCcw className="mx-auto h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
