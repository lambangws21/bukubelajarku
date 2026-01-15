"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  AlignmentContent,
  ChatBubble,
  QAAnswerValue,
  QAState,
  QAStep,
  Side,
  Point,
} from "./types";

/* ================= helpers ================= */

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function toNumber(v: QAAnswerValue | undefined): number | null {
  if (v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isSide(v: QAAnswerValue | undefined): v is Side {
  return v === "varus" || v === "valgus";
}

function getAnswer(
  answers: Partial<Record<QAStep["id"], QAAnswerValue>>,
  id: QAStep["id"]
): QAAnswerValue | undefined {
  return answers[id];
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function angleDegBetween(v1: { x: number; y: number }, v2: { x: number; y: number }): number {
  // returns 0..180
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return 0;
  const c = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(c) * 180) / Math.PI;
}

function isStepValid(step: QAStep, value: QAAnswerValue | undefined): boolean {
  if (step.kind === "choice") return value === "varus" || value === "valgus";
  if (step.kind === "number") {
    const n = toNumber(value);
    if (n === null) return false;
    return n >= step.min && n <= step.max;
  }
  if (step.kind === "confirm") return value === true;
  return false;
}

/* ================= chat UI ================= */

function ChatPanel({ script }: { script?: ChatBubble[] }) {
  if (!script || script.length === 0) return null;
  return (
    <div className="mb-4 space-y-2">
      {script.map((b, idx) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: idx * 0.03 }}
          className={[
            "max-w-[95%] rounded-2xl px-3 py-2 text-sm border",
            b.role === "bot"
              ? "bg-white/5 border-white/10 text-white/80"
              : "bg-white/10 border-white/15 text-white ml-auto",
          ].join(" ")}
        >
          {b.text}
        </motion.div>
      ))}
    </div>
  );
}

/* ================= overlay canvas ================= */

type HandleId = "hip" | "knee" | "ankle";

type OverlayState = {
  hip: Point; // 0..1 normalized
  knee: Point;
  ankle: Point;
};

function defaultOverlay(): OverlayState {
  // posisi template awal yang enak buat full leg AP
  return {
    hip: { x: 0.35, y: 0.18 },
    knee: { x: 0.52, y: 0.55 },
    ankle: { x: 0.58, y: 0.88 },
  };
}

