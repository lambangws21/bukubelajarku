"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Grab,
  Hand,
  Image as ImageIcon,
  Keyboard,
  List,
  Maximize2,
  Minus,
  Plus,
  RefreshCcw,
  Settings2,
  Square,
  Trash,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import type {
  ImplantLibraryItem,
  TemplatingCanvasObject,
} from "@/components/digitalTemplating/implantLibrary";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  collapseVariants,
} from "../constants";
import type { CanvasMode } from "../utils";

type CalibrationPreset = {
  id: string;
  name: string;
  realMm: number;
  pixelsPerMm: number;
  useRealScale: boolean;
  createdAt: number;
};

type PanelSectionKey = "imaging" | "calibration" | "tools" | "overview";
type CameraFit = "cover" | "contain";
type CameraZoomMode = "hardware" | "digital";

type CameraZoomRange = {
  min: number;
  max: number;
  step: number;
};

export type DraggablePanelProps = {
  mobileHidden: boolean;
  onRequestCloseMobile?: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
  panelPos: { x: number; y: number };
  onPanelPointerMove: (e: React.PointerEvent) => void;
  onPanelPointerUp: (e: React.PointerEvent) => void;
  onPanelPointerDown: (e: React.PointerEvent) => void;
  measurementsPanelOpen: boolean;
  onToggleMeasurementsPanel: () => void;
  uploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setOpenImplantModal: React.Dispatch<React.SetStateAction<boolean>>;
  onAddShapeOverlay: (shape: "circle" | "square" | "triangle") => void;
  onAddImageOverlay: (file: File) => void;
  xrayContrast: number;
  setXrayContrast: React.Dispatch<React.SetStateAction<number>>;
  realMm: number;
  setRealMm: React.Dispatch<React.SetStateAction<number>>;
  pixelsPerMm: number | null;
  setPixelsPerMm: React.Dispatch<React.SetStateAction<number | null>>;
  xraySourceScale: number;
  xrayMagnificationFactor: number;
  setXrayMagnificationFactor: React.Dispatch<React.SetStateAction<number>>;
  applyCalibration: () => void;
  presetName: string;
  setPresetName: React.Dispatch<React.SetStateAction<string>>;
  calibrationPresets: CalibrationPreset[];
  onSavePreset: () => void;
  onLoadPresets: () => void;
  onApplyPreset: (preset: CalibrationPreset) => void;
  onRemovePreset: (id: string) => void;
  onExportReport: (format: "png" | "pdf") => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  canvasMode: CanvasMode;
  panMode: boolean;
  onTogglePanMode: () => void;
  onFitToScreen: () => void;
  onSetOneToOne: () => void;
  onResetView: () => void;
  onResetSession: () => void;
  cameraMode: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  isRecording: boolean;
  cameraFit: CameraFit;
  setCameraFit: React.Dispatch<React.SetStateAction<CameraFit>>;
  cameraZoom: number;
  setCameraZoom: React.Dispatch<React.SetStateAction<number>>;
  cameraZoomMode: CameraZoomMode;
  cameraZoomRange: CameraZoomRange;
  onToggleCamera: () => void;
  onRequestCamera: () => void;
  onSnapshot: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  syncScaleMode: boolean;
  startSyncScale: () => void;
  stopSyncScale: () => void;
  autoStartTour: boolean;
  onStartTour: () => void;
  shortcutsOpen: boolean;
  onToggleShortcuts: () => void;
};

