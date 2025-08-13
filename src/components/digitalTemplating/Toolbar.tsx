// src/components/PACS/Toolbar.tsx
import React, { useRef } from 'react';
import { 
  Plus, Minus, RotateCw, FlipHorizontal, FlipVertical,
   Sun, Ruler, Square, Type, PenTool, Trash2,
  Grab,
  Delete,
  Folder
} from 'lucide-react';
import { motion } from 'framer-motion'; 

import type { CalibrationPresetKey } from '@/components/digitalTemplating/ImageCanvas'; 

// Define a type for the calibration presets object structure
interface CalibrationPreset {
  x: number;
  y: number;
  widthPx: number;
  realWorldMm: number;
}

// Define the type for the calibrationPresets object itself
interface CalibrationPresetsMap {
  [key: string]: CalibrationPreset;
}

interface ToolbarProps {
  onFilesSelected: (files: FileList | null) => void;
  onReset: () => void;
  onToolSelect: (tool: string | null) => void; 
  activeTool: string | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateCW: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onClearMeasurements: () => void;
  className?: string;
  
  // New props for calibration, using the defined types
  calibrationPresets: CalibrationPresetsMap;
  selectedCalibrationPreset: CalibrationPresetKey; // Using the specific type
  onCalibrationSelect: (presetName: CalibrationPresetKey) => void; // Using the specific type

  // PROPS BARU UNTUK PEMBESARAN
  enlargementFactor: number;
  onEnlargementChange: (factor: number) => void;
}

// Varian animasi untuk kontainer toolbar (fade in dari kiri)
const toolbarVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5, 
      when: "beforeChildren", 
      staggerChildren: 0.05 
    }
  },
};

// Varian animasi untuk setiap tombol (skala saat hover, press saat tap)
const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.1 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

