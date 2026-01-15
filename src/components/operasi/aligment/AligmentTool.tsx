"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AlignmentContent,
  CalcResult,
  HkaResult,
  Side,
  ImageItem,
  QAStep,
  QAAnswerValue,
  QAState,
  ChatBubble,
} from "./types";

type Props = {
  content: AlignmentContent;
};

/* ================= UTIL ================= */

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
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

/* ================= CALC ================= */

function calcAHKAA(
  MPTA: number,
  LDFA: number,
  min: number,
  max: number
): CalcResult {
  const raw = MPTA - LDFA;
  const aHKAA = round1(raw);
  const withinRange = aHKAA >= min && aHKAA <= max;

  if (withinRange) {
    return {
      aHKAA,
      withinRange,
      classification: "OK",
      message: `Dalam batas aman (${min}° s/d ${max}°). Target ideal mendekati 0°.`,
    };
  }

  const direction = aHKAA > max ? "positif" : "negatif";
  return {
    aHKAA,
    withinRange,
    classification: "OUT_OF_RANGE",
    message: `Di luar batas (${min}° s/d ${max}°) → deviasi ${direction}. Risiko overload kompartemen & accelerated wear meningkat.`,
  };
}

function interpretHKA(angleDegSigned: number): HkaResult {
  const a = round1(angleDegSigned);
  const absAngle = Math.abs(a);

  // negatif = varus, positif = valgus, 0 = netral
  if (absAngle < 0.1) {
    return { side: "neutral", absAngle: 0, message: "Netral (mendekati 0°)." };
  }
  if (a > 0) {
    return { side: "valgus", absAngle, message: `Valgus ≈ ${absAngle}°.` };
  }
  return { side: "varus", absAngle, message: `Varus ≈ ${absAngle}°.` };
}

/* ================= Q&A UI ================= */

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

/* ================= COMPONENT ================= */

