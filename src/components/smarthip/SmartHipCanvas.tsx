"use client";

import { useRef, useEffect } from "react";
import { useSmartHip } from "./useSmartHip";
import {
  Point,
  isNearPoint,
  snapLineToAxis,
  midPoint,
  measureMm,
} from "./geometry";

type Props = {
  hip: ReturnType<typeof useSmartHip>;
};

export function SmartHipCanvas({ hip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const lastPan = useRef<Point | null>(null);

  /* ================= DRAW ================= */

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(hip.offset.x, hip.offset.y);
    ctx.scale(hip.zoom, hip.zoom);

    /* XRAY */
    if (hip.layers.XRAY && hip.image) {
      ctx.drawImage(hip.image, 0, 0);
    }

    /* AXIS */
    if (hip.layers.REFERENCE && hip.axis) {
      const { p1, p2 } = hip.axis;
      const mid = midPoint(p1, p2);

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.fillStyle = "#fde047";
      [p1, p2, mid].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    /* MEASUREMENTS */
    if (hip.layers.MEASUREMENT) {
      hip.measurements.forEach(m => {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(m.p1.x, m.p1.y);
        ctx.lineTo(m.p2.x, m.p2.y);
        ctx.stroke();

        [m.p1, m.p2].forEach(p => {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        if (!hip.calibration) return;

        /* ===== LLD ===== */
if (hip.layers.LLD && hip.lld?.pelvic && hip.calibration) {
    const { pelvic, left, right } = hip.lld;
  
    const pelvicY =
      (pelvic.p1.y + pelvic.p2.y) / 2;
  
    // pelvic reference
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pelvic.p1.x, pelvicY);
    ctx.lineTo(pelvic.p2.x, pelvicY);
    ctx.stroke();
  
    ctx.fillStyle = "#fde047";
    ctx.fillText("Pelvic reference", pelvic.p2.x + 6, pelvicY);
  
    // LEFT
    if (left) {
      ctx.strokeStyle = "#ffffff55";
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(left.x, pelvicY);
      ctx.stroke();
  
      ctx.beginPath();
      ctx.arc(left.x, left.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  
    // RIGHT
    if (right) {
      ctx.strokeStyle = "#ffffff55";
      ctx.beginPath();
      ctx.moveTo(right.x, right.y);
      ctx.lineTo(right.x, pelvicY);
      ctx.stroke();
  
      ctx.beginPath();
      ctx.arc(right.x, right.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  
    // RESULT
    if (left && right) {
      const lldMm =
        (right.y - left.y) *
        hip.calibration.mmPerPixel;
  
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 16px Arial";
  
      ctx.fillText(
        `LLD: ${lldMm.toFixed(1)} mm ${
          lldMm > 0 ? "(Right longer)" : "(Left longer)"
        }`,
        pelvic.p2.x + 10,
        pelvicY + 20
      );
    }
  }
  

        /* HEAD */
        if (m.kind === "HEAD") {
          const r =
            Math.hypot(m.p2.x - m.p1.x, m.p2.y - m.p1.y) / 2;
          const c = midPoint(m.p1, m.p2);

          ctx.strokeStyle = "#3b82f6";
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillText(
            `${(r * 2 * hip.calibration.mmPerPixel).toFixed(1)} mm`,
            c.x + 6,
            c.y
          );
        }

        /* OFFSET + CANAL */
        if (
          m.kind === "OFFSET" ||
          m.kind === "CANAL_PROX" ||
          m.kind === "CANAL_DIST"
        ) {
          ctx.fillText(
            `${measureMm(
              m.p1,
              m.p2,
              hip.calibration.mmPerPixel
            ).toFixed(1)} mm`,
            midPoint(m.p1, m.p2).x + 6,
            midPoint(m.p1, m.p2).y
          );
        }
      });
    }

    ctx.restore();
  }

  useEffect(() => {
    draw();
  });

  /* ================= UTILS ================= */

  function getWorld(e: React.MouseEvent): Point {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - hip.offset.x) / hip.zoom,
      y: (e.clientY - r.top - hip.offset.y) / hip.zoom,
    };
  }

  /* ================= EVENTS ================= */

  function onMouseDown(e: React.MouseEvent) {
    if (e.altKey || e.button === 1) {
      isPanning.current = true;
      lastPan.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const p = getWorld(e);

    /* AXIS */
    if (hip.axis) {
      const { p1, p2 } = hip.axis;
      const mid = midPoint(p1, p2);

      if (isNearPoint(p, p1, 18)) {
        hip.setActiveId("AXIS_P1");
        return;
      }
      if (isNearPoint(p, p2, 18)) {
        hip.setActiveId("AXIS_P2");
        return;
      }
      if (isNearPoint(p, mid, 20)) {
        hip.setActiveId("AXIS_MOVE");
        return;
      }
    }

    // ===== LLD HIT TEST =====
if (hip.lld?.pelvic) {
    if (isNearPoint(p, hip.lld.pelvic.p1, 12)) {
      hip.setActiveId("LLD_PELVIS_P1");
      return;
    }
    if (isNearPoint(p, hip.lld.pelvic.p2, 12)) {
      hip.setActiveId("LLD_PELVIS_P2");
      return;
    }
  }
  
  if (hip.lld?.left && isNearPoint(p, hip.lld.left, 12)) {
    hip.setActiveId("LLD_LEFT");
    return;
  }
  
  if (hip.lld?.right && isNearPoint(p, hip.lld.right, 12)) {
    hip.setActiveId("LLD_RIGHT");
    return;
  }
  

    /* MEASUREMENTS (HEAD + OFFSET + CANAL) */
    hip.measurements.forEach(m => {
      const c = midPoint(m.p1, m.p2);

      if (isNearPoint(p, m.p1, 10)) {
        hip.setActiveId(`${m.id}:P1`);
      } else if (isNearPoint(p, m.p2, 10)) {
        hip.setActiveId(`${m.id}:P2`);
      } else if (isNearPoint(p, c, 12)) {
        hip.setActiveId(`${m.id}:MOVE`);
      }
    });
  }

  function onMouseMove(e: React.MouseEvent) {
    if (isPanning.current && lastPan.current) {
      hip.setOffset(o => ({
        x: o.x + (e.clientX - lastPan.current!.x),
        y: o.y + (e.clientY - lastPan.current!.y),
      }));
      lastPan.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const p = getWorld(e);

    /* AXIS */
    if (hip.activeId?.startsWith("AXIS") && hip.axis) {
      const { p1, p2 } = hip.axis;

      if (hip.activeId === "AXIS_P1") {
        hip.setFemoralAxis(p, p2);
        return;
      }
      if (hip.activeId === "AXIS_P2") {
        hip.setFemoralAxis(p1, p);
        return;
      }
      if (hip.activeId === "AXIS_MOVE") {
        const mid = midPoint(p1, p2);
        const dx = p.x - mid.x;
        const dy = p.y - mid.y;
        hip.setFemoralAxis(
          { x: p1.x + dx, y: p1.y + dy },
          { x: p2.x + dx, y: p2.y + dy }
        );
        return;
      }
    }
    // ===== LLD MOVE =====
if (hip.activeId?.startsWith("LLD")) {
    if (!hip.lld) return;
  
    if (hip.activeId === "LLD_PELVIS_P1" && hip.lld.pelvic) {
      hip.setLLD({
        ...hip.lld,
        pelvic: { p1: p, p2: hip.lld.pelvic.p2 },
      });
      return;
    }
  
    if (hip.activeId === "LLD_PELVIS_P2" && hip.lld.pelvic) {
      hip.setLLD({
        ...hip.lld,
        pelvic: { p1: hip.lld.pelvic.p1, p2: p },
      });
      return;
    }
  
    if (hip.activeId === "LLD_LEFT") {
      hip.setLLD({ ...hip.lld, left: p });
      return;
    }
  
    if (hip.activeId === "LLD_RIGHT") {
      hip.setLLD({ ...hip.lld, right: p });
      return;
    }
  }
  

    /* MEASUREMENTS */
    if (hip.activeId) {
      const [id, mode] = hip.activeId.split(":");
      const m = hip.measurements.find(x => x.id === id);
      if (!m) return;

      let p1 = m.p1;
      let p2 = m.p2;

      if (mode === "P1") p1 = p;
      if (mode === "P2") p2 = p;
      if (mode === "MOVE") {
        const c = midPoint(m.p1, m.p2);
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        p1 = { x: m.p1.x + dx, y: m.p1.y + dy };
        p2 = { x: m.p2.x + dx, y: m.p2.y + dy };
      }

      if (hip.axis) {
        const s = snapLineToAxis(p1, p2, hip.axis.p1, hip.axis.p2);
        p1 = s.p1;
        p2 = s.p2;
      }

      hip.updateMeasurement(id, p1, p2);
    }
  }

  function onMouseUp() {
    isPanning.current = false;
    lastPan.current = null;
    hip.setActiveId(null);
    hip.setDragMode(null);
  }
  if (hip.activeId?.startsWith("LLD")) {
    hip.setActiveId(null);
    return;
  }
  

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    hip.setZoom(z =>
      Math.min(5, Math.max(0.3, z * (e.deltaY > 0 ? 0.9 : 1.1)))
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={900}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      className="bg-black border border-zinc-700 rounded-lg"
    />
  );
}
