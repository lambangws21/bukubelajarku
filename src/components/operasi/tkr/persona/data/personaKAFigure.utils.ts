import { PersonaFigure } from "@/components/operasi/tkr/persona/data/personaKAFigureBased.data";

export function groupFiguresByStage(figures: PersonaFigure[]) {
  return figures.reduce<Record<number, PersonaFigure[]>>((acc, fig) => {
    if (!acc[fig.stage]) acc[fig.stage] = [];
    acc[fig.stage].push(fig);
    return acc;
  }, {});
}
