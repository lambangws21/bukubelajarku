"use client";

import Image from "next/image";
import { tkaFemoralRotationLearning } from "@/components/operasi/tkr/data/tkaFemoralRotation";

export default function TKAFemoralRotationCourse() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold">
        🎓 TKA Learning Module: Femoral Rotation & Patella
      </h1>

      {tkaFemoralRotationLearning.map((section) => (
        <section
          key={section.id}
          className="rounded-xl border p-6 bg-white dark:bg-zinc-900 space-y-4"
        >
          <div>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="text-sm text-muted-foreground">
              {section.figure}
            </p>
          </div>

          {section.description.map((d, i) => (
            <p key={i} className="text-sm">
              {d}
            </p>
          ))}

          {section.images.map((img, i) => (
            <figure key={i} className="space-y-2">
              <Image
                src={img.src}
                alt={img.caption}
                width={800}
                height={450}
                className="rounded-lg border"
              />
              <figcaption className="text-xs text-center text-muted-foreground">
                {img.caption}
              </figcaption>
            </figure>
          ))}

          {section.bulletPoints && (
            <ul className="list-disc ml-5 text-sm space-y-1">
              {section.bulletPoints.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}

          {section.conclusion && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm font-semibold text-green-700 dark:text-green-300">
              📌 {section.conclusion}
            </div>
          )}
        </section>
      ))}

      {/* RANGKUMAN */}
      <section className="rounded-xl border p-6 bg-zinc-50 dark:bg-zinc-800">
        <h2 className="text-lg font-bold mb-3">🔑 Rangkuman Penting</h2>
        <ul className="list-disc ml-5 text-sm space-y-1">
          <li>Internal rotation → patella maltracking & nyeri</li>
          <li>Netral / kurang ER → Q-angle meningkat</li>
          <li>Slight external rotation (±3–5°) → tracking center & gap balance</li>
        </ul>

        <blockquote className="mt-4 border-l-4 pl-4 italic text-sm">
          “Masalah patella pada TKA paling sering berasal dari rotasi femur,
          bukan dari patellanya.”
        </blockquote>
      </section>
    </div>
  );
}
