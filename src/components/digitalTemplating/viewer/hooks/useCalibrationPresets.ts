"use client";

import { useCallback, useState } from "react";
import { CALIBRATION_STORAGE_KEY } from "@/components/digitalTemplating/viewer/constants";
import type { CalibrationPreset } from "@/components/digitalTemplating/viewer/types";
import { createId } from "@/components/digitalTemplating/viewer/utils";

type ToastFn = (args: { title: string; description?: string }) => void;

export function useCalibrationPresets({
  realMm,
  setRealMm,
  pixelsPerMm,
  setPixelsPerMm,
  useRealScale,
  setUseRealScale,
  toast,
}: {
  realMm: number;
  setRealMm: React.Dispatch<React.SetStateAction<number>>;
  pixelsPerMm: number | null;
  setPixelsPerMm: React.Dispatch<React.SetStateAction<number | null>>;
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
        parsed
          .map((preset: any) => {
            if (preset && typeof preset.pixelsPerMm === "number") return preset as CalibrationPreset;
            if (preset && typeof preset.mmPerPixel === "number") {
              const mmPerPixel = preset.mmPerPixel as number;
              if (!Number.isFinite(mmPerPixel) || mmPerPixel <= 0) return null;
              return {
                ...preset,
                pixelsPerMm: 1 / mmPerPixel,
              } as CalibrationPreset;
            }
            return null;
          })
          .filter((preset): preset is CalibrationPreset => Boolean(preset?.pixelsPerMm))
      );
    } catch {
      setCalibrationPresets([]);
    }
  }, []);

  const saveCalibrationPreset = useCallback(() => {
    if (!pixelsPerMm) {
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
      pixelsPerMm,
      useRealScale,
      createdAt: Date.now(),
    };
    setCalibrationPresets((prev) => {
      const next = [...prev, preset];
      persistCalibrationPresets(next);
      return next;
    });
    setPresetName("");
  }, [pixelsPerMm, presetName, realMm, useRealScale, persistCalibrationPresets, toast]);

  const applyCalibrationPreset = useCallback(
    (preset: CalibrationPreset) => {
      setRealMm(preset.realMm);
      setPixelsPerMm(preset.pixelsPerMm);
      setUseRealScale(preset.useRealScale);
    },
    [setPixelsPerMm, setRealMm, setUseRealScale]
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
