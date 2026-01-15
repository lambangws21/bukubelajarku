"use client";

export default function PrintToolbar() {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-lg font-semibold">Butterfly Ruler Real-Size</h1>

      <button
        className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        onClick={() => window.print()}
        type="button"
      >
        Print 1:1
      </button>
    </div>
  );
}
