"use client";

import {
  intraOpChecklist,
  psCrComparison,
  implantSystemNotes,
} from "@/components/operasi/tkr/data/tkaMentalChecklist";

export default function TKAMentalChecklistUI() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-bold">
          🧠 TKA Mental Checklist Intra-Operatif
        </h1>
        <p className="text-sm text-muted-foreground">
          Step-by-step • PS vs CR • Implant System Insight
        </p>
      </header>

      {/* A. CHECKLIST */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          🦴 A. Praktis di Meja Operasi
        </h2>

        <div className="space-y-4">
          {intraOpChecklist.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border p-5 bg-white dark:bg-zinc-900"
            >
              <h3 className="font-semibold">
                {item.step}. {item.title}
              </h3>

              <ul className="list-disc ml-5 text-sm mt-2">
                {item.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>

              {item.mindset && (
                <blockquote className="mt-3 border-l-4 pl-4 italic text-sm">
                  “{item.mindset}”
                </blockquote>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* B. PS vs CR */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          ⚙️ B. Hubungan dengan PS vs CR
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {psCrComparison.map((item) => (
            <div
              key={item.type}
              className="rounded-xl border p-5 bg-white dark:bg-zinc-900"
            >
              <h3 className="text-lg font-bold mb-2">{item.type}</h3>

              <p className="text-sm font-semibold">Karakter</p>
              <ul className="list-disc ml-5 text-sm">
                {item.characteristics.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3">Implikasi Intra-Op</p>
              <ul className="list-disc ml-5 text-sm">
                {item.intraOpImplication.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>

              <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm font-semibold">
                Rule: {item.ruleOfThumb}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* C. IMPLANT SYSTEM */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          🧩 C. Kaitkan dengan Sistem Implan
        </h2>

        <div className="space-y-4">
          {implantSystemNotes.map((imp) => (
            <div
              key={imp.name}
              className="rounded-xl border p-5 bg-white dark:bg-zinc-900"
            >
              <h3 className="text-lg font-bold">{imp.name}</h3>

              <p className="text-sm font-semibold mt-2">Filosofi</p>
              <ul className="list-disc ml-5 text-sm">
                {imp.philosophy.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3">Praktis di Meja</p>
              <ul className="list-disc ml-5 text-sm">
                {imp.intraOpNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>

              <div className="mt-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm font-semibold">
                📌 {imp.keyMessage}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
