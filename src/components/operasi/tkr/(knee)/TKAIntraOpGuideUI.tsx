"use client";

import {
  troubleshootingTable,
  intraOpScenarios,
  implantComparison,
} from "@/components/operasi/tkr/data/tkaIntraOpGuide";

export default function TKAIntraOpGuideUI() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">

      {/* ================= HEADER ================= */}
      <header>
        <h1 className="text-2xl font-bold">
          🦴 TKA Intra-Operative Practical Guide
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Troubleshooting • Simulation • Implant Decision
        </p>
      </header>

      {/* ================= TROUBLESHOOTING TABLE ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          1️⃣ Troubleshooting Patella Tracking
        </h2>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-3 text-left">Temuan</th>
                <th className="p-3 text-left">Penyebab</th>
                <th className="p-3 text-left">Cek Cepat</th>
                <th className="p-3 text-left">Koreksi</th>
              </tr>
            </thead>
            <tbody>
              {troubleshootingTable.map((row, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="p-3 font-medium">{row.finding}</td>
                  <td className="p-3">{row.cause}</td>
                  <td className="p-3">{row.check}</td>
                  <td className="p-3 text-green-600 font-semibold">
                    {row.correction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm font-semibold">
          ⚠️ Golden Rule: Jangan lakukan lateral release sebelum rotasi femur beres.
        </div>
      </section>

      {/* ================= SIMULATION ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          2️⃣ Simulasi Intra-Operatif
        </h2>

        <div className="space-y-4">
          {intraOpScenarios.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-5 bg-white dark:bg-zinc-900"
            >
              <h3 className="font-semibold mb-2">{s.title}</h3>

              <p className="text-sm font-semibold">Langkah</p>
              <ul className="list-disc ml-5 text-sm">
                {s.steps.map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3">Makna</p>
              <ul className="list-disc ml-5 text-sm text-yellow-600">
                {s.interpretation.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3">Aksi</p>
              <ul className="list-disc ml-5 text-sm text-green-600">
                {s.actions.map((ac, i) => (
                  <li key={i}>{ac}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COMPARISON ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          3️⃣ Medial Pivot vs PS Klasik
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {implantComparison.map((imp) => (
            <div
              key={imp.name}
              className="rounded-xl border p-5 bg-white dark:bg-zinc-900"
            >
              <h3 className="text-lg font-bold mb-2">{imp.name}</h3>

              <p className="text-sm font-semibold">Biomekanik</p>
              <ul className="list-disc ml-5 text-sm">
                {imp.biomechanics.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3">Praktis di Meja</p>
              <ul className="list-disc ml-5 text-sm">
                {imp.intraOpPractical.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3 text-green-600">
                Cocok Untuk
              </p>
              <ul className="list-disc ml-5 text-sm text-green-600">
                {imp.suitableFor.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <p className="text-sm font-semibold mt-3 text-red-600">
                Risiko
              </p>
              <ul className="list-disc ml-5 text-sm text-red-600">
                {imp.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MEMORY ================= */}
      <section className="rounded-xl border p-6 bg-zinc-50 dark:bg-zinc-800">
        <h2 className="font-bold mb-2">🧠 One-Line Memory</h2>
        <ul className="list-disc ml-5 text-sm space-y-1">
          <li>Patella lari = rotasi femur</li>
          <li>Flexion gap trapezoid = rotasi salah</li>
          <li>Lateral release = pilihan terakhir</li>
          <li>Medial pivot menghargai presisi</li>
          <li>PS memaafkan tapi tidak melupakan</li>
        </ul>
      </section>
    </div>
  );
}
