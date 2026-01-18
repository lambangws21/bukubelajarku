"use client";

import React from "react";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Redo2,
  RulerIcon,
  Settings2,
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
}) {
  const baseButton =
    "h-7 w-7 rounded-lg ring-1 ring-gray-200/70 bg-white/95 text-gray-700 shadow-sm backdrop-blur transition hover:bg-white dark:ring-neutral-700/70 dark:bg-neutral-900/95 dark:text-gray-200";
  const activeButton =
    "ring-emerald-300/70 text-emerald-700 dark:text-emerald-300";
  const inactiveButton = "text-gray-600 dark:text-gray-200";

  return (
    <div
      className="md:hidden fixed left-1/2 top-[calc(env(safe-area-inset-top)+10px)] z-50 -translate-x-1/2 rounded-lg border border-gray-200/70 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur dark:border-neutral-700/70 dark:bg-neutral-900/95"
      onPointerDown={(e) => e.stopPropagation()}
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
            <Eye className="mx-auto h-4 w-4" />
          ) : (
            <EyeOff className="mx-auto h-4 w-4" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-200/70 dark:bg-neutral-700/70" />

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`${baseButton} ${inactiveButton} disabled:opacity-50`}
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 className="mx-auto h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`${baseButton} ${inactiveButton} disabled:opacity-50`}
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 className="mx-auto h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-200/70 dark:bg-neutral-700/70" />

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
          <ImageIcon className="mx-auto h-4 w-4" />
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
          <RulerIcon className="mx-auto h-4 w-4" />
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
          <Settings2 className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

