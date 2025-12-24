"use client";

import { useState } from "react";

import {
  implantCases,
  decisionGuide,
  techSupportModules,
  type ImplantCase,
  type DecisionGuide,
  type TechSupportModule,
} from "@/components/operasi/tkr/data/tkaImplantDecisionGuide";

import {
  implantCaseExplanation,
  decisionGuideRationale,
  techSupportExplanation,
} from "@/components/operasi/tkr/data/tkaImplantDecisionGuide.explain";

export default function TKAImplantDecisionGuideUI() {
  const [openCase, setOpenCase] = useState<number | null>(null);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-14">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-bold">
          🧩 TKA Implant Decision & Case-Based Learning
        </h1>
        <p className="text-sm text-muted-foreground">
          Real Case • Decision Guide • Technical Support Mode
        </p>
      </header>

      {/* ================= CASES ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          1️⃣ Contoh Kasus Nyata per Implant
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {implantCases.map((c: ImplantCase, i: number) => {
            const explain = implantCaseExplanation[i];
            const isOpen = openCase === i;

            return (
              <div
                key={i}
                className="rounded-xl border p-5 bg-white dark:bg-zinc-900 space-y-3"
              >
                <h3 className="font-bold">{c.implant}</h3>
                <p className="text-sm font-semibold">{c.caseTitle}</p>

                <div>
                  <p className="text-sm font-semibold">Temuan Intra-Op</p>
                  <ul className="list-disc ml-5 text-sm">
                    {c.intraOpFinding.map((f: string, idx: number) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-red-600">{c.rootCause}</p>

                <ul className="list-disc ml-5 text-sm text-green-600">
                  {c.correction.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm font-semibold rounded">
                  💡 {c.learningPoint}
                </div>

                {explain && (
                  <>
                    <button
                      onClick={() => setOpenCase(isOpen ? null : i)}
                      className="text-sm text-blue-600 underline"
                    >
                      {isOpen
                        ? "Sembunyikan penjelasan ilmiah"
                        : "Lihat penjelasan & referensi"}
                    </button>

                    {isOpen && (
                      <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2">
                        <ul className="list-disc ml-5">
                          {explain.rationale.map((r: string, idx: number) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>

                        <ul className="list-disc ml-5">
                          {explain.evidence.map((e: string, idx: number) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>

                        <ul className="list-disc ml-5 italic">
                          {explain.references.map((ref: string, idx: number) => (
                            <li key={idx}>{ref}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= DECISION GUIDE ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          2️⃣ Decision Guide
        </h2>

        {decisionGuide.map((d: DecisionGuide, i: number) => {
          const explain = decisionGuideRationale[i];

          return (
            <div
              key={i}
              className="rounded-xl border p-4 bg-white dark:bg-zinc-900 space-y-2"
            >
              <p className="font-semibold">{d.scenario}</p>
              <p className="text-sm">
                👉 <b>{d.recommendation}</b>
              </p>

              <ul className="list-disc ml-5 text-sm">
                {d.reason.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>

              {explain && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 text-sm rounded">
                  <p>{explain.explanation}</p>
                  <p className="text-red-600 mt-1">
                    ⚠️ {explain.riskNote}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ================= TECH SUPPORT ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          3️⃣ Mode Edukasi Teknikal Support
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {techSupportModules.map(
            (m: TechSupportModule, idx: number) => {
              const explain = techSupportExplanation[m.phase];

              return (
                <div
                  key={idx}
                  className="rounded-xl border p-5 bg-white dark:bg-zinc-900 space-y-2"
                >
                  <h3 className="font-bold">{m.phase}</h3>
                  <p>{m.focus}</p>

                  <ul className="list-disc ml-5 text-sm">
                    {m.checklist.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>

                  <ul className="list-disc ml-5 text-sm text-red-600">
                    {m.redFlags.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>

                  {explain && (
                    <p className="text-sm text-red-600">
                      ⚠️ {explain.impactIfIgnored}
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}
