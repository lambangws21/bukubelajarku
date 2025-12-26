import { DislocationRisk, DecisionRule } from "@/components/operasi/thr/data/data";

export default function ThrDislocationPanel({
  rules,
}: {
  rules: Record<DislocationRisk, DecisionRule[]>;
}) {
  return (
    <section className="border rounded-xl p-6 bg-background shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Dislocation Decision Rules
      </h2>

      {Object.entries(rules).map(([type, ruleList]) => (
        <div key={type} className="mb-6">
          <h3 className="font-semibold text-lg mb-3">
            {type === "POSTERIOR"
              ? "🟥 Posterior Dislocation"
              : "🟦 Anterior Dislocation"}
          </h3>

          <div className="space-y-4">
            {ruleList.map((rule, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border bg-muted"
              >
                <p className="font-medium">{rule.condition}</p>

                <p className="text-sm mt-1 text-muted-foreground">
                  {rule.explanation}
                </p>

                <p className="text-xs mt-2">
                  📌 Referensi: {rule.relatedFigures.join(", ")}
                </p>

                <ul className="list-disc pl-5 mt-2 text-sm">
                  {rule.recommendedAction.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
