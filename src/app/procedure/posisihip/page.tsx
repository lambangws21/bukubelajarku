import NoteCard from "@/components/poisi/hip/notecard";
import { PlaningCard } from "@/components/poisi/hip/planing";
import StepsCard from "@/components/poisi/hip/stepcard";

export default function PosisiHip() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Total Hip Replacement Note</h1>
      <StepsCard />
      <NoteCard />
      <PlaningCard/>
    </div>
  );
}
