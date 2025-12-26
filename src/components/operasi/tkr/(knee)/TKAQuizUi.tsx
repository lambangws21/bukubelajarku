"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import { tkaQuiz } from "@/components/operasi/tkr/data/tkaQuiz";

type AnswerRecord = {
  question: string;
  selected: number;
  correct: number;
  explanation: string;
  options: string[];
};

export default function TKAQuizUI() {
  const total = tkaQuiz.length;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);

  const [wrongAnswers, setWrongAnswers] = useState<AnswerRecord[]>([]);

  const q = tkaQuiz[current];
  const progress = ((current + 1) / total) * 100;

  /* ================= NEXT ================= */
  const nextQuestion = () => {
    if (selected !== q.correctIndex) {
      setWrongAnswers((prev) => [
        ...prev,
        {
          question: q.question,
          selected: selected!,
          correct: q.correctIndex,
          explanation: q.explanation,
          options: q.options,
        },
      ]);
    }

    if (current === total - 1) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowAnswer(false);
    }
  };

  /* ================= RESET ================= */
  const resetQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setShowAnswer(false);
    setFinished(false);
    setWrongAnswers([]);
  };

  /* ================= RESULT VIEW ================= */
  if (finished) {
    const score = total - wrongAnswers.length;
    const percent = Math.round((score / total) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto p-6 rounded-2xl border bg-card shadow space-y-6"
      >
        {/* ===== RESULT HEADER ===== */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">📊 Hasil Quiz TKA</h2>
          <p className="text-sm text-muted-foreground">
            Evaluasi pemahaman implant & teknik TKA
          </p>
        </div>

        {/* ===== SCORE ===== */}
        <div className="rounded-xl bg-muted/40 p-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">Skor Akhir</p>
          <p className="text-4xl font-bold">
            {score} / {total}
          </p>
          <p
            className={`text-sm font-medium ${
              percent >= 80
                ? "text-green-600"
                : percent >= 60
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {percent}%
          </p>
        </div>

        {/* ===== MESSAGE ===== */}
        <p className="text-center text-sm">
          {percent >= 80
            ? "🔥 Mantap! Pemahaman TKA kamu sangat baik."
            : percent >= 60
            ? "👍 Cukup baik, masih bisa ditingkatkan."
            : "⚠️ Perlu review ulang konsep TKA."}
        </p>

        {/* ===== REVIEW WRONG ANSWERS ===== */}
        {wrongAnswers.length > 0 && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <ClipboardList className="h-4 w-4" />
              Review Jawaban Salah
            </h3>

            <div className="space-y-3">
              {wrongAnswers.map((w, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4 space-y-2 bg-background"
                >
                  <p className="font-medium text-sm">
                    {i + 1}. {w.question}
                  </p>

                  <p className="text-sm text-red-600">
                    ❌ Jawaban kamu:{" "}
                    <b>{w.options[w.selected]}</b>
                  </p>

                  <p className="text-sm text-green-600">
                    ✅ Jawaban benar:{" "}
                    <b>{w.options[w.correct]}</b>
                  </p>

                  <p className="text-xs text-muted-foreground">
                    💡 {w.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ACTION ===== */}
        <div className="flex justify-center pt-2">
          <button
            onClick={resetQuiz}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Ulangi Quiz
          </button>
        </div>
      </motion.div>
    );
  }

  /* ================= QUIZ VIEW ================= */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto p-5 rounded-2xl border bg-card shadow space-y-5"
    >
      {/* HEADER */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold">🧠 Quiz Implant TKA</h2>
        <p className="text-xs text-muted-foreground">
          Soal {current + 1} dari {total}
        </p>

        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* QUESTION */}
      <p className="font-semibold text-sm">{q.question}</p>

      {/* OPTIONS */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isSelected = i === selected;

          return (
            <button
              key={i}
              onClick={() => {
                if (!showAnswer) {
                  setSelected(i);
                  setShowAnswer(true);
                }
              }}
              className={`
                w-full flex gap-3 p-3 rounded-xl border text-left transition 
                ${
                  showAnswer && isCorrect
                    ? "bg-slate-50 text-green-800 border-green-500"
                    : showAnswer && isSelected && !isCorrect
                    ? "bg-red-50 border-red-500 text-red-500"
                    : "hover:bg-muted"
                }
              `}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold">
                {String.fromCharCode(65 + i)}
              </span>

              <span className="flex-1 text-sm">{opt}</span>

              {showAnswer && isCorrect && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              {showAnswer && isSelected && !isCorrect && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* EXPLANATION */}
      <AnimatePresence>
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-blue-50 p-3 text-sm"
          >
            <b className="font-semibold text-slate-700">Penjelasan:</b>
            <p className="mt-1 text-muted-foreground text-slate-700">
              {q.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEXT */}
      <div className="flex justify-end">
        <button
          onClick={nextQuestion}
          disabled={!showAnswer}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm
            ${
              showAnswer
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
        >
          {current === total - 1 ? "Lihat Hasil" : "Soal Berikutnya"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
