"use client";

import { useState } from "react";
import { tkaQuiz } from "@/components/operasi/tkr/data/tkaQuiz";

export default function TKAQuizUI() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const q = tkaQuiz[current];

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 border rounded-xl">
      <h2 className="text-xl font-bold">🧠 Quiz Implant TKA</h2>

      <p className="font-semibold">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => {
              setSelected(i);
              setShowAnswer(true);
            }}
            className={`w-full text-left p-3 rounded border ${
              showAnswer
                ? i === q.correctIndex
                  ? "bg-green-100"
                  : i === selected
                  ? "bg-red-100"
                  : ""
                : "hover:bg-zinc-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {showAnswer && (
        <div className="text-sm bg-blue-50 p-3 rounded">
          <p>
            <b>Penjelasan:</b> {q.explanation}
          </p>
        </div>
      )}

      <button
        onClick={() => {
          setSelected(null);
          setShowAnswer(false);
          setCurrent((c) => (c + 1) % tkaQuiz.length);
        }}
        className="mt-3 px-4 py-2 rounded bg-black text-white"
      >
        Soal Berikutnya
      </button>
    </div>
  );
}