export function AlignmentTool({ content }: Props) {
  /* ===== 기존 tool states ===== */
  const [mptaText, setMptaText] = useState<string>("87");
  const [ldfaText, setLdfaText] = useState<string>("91");
  const [hkaSignedText, setHkaSignedText] = useState<string>("5");
  const [activeImageId, setActiveImageId] = useState<ImageItem["id"]>("img-1");

  const mpta = clampNumber(Number(mptaText), 60, 110);
  const ldfa = clampNumber(Number(ldfaText), 60, 110);
  const hkaSigned = clampNumber(Number(hkaSignedText), -40, 40);

  const aHKAAResult = useMemo(() => {
    const r = content.formula.acceptableDeviation;
    return calcAHKAA(mpta, ldfa, r.min, r.max);
  }, [mpta, ldfa, content.formula.acceptableDeviation]);

  const hkaResult = useMemo(() => interpretHKA(hkaSigned), [hkaSigned]);

  const activeImage = useMemo(() => {
    return content.images.find((i) => i.id === activeImageId) ?? content.images[0];
  }, [activeImageId, content.images]);

  const badgeTone: Record<CalcResult["classification"], string> = {
    OK: "bg-emerald-600/15 text-emerald-200 border-emerald-400/30",
    OUT_OF_RANGE: "bg-rose-600/15 text-rose-200 border-rose-400/30",
  };

  const hkaBadgeTone: Record<Side | "neutral", string> = {
    neutral: "bg-slate-600/15 text-slate-200 border-slate-400/30",
    varus: "bg-amber-600/15 text-amber-200 border-amber-400/30",
    valgus: "bg-sky-600/15 text-sky-200 border-sky-400/30",
  };

  /* ===== Q&A states ===== */
  const steps: QAStep[] = content.qaSteps ?? [];
  const [qa, setQa] = useState<QAState>({ currentIndex: 0, answers: {} });

  const currentStep: QAStep | null =
    steps.length > 0 ? steps[qa.currentIndex] ?? null : null;

  const currentValue = currentStep ? getAnswer(qa.answers, currentStep.id) : undefined;
  const canNext = currentStep ? isStepValid(currentStep, currentValue) : false;

  const qaResult = useMemo(() => {
    if (!currentStep) return null;

    const side = qa.answers.side;
    const hka = toNumber(qa.answers.measure_hka);
    const qmpta = toNumber(qa.answers.mpta);
    const qldfa = toNumber(qa.answers.ldfa);

    if (!isSide(side) || hka === null || qmpta === null || qldfa === null) return null;

    const aHKAA = round1(qmpta - qldfa);
    const { min, max } = content.formula.acceptableDeviation;
    const ok = aHKAA >= min && aHKAA <= max;

    const notes: string[] = [];
    notes.push(`Klasifikasi: ${side.toUpperCase()}.`);
    notes.push(`Sudut HKA/HKAA pasien: ${round1(hka)}°.`);
    notes.push(`aHKAA = MPTA - LDFA = ${qmpta} - ${qldfa} = ${aHKAA}°.`);

    if (ok) {
      notes.push(`✅ Dalam batas aman (${min}° s/d ${max}°) → stabilisasi implant lebih terjaga.`);
    } else {
      notes.push(`⚠️ Di luar batas (${min}° s/d ${max}°) → risiko overload & accelerated wear meningkat.`);
      notes.push(
        "Sesuai penjelasanmu: insert bisa lebih cepat tergerus pada sisi overload dan risiko sinking pada sisi overload."
      );
    }

    return { ok, aHKAA, notes };
  }, [qa.answers, content.formula.acceptableDeviation, currentStep]);

  function setAnswer(id: QAStep["id"], value: QAAnswerValue) {
    setQa((prev) => ({ ...prev, answers: { ...prev.answers, [id]: value } }));
  }

  function nextQA() {
    if (!currentStep || !canNext) return;
    setQa((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, steps.length - 1),
    }));
  }

  function backQA() {
    setQa((prev) => ({ ...prev, currentIndex: Math.max(prev.currentIndex - 1, 0) }));
  }

  function resetQA() {
    setQa({ currentIndex: 0, answers: {} });
  }

  const progress =
    steps.length === 0 ? 0 : Math.round(((qa.currentIndex + 1) / steps.length) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold">{content.topic}</h1>
          <p className="text-sm md:text-base text-white/70">
            Tool interaktif: (1) tanya-jawab sesuai penjelasan kamu, (2) interpretasi cepat HKA,
            (3) kalkulator aHKAA = MPTA - LDFA, (4) langkah pengukuran + viewer gambar.
          </p>
        </header>

        {/* ================= Q&A SECTION ================= */}
        {steps.length > 0 && currentStep ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">Mode Tanya Jawab</h2>
                <div className="text-xs text-white/60">
                  Pertanyaan {qa.currentIndex + 1}/{steps.length} • {progress}%
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetQA}
                  className="text-xs px-3 py-2 rounded-xl border border-white/10 bg-black/20 hover:border-white/20"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-white/40"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* left: question card */}
              <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.99 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="text-lg font-semibold">{currentStep.question}</div>

                    {"hint" in currentStep && currentStep.hint ? (
                      <div className="mt-2 text-sm text-white/70">{currentStep.hint}</div>
                    ) : null}

                    {/* narrative */}
                    <div className="mt-4">
                      <ChatPanel script={currentStep.script} />
                    </div>

                    {/* input */}
                    <div className="mt-2">
                      {currentStep.kind === "choice" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentStep.choices.map((c) => {
                            const active = currentValue === c.value;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setAnswer(currentStep.id, c.value)}
                                className={[
                                  "rounded-2xl border p-4 text-left transition",
                                  active
                                    ? "border-white/25 bg-white/10"
                                    : "border-white/10 bg-black/30 hover:border-white/20",
                                ].join(" ")}
                              >
                                <div className="font-medium">{c.label}</div>
                                {c.helper ? (
                                  <div className="mt-1 text-xs text-white/60">{c.helper}</div>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {currentStep.kind === "number" ? (
                        <label className="space-y-1 block">
                          <div className="text-sm text-white/70">
                            Input {currentStep.unit ?? ""}
                          </div>
                          <input
                            value={typeof currentValue === "undefined" ? "" : String(currentValue)}
                            onChange={(e) => setAnswer(currentStep.id, e.target.value)}
                            inputMode="decimal"
                            placeholder={currentStep.placeholder}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/25"
                          />
                          <div className="text-xs text-white/50">
                            Range: {currentStep.min} – {currentStep.max} {currentStep.unit ?? ""}
                          </div>
                        </label>
                      ) : null}

                      {currentStep.kind === "confirm" ? (
                        <button
                          type="button"
                          onClick={() => setAnswer(currentStep.id, true)}
                          className={[
                            "w-full rounded-2xl border px-4 py-3 text-left transition",
                            currentValue === true
                              ? "border-white/25 bg-white/10"
                              : "border-white/10 bg-black/30 hover:border-white/20",
                          ].join(" ")}
                        >
                          <div className="font-medium">Ya, hitung sekarang</div>
                          <div className="mt-1 text-xs text-white/60">
                            Klik untuk menampilkan hasil evaluasi aHKAA.
                          </div>
                        </button>
                      ) : null}
                    </div>

                    {/* nav */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={backQA}
                        disabled={qa.currentIndex === 0}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm disabled:opacity-40"
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={nextQA}
                        disabled={!canNext}
                        className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* right: live result */}
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-medium">Ringkasan Jawaban</div>
                  <div className="mt-2 text-sm text-white/70 space-y-1">
                    <div className="flex justify-between">
                      <span>Side</span>
                      <span className="text-white">
                        {isSide(qa.answers.side) ? qa.answers.side.toUpperCase() : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>HKA/HKAA</span>
                      <span className="text-white">
                        {toNumber(qa.answers.measure_hka) ?? "-"}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>MPTA</span>
                      <span className="text-white">{toNumber(qa.answers.mpta) ?? "-"}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LDFA</span>
                      <span className="text-white">{toNumber(qa.answers.ldfa) ?? "-"}°</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {qaResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={[
                        "rounded-xl border p-3",
                        qaResult.ok
                          ? "border-emerald-400/30 bg-emerald-600/10 text-emerald-200"
                          : "border-rose-400/30 bg-rose-600/10 text-rose-200",
                      ].join(" ")}
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-medium">Hasil aHKAA</div>
                        <div className="text-lg font-semibold">{qaResult.aHKAA}°</div>
                      </div>
                      <div className="mt-2 space-y-2 text-sm">
                        {qaResult.notes.map((n, i) => (
                          <div key={i}>{n}</div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-white/70">
                        Target {content.formula.targetDeg}° • batas aman{" "}
                        {content.formula.acceptableDeviation.min}° s/d{" "}
                        {content.formula.acceptableDeviation.max}°
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </section>
        ) : null}

        {/* ================= ORIGINAL GRID (STEPS + CALC) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Steps */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Langkah Pengukuran (Ringkas)</h2>
              <span className="text-xs text-white/60">HKA/HKAA dari mekanikal axis</span>
            </div>

            <div className="mt-4 space-y-3">
              {content.steps.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className="rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{s.title}</div>
                      <div className="text-sm text-white/70">{s.detail}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <div className="font-medium text-white">Catatan Varus vs Valgus</div>
              <div className="mt-1">
                Teknik sama, yang berbeda arah deviasi: valgus dominan medial, varus dominan lateral.
              </div>
            </div>
          </section>

          {/* Right: Calculators */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-5">
            {/* HKA quick */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium">Interpretasi Cepat HKA (Signed)</h2>
                <span
                  className={[
                    "text-xs px-2 py-1 rounded-full border",
                    hkaBadgeTone[hkaResult.side],
                  ].join(" ")}
                >
                  {hkaResult.side.toUpperCase()}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-sm text-white/70">
                    Masukkan sudut HKA (derajat). Negatif=varus, Positif=valgus
                  </div>
                  <input
                    value={hkaSignedText}
                    onChange={(e) => setHkaSignedText(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/25"
                    aria-label="HKA signed degrees"
                  />
                </label>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm text-white/70">Hasil</div>
                  <div className="mt-1 text-base font-medium">{hkaResult.message}</div>
                  <div className="mt-1 text-xs text-white/60">
                    Ini hanya interpretasi arah berdasarkan tanda. Angka sudut tetap kamu ambil dari garis mekanikal femur vs tibia.
                  </div>
                </div>
              </div>
            </div>

            {/* aHKAA calc */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium">Kalkulator aHKAA</h2>
                <span
                  className={[
                    "text-xs px-2 py-1 rounded-full border",
                    badgeTone[aHKAAResult.classification],
                  ].join(" ")}
                >
                  {aHKAAResult.classification === "OK" ? "OK" : "OUT"}
                </span>
              </div>

              <div className="mt-1 text-sm text-white/70">
                Rumus: <span className="font-medium text-white">{content.formula.formulaText}</span> • Target {content.formula.targetDeg}° • Batas aman{" "}
                {content.formula.acceptableDeviation.min}° s/d {content.formula.acceptableDeviation.max}°
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-sm text-white/70">MPTA (deg)</div>
                  <input
                    value={mptaText}
                    onChange={(e) => setMptaText(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/25"
                    aria-label="MPTA"
                  />
                  <div className="text-xs text-white/50">{content.formula.meaning.MPTA}</div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm text-white/70">LDFA (deg)</div>
                  <input
                    value={ldfaText}
                    onChange={(e) => setLdfaText(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/25"
                    aria-label="LDFA"
                  />
                  <div className="text-xs text-white/50">{content.formula.meaning.LDFA}</div>
                </label>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={aHKAAResult.classification + aHKAAResult.aHKAA}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-sm text-white/70">aHKAA</div>
                    <div className="text-xl font-semibold">{aHKAAResult.aHKAA}°</div>
                  </div>
                  <div className="mt-1 text-sm text-white/80">{aHKAAResult.message}</div>

                  <div className="mt-3 text-xs text-white/60">
                    Contoh: MPTA=87, LDFA=91 → aHKAA=-4 (di luar batas) → potensi accelerated wear & overload.
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Image Viewer */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-medium">Viewer Gambar</h2>
            <div className="flex flex-wrap gap-2">
              {content.images.map((img) => {
                const active = img.id === activeImageId;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageId(img.id)}
                    className={[
                      "text-xs px-3 py-2 rounded-xl border transition",
                      active
                        ? "border-white/25 bg-white/10"
                        : "border-white/10 bg-black/20 hover:border-white/20",
                    ].join(" ")}
                    type="button"
                  >
                    {img.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  className="relative w-full aspect-[3/4]"
                >
                  <Image
                    src={activeImage.src}
                    alt={activeImage.label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm text-white/70">Keterangan</div>
                <div className="mt-1 font-medium">{activeImage.label}</div>
                <div className="mt-1 text-sm text-white/70">
                  Lihat garis mekanikal femur (hip→knee) dan tibia (ankle/mid-talus→knee),
                  lalu baca sudut di knee center.
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white/70">Data contoh sudut</div>
                <ul className="mt-2 space-y-2">
                  {content.patientExamples.map((ex) => (
                    <li key={ex.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">{ex.hkaAngleDeg}°</div>
                        <span
                          className={[
                            "text-xs px-2 py-1 rounded-full border",
                            hkaBadgeTone[ex.interpretation],
                          ].join(" ")}
                        >
                          {ex.interpretation.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/60">{ex.notes}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Worked Example */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
          <h2 className="text-lg font-medium">Contoh Perhitungan (sesuai materi)</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm text-white/70">MPTA</div>
              <div className="text-xl font-semibold">{content.workedExample.MPTA}°</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm text-white/70">LDFA</div>
              <div className="text-xl font-semibold">{content.workedExample.LDFA}°</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm text-white/70">aHKAA</div>
              <div className="text-xl font-semibold">{content.workedExample.aHKAA}°</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            <div className="font-medium text-white">{content.workedExample.interpretation}</div>
            <div className="mt-1">{content.workedExample.riskNote}</div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
