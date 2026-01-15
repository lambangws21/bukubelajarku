"use client";
import PrintToolbar from "@/components/butterfly-bt/PrintToolbar";
import ButterflyRulerReal from "@/components/butterfly-bt/TriangleRulerBT";

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <PrintToolbar />

      <ButterflyRulerReal wingHalfMm={120} heightMm={120} marginMm={10} topCmMax={11} />

      <p className="mt-3 text-xs text-zinc-400">
        Saat print: Scale 100% (jangan “Fit to page”). Cek 0→100 mm = 10 cm di skala atas.
      </p>
    </main>
  );
}
