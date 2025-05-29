import NoteCard from "@/components/operasi/hip/notecard";
import { PlaningCard } from "@/components/operasi/hip/planing";
import { ThrTechniqueCard } from "@/components/operasi/hip/Thr-steps";


export default function PosisiHip() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Total Hip Replacement Note</h1>
      <NoteCard />
      <PlaningCard />
      <ThrTechniqueCard />
    </div>
  );
}