const Toolbar: React.FC<ToolbarProps> = ({ 
  onFilesSelected, onReset, onToolSelect, activeTool, 
  onZoomIn, onZoomOut, onRotateCW, onFlipH, onFlipV,
  onClearMeasurements, className,
  calibrationPresets, selectedCalibrationPreset, onCalibrationSelect,
  enlargementFactor, onEnlargementChange // PROPS BARU
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonClass = (tool: string | null) => 
    `px-2 py-3 shadow-lg rounded-lg transition-colors text-gray-200 
     ${activeTool === tool ? 'bg-blue-600 shadow-inner' : 'hover:bg-gray-700'}`; 

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={toolbarVariants}
      className={`flex flex-col items-center gap-1 p-3 bg-gray-800 rounded-xl shadow-2xl ${className || ''}`}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => onFilesSelected(e.target.files)}
        className="hidden"
      />
      <motion.button
        onClick={handleUploadClick}
        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-lg shadow-sm w-full"
        title="Upload Gambar"
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
      >
        <Folder className="w-5 h-5 mx-auto" />
      </motion.button>

      <div className="w-full h-px bg-gray-700 my-2"></div> {/* Pembatas */}

      {/* Kontrol Gambar Dasar */}
      <motion.button onClick={onZoomIn} className="py-3 px-2 mb-2 hover:bg-gray-700 text-gray-200 rounded-lg shadow-lg transition-colors w-full" title="Zoom In"
        whileHover="hover" whileTap="tap" variants={buttonVariants}>
        <Plus className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button onClick={onZoomOut} className="py-3 px-2 mb-2 hover:bg-gray-700 text-gray-200 rounded-lg shadow-lg transition-colors w-full" title="Zoom Out"
        whileHover="hover" whileTap="tap" variants={buttonVariants}>
        <Minus className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button onClick={onRotateCW} className="py-3 px-2 mb-2 hover:bg-gray-700 text-gray-200 rounded-lg shadow-lg transition-colors w-full" title="Putar Searah Jarum Jam"
        whileHover="hover" whileTap="tap" variants={buttonVariants}>
        <RotateCw className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button onClick={onFlipH} className="py-3 px-2 mb-2 hover:bg-gray-700 text-gray-200 rounded-lg shadow-lg transition-colors w-full" title="Balik Horizontal"
        whileHover="hover" whileTap="tap" variants={buttonVariants}>
        <FlipHorizontal className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button onClick={onFlipV} className="py-3 px-2 mb-2 hover:bg-gray-700 text-gray-200 rounded-lg shadow-lg transition-colors w-full" title="Balik Vertikal"
        whileHover="hover" whileTap="tap" variants={buttonVariants}>
        <FlipVertical className="w-5 h-5 mx-auto" />
      </motion.button>

      <div className="w-full h-px bg-gray-700 my-2"></div> {/* Pembatas */}

      {/* Tool Selection */}
      <motion.button 
        onClick={() => onToolSelect('pan')} 
        className={`${getButtonClass('pan')} w-full`}
        title="Pan (Geser Gambar)"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Grab className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button 
        onClick={() => onToolSelect('windowLevel')} 
        className={`${getButtonClass('windowLevel')} w-full`}
        title="Window/Level (Atur Kecerahan/Kontras)"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Sun className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button 
        onClick={() => onToolSelect('lineMeasurement')} 
        className={`${getButtonClass('lineMeasurement')} w-full`}
        title="Pengukuran Garis (Jarak)"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Ruler className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button 
        onClick={() => onToolSelect('angleMeasurement')} 
        className={`${getButtonClass('angleMeasurement')} w-full`}
        title="Pengukuran Sudut"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <PenTool className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button 
        onClick={() => onToolSelect('areaMeasurement')} 
        className={`${getButtonClass('areaMeasurement')} w-full`}
        title="Pengukuran Area"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Square className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button 
        onClick={() => onToolSelect('annotation')} 
        className={`${getButtonClass('annotation')} w-full`}
        title="Anotasi Teks"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Type className="w-5 h-5 mx-auto" />
      </motion.button>

      <div className="w-full h-px bg-gray-700 my-2"></div> {/* Pembatas */}

      {/* Calibration Scale Selection */}
      <motion.label htmlFor="calibration-select" className="text-gray-200 text-xs mt-2 mb-1"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>Skala</motion.label>
      <motion.select
        id="calibration-select"
        value={selectedCalibrationPreset}
        onChange={(e) => onCalibrationSelect(e.target.value as CalibrationPresetKey)}
        className="w-full p-1 bg-gray-700 text-white text-xs rounded mb-2"
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      >
        {Object.keys(calibrationPresets).map(key => (
          <option key={key} value={key}>
            {key === 'auto' ? 'Auto (dari Gambar)' : `${key.replace('_ruler', '').toUpperCase()} Ruler`}
          </option>
        ))}
      </motion.select>

      {/* INPUT BARU UNTUK FAKTOR PEMBESARAN */}
      <motion.label htmlFor="enlargement-factor" className="text-gray-200 text-xs mt-2 mb-1 flex items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>Enlargement</motion.label>
      <motion.input
          type="number"
          id="enlargement-factor"
          value={Math.round((enlargementFactor - 1) * 100)} // Konversi dari faktor (1.20) ke persentase (20)
          onChange={(e) => onEnlargementChange(1 + parseFloat(e.target.value || '0') / 100)}
          className="w-[110%] p-1 bg-gray-700 text-white text-xs rounded mb-2 text-center"
          min="0"
          step="1"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      />


      {/* Tombol Reset */}
      <motion.button
        onClick={onReset}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs mb-2 shadow-md w-full"
        title="Reset Tampilan"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Delete className="w-5 h-5 mx-auto" />
      </motion.button>
      <motion.button
        onClick={onClearMeasurements}
        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md shadow-sm w-full"
        title="Hapus Semua Pengukuran/Anotasi"
        whileHover="hover" whileTap="tap" variants={buttonVariants}
      >
        <Trash2 className="w-5 h-5 mx-auto" />
      </motion.button>
    </motion.div>
  );
};

export default Toolbar;