function AngleOverlayCanvas({
  side,
  showArc,
  label,
  containerClassName,
}: {
  side: Side | null;
  showArc: boolean;
  label: string;
  containerClassName?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState<OverlayState>(() => defaultOverlay());
  const [drag, setDrag] = useState<HandleId | null>(null);

  // compute angle at knee between femur vector (knee->hip) and tibia vector (knee->ankle)
  const computedAngle = useMemo(() => {
    const vFem = { x: p.hip.x - p.knee.x, y: p.hip.y - p.knee.y };
    const vTib = { x: p.ankle.x - p.knee.x, y: p.ankle.y - p.knee.y };
    return round1(angleDegBetween(vFem, vTib));
  }, [p]);

  function toClientPoint(e: PointerEvent | React.PointerEvent): { x: number; y: number } | null {
    const el = wrapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (("clientX" in e ? e.clientX : 0) - rect.left) / rect.width;
    const y = (("clientY" in e ? e.clientY : 0) - rect.top) / rect.height;
    return { x: clamp01(x), y: clamp01(y) };
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag) return;
    const pt = toClientPoint(e);
    if (!pt) return;
    setP((prev) => ({ ...prev, [drag]: pt }));
  }

  useEffect(() => {
    if (!drag) return;
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  // SVG geometry (normalized -> viewBox)
  const W = 1000;
  const H = 1400;

  const hip = { x: p.hip.x * W, y: p.hip.y * H };
  const knee = { x: p.knee.x * W, y: p.knee.y * H };
  const ankle = { x: p.ankle.x * W, y: p.ankle.y * H };

  // arc for angle at knee
  const arc = useMemo(() => {
    if (!showArc) return null;

    const v1 = { x: hip.x - knee.x, y: hip.y - knee.y };
    const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };

    const a1 = Math.atan2(v1.y, v1.x);
    const a2 = Math.atan2(v2.y, v2.x);

    // normalize to draw smallest arc
    let start = a1;
    let end = a2;
    let delta = end - start;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;

    // ensure |delta| <= PI
    end = start + delta;

    const r = 140; // radius in px (viewBox)
    const p1 = { x: knee.x + r * Math.cos(start), y: knee.y + r * Math.sin(start) };
    const p2 = { x: knee.x + r * Math.cos(end), y: knee.y + r * Math.sin(end) };
    const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
    const sweep = delta >= 0 ? 1 : 0;

    const d = `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
    return { d };
  }, [showArc, hip.x, hip.y, knee.x, knee.y, ankle.x, ankle.y]);

  const sideBadge =
    side === "valgus"
      ? "bg-sky-600/15 text-sky-200 border-sky-400/30"
      : side === "varus"
      ? "bg-amber-600/15 text-amber-200 border-amber-400/30"
      : "bg-slate-600/15 text-slate-200 border-slate-400/30";

  function Handle({
    id,
    x,
    y,
    title,
  }: {
    id: HandleId;
    x: number;
    y: number;
    title: string;
  }) {
    return (
      <g
        onPointerDown={(e) => {
          e.preventDefault();
          setDrag(id);
        }}
        style={{ cursor: "grab" }}
      >
        <circle cx={x} cy={y} r={18} fill="rgba(255,255,255,0.85)" />
        <circle cx={x} cy={y} r={8} fill="rgba(0,0,0,0.65)" />
        <text
          x={x}
          y={y - 28}
          textAnchor="middle"
          fontSize="22"
          fill="rgba(255,255,255,0.85)"
        >
          {title}
        </text>
      </g>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={[
        "relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black/20",
        containerClassName ?? "",
      ].join(" ")}
    >
      {/* overlay svg */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {/* femur axis */}
        <line
          x1={hip.x}
          y1={hip.y}
          x2={knee.x}
          y2={knee.y}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* extend femur */}
        <line
          x1={knee.x}
          y1={knee.y}
          x2={knee.x + (knee.x - hip.x) * 0.9}
          y2={knee.y + (knee.y - hip.y) * 0.9}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={6}
          strokeDasharray="14 14"
        />

        {/* tibia axis */}
        <line
          x1={knee.x}
          y1={knee.y}
          x2={ankle.x}
          y2={ankle.y}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* extend tibia */}
        <line
          x1={knee.x}
          y1={knee.y}
          x2={knee.x + (knee.x - ankle.x) * 0.45}
          y2={knee.y + (knee.y - ankle.y) * 0.45}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={6}
          strokeDasharray="14 14"
        />

        {/* arc */}
        {showArc && arc ? (
          <path d={arc.d} stroke="rgba(255,255,255,0.9)" strokeWidth={10} fill="none" />
        ) : null}

        {/* knee center */}
        <circle cx={knee.x} cy={knee.y} r={10} fill="rgba(255,255,255,0.9)" />

        {/* handles */}
        <Handle id="hip" x={hip.x} y={hip.y} title="Hip" />
        <Handle id="knee" x={knee.x} y={knee.y} title="Knee" />
        <Handle id="ankle" x={ankle.x} y={ankle.y} title="Talus" />
      </svg>

      {/* badges */}
      <div className="absolute left-3 top-3 flex gap-2">
        <span className={["text-xs px-2 py-1 rounded-full border", sideBadge].join(" ")}>
          {side ? side.toUpperCase() : "PILIH SIDE"}
        </span>
        <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-black/30 text-white/80">
          Angle ≈ {computedAngle}°
        </span>
      </div>

      <div className="absolute right-3 bottom-3 text-xs px-2 py-1 rounded-xl border border-white/10 bg-black/30 text-white/70">
        {label} • Drag Hip/Knee/Talus
      </div>
    </div>
  );
}

/* ================= main wizard ================= */

type Props = { content: AlignmentContent };

export function QnAAlignmentWizard({ content }: Props) {
  const steps: QAStep[] = content.qaSteps;

  const [qa, setQa] = useState<QAState>({ currentIndex: 0, answers: {} });

  // image pick for Q&A (biar user bisa ganti gambar saat wizard)
  const [activeImageId, setActiveImageId] = useState(content.images[0]?.id ?? "img-1");
  const activeImage = useMemo(
    () => content.images.find((i) => i.id === activeImageId) ?? content.images[0],
    [content.images, activeImageId]
  );

  const current: QAStep = steps[qa.currentIndex]!;
  const currentValue = getAnswer(qa.answers, current.id);
  const canNext = isStepValid(current, currentValue);

  const side = isSide(qa.answers.side) ? qa.answers.side : null;

  // show arc when user already input HKA OR at confirm step
  const showArc = useMemo(() => {
    const hka = toNumber(qa.answers.measure_hka);
    return hka !== null || current.id === "confirm";
  }, [qa.answers.measure_hka, current.id]);

  const progress = Math.round(((qa.currentIndex + 1) / steps.length) * 100);

  function setAnswer(id: QAStep["id"], value: QAAnswerValue) {
    setQa((prev) => ({ ...prev, answers: { ...prev.answers, [id]: value } }));
  }
  function next() {
    if (!canNext) return;
    setQa((prev) => ({ ...prev, currentIndex: Math.min(prev.currentIndex + 1, steps.length - 1) }));
  }
  function back() {
    setQa((prev) => ({ ...prev, currentIndex: Math.max(prev.currentIndex - 1, 0) }));
  }
  function reset() {
    setQa({ currentIndex: 0, answers: {} });
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold">{content.topic}</h1>
          <p className="text-sm text-white/70">
            Q&A mode + visual overlay garis femur/tibia + arc sudut (drag Hip/Knee/Talus biar pas sama gambar).
          </p>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-white/40"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
        <div className="mt-2 text-xs text-white/60">
          Pertanyaan {qa.currentIndex + 1}/{steps.length} • {progress}%
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: wizard */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6"
            >
              <div className="text-lg md:text-xl font-semibold">{current.question}</div>

              {"hint" in current && current.hint ? (
                <div className="mt-2 text-sm text-white/70">{current.hint}</div>
              ) : null}

              <div className="mt-4">
                <ChatPanel script={current.script} />
              </div>

              {/* input */}
              <div className="mt-2">
                {current.kind === "choice" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {current.choices.map((c) => {
                      const active = currentValue === c.value;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAnswer(current.id, c.value)}
                          className={[
                            "rounded-2xl border p-4 text-left transition",
                            active
                              ? "border-white/25 bg-white/10"
                              : "border-white/10 bg-black/30 hover:border-white/20",
                          ].join(" ")}
                        >
                          <div className="font-medium">{c.label}</div>
                          {c.helper ? <div className="mt-1 text-xs text-white/60">{c.helper}</div> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {current.kind === "number" ? (
                  <label className="space-y-1 block">
                    <div className="text-sm text-white/70">Input {current.unit ?? ""}</div>
                    <input
                      value={typeof currentValue === "undefined" ? "" : String(currentValue)}
                      onChange={(e) => setAnswer(current.id, e.target.value)}
                      inputMode="decimal"
                      placeholder={current.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/25"
                    />
                    <div className="text-xs text-white/50">
                      Range: {current.min} – {current.max} {current.unit ?? ""}
                    </div>
                  </label>
                ) : null}

                {current.kind === "confirm" ? (
                  <button
                    type="button"
                    onClick={() => setAnswer(current.id, true)}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      currentValue === true
                        ? "border-white/25 bg-white/10"
                        : "border-white/10 bg-black/30 hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="font-medium">Ya, lanjutkan</div>
                    <div className="mt-1 text-xs text-white/60">Klik untuk menutup wizard / lanjut ke hasil di tool lain.</div>
                  </button>
                ) : null}
              </div>

              {/* actions */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={qa.currentIndex === 0}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={next}
                    disabled={!canNext}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT: image + overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap gap-2">
              {content.images.map((img) => {
                const active = img.id === activeImageId;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageId(img.id)}
                    className={[
                      "text-xs px-3 py-2 rounded-xl border transition",
                      active ? "border-white/25 bg-white/10" : "border-white/10 bg-black/20 hover:border-white/20",
                    ].join(" ")}
                    type="button"
                  >
                    {img.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 relative">
              {/* base image */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                {activeImage ? (
                  <Image
                    src={activeImage.src}
                    alt={activeImage.label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    priority
                  />
                ) : null}

                {/* overlay canvas on top */}
                <div className="absolute inset-0">
                  <AngleOverlayCanvas
                    side={side}
                    showArc={showArc}
                    label="Overlay edukasi"
                    containerClassName="border-0 bg-transparent"
                  />
                </div>
              </div>

              <div className="mt-2 text-xs text-white/60">
                Tip: drag titik Hip/Knee/Talus biar garis mekanikal pas mengikuti gambar. Arc sudut akan ikut berubah.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            <div className="font-medium text-white">Catatan</div>
            <div className="mt-2">
              Overlay ini untuk <span className="text-white">visual edukasi</span>. Kamu bisa menyesuaikan posisi titik agar
              sudut yang terbentuk sesuai pengukuran manual pada X-ray.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