export function DraggablePanel({
  mobileHidden,
  onRequestCloseMobile,
  panelRef,
  panelPos,
  onPanelPointerMove,
  onPanelPointerUp,
  onPanelPointerDown,
  measurementsPanelOpen,
  onToggleMeasurementsPanel,
  uploadBackground,
  setOpenImplantModal,
  onAddShapeOverlay,
  onAddImageOverlay,
  xrayContrast,
  setXrayContrast,
  realMm,
  setRealMm,
  pixelsPerMm,
  setPixelsPerMm,
  xraySourceScale,
  xrayMagnificationFactor,
  setXrayMagnificationFactor,
  applyCalibration,
  presetName,
  setPresetName,
  calibrationPresets,
  onSavePreset,
  onLoadPresets,
  onApplyPreset,
  onRemovePreset,
  onExportReport,
  zoom,
  setZoom,
  canvasMode,
  panMode,
  onTogglePanMode,
  onFitToScreen,
  onSetOneToOne,
  onResetView,
  onResetSession,
  cameraMode,
  cameraReady,
  cameraError,
  isRecording,
  cameraFit,
  setCameraFit,
  cameraZoom,
  setCameraZoom,
  cameraZoomMode,
  cameraZoomRange,
  onToggleCamera,
  onRequestCamera,
  onSnapshot,
  onStartRecording,
  onStopRecording,
  syncScaleMode,
  startSyncScale,
  stopSyncScale,
  autoStartTour,
  onStartTour,
  shortcutsOpen,
  onToggleShortcuts,
}: DraggablePanelProps) {
  const [dicomPixelSpacing, setDicomPixelSpacing] = useState("");
  const [canvasMmPerPxText, setCanvasMmPerPxText] = useState("");
  const [magnificationText, setMagnificationText] = useState("");
  const safeSourceScale = xraySourceScale > 0 ? xraySourceScale : 1;
  const parseLocaleNumber = (raw: string) => {
    const normalized = raw.trim().replace(",", ".");
    if (!normalized) return null;
    const next = Number(normalized);
    if (!Number.isFinite(next) || next <= 0) return null;
    return next;
  };
  const mmPerPixel =
    typeof pixelsPerMm === "number" && pixelsPerMm > 0 ? 1 / pixelsPerMm : null;
  useEffect(() => {
    if (typeof mmPerPixel === "number" && mmPerPixel > 0) {
      setCanvasMmPerPxText(mmPerPixel.toString());
      return;
    }
    setCanvasMmPerPxText("");
  }, [mmPerPixel]);
  const magnificationFactor =
    typeof xrayMagnificationFactor === "number" && xrayMagnificationFactor > 0
      ? xrayMagnificationFactor
      : 1;
  useEffect(() => {
    setMagnificationText(String(magnificationFactor));
  }, [magnificationFactor]);
  const effectiveMmPerPixel =
    typeof mmPerPixel === "number" && mmPerPixel > 0
      ? mmPerPixel / magnificationFactor
      : null;
  const clampZoomValue = (value: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  const clampCameraZoom = (value: number) =>
    Math.min(cameraZoomRange.max, Math.max(cameraZoomRange.min, value));
  const headerClass =
    "cursor-move max-md:cursor-default px-3 py-2 border-b border-gray-200/60 dark:border-neutral-800/70 flex items-center justify-between text-[11px] font-semibold text-gray-800 dark:text-gray-100";
  const contentClass =
    "p-2.5 space-y-2 text-[11px] max-h-[58svh] overflow-y-auto overscroll-contain touch-pan-y md:max-h-[calc(80svh-52px)] md:overflow-y-auto md:overscroll-contain md:space-y-3 md:text-xs max-md:h-[calc(70svh-52px)] max-md:max-h-[calc(70svh-52px)] max-md:overflow-y-auto max-md:overscroll-contain max-md:touch-pan-y max-md:pb-3";
  const groupClass =
    "rounded-lg border border-gray-200/50 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50 overflow-hidden";
  const groupHeaderClass =
    "w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-gray-800 dark:text-gray-100 bg-white/40 dark:bg-neutral-900/40 hover:bg-gray-50/70 dark:hover:bg-neutral-800/60 transition";
  const calibrationHeaderClass =
    "w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 dark:text-emerald-100 bg-emerald-50/70 dark:bg-emerald-950/35 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/45 transition";
  const groupContentClass = "px-2.5 pb-2.5 pt-2 space-y-2 md:space-y-3";
  const sectionClass =
    "rounded-lg border border-transparent bg-transparent p-2 space-y-2 md:border-gray-200/50 md:bg-white/70 md:dark:border-neutral-700/60 md:dark:bg-neutral-900/60";
  const labelClass =
    "text-[10px] font-semibold text-gray-700 dark:text-gray-200";
  const inputBase =
    "rounded-lg border border-gray-200/70 dark:border-neutral-700/70 bg-white/90 dark:bg-neutral-900/70 px-2 py-1 text-[10px] text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  const inputFull = `w-full ${inputBase}`;
  const inputCompact = `w-16 ${inputBase} px-1.5 py-1`;
  const rangeClass = "w-full accent-emerald-500";
  const primaryButton =
    "w-full rounded-lg bg-gray-900 text-white py-1 text-[10px] font-semibold hover:bg-black transition";
  const secondaryButton =
    "w-full rounded-lg border border-gray-200/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-900/60 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition";
  const toggleOn =
    "rounded-lg px-2 py-1 text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition";
  const toggleOff =
    "rounded-lg px-2 py-1 text-[10px] font-medium bg-gray-200/80 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300/80 dark:hover:bg-neutral-700 transition";
  const miniButton =
    "rounded-lg px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const chipBase = "rounded-md px-1 py-1 text-[9px] font-medium transition";
  const chipActive = "bg-emerald-600 text-white";
  const chipInactive = "bg-gray-100 text-gray-700 hover:bg-gray-200";
  const mutedText = "text-[9px] text-gray-400";
  const buildAccordionState = (openKey?: PanelSectionKey) => ({
    imaging: openKey === "imaging",
    calibration: openKey === "calibration",
    tools: openKey === "tools",
    overview: openKey === "overview",
  });
  const [panelCollapsed, setPanelCollapsed] = useState(() => !autoStartTour);
  const panelShellClass = `relative bg-white/92 dark:bg-neutral-900/92 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/60 dark:border-neutral-700/70 w-[82vw] max-w-[82vw] md:w-80 md:max-w-[100vw] max-h-[80svh] md:max-h-[80svh] overflow-hidden max-md:w-[78vw] max-md:max-w-[320px] max-md:rounded-2xl max-md:shadow-xl max-md:border-gray-200/60 max-md:overflow-hidden max-md:touch-pan-y ${
    panelCollapsed ? "max-md:h-auto" : "max-md:h-[82svh]"
  }`;
  const [openSections, setOpenSections] = useState<
    Record<PanelSectionKey, boolean>
  >(() => buildAccordionState("imaging"));
  const toggleSection = (key: PanelSectionKey) => {
    setOpenSections((prev) => {
      const nextOpen = !prev[key];
      if (!nextOpen) {
        return buildAccordionState();
      }
      return buildAccordionState(key);
    });
  };
  useEffect(() => {
    if (!openSections.calibration) return;
    onLoadPresets();
  }, [openSections.calibration, onLoadPresets]);
  const handleStartTour = () => {
    setPanelCollapsed(false);
    setOpenSections({
      imaging: true,
      calibration: true,
      tools: true,
      overview: true,
    });
    onStartTour();
  };

  const [isMobileViewport, setIsMobileViewport] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const showMobileBackdrop = isMobileViewport && !mobileHidden && !panelCollapsed;
  const requestClose = onRequestCloseMobile ?? (() => setPanelCollapsed(true));

  return (
    <>
      {showMobileBackdrop ? (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          onClick={requestClose}
          aria-label="Close X-ray control"
        />
      ) : null}

      <motion.div
        ref={panelRef}
        className={`fixed z-40 select-none touch-auto md:touch-none max-md:touch-pan-y max-md:!left-auto max-md:!right-3 max-md:!top-[calc(env(safe-area-inset-top)+54px)] max-md:!bottom-auto max-md:!translate-x-0 max-md:!translate-y-0 ${
          mobileHidden ? "max-md:hidden" : ""
        }`}
        data-tour="panel"
        style={isMobileViewport ? undefined : { left: panelPos.x, top: panelPos.y }}
        onPointerMove={isMobileViewport ? undefined : onPanelPointerMove}
        onPointerUp={isMobileViewport ? undefined : onPanelPointerUp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
      <div className={panelShellClass}>
        <div
          className={`${headerClass} touch-none`}
          onPointerDown={isMobileViewport ? undefined : onPanelPointerDown}
        >
          <div className="flex items-center gap-2">
            <span>X-ray Control</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartTour();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-7 w-7 rounded-lg border border-emerald-300/70 bg-emerald-50 text-[14px] font-semibold text-emerald-600 hover:bg-emerald-100"
              aria-label="Start guide"
              title="Start guide"
            >
              ?
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleShortcuts();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-pressed={shortcutsOpen}
              className={`h-7 w-7 rounded-lg border text-gray-600 transition ${
                shortcutsOpen
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-600"
                  : "border-gray-200/70 bg-white/80 hover:bg-gray-100"
              }`}
              aria-label="Toggle shortcuts"
              title="Shortcuts (Shift+/)"
            >
              <Keyboard className="h-3 w-3 ml-[7px] md:ml-[7px]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMeasurementsPanel();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-pressed={measurementsPanelOpen}
              className={`h-7 w-7 rounded-lg border text-gray-600 transition ${
                measurementsPanelOpen
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-600"
                  : "border-gray-200/70 bg-white/80 hover:bg-gray-100"
              }`}
              aria-label="Toggle measurements panel"
              title="Measurements"
            >
              <List className="h-3 w-3 ml-1.5 md:ml-1.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPanelCollapsed((prev) => !prev);
              }}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={panelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <ChevronDown
                className={`h-4 w-4 transition ${
                  panelCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>
            {isMobileViewport ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  requestClose();
                }}
                className="rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close panel"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <span className="text-gray-400">
                <Grab />
              </span>
            )}
          </div>
        </div>

        <div
          className={`${contentClass} ${panelCollapsed ? "max-md:hidden" : ""} ${
            isMobileViewport && panelCollapsed ? "max-md:hidden" : ""
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("imaging")}
              aria-expanded={openSections.imaging}
            >
              <span className="inline-flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Imaging
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.imaging ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.imaging && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass} data-tour="xray-upload">
                    <label className={labelClass}>X-ray Background</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadBackground}
                      className={`${inputFull} file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-gray-600 dark:file:bg-neutral-800 dark:file:text-gray-300`}
                    />
                    <button
                      onClick={() => setOpenImplantModal(true)}
                      className={primaryButton}
                    >
                      + Add Template
                    </button>
                  </div>

                  <div className={sectionClass} data-tour="xray-zoom">
                    <label className={labelClass}>X-ray Contrast</label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={xrayContrast}
                      onChange={(e) => setXrayContrast(Number(e.target.value))}
                      className={rangeClass}
                    />

                    <div className="pt-1">
                      <label className={labelClass}>Zoom</label>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoom(clampZoomValue(zoom - 0.1))}
                          className={miniButton}
                          aria-label="Zoom out"
                          title="Zoom out"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="range"
                          min={ZOOM_MIN}
                          max={ZOOM_MAX}
                          step={ZOOM_STEP}
                          value={zoom}
                          onChange={(e) =>
                            setZoom(clampZoomValue(Number(e.target.value)))
                          }
                          className={rangeClass}
                        />
                        <div className="min-w-12 text-right text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                          {Math.round(zoom * 100)}%
                        </div>
                        <button
                          type="button"
                          onClick={() => setZoom(clampZoomValue(zoom + 0.1))}
                          className={miniButton}
                          aria-label="Zoom in"
                          title="Zoom in"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className={labelClass}>View</label>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        <button
                          type="button"
                          onClick={onTogglePanMode}
                          className={`${chipBase} ${
                            panMode ? chipActive : chipInactive
                          }`}
                          aria-label={panMode ? "Pan mode on" : "Pan mode off"}
                          title={panMode ? "Pan mode on" : "Pan mode off"}
                        >
                          <Hand className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={onFitToScreen}
                          className={`${chipBase} ${
                            canvasMode === "fit" ? chipActive : chipInactive
                          }`}
                          aria-label="Fit to screen"
                          title="Fit to screen"
                        >
                          <Maximize2 className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={onSetOneToOne}
                          className={`${chipBase} ${
                            canvasMode === "oneToOne" ? chipActive : chipInactive
                          }`}
                          aria-label="1:1"
                          title="1:1"
                        >
                          <Square className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={onResetView}
                          className={chipInactive}
                          aria-label="Reset view"
                          title="Reset view"
                        >
                          <RefreshCcw className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 md:hidden">
                      <label className={labelClass}>Camera Mode</label>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={onToggleCamera}
                          className={`${cameraMode ? toggleOn : toggleOff} flex-1`}
                        >
                          {cameraMode ? "Camera: ON" : "Camera: OFF"}
                        </button>
                        <button
                          type="button"
                          onClick={onSnapshot}
                          disabled={!cameraMode || !cameraReady}
                          className={miniButton}
                        >
                          Snapshot
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={isRecording ? onStopRecording : onStartRecording}
                          disabled={!cameraMode || !cameraReady}
                          className={`${isRecording ? toggleOn : toggleOff} flex-1`}
                        >
                          {isRecording ? "Stop Record" : "Record"}
                        </button>
                        {cameraError ? (
                          <span className={mutedText}>{cameraError}</span>
                        ) : null}
                      </div>
                      {cameraMode && (
                        <div className="mt-2 rounded-lg border border-gray-200/60 bg-white/60 p-2 dark:border-neutral-700/60 dark:bg-neutral-900/50">
                          <div className="flex items-center justify-between">
                            <label className={labelClass}>Camera Zoom</label>
                            <span className={mutedText}>
                              {cameraZoomMode === "hardware" ? "Optical" : "Digital"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCameraZoom((prev) =>
                                  clampCameraZoom(
                                    Number((prev - cameraZoomRange.step).toFixed(2))
                                  )
                                )
                              }
                              disabled={!cameraReady}
                              className={miniButton}
                              aria-label="Camera zoom out"
                              title="Camera zoom out"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="range"
                              min={cameraZoomRange.min}
                              max={cameraZoomRange.max}
                              step={cameraZoomRange.step}
                              value={cameraZoom}
                              onChange={(e) =>
                                setCameraZoom(clampCameraZoom(Number(e.target.value)))
                              }
                              disabled={!cameraReady}
                              className={`${rangeClass} ${!cameraReady ? "opacity-60" : ""}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCameraZoom((prev) =>
                                  clampCameraZoom(
                                    Number((prev + cameraZoomRange.step).toFixed(2))
                                  )
                                )
                              }
                              disabled={!cameraReady}
                              className={miniButton}
                              aria-label="Camera zoom in"
                              title="Camera zoom in"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCameraZoom(1);
                                setCameraFit("contain");
                              }}
                              disabled={!cameraReady}
                              className={`${chipBase} ${
                                cameraFit === "contain" ? chipActive : chipInactive
                              }`}
                              title="Normal (fit)"
                            >
                              Normal
                            </button>
                            <button
                              type="button"
                              onClick={() => setCameraFit("cover")}
                              disabled={!cameraReady}
                              className={`${chipBase} ${
                                cameraFit === "cover" ? chipActive : chipInactive
                              }`}
                              title="Fill (cover)"
                            >
                              Fill
                            </button>
                          </div>
                        </div>
                      )}
                      {cameraMode && !cameraReady && (
                        <div className="mt-2 rounded-lg border border-amber-200/60 bg-amber-50/70 px-2 py-2 text-[10px] text-amber-700">
                          Izinkan akses kamera di browser. Jika prompt tidak muncul,
                          klik tombol di bawah ini untuk mencoba lagi.
                          <button
                            type="button"
                            onClick={onRequestCamera}
                            className="mt-2 w-full rounded-md bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-600"
                          >
                            Minta Izin Kamera
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={groupClass}>
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("tools")}
              aria-expanded={openSections.tools}
            >
              <span className="inline-flex items-center gap-2">
                <Square className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Overlays & Notes
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.tools ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.tools && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass}>
                    <label className={labelClass}>Overlays</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onAddShapeOverlay("circle")}
                        className={`${chipBase} ${chipInactive} w-full`}
                      >
                        Circle
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddShapeOverlay("square")}
                        className={`${chipBase} ${chipInactive} w-full`}
                      >
                        Square
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddShapeOverlay("triangle")}
                        className={`${chipBase} ${chipInactive} w-full`}
                      >
                        Triangle
                      </button>
                    </div>
                    <div className="mt-2">
                      <label className={labelClass}>Image Overlay</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onAddImageOverlay(file);
                          e.currentTarget.value = "";
                        }}
                        className={`${inputFull} file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-gray-600 dark:file:bg-neutral-800 dark:file:text-gray-300`}
                      />
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={groupClass} data-tour="calibration">
            <button
              type="button"
              className={calibrationHeaderClass}
              onClick={() => toggleSection("calibration")}
              aria-expanded={openSections.calibration}
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                Calibration
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.calibration ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.calibration && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass}>
                    <label className={labelClass}>Marker Length (mm)</label>
                    <input
                      type="number"
                      value={realMm}
                      onChange={(e) => setRealMm(Number(e.target.value))}
                      className={inputFull}
                    />
                    <label className={`${labelClass} mt-2`}>
                      Canvas Resolution (mm/px)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 0.143"
                      value={canvasMmPerPxText}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCanvasMmPerPxText(raw);
                        const next = parseLocaleNumber(raw);
                        if (next) setPixelsPerMm(1 / next);
                      }}
                      onBlur={() => {
                        const next = parseLocaleNumber(canvasMmPerPxText);
                        if (next) {
                          setPixelsPerMm(1 / next);
                          setCanvasMmPerPxText(next.toString());
                        } else {
                          setCanvasMmPerPxText(
                            typeof mmPerPixel === "number" && mmPerPixel > 0
                              ? mmPerPixel.toString()
                              : ""
                          );
                        }
                      }}
                      className={inputFull}
                    />
                    <div className={mutedText}>
                      Effective:{" "}
                      {effectiveMmPerPixel
                        ? `${effectiveMmPerPixel.toFixed(4)} mm/px`
                        : "—"}{" "}
                      (factor {magnificationFactor.toFixed(3)})
                    </div>
                    <div className="mt-2 space-y-1">
                      <label className={labelClass}>
                        DICOM PixelSpacing (mm/px)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 0.143"
                        value={dicomPixelSpacing}
                        onChange={(e) => setDicomPixelSpacing(e.target.value)}
                        className={inputFull}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = parseLocaleNumber(dicomPixelSpacing);
                          if (!next) return;
                          const mmPerPxCanvas = next / safeSourceScale;
                          setPixelsPerMm(1 / mmPerPxCanvas);
                          setCanvasMmPerPxText(mmPerPxCanvas.toString());
                        }}
                        className={secondaryButton}
                      >
                        Apply DICOM PixelSpacing
                      </button>
                      <div className={mutedText}>
                        Resize factor: {safeSourceScale.toFixed(3)} (DICOM value ÷ factor)
                      </div>
                    </div>
                    <label className={`${labelClass} mt-2`}>
                      X-ray Zoom/Magnification Factor
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 1.0"
                      value={magnificationText}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setMagnificationText(raw);
                        const next = parseLocaleNumber(raw);
                        if (next) setXrayMagnificationFactor(next);
                      }}
                      onBlur={() => {
                        const next = parseLocaleNumber(magnificationText);
                        if (next) {
                          setXrayMagnificationFactor(next);
                          setMagnificationText(String(next));
                        } else {
                          setMagnificationText(String(magnificationFactor));
                        }
                      }}
                      className={inputFull}
                    />
                    <button onClick={applyCalibration} className={secondaryButton}>
                      Apply Calibration
                    </button>
                    <button
                      type="button"
                      onClick={syncScaleMode ? stopSyncScale : startSyncScale}
                      className={`${syncScaleMode ? toggleOn : toggleOff} w-full`}
                    >
                      {syncScaleMode ? "Sync Scale: ON" : "Sync X-ray Scale"}
                    </button>
                    <div className={mutedText}>
                      Click 2 points on {realMm} mm scale bar.
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Calibration Presets</label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name"
                      className={inputFull}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onSavePreset}
                        className={secondaryButton}
                      >
                        Save Preset
                      </button>
                      <button type="button" onClick={onLoadPresets} className={miniButton}>
                        Load
                      </button>
                    </div>
                    <div className="mt-2 space-y-1 max-h-[96px] overflow-y-auto pr-1">
                      {calibrationPresets.length ? (
                        calibrationPresets.map((preset) => (
                          <div
                            key={preset.id}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <button
                              type="button"
                              onClick={() => onApplyPreset(preset)}
                              className="flex-1 truncate text-left text-gray-700 hover:text-emerald-600"
                              title={preset.name}
                            >
                              {preset.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemovePreset(preset.id)}
                              className="text-gray-400 hover:text-red-500"
                              aria-label="Remove preset"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className={mutedText}>No presets yet.</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={groupClass} data-tour="annotations">
            <button
              type="button"
              className={groupHeaderClass}
              onClick={() => toggleSection("overview")}
              aria-expanded={openSections.overview}
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                Overview
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${
                  openSections.overview ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.overview && (
                <motion.div
                  variants={collapseVariants}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  className={`${groupContentClass} overflow-hidden`}
                >
                  <div className={sectionClass}>
                    <label className={labelClass}>Export Report</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onExportReport("png")}
                        className={secondaryButton}
                      >
                        Export PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportReport("pdf")}
                        className={miniButton}
                      >
                        Export PDF
                      </button>
                    </div>
                    <div className={mutedText}>
                      PDF akan terbuka di tab baru (print to PDF).
                    </div>
                  </div>
                  <div className={sectionClass}>
                    <label className={labelClass}>Reset Session</label>
                    <button
                      type="button"
                      onClick={onResetSession}
                      className="w-full rounded-lg bg-red-600 text-white py-1 text-[10px] font-semibold hover:bg-red-700 transition"
                    >
                      Reset Semua Data
                    </button>
                    <div className={mutedText}>
                      Menghapus background, overlay, measurement, dan pengaturan sesi.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}
