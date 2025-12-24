"use client";

import {
  troubleshootingTable,
  intraOpSimulations,
  implantComparison,
} from "@/components/operasi/tkr/data/tkaTroubleshooting";

export default function TKAKnowledgeUI() {
  return (
    <div className="space-y-10">

      {/* ================= TROUBLESHOOTING ================= */}
      <section>
        <h2 className="text-xl font-bold mb-4">🧩 Troubleshooting Patella</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {troubleshootingTable.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 bg-white dark:bg-zinc-900"
            >
              <p className="font-semibold text-red-600">{item.problem}</p>
              <p className="text-sm mt-1"><b>Penyebab:</b> {item.cause}</p>
              <p className="text-sm"><b>Cek:</b> {item.check}</p>
              <p className="text-sm text-green-600">
                <b>Koreksi:</b> {item.solution}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SIMULATION ================= */}
      <section>
        <h2 className="text-xl font-bold mb-4">🦴 Simulasi Intra-Operatif</h2>
        <div className="space-y-4">
          {intraOpSimulations.map((sim, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 bg-white dark:bg-zinc-900"
            >
              <h3 className="font-semibold">{sim.title}</h3>
              <p className="text-sm mt-1">{sim.scenario}</p>
              <p className="text-sm text-yellow-600 mt-2">
                <b>Makna:</b> {sim.meaning}
              </p>
              <ul className="list-disc ml-5 mt-2 text-sm text-green-600">
                {sim.action.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ================= IMPLANT COMPARISON ================= */}
      <section>
        <h2 className="text-xl font-bold mb-4">⚔️ Medial Pivot vs PS</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {implantComparison.map((impl, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 bg-white dark:bg-zinc-900"
            >
              <h3 className="font-semibold mb-2">{impl.type}</h3>

              <p className="text-sm font-semibold">Biomekanik</p>
              <ul className="list-disc ml-5 text-sm">
                {impl.biomechanics.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-2">Catatan Intra-Op</p>
              <ul className="list-disc ml-5 text-sm">
                {impl.intraOpNotes.map((n, idx) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-2 text-green-600">
                Keunggulan
              </p>
              <ul className="list-disc ml-5 text-sm text-green-600">
                {impl.advantages.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-2 text-red-600">
                Risiko
              </p>
              <ul className="list-disc ml-5 text-sm text-red-600">
                {impl.risks.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
