import type { PersonaFigureStep } from "@/components/operasi/tkr/persona/data/personaSurgicalFigures.data";

export function groupByPhase(
  steps: PersonaFigureStep[]
): Record<string, PersonaFigureStep[]> {
  return steps.reduce<Record<string, PersonaFigureStep[]>>((acc, step) => {
    if (!acc[step.phase]) {
      acc[step.phase] = [];
    }
    acc[step.phase].push(step);
    return acc;
  }, {});
}
