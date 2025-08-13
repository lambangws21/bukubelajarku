// src/components/PACS/Toolbar.tsx
"use client";

import React, { useRef } from "react";
import {
  ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, MousePointer2,
  Hand, Ruler, Type, Shapes, Eraser, RefreshCw, FolderOpen, Scaling
} from "lucide-react";

export const TOOLS = {
  PAN: 'pan',
  LINE: 'lineMeasurement',
  ANGLE: 'angle',
  WINDOW_LEVEL: 'windowLevel',
  AREA: 'area',
  ANNOTATION: 'annotation',
} as const;

export type Tool = typeof TOOLS[keyof typeof TOOLS];
export type CalibrationPresetKey = 'auto' | '1cm_ruler' | '2cm_ruler' | '5cm_ruler' | '10cm_ruler';

export interface CalibrationPreset {
  widthPx: number;
  realWorldMm: number;
  name: string;
}

interface ToolbarProps {
  onFilesSelected: (files: FileList | null) => void;
  onReset: () => void;
  onToolSelect: (tool: Tool | null) => void;
  activeTool: Tool | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateCW: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onClearMeasurements: () => void;
  calibrationPresets: Record<string, CalibrationPreset>;
  selectedCalibrationPreset: CalibrationPresetKey;
  onCalibrationSelect: (presetName: CalibrationPresetKey) => void;
  enlargementFactor: number;
  onEnlargementChange: (factor: number) => void;
  className?: string;
}

const ToolbarButton: React.FC<{
  label: string;
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, isActive = false, children }) => (
  <button
    onClick={onClick}
    title={label}
    className={`group relative flex justify-center items-center w-12 h-12 rounded-lg transition-colors duration-150 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
  >
    {children}
    <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {label}
    </span>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  onFilesSelected, onReset, onToolSelect, activeTool,
  onZoomIn, onZoomOut, onRotateCW, onFlipH, onFlipV, onClearMeasurements,
  calibrationPresets, selectedCalibrationPreset, onCalibrationSelect,
  enlargementFactor, onEnlargementChange, className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelectClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const formatPresetName = (name: string) => name === 'auto' ? 'Auto Detect' : name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className={className}>
      <nav className="flex flex-col items-center gap-y-4 p-2 bg-gray-800 rounded-lg">
        <div className="flex flex-col items-center gap-y-2">
          <ToolbarButton label="Buka File" onClick={handleFileSelectClick}><FolderOpen size={24} /></ToolbarButton>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple accept="image/jpeg,image/png,image/dicom,.dcm" />
          <ToolbarButton label="Reset Tampilan" onClick={onReset}><RefreshCw size={24} /></ToolbarButton>
        </div>
        <hr className="w-full border-t border-gray-600" />
        <div className="flex flex-col items-center gap-y-2">
          <ToolbarButton label="Pan / Geser" onClick={() => onToolSelect(TOOLS.PAN)} isActive={activeTool === TOOLS.PAN}><Hand size={24} /></ToolbarButton>
          <ToolbarButton label="Zoom In" onClick={onZoomIn}><ZoomIn size={24} /></ToolbarButton>
          <ToolbarButton label="Zoom Out" onClick={onZoomOut}><ZoomOut size={24} /></ToolbarButton>
          <ToolbarButton label="Window Level" onClick={() => onToolSelect(TOOLS.WINDOW_LEVEL)} isActive={activeTool === TOOLS.WINDOW_LEVEL}><MousePointer2 size={24} /></ToolbarButton>
        </div>
        <hr className="w-full border-t border-gray-600" />
        <div className="flex flex-col items-center gap-y-2">
          <ToolbarButton label="Ukur Jarak" onClick={() => onToolSelect(TOOLS.LINE)} isActive={activeTool === TOOLS.LINE}><Ruler size={24} /></ToolbarButton>
          <ToolbarButton label="Ukur Sudut" onClick={() => onToolSelect(TOOLS.ANGLE)} isActive={activeTool === TOOLS.ANGLE}><Scaling size={24} /></ToolbarButton>
          <ToolbarButton label="Ukur Area" onClick={() => onToolSelect(TOOLS.AREA)} isActive={activeTool === TOOLS.AREA}><Shapes size={24} /></ToolbarButton>
          <ToolbarButton label="Anotasi Teks" onClick={() => onToolSelect(TOOLS.ANNOTATION)} isActive={activeTool === TOOLS.ANNOTATION}><Type size={24} /></ToolbarButton>
          <ToolbarButton label="Hapus Pengukuran" onClick={onClearMeasurements}><Eraser size={24} /></ToolbarButton>
        </div>
        <hr className="w-full border-t border-gray-600" />
        <div className="flex flex-col items-center gap-y-2">
          <ToolbarButton label="Putar 90°" onClick={onRotateCW}><RotateCw size={24} /></ToolbarButton>
          <ToolbarButton label="Flip Horizontal" onClick={onFlipH}><FlipHorizontal size={24} /></ToolbarButton>
          <ToolbarButton label="Flip Vertikal" onClick={onFlipV}><FlipVertical size={24} /></ToolbarButton>
        </div>
        <hr className="w-full border-t border-gray-600" />
        <div className="flex flex-col items-center gap-y-3 w-full px-1 text-xs text-gray-300">
          <label htmlFor="calibration-select" className="w-full text-center">Kalibrasi</label>
          <select id="calibration-select" value={selectedCalibrationPreset} onChange={(e) => onCalibrationSelect(e.target.value as CalibrationPresetKey)} className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-white text-xs">
            {Object.keys(calibrationPresets).map(key => <option key={key} value={key}>{formatPresetName(calibrationPresets[key].name)}</option>)}
          </select>
          <label htmlFor="enlargement-factor" className="w-full text-center mt-2">Faktor Pembesaran</label>
          <input id="enlargement-factor" type="number" value={enlargementFactor} onChange={(e) => onEnlargementChange(parseFloat(e.target.value) || 1)} min={0.1} step={0.1} className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-white text-center" />
        </div>
      </nav>
    </div>
  );
};

export default Toolbar;
