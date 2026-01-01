"use client";

import { useSmartHip } from "./useSmartHip";

type Props = {
  hip: ReturnType<typeof useSmartHip>;
};

export function SmartHipSidebar({ hip }: Props) {
  return (
    <div className="w-[320px] p-4 border-l border-zinc-800 space-y-4">
      <h2 className="text-lg font-semibold">SmartHip</h2>

      {/* ================= UPLOAD XRAY ================= */}
      <label className="block">
        <input
          type="file"
          accept="image/*"
          onChange={e =>
            e.target.files && hip.loadXray(e.target.files[0])
          }
          className="hidden"
        />
        <div className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-center py-2 rounded">
          Upload X-ray
        </div>
      </label>

      {/* ================= UNDO / REDO ================= */}
      <div className="flex gap-2">
        <button
          onClick={hip.undo}
          className="flex-1 bg-zinc-600 hover:bg-zinc-500 py-2 rounded"
        >
          Undo
        </button>

        <button
          onClick={hip.redo}
          className="flex-1 bg-zinc-600 hover:bg-zinc-500 py-2 rounded"
        >
          Redo
        </button>
      </div>

      {/* ================= FEMORAL AXIS ================= */}
      <button
        onClick={() =>
          hip.setFemoralAxis(
            { x: 450, y: 100 },
            { x: 450, y: 800 }
          )
        }
        className="w-full bg-yellow-500 text-black py-2 rounded"
      >
        Set Femoral Axis
      </button>

      {/* ================= MEASUREMENTS ================= */}
      <button
        onClick={() =>
          hip.addMeasurement(
            "HEAD",
            { x: 520, y: 240 },
            { x: 620, y: 240 }
          )
        }
        className="w-full bg-sky-600 py-2 rounded"
      >
        Femoral Head
      </button>

      <button
        onClick={() =>
          hip.addMeasurement(
            "OFFSET",
            { x: 520, y: 240 },
            { x: 450, y: 350 }
          )
        }
        className="w-full bg-amber-500 py-2 rounded"
      >
        Femoral Offset
      </button>

      <button
        onClick={() =>
          hip.addMeasurement(
            "CANAL_PROX",
            { x: 470, y: 420 },
            { x: 520, y: 420 }
          )
        }
        className="w-full bg-emerald-600 py-2 rounded"
      >
        Proximal Canal
      </button>

      <button
        onClick={() =>
          hip.addMeasurement(
            "CANAL_DIST",
            { x: 480, y: 650 },
            { x: 510, y: 650 }
          )
        }
        className="w-full bg-green-700 py-2 rounded"
      >
        Distal Canal
      </button>

      {/* ================= CUP PLANNING ================= */}
<div className="pt-4 border-t border-zinc-700 space-y-2">
  <h3 className="font-semibold">Cup Planning</h3>

  <button
    onClick={() =>
      hip.initCupPlan({ x: 550, y: 350 })
    }
    className="w-full bg-rose-600 py-2 rounded"
  >
    Set Cup COR
  </button>

  {hip.cupPlan && (
    <>
      <label className="text-xs">Cup Size (mm)</label>
      <input
        type="range"
        min={44}
        max={64}
        step={2}
        value={hip.cupPlan.sizeMm}
        onChange={e =>
          hip.setCupPlan({
            ...hip.cupPlan!,
            sizeMm: Number(e.target.value),
          })
        }
      />

      <label className="text-xs">Inclination (°)</label>
      <input
        type="range"
        min={30}
        max={60}
        value={hip.cupPlan.inclinationDeg}
        onChange={e =>
          hip.setCupPlan({
            ...hip.cupPlan!,
            inclinationDeg: Number(e.target.value),
          })
        }
      />

      <label className="text-xs">Anteversion (°)</label>
      <input
        type="range"
        min={0}
        max={30}
        value={hip.cupPlan.anteversionDeg}
        onChange={e =>
          hip.setCupPlan({
            ...hip.cupPlan!,
            anteversionDeg: Number(e.target.value),
          })
        }
      />
    </>
  )}
</div>


      <p className="text-xs text-zinc-400 pt-2">
        Semua measurement akan auto-snap ke femoral axis
      </p>
    </div>
  );
}
