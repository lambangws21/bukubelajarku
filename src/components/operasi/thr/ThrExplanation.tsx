import { ExplanationBlock } from "@/components/operasi/thr/data/data";

export default function ThrExplanation({
  explanation,
}: {
  explanation: ExplanationBlock[];
}) {
  return (
    <div className="space-y-4">
      {explanation.map((block, i) => (
        <div key={i} className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">{block.heading}</h4>

          <ul className="list-disc pl-5 space-y-1 text-sm">
            {block.points.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>

          {block.clinicalPearl && (
            <p className="mt-3 text-xs text-primary font-medium">
              💡 Clinical Pearl: {block.clinicalPearl}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

