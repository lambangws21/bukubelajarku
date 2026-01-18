"use client";

import { useCallback, useState } from "react";
import { CALIBRATION_STORAGE_KEY } from "@/components/digitalTemplating/viewer/constants";
import type { CalibrationPreset } from "@/components/digitalTemplating/viewer/types";
import { createId } from "@/components/digitalTemplating/viewer/utils";

type ToastFn = (args: { title: string; description?: string }) => void;

export function useCalibrationPresets({
  realMm,
  setRealMm,
  mmPerPixel,
  setMmPerPixel,
  useRealScale,
  setUseRealScale,
  toast,
}: {
  realMm: number;
  setRealMm: React.Dispatch<React.SetStateAction<number>>;
  mmPerPixel: number | null;
  setMmPerPixel: React.Dispatch<React.SetStateAction<number | null>>;
  useRealScale: boolean;
  setUseRealScale: React.Dispatch<React.SetStateAction<boolean>>;
  toast: ToastFn;
}) {
  const [presetName, setPresetName] = useState("");
  const [calibrationPresets, setCalibrationPresets] = useState<
    CalibrationPreset[]
  >([]);

  const persistCalibrationPresets = useCallback((next: CalibrationPreset[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const loadCalibrationPresets = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!raw) {
      setCalibrationPresets([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CalibrationPreset[];
      if (!Array.isArray(parsed)) {
        setCalibrationPresets([]);
        return;
      }
      setCalibrationPresets(
        parsed.filter((preset) => typeof preset?.mmPerPixel === "number")
      );
    } catch {
      setCalibrationPresets([]);
    }
  }, []);

  const saveCalibrationPreset = useCallback(() => {
    if (!mmPerPixel) {
      toast({
        title: "Kalibrasi belum ada",
        description: "Lakukan kalibrasi dulu sebelum menyimpan preset.",
      });
      return;
    }
    const name =
      presetName.trim() || `Preset ${new Date().toLocaleString("id-ID")}`;
    const preset: CalibrationPreset = {
      id: createId(),
      name,
      realMm,
      mmPerPixel,
      useRealScale,
      createdAt: Date.now(),
    };
    setCalibrationPresets((prev) => {
      const next = [...prev, preset];
      persistCalibrationPresets(next);
      return next;
    });
    setPresetName("");
  }, [mmPerPixel, presetName, realMm, useRealScale, persistCalibrationPresets, toast]);

  const applyCalibrationPreset = useCallback(
    (preset: CalibrationPreset) => {
      setRealMm(preset.realMm);
      setMmPerPixel(preset.mmPerPixel);
      setUseRealScale(preset.useRealScale);
    },
    [setMmPerPixel, setRealMm, setUseRealScale]
  );

  const removeCalibrationPreset = useCallback(
    (id: string) => {
      setCalibrationPresets((prev) => {
        const next = prev.filter((preset) => preset.id !== id);
        persistCalibrationPresets(next);
        return next;
      });
    },
    [persistCalibrationPresets]
  );

  return {
    presetName,
    setPresetName,
    calibrationPresets,
    loadCalibrationPresets,
    saveCalibrationPreset,
    applyCalibrationPreset,
    removeCalibrationPreset,
  };
}

