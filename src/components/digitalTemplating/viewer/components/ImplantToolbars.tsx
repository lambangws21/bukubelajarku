"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  FlipHorizontal,
  FlipVertical,
  Grab,
  Lock,
  Redo2,
  RotateCcwIcon,
  RotateCw,
  Settings2,
  Trash,
  Undo2,
  Unlock,
  X,
} from "lucide-react";
import React from "react";
import type { TemplatingCanvasObject } from "@/components/digitalTemplating/implantLibrary";

export function ToolbarDesktop({
  active,
  toolbarRef,
  toolbarPos,
  onToolbarPointerMove,
  onToolbarPointerUp,
  onToolbarPointerDown,
  moveStep,
  setMoveStep,
  scaleStep,
  rotateStep,
  moveActive,
  scaleActive,
  rotateActive,
  flipActiveX,
  flipActiveY,
  deleteActive,
  updateActiveScale,
  updateActiveRotation,
  updateActiveOpacity,
  toggleActiveLock,
  toggleActiveScaleLock,
  startScaleScrub,
  endScaleScrub,
  bringActiveToFront,
  sendActiveToBack,
  mmPerPixel,
  scaleImplantByMm,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  active: TemplatingCanvasObject;
  toolbarRef: React.RefObject<HTMLDivElement>;
  toolbarPos: { x: number; y: number };
  onToolbarPointerMove: (e: React.PointerEvent) => void;
  onToolbarPointerUp: (e: React.PointerEvent) => void;
  onToolbarPointerDown: (e: React.PointerEvent) => void;
  moveStep: number;
  setMoveStep: React.Dispatch<React.SetStateAction<number>>;
  scaleStep: number;
  rotateStep: number;
  moveActive: (dx: number, dy: number) => void;
  scaleActive: (delta: number) => void;
  rotateActive: (delta: number) => void;
  flipActiveX: () => void;
  flipActiveY: () => void;
  deleteActive: () => void;
  updateActiveScale: (value: number) => void;
  updateActiveRotation: (value: number) => void;
  updateActiveOpacity: (value: number) => void;
  toggleActiveLock: () => void;
  toggleActiveScaleLock: () => void;
  startScaleScrub: () => void;
  endScaleScrub: () => void;
  bringActiveToFront: () => void;
  sendActiveToBack: () => void;
  mmPerPixel: number | null;
  scaleImplantByMm: (targetMm: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  const shellClass =
    "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/70 dark:border-neutral-700/70 w-36";
  const headerClass =
    "cursor-move px-3 py-2 border-b border-gray-200/70 dark:border-neutral-700/70 text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200 flex items-center justify-between";
  const contentClass = "p-3 space-y-3 text-xs";
  const sectionClass =
    "rounded-xl border border-gray-200/60 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-800/40 p-1 space-y-1.2";
  const labelClass =
    "text-[11px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const rangeClass = "w-full accent-emerald-500";
  const helperText = "text-[10px] text-gray-500";
  const iconButton =
    "inline-flex h-5 w-5 items-center justify-center rounded-md border border-gray-200/70 bg-white/80 text-gray-600 hover:bg-gray-100 dark:border-neutral-700/70 dark:bg-neutral-900/70 dark:text-gray-200";
  const scaleDisabled = active.scaleLocked;
  const safeScaleStep = Math.abs(scaleStep) || 0.01;
  const safeRotateStep = Math.abs(rotateStep) || 1;
  return (
    <motion.div
      ref={toolbarRef}
      className="hidden md:block fixed z-40 select-none touch-none"
      data-tour="toolbar-desktop"
      style={{ left: toolbarPos.x, top: toolbarPos.y }}
      onPointerMove={onToolbarPointerMove}
      onPointerUp={onToolbarPointerUp}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={shellClass}>
        <div className={headerClass} onPointerDown={onToolbarPointerDown}>
          <span>Implant Tool</span>
          <span className="text-gray-400">
            <Grab />
          </span>
        </div>

        <div className={contentClass}>
          <div className={sectionClass}>
            <label className={labelClass}>History</label>
            <div className="flex gap-1 mt-1">
              <TB onClick={undo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4 " />
              </TB>
              <TB onClick={redo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4 " />
              </TB>
            </div>
          </div>

          <div className={sectionClass}>
            <label className={labelClass}>Move (px)</label>
            <input
              type="number"
              value={moveStep}
              onChange={(e) => setMoveStep(Number(e.target.value))}
              className={inputFull}
            />

            <div className="grid grid-cols-3 gap-0 place-items-center">
              <div />
              <TB onClick={() => moveActive(0, -moveStep)}>↑</TB>
              <div />

              <TB onClick={() => moveActive(-moveStep, 0)}>←</TB>
              <div className="w-6 h-6 rounded-lg bg-gray-100/80 dark:bg-neutral-800/70 text-[9px] text-gray-400 dark:text-gray-500 flex items-center justify-center">
                MOVE
              </div>
              <TB onClick={() => moveActive(moveStep, 0)}>→</TB>

              <div />
              <TB onClick={() => moveActive(0, moveStep)}>↓</TB>
              <div />
            </div>
          </div>

          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <label className={labelClass}>Scale</label>
              <button
                type="button"
                onClick={toggleActiveScaleLock}
                className={iconButton}
                aria-label={scaleDisabled ? "Unlock scale" : "Lock scale"}
                title={scaleDisabled ? "Unlock scale" : "Lock scale"}
              >
                {scaleDisabled ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </button>
            </div>

            <input
              type="range"
              min={0.1}
              max={3}
              step={0.01}
              value={active.scaleX}
              onChange={(e) => updateActiveScale(Number(e.target.value))}
              onPointerDown={startScaleScrub}
              onPointerUp={endScaleScrub}
              onPointerCancel={endScaleScrub}
              disabled={scaleDisabled}
              className={`${rangeClass} ${scaleDisabled ? "opacity-60" : ""}`}
            />
            {mmPerPixel && active.type !== "shape" && (
              <div className="mt-2 space-y-1">
                <label className={labelClass}>Real Length (mm)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={active.realLengthMm ?? ""}
                  onChange={(e) => scaleImplantByMm(Number(e.target.value))}
                  disabled={scaleDisabled}
                  className={`${inputFull} ${
                    scaleDisabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                <div className={helperText}>
                  Calibrated ✓ ({mmPerPixel.toFixed(3)} mm/px)
                </div>
              </div>
            )}

            <input
              type="number"
              step={0.01}
              value={active.scaleX}
              onChange={(e) => updateActiveScale(Number(e.target.value))}
              disabled={scaleDisabled}
              className={`${inputFull} ${
                scaleDisabled ? "cursor-not-allowed opacity-60" : ""
              }`}
            />

            <div className="flex gap-1 mt-1">
              <TB
                onClick={() => scaleActive(safeScaleStep)}
                disabled={scaleDisabled}
              >
                ＋
              </TB>
              <TB
                onClick={() => scaleActive(-safeScaleStep)}
                disabled={scaleDisabled}
              >
                －
              </TB>
            </div>
          </div>

          <div className={sectionClass}>
            <label className={labelClass}>Layer</label>
            <div className="flex gap-1">
              <TB onClick={sendActiveToBack}>
                <ArrowDown className="h-4 w-4 " />
              </TB>
              <TB onClick={bringActiveToFront}>
                <ArrowUp className="h-3 w-3 " />
              </TB>
            </div>
            <label className={`${labelClass} mt-2`}>Opacity</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={active.opacity ?? 1}
              onChange={(e) => updateActiveOpacity(Number(e.target.value))}
              className={rangeClass}
            />
          </div>

          <div className={sectionClass}>
            <label className={labelClass}>Rotate (°)</label>

            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={active.rotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className={rangeClass}
            />

            <input
              type="number"
              step={1}
              value={active.rotation}
              onChange={(e) => updateActiveRotation(Number(e.target.value))}
              className={inputFull}
            />

            <div className="flex gap-1 mt-1">
              <TB onClick={() => rotateActive(safeRotateStep)}>
                <RotateCw />
              </TB>
              <TB onClick={() => rotateActive(-safeRotateStep)}>
                <RotateCcwIcon />
              </TB>
            </div>
          </div>

          <div className={sectionClass}>
            <label className={labelClass}>Flip</label>
            <div className="flex gap-1">
              <TB onClick={flipActiveX}>
                <FlipHorizontal />
              </TB>
              <TB onClick={flipActiveY}>
                <FlipVertical />
              </TB>
            </div>
          </div>

          <div className={sectionClass}>
            <label className={labelClass}>Lock & Delete</label>
            <div className="items-center flex justify-start gap-2">
              <TB onClick={toggleActiveLock}>
                {active.locked ? "🔒 Lock" : "🔓 Unlock"}
              </TB>

              <TB danger onClick={deleteActive}>
                <Trash />
              </TB>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ToolbarMobile({
  panelOpen,
  onTogglePanel,
}: {
  panelOpen: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onTogglePanel}
      className="md:hidden fixed right-3 top-[calc(env(safe-area-inset-top)+10px)] z-40 h-8 w-8 rounded-full bg-white/95 text-gray-700 shadow-lg ring-1 ring-gray-200/70 backdrop-blur transition hover:bg-white dark:bg-neutral-900/95 dark:text-gray-200 dark:ring-neutral-700/70"
      data-tour="toolbar-mobile"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {panelOpen ? (
        <X className="h-3.5 w-3.5" />
      ) : (
        <Settings2 className="h-3.5 w-3.5" />
      )}
    </motion.button>
  );
}

export function ToolbarMobilePanel({
  open,
  onClose,
  active,
  moveStep,
  setMoveStep,
  scaleStep,
  rotateStep,
  moveActive,
  scaleActive,
  rotateActive,
  flipActiveX,
  flipActiveY,
  deleteActive,
  updateActiveScale,
  updateActiveRotation,
  updateActiveOpacity,
  toggleActiveLock,
  toggleActiveScaleLock,
  startScaleScrub,
  endScaleScrub,
  bringActiveToFront,
  sendActiveToBack,
  mmPerPixel,
  scaleImplantByMm,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  open: boolean;
  onClose: () => void;
  active: TemplatingCanvasObject;
  moveStep: number;
  setMoveStep: React.Dispatch<React.SetStateAction<number>>;
  scaleStep: number;
  rotateStep: number;
  moveActive: (dx: number, dy: number) => void;
  scaleActive: (delta: number) => void;
  rotateActive: (delta: number) => void;
  flipActiveX: () => void;
  flipActiveY: () => void;
  deleteActive: () => void;
  updateActiveScale: (value: number) => void;
  updateActiveRotation: (value: number) => void;
  updateActiveOpacity: (value: number) => void;
  toggleActiveLock: () => void;
  toggleActiveScaleLock: () => void;
  startScaleScrub: () => void;
  endScaleScrub: () => void;
  bringActiveToFront: () => void;
  sendActiveToBack: () => void;
  mmPerPixel: number | null;
  scaleImplantByMm: (targetMm: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  const safeScaleStep = Math.abs(scaleStep) || 0.01;
  const safeRotateStep = Math.abs(rotateStep) || 1;
  const sectionClass =
    "rounded-2xl border border-gray-200/70 dark:border-neutral-700/70 bg-white/90 dark:bg-neutral-900/80 p-2.5 space-y-2";
  const labelClass =
    "text-[10px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/70 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const rangeClass = "w-full accent-emerald-500";
  const helperText = "text-[9px] text-gray-500";
  const iconButton =
    "inline-flex h-5 w-5 items-center justify-center rounded-md border border-gray-200/80 bg-white/90 text-gray-600 hover:bg-gray-100 dark:border-neutral-700/70 dark:bg-neutral-900/70 dark:text-gray-200";
  const scaleDisabled = active.scaleLocked;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="md:hidden fixed bottom-3 right-3 z-50 flex justify-end pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="pointer-events-auto w-[80vw] max-w-[260px] max-h-[65svh] overflow-y-auto overscroll-contain touch-pan-y rounded-3xl border border-gray-200/70 dark:border-neutral-700/70 bg-white/95 dark:bg-neutral-900/95 px-3 pb-3 pt-2 shadow-2xl"
            style={{ WebkitOverflowScrolling: "touch" }}
            initial={{ y: 12, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between pb-3">
              <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                Implant Tool
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={sectionClass}>
                <label className={labelClass}>History</label>
                <div className="flex gap-2">
                  <TB onClick={undo} disabled={!canUndo}>
                    <Undo2 />
                  </TB>
                  <TB onClick={redo} disabled={!canRedo}>
                    <Redo2 />
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Move (px)</label>
                <input
                  type="number"
                  value={moveStep}
                  onChange={(e) => setMoveStep(Number(e.target.value))}
                  className={inputFull}
                />
                <div className="grid grid-cols-3 gap-0 place-items-center">
                  <div />
                  <TB onClick={() => moveActive(0, -moveStep)}>↑</TB>
                  <div />
                  <TB onClick={() => moveActive(-moveStep, 0)}>←</TB>
                  <div className="w-5 h-5 rounded bg-gray-100/80 dark:bg-neutral-800/70 text-[8px] text-gray-400 dark:text-gray-500 flex items-center justify-center">
                    MOVE
                  </div>
                  <TB onClick={() => moveActive(moveStep, 0)}>→</TB>
                  <div />
                  <TB onClick={() => moveActive(0, moveStep)}>↓</TB>
                  <div />
                </div>
              </div>

              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Scale</label>
                  <button
                    type="button"
                    onClick={toggleActiveScaleLock}
                    className={iconButton}
                    aria-label={scaleDisabled ? "Unlock scale" : "Lock scale"}
                    title={scaleDisabled ? "Unlock scale" : "Lock scale"}
                  >
                    {scaleDisabled ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.01}
                  value={active.scaleX}
                  onChange={(e) => updateActiveScale(Number(e.target.value))}
                  onPointerDown={startScaleScrub}
                  onPointerUp={endScaleScrub}
                  onPointerCancel={endScaleScrub}
                  disabled={scaleDisabled}
                  className={`${rangeClass} ${
                    scaleDisabled ? "opacity-60" : ""
                  }`}
                />
                {mmPerPixel && active.type !== "shape" && (
                  <div className="mt-2 space-y-1">
                    <label className={labelClass}>Real Length (mm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={active.realLengthMm ?? ""}
                      onChange={(e) => scaleImplantByMm(Number(e.target.value))}
                      disabled={scaleDisabled}
                      className={`${inputFull} ${
                        scaleDisabled ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    />
                    <div className={helperText}>
                      Calibrated ✓ ({mmPerPixel.toFixed(3)} mm/px)
                    </div>
                  </div>
                )}
                <input
                  type="number"
                  step={0.01}
                  value={active.scaleX}
                  onChange={(e) => updateActiveScale(Number(e.target.value))}
                  disabled={scaleDisabled}
                  className={`${inputFull} ${
                    scaleDisabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                <div className="flex gap-2">
                  <TB
                    onClick={() => scaleActive(safeScaleStep)}
                    disabled={scaleDisabled}
                  >
                    ＋
                  </TB>
                  <TB
                    onClick={() => scaleActive(-safeScaleStep)}
                    disabled={scaleDisabled}
                  >
                    －
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Layer</label>
                <div className="flex gap-2">
                  <TB onClick={sendActiveToBack}>
                    <ArrowDown />
                  </TB>
                  <TB onClick={bringActiveToFront}>
                    <ArrowUp />
                  </TB>
                </div>
                <label className={`${labelClass} mt-2`}>Opacity</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={active.opacity ?? 1}
                  onChange={(e) => updateActiveOpacity(Number(e.target.value))}
                  className={rangeClass}
                />
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Rotate (°)</label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={active.rotation}
                  onChange={(e) => updateActiveRotation(Number(e.target.value))}
                  className={rangeClass}
                />
                <input
                  type="number"
                  step={1}
                  value={active.rotation}
                  onChange={(e) => updateActiveRotation(Number(e.target.value))}
                  className={inputFull}
                />
                <div className="flex gap-2">
                  <TB onClick={() => rotateActive(safeRotateStep)}>
                    <RotateCw />
                  </TB>
                  <TB onClick={() => rotateActive(-safeRotateStep)}>
                    <RotateCcwIcon />
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Flip</label>
                <div className="flex gap-2">
                  <TB onClick={flipActiveX}>
                    <FlipHorizontal />
                  </TB>
                  <TB onClick={flipActiveY}>
                    <FlipVertical />
                  </TB>
                </div>
              </div>

              <div className={sectionClass}>
                <label className={labelClass}>Lock & Delete</label>
                <div className="flex gap-2">
                  <TB onClick={toggleActiveLock}>
                    {active.locked ? "🔒 Lock" : "🔓 Unlock"}
                  </TB>
                  <TB danger onClick={deleteActive}>
                    <Trash />
                  </TB>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TB({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={`w-6 h-6 text-[11px] md:w-8 md:h-8 md:text-sm rounded-xl flex items-center justify-center
      ${
        danger
          ? "bg-red-50 text-red-600 hover:bg-red-100 disabled:hover:bg-red-50"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:hover:bg-gray-100"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </motion.button>
  );
}

